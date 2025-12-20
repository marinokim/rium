import express from 'express'
import multer from 'multer'
import * as XLSX from 'xlsx'
import pool from '../config/database.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import ExcelJS from 'exceljs' // Logic ported from Arontec-SCM

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for disk storage (safer for memory)
const upload = multer({ dest: '/tmp/' })

// Helper to sanitize string
const sanitize = (str) => {
    if (!str) return ''
    return String(str).trim().replace(/"/g, '')
}

// Helper to parse price
const parsePrice = (price) => {
    if (!price) return 0
    // Remove commas and 'won' symbol if present
    const cleanPrice = String(price).replace(/[,원]/g, '').trim()
    return parseInt(cleanPrice) || 0
}

// Process Excel Upload (Existing Logic preserved)
router.post('/upload', upload.single('file'), async (req, res) => {
    let client = null
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        client = await pool.connect()
        await client.query('BEGIN')

        const workbook = XLSX.readFile(req.file.path)
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet)

        let successCount = 0
        let errorCount = 0
        const errors = []

        for (const [index, row] of data.entries()) {
            try {
                await client.query('SAVEPOINT row_savepoint')

                // Map Excel columns to DB fields
                const brand = sanitize(row['Brand'] || row['브랜드'])
                const modelName = sanitize(row['ModelName'] || row['모델명'])
                const modelNo = sanitize(row['ModelNo'] || row['모델번호'])
                const categoryName = sanitize(row['Category'] || row['카테고리'])
                const description = sanitize(row['Description'] || row['상세설명'])

                const b2bPrice = parsePrice(row['B2BPrice'] || row['실판매가'] || row['판매가'] || row['B2B가'])
                const consumerPrice = parsePrice(row['ConsumerPrice'] || row['소비자가'] || row['소가'])
                const supplyPrice = parsePrice(row['SupplyPrice'] || row['공급가'] || row['매입가'] || 0)

                if (supplyPrice === 0 && b2bPrice > 0) {
                    supplyPrice = b2bPrice
                }
                const stockQuantity = parsePrice(row['Stock'] || row['재고'])

                const extractUrl = (raw) => {
                    const str = sanitize(raw)
                    if (!str) return ''
                    const imgMatch = str.match(/<img[^>]+src\s*=\s*(?:['"]([^'"]+)['"]|(\S+))/i)
                    if (imgMatch) {
                        let url = imgMatch[1] || imgMatch[2]
                        if (url) return url.replace(/[\/>]+$/, '')
                    }
                    return str
                }

                const imageUrl = extractUrl(row['ImageURL'] || row['이미지URL'])

                let rawDetail = row['DetailURL'] || row['상세페이지URL']
                let detailUrlClean = ''
                if (rawDetail) {
                    if (String(rawDetail).trim().match(/^<.+>$/s) || String(rawDetail).includes('<img') || String(rawDetail).includes('<center')) {
                        detailUrlClean = String(rawDetail).trim()
                    } else {
                        detailUrlClean = sanitize(rawDetail)
                    }
                }
                const finalDetailUrl = detailUrlClean

                const manufacturer = sanitize(row['Manufacturer'] || row['제조사'])
                const origin = sanitize(row['Origin'] || row['원산지'])
                const productSpec = sanitize(row['ProductSpec'] || row['제품규격'])
                const productOptions = sanitize(row['ProductOptions'] || row['옵션'])
                const quantityPerCarton = parsePrice(row['QuantityPerCarton'] || row['카톤수량']) || 1
                const shippingFee = parsePrice(row['ShippingFee'] || row['배송비'])
                let shippingFeeIndividual = parsePrice(row['ShippingFeeIndividual'] || row['개별배송비'])

                if (shippingFeeIndividual === 0 && shippingFee > 0) {
                    shippingFeeIndividual = shippingFee
                }

                const shippingFeeCarton = parsePrice(row['ShippingFeeCarton'] || row['카톤배송비'])
                const isTaxFree = (row['IsTaxFree'] || row['면세여부']) === 'TRUE' || (row['IsTaxFree'] || row['면세여부']) === '면세'
                const remarks = sanitize(row['Remark'] || row['비고'])

                if (!modelName) {
                    throw new Error('Model Name is required')
                }

                let categoryId = null
                if (categoryName) {
                    const catRes = await client.query('SELECT id FROM categories WHERE name = $1', [categoryName])
                    if (catRes.rows.length > 0) {
                        categoryId = catRes.rows[0].id
                    } else {
                        const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                        const newCatRes = await client.query(
                            'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id',
                            [categoryName, slug]
                        )
                        categoryId = newCatRes.rows[0].id
                    }
                }

                let existingProduct = null
                if (modelNo) {
                    const checkRes = await client.query('SELECT id FROM products WHERE model_no = $1', [modelNo])
                    if (checkRes.rows.length > 0) existingProduct = checkRes.rows[0]
                }

                if (!existingProduct) {
                    const checkRes = await client.query('SELECT id FROM products WHERE model_name = $1', [modelName])
                    if (checkRes.rows.length > 0) existingProduct = checkRes.rows[0]
                }

                if (existingProduct) {
                    const mode = req.body.mode || 'all'
                    if (mode === 'new') {
                        await client.query('RELEASE SAVEPOINT row_savepoint')
                        continue
                    }

                    await client.query(
                        `UPDATE products SET 
                            category_id = COALESCE($1, category_id),
                            brand = $2,
                            description = $3,
                            image_url = $4,
                            b2b_price = $5,
                            stock_quantity = $6,
                            detail_url = $7,
                            consumer_price = $8,
                            supply_price = $9,
                            quantity_per_carton = $10,
                            shipping_fee = $11,
                            manufacturer = $12,
                            origin = $13,
                            is_tax_free = $14,
                            shipping_fee_individual = $15,
                            shipping_fee_carton = $16,
                            product_options = $17,
                            model_no = $18,
                            product_spec = $19,
                            remarks = $20,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $21`,
                        [
                            categoryId, brand, description, imageUrl, b2bPrice, stockQuantity, finalDetailUrl,
                            consumerPrice, supplyPrice, quantityPerCarton, shippingFee, manufacturer, origin,
                            isTaxFree, shippingFeeIndividual, shippingFeeCarton, productOptions, modelNo, productSpec,
                            remarks, existingProduct.id
                        ]
                    )
                } else {
                    const mode = req.body.mode || 'all'
                    if (mode === 'update') {
                        await client.query('RELEASE SAVEPOINT row_savepoint')
                        continue
                    }

                    await client.query(
                        `INSERT INTO products (
                            category_id, brand, model_name, description, image_url, b2b_price, stock_quantity,
                            detail_url, consumer_price, supply_price, quantity_per_carton, shipping_fee,
                            manufacturer, origin, is_tax_free, shipping_fee_individual, shipping_fee_carton,
                            product_options, model_no, product_spec, remarks, is_available
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, true)`,
                        [
                            categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity,
                            finalDetailUrl, consumerPrice, supplyPrice, quantityPerCarton, shippingFee,
                            manufacturer, origin, isTaxFree, shippingFeeIndividual, shippingFeeCarton,
                            productOptions, modelNo, productSpec, remarks
                        ]
                    )
                }

                await client.query('RELEASE SAVEPOINT row_savepoint')
                successCount++
            } catch (err) {
                await client.query('ROLLBACK TO SAVEPOINT row_savepoint')
                console.error(`Error processing row ${index + 2}:`, err)
                errorCount++
                errors.push(`Row ${index + 2}: ${err.message}`)
            }
        }

        await client.query('COMMIT')
        res.json({
            message: 'Excel processing completed',
            success: successCount,
            failed: errorCount,
            errors: errors
        })

    } catch (error) {
        if (client) await client.query('ROLLBACK')
        console.error('Excel upload error:', error)
        res.status(500).json({ error: 'Failed to process Excel file' })
    } finally {
        if (client) client.release()
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path)
            } catch (e) {
                console.error('Error deleting temp file:', e)
            }
        }
    }
})

// Sync supply_price with consumer_price for existing products
router.post('/sync-prices', async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await client.query(`
            UPDATE products 
            SET supply_price = b2b_price 
            WHERE (supply_price = 0 OR supply_price IS NULL) 
            AND b2b_price > 0
        `)
        await client.query('COMMIT')
        res.json({ message: `Updated ${result.rowCount} products`, count: result.rowCount })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Sync prices error:', error)
        res.status(500).json({ error: 'Failed to sync prices' })
    } finally {
        client.release()
    }
})

// Sync shipping_fee_individual with shipping_fee
router.post('/sync-shipping', async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await client.query(`
            UPDATE products 
            SET shipping_fee_individual = shipping_fee 
            WHERE (shipping_fee_individual = 0 OR shipping_fee_individual IS NULL) 
            AND shipping_fee > 0
        `)
        await client.query('COMMIT')
        res.json({ message: `Updated ${result.rowCount} products`, count: result.rowCount })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Sync shipping error:', error)
        res.status(500).json({ error: 'Failed to sync shipping' })
    } finally {
        client.release()
    }
})

// Swap b2b_price and consumer_price
router.post('/swap-prices', async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await client.query(`
            UPDATE products 
            SET b2b_price = consumer_price, consumer_price = b2b_price 
            WHERE b2b_price > consumer_price AND consumer_price > 0
        `)
        await client.query('COMMIT')
        res.json({ message: `Swapped prices for ${result.rowCount} products`, count: result.rowCount })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Swap prices error:', error)
        res.status(500).json({ error: 'Failed to swap prices' })
    } finally {
        client.release()
    }
})

// Comprehensive data fix
router.post('/fix-data', async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const swapResult = await client.query(`
            UPDATE products 
            SET b2b_price = consumer_price, consumer_price = b2b_price 
            WHERE b2b_price > consumer_price AND consumer_price > 0
        `)
        const supplyResult = await client.query(`
            UPDATE products 
            SET supply_price = b2b_price 
            WHERE (supply_price = 0 OR supply_price IS NULL) 
            AND b2b_price > 0
        `)
        const shippingResult = await client.query(`
            UPDATE products 
            SET shipping_fee_individual = shipping_fee_individual * 1000 
            WHERE shipping_fee_individual > 0 AND shipping_fee_individual < 100
        `)
        const shippingSyncResult = await client.query(`
            UPDATE products 
            SET shipping_fee_individual = shipping_fee 
            WHERE (shipping_fee_individual = 0 OR shipping_fee_individual IS NULL) 
            AND shipping_fee > 0
        `)
        await client.query('COMMIT')
        res.json({
            message: 'Data fix completed',
            swapped: swapResult.rowCount,
            syncedSupply: supplyResult.rowCount,
            fixedShipping: shippingResult.rowCount,
            syncedShipping: shippingSyncResult.rowCount
        })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Data fix error:', error)
        res.status(500).json({ error: 'Failed to fix data' })
    } finally {
        client.release()
    }
})

// Delete products by ID range
router.delete('/range', async (req, res) => {
    const client = await pool.connect()
    try {
        const { startId, endId } = req.query
        if (!startId || !endId) {
            return res.status(400).json({ error: 'Start ID and End ID are required' })
        }
        await client.query('BEGIN')
        await client.query(`
            DELETE FROM quote_items 
            WHERE product_id IN (SELECT id FROM products WHERE id BETWEEN $1 AND $2)
        `, [startId, endId])
        const result = await client.query(`
            DELETE FROM products 
            WHERE id BETWEEN $1 AND $2
        `, [startId, endId])
        await client.query('COMMIT')
        res.json({ message: `Deleted ${result.rowCount} products with ID between ${startId} and ${endId}`, count: result.rowCount })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Delete product range error:', error)
        res.status(500).json({ error: 'Failed to delete product range' })
    } finally {
        client.release()
    }
})

// Reset product ID sequence
router.post('/reset-sequence', async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const maxIdRes = await client.query('SELECT MAX(id) as max_id FROM products')
        const maxId = maxIdRes.rows[0].max_id || 0
        await client.query("SELECT setval('products_id_seq', $1)", [maxId])
        await client.query('COMMIT')
        res.json({ message: `Sequence reset to ${maxId}. Next ID will be ${maxId + 1}.` })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Reset sequence error:', error)
        res.status(500).json({ error: 'Failed to reset sequence' })
    } finally {
        client.release()
    }
})

// Register products by row range
router.post('/register-range', async (req, res) => {
    const { startRow, endRow } = req.body
    if (!startRow || !endRow) {
        return res.status(400).json({ error: 'Start Row and End Row are required' })
    }
    try {
        const { spawn } = await import('child_process')
        const pythonScript = path.join(__dirname, '..', 'register_range_generic.py')
        const pythonProcess = spawn('python3', [pythonScript, '--start', String(startRow), '--end', String(endRow)])
        let output = ''
        let errorOutput = ''
        pythonProcess.stdout.on('data', (data) => { output += data.toString() })
        pythonProcess.stderr.on('data', (data) => { errorOutput += data.toString() })
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                res.json({ message: 'Range registration completed', output })
            } else {
                console.error(`Python script exited with code ${code}`)
                console.error(`Error output: ${errorOutput}`)
                res.status(500).json({ error: 'Range registration failed', details: errorOutput })
            }
        })
    } catch (error) {
        console.error('Register range error:', error)
        res.status(500).json({ error: 'Failed to initiate range registration' })
    }
})

// Update source Excel file
router.post('/update-source', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
    }
    const targetDir = path.join(__dirname, '..', '..', 'excel')
    const targetPath = path.join(targetDir, 'aron_product_upload_consolidated.xlsx')
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
    }
    try {
        fs.copyFileSync(req.file.path, targetPath)
        fs.unlinkSync(req.file.path)
        console.log(`Updated master Excel file at ${targetPath}`)
        res.json({ message: 'Server source Excel file updated successfully' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to update source Excel file' })
    }
})

// Generate Excel Proposal (USING EXCELJS - Ported from Arontec-SCM Frontend Logic)
router.post('/download/proposal', async (req, res) => {
    try {
        let { title, items } = req.body

        // Handle case where items is a string (multipart/form-data or urlencoded form)
        // Looping parse to handle potential double-stringification
        try {
            while (typeof items === 'string') {
                items = JSON.parse(items)
            }
        } catch (e) {
            console.error('Failed to parse items string:', e)
            return res.status(400).json({ error: 'Invalid items JSON string' })
        }

        console.log('Download Proposal Request Body (Parsed):', JSON.stringify({ title, itemsCount: items?.length }), null, 2)

        if (!items || !Array.isArray(items)) {
            console.error('Items missing or invalid after parse:', typeof items)
            return res.status(400).json({ error: 'Items array is required' })
        }

        // Helper to hydrate items if they are missing details (only have productId)
        // Ensure IDs are integers for Postgres query
        const productIdsToFetch = items
            .filter(item => (!item.name && !item.productName && !item.modelName) && (item.productId || item.id))
            .map(item => parseInt(item.productId || item.id, 10))
            .filter(id => !isNaN(id))

        let productMap = {}
        if (productIdsToFetch.length > 0) {
            try {
                // Fetch details for missing items
                // Use a parameterized query with ANY for arrays
                console.log(`Hydrating ${productIdsToFetch.length} products:`, productIdsToFetch)
                const { rows } = await pool.query('SELECT * FROM products WHERE id = ANY($1::int[])', [productIdsToFetch])
                rows.forEach(p => {
                    productMap[p.id] = p
                })
                console.log(`Hydrated ${rows.length} products from database`)
            } catch (err) {
                console.error('Failed to hydrate products:', err)
                // Do not fail the whole request, just log and continue
            }
        }

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('제안서')

        // ... (Columns definition skipped, same as before) ...
        // We need to keep the columns definition here if we are replacing the block. 
        // But since I'm using replace_file_content on a specific range, I should enable seeing the columns.
        // Actually, let's just insert the hydration logic BEFORE the workbook creation.
        // And then inside the loop, merge the DB data.

        // Define columns based on user requirement matches Arontec-SCM
        worksheet.columns = [
            { header: '순번', key: 'no', width: 5 },
            { header: '품절여부', key: 'status', width: 10 },
            { header: '고유번호', key: 'id', width: 10 },
            { header: '상품명', key: 'name', width: 40 },
            { header: '상품이미지', key: 'image', width: 20 },
            { header: '모델명', key: 'model', width: 15 },
            { header: '옵션', key: 'option', width: 10 },
            { header: '설명', key: 'desc', width: 40 },
            { header: '제조원', key: 'manufacturer', width: 15 },
            { header: '원산지', key: 'origin', width: 10 },
            { header: '카톤입수량', key: 'cartonQty', width: 10 },
            { header: '기본수량', key: 'defaultQty', width: 10 },
            { header: '소비자가', key: 'consumerPrice', width: 12 },
            { header: '공급가(부가세포함)', key: 'supplyPrice', width: 15 },
            { header: '개별배송비(부가세포함)', key: 'shipping', width: 15 },
            { header: '대표이미지', key: 'imageUrl', width: 30 },
            { header: '상세이미지', key: 'detailUrl', width: 30 },
            { header: '비고', key: 'remarks', width: 20 },
        ]

        // ...

        // Mappings helper
        const getVal = (v) => v || ''
        const getNum = (v) => v ? parseInt(v) : 0

        for (let i = 0; i < items.length; i++) {
            let item = items[i]
            const pId = item.productId || item.id

            // MERGE with DB data if available
            if (productMap[pId]) {
                const dbP = productMap[pId]
                // Prioritize existing item properties (e.g. quantity), fallback to DB
                item = {
                    ...item,
                    name: item.name || dbP.name || dbP.model_name, // fallback
                    modelName: item.modelName || dbP.model_name,
                    brand: item.brand || dbP.brand,
                    description: item.description || dbP.description,
                    imageUrl: item.imageUrl || dbP.image_url,
                    detailUrl: item.detailUrl || dbP.detail_url,
                    consumerPrice: item.consumerPrice || dbP.consumer_price,
                    supplyPrice: item.supplyPrice || dbP.supply_price || dbP.b2b_price, // fallback chain
                    manufacturer: item.manufacturer || dbP.manufacturer,
                    origin: item.origin || dbP.origin,
                    shippingFee: item.shippingFee || dbP.shipping_fee,
                    quantityPerCarton: item.quantityPerCarton || dbP.quantity_per_carton,
                    productOptions: item.productOptions || dbP.product_options,
                    is_available: dbP.is_available // Always take DB availability
                }
            }

            const rowIndex = i + 3
            const row = worksheet.getRow(rowIndex)


            // Map frontend keys to internal keys
            const imgUrl = item.imageUrl || item.image_url || item.image || item.ImageURL || ''
            const modelName = item.modelName || item.model_name || item.model || item.modelNo || item.ModelName || ''
            const pName = item.productName || item.name || item.product_name || item.Name || ''
            const supplyPr = item.supplyPrice || item.supply_price || item.price || item.b2b_price || item.SupplyPrice
            const consPr = item.consumerPrice || item.consumer_price || item.ConsumerPrice
            const dUrl = item.detailUrl || item.detail_url || item.DetailURL || ''

            // DEBUG PROBE REMOVED
            // let descVal = item.description || item.desc || ''
            // if (!pName && !modelName) {
            //     descVal = 'DEBUG: ' + JSON.stringify(item)
            // }

            row.values = {
                no: i + 1,
                status: item.is_available === false ? '품절' : '',
                id: item.id || '',
                name: item.brand ? `[${item.brand}] ${modelName}` : (pName || modelName),
                image: '', // Placeholder
                model: modelName,
                option: item.productOptions || item.product_options || item.option || '',
                desc: item.description || '', // Revert to standard
                manufacturer: item.manufacturer || '',
                origin: item.origin || '',
                cartonQty: item.quantityPerCarton || item.quantity_per_carton || '',
                defaultQty: item.defaultQuantity || 1,
                consumerPrice: getNum(consPr),
                supplyPrice: getNum(supplyPr),
                shipping: getNum(item.shippingFee || item.shipping_fee || item.shipping),
                imageUrl: imgUrl,
                detailUrl: dUrl,
                remarks: item.remarks || ''
            }

            row.height = 100
            row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

            // Embed Image
            if (imgUrl && imgUrl.startsWith('http')) {
                try {
                    // Fetch image buffer
                    const response = await fetch(imgUrl)
                    if (response.ok) {
                        const buffer = await response.arrayBuffer()
                        let ext = 'jpeg'
                        if (imgUrl.toLowerCase().includes('.png')) ext = 'png'
                        if (imgUrl.toLowerCase().includes('.gif')) ext = 'gif'

                        const imageId = workbook.addImage({
                            buffer: Buffer.from(buffer),
                            extension: ext,
                        })

                        worksheet.addImage(imageId, {
                            tl: { col: 4, row: rowIndex - 1 }, // Column E (0-based: 4)
                            br: { col: 5, row: rowIndex },
                            editAs: 'oneCell'
                        })
                    }
                } catch (err) {
                    console.error('Failed to embed image:', err)
                    // No fallback needed, cell will be empty
                }
            }
        }

        const filename = `Proposal_${Date.now()}.xlsx`
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

        await workbook.xlsx.write(res)
        res.end()

    } catch (error) {
        console.error('Excel generation error:', error)
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate Excel file: ' + error.message })
        }
    }
})

export default router
