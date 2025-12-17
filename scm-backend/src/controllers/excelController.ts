import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import prisma from '../lib/prisma.js';
import fs from 'fs/promises';
import path from 'path';

const SERVER_SOURCE_FILE = 'server_source.xlsx';

// Helper to sanitise string
const sanitize = (str: any): string => {
    if (!str) return '';
    return String(str).trim().replace(/"/g, '');
};

// Helper to parse price
const parsePrice = (price: any): number => {
    if (!price) return 0;
    const cleanPrice = String(price).replace(/[,원]/g, '').trim();
    return parseInt(cleanPrice) || 0;
};

// Core processing logic (extracted for reuse)
const processExcelData = async (data: any[], startRow: number = 0, endRow: number | null = null) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Identify category map to reduce DB calls
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));

    // Slice data if range provided
    // data is an array of objects. row index 0 in array is actually Excel row 2 (header is 1).
    // User provides Excel row numbers. e.g. Start 2, End 5.
    // Excel Row 2 -> Array Index 0.
    // Excel Row N -> Array Index N-2.

    let processingData = data;
    let offset = 2; // Default offset for reporting row numbers

    if (startRow > 0 && endRow) {
        const startIndex = Math.max(0, startRow - 2);
        const endIndex = Math.max(0, endRow - 2) + 1; // slice end is exclusive
        processingData = data.slice(startIndex, endIndex);
        offset = startRow;
    }

    for (const [index, row] of processingData.entries()) {
        const rowNum = index + offset;
        try {
            // Determine keys (Korean or English support from Arontec)
            const r = row as any;
            const brand = sanitize(r['Brand'] || r['브랜드']);
            const modelName = sanitize(r['ModelName'] || r['모델명']);
            const modelNo = sanitize(r['ModelNo'] || r['모델번호']);
            const categoryName = sanitize(r['Category'] || r['카테고리']);
            const description = sanitize(r['Description'] || r['상세설명']);

            const b2bPrice = parsePrice(r['B2BPrice'] || r['실판매가'] || r['판매가'] || r['B2B가']);
            const consumerPrice = parsePrice(r['ConsumerPrice'] || r['소비자가'] || r['소가']);
            let supplyPrice = parsePrice(r['SupplyPrice'] || r['공급가'] || r['매입가'] || 0);
            if (supplyPrice === 0 && b2bPrice > 0) supplyPrice = b2bPrice;

            const stockQuantity = parsePrice(r['Stock'] || r['재고']);

            // Image Handling
            const extractUrl = (raw: any) => {
                const str = sanitize(raw);
                if (!str) return '';

                // Check for HTML img tag
                if (str.toLowerCase().includes('<img')) {
                    // Try to extract src="URL" or src='URL'
                    const srcMatch = str.match(/src\s*=\s*(["'])(.*?)\1/i);
                    if (srcMatch && srcMatch[2]) return srcMatch[2];

                    // Fallback for unquoted src=URL (rare but possible)
                    const unquoted = str.match(/src\s*=\s*([^\s>]+)/i);
                    if (unquoted && unquoted[1]) return unquoted[1];
                }

                // If no img tag or extraction failed, assume it's a direct URL 
                // but clean up any surrounding HTML if present (e.g. <div>URL</div>)
                // However, user likely provides either raw URL or <img src="...">.
                // If it starts with http, return as is.
                if (str.startsWith('http')) return str;

                return str;
            };
            const imageUrl = extractUrl(r['ImageURL'] || r['이미지URL']);

            let detailUrl = '';
            const rawDetail = r['DetailURL'] || r['상세페이지URL'];
            if (rawDetail) {
                if (String(rawDetail).trim().match(/^<.+>$/s) || String(rawDetail).includes('<img')) {
                    detailUrl = String(rawDetail).trim();
                } else {
                    detailUrl = sanitize(rawDetail);
                }
            }

            const manufacturer = sanitize(r['Manufacturer'] || r['제조사']);
            const origin = sanitize(r['Origin'] || r['원산지']);
            const productSpec = sanitize(r['ProductSpec'] || r['제품규격']);
            const productOptions = sanitize(r['ProductOptions'] || r['옵션']);
            const quantityPerCarton = parsePrice(r['QuantityPerCarton'] || r['카톤수량']) || 1;
            const shippingFee = parsePrice(r['ShippingFee'] || r['배송비']);
            let shippingFeeIndividual = parsePrice(r['ShippingFeeIndividual'] || r['개별배송비']);
            if (shippingFeeIndividual === 0 && shippingFee > 0) shippingFeeIndividual = shippingFee;
            const shippingFeeCarton = parsePrice(r['ShippingFeeCarton'] || r['카톤배송비']);

            const isTaxFreeStr = r['IsTaxFree'] || r['면세여부'];
            const isTaxFree = isTaxFreeStr === 'TRUE' || isTaxFreeStr === 'true' || isTaxFreeStr === '면세';
            const remarks = sanitize(r['Remark'] || r['remark'] || r['비고']);

            if (!modelName) {
                throw new Error('Model Name is required');
            }

            // Category Logic
            let categoryId: number | null = null;
            if (categoryName) {
                if (categoryMap.has(categoryName)) {
                    categoryId = categoryMap.get(categoryName)!;
                } else {
                    // Create Category
                    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    const newCat = await prisma.category.create({
                        data: { name: categoryName, slug }
                    });
                    categoryId = newCat.id;
                    categoryMap.set(categoryName, categoryId);
                }
            }

            // Upsert Logic
            let existingProduct = null;
            if (modelNo) {
                existingProduct = await prisma.product.findFirst({ where: { modelNo } });
            }
            if (!existingProduct) {
                existingProduct = await prisma.product.findFirst({ where: { modelNo: modelName } });
                if (!existingProduct) {
                    existingProduct = await prisma.product.findFirst({ where: { name: modelName } });
                }
            }

            const productData = {
                categoryId: categoryId || undefined,
                brand,
                description,
                imageUrl,
                price: b2bPrice,
                stockQuantity,
                detailUrl,
                consumerPrice,
                supplyPrice,
                quantityPerCarton,
                shippingFee,
                manufacturer,
                origin,
                isTaxFree,
                shippingFeeIndividual,
                shippingFeeCarton,
                productOptions,
                modelNo: modelNo || modelName,
                productSpec,
                remarks,
                name: modelName,
                isAvailable: true
            };

            if (existingProduct) {
                await prisma.product.update({
                    where: { id: existingProduct.id },
                    data: { ...productData, categoryId: categoryId || undefined }
                });
            } else {
                if (!categoryId) throw new Error('Category is required for new products');
                await prisma.product.create({
                    data: {
                        ...productData,
                        name: modelName,
                        modelNo: modelNo || modelName,
                        categoryId: categoryId
                    }
                });
            }
            successCount++;

        } catch (err) {
            errorCount++;
            errors.push(`Row ${rowNum}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    return { successCount, errorCount, errors };
};

// 1. Standard Upload (In-memory)
export const uploadExcel = async (req: Request, res: Response) => {
    const file = (req as any).file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const result = await processExcelData(data);

        res.json({
            message: 'Excel processing completed',
            success: result.successCount,
            failed: result.errorCount,
            errors: result.errors
        });

    } catch (error) {
        console.error('Excel upload error:', error);
        res.status(500).json({ error: 'Failed to process Excel file' });
    }
};

// 2. Replace Server Source File
export const replaceSource = async (req: Request, res: Response) => {
    const file = (req as any).file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Save file to root or specific folder
        const filePath = path.join(process.cwd(), SERVER_SOURCE_FILE);
        await fs.writeFile(filePath, file.buffer);

        res.json({ message: 'Server source file updated successfully' });
    } catch (error) {
        console.error('Replace source error:', error);
        res.status(500).json({ error: 'Failed to update server source file' });
    }
};

// 3. Register Range from Server Source
export const registerRange = async (req: Request, res: Response) => {
    try {
        const { start, end } = req.body;
        const startRow = parseInt(start);
        const endRow = parseInt(end);

        if (isNaN(startRow) || isNaN(endRow) || startRow > endRow || startRow < 1) {
            return res.status(400).json({ error: 'Invalid range' });
        }

        const filePath = path.join(process.cwd(), SERVER_SOURCE_FILE);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'Server source file not found. Please upload one first.' });
        }

        const fileBuffer = await fs.readFile(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const result = await processExcelData(data, startRow, endRow);

        res.json({
            message: `Range ${startRow}~${endRow} processed`,
            success: result.successCount,
            failed: result.errorCount,
            errors: result.errors
        });

    } catch (error) {
        console.error('Register range error:', error);
        res.status(500).json({ error: 'Failed to register range' });
    }
};

// 4. Download All Products
export const downloadAll = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany();

        // Map to Excel format
        const data = products.map(p => ({
            'ModelName': p.name,
            'ModelNo': p.modelNo,
            'Brand': p.brand,
            'Description': p.description,
            'B2BPrice': p.price,
            'ConsumerPrice': p.consumerPrice,
            'SupplyPrice': p.supplyPrice,
            'Stock': p.stockQuantity,
            'ImageURL': p.imageUrl,
            'DetailURL': p.detailUrl,
            'Manufacturer': p.manufacturer,
            'Origin': p.origin,
            'IsTaxFree': p.isTaxFree ? 'TRUE' : 'FALSE',
            'ShippingFee': p.shippingFee
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Products');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=products_export.xlsx');
        res.send(buffer);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download products' });
    }
};

// 5. Download Template
export const downloadTemplate = async (req: Request, res: Response) => {
    try {
        const headers = [
            {
                'Brand': 'Brand Name',
                'ModelName': 'Product Name',
                'ModelNo': 'Model Number',
                'Category': 'Category Name',
                'B2BPrice': 10000,
                'ConsumerPrice': 20000,
                'Stock': 100,
                'ImageURL': 'https://example.com/image.jpg',
                'DetailURL': 'https://example.com/detail.jpg'
            }
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(headers);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=product_template.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Template error:', error);
        res.status(500).json({ error: 'Failed to download template' });
    }
};

// 6. Delete Range (by ID for now, as consistent with "Range")
export const deleteRange = async (req: Request, res: Response) => {
    try {
        // Expecting ?start=100&end=200 query params? Or body?
        // User UI has "Start ~ End".
        const { start, end } = req.body;
        const startId = parseInt(start);
        const endId = parseInt(end);

        if (isNaN(startId) || isNaN(endId)) {
            return res.status(400).json({ error: 'Invalid ID range' });
        }

        const result = await prisma.product.deleteMany({
            where: {
                id: {
                    gte: startId,
                    lte: endId
                }
            }
        });

        res.json({ message: `${result.count} products deleted`, count: result.count });

    } catch (error) {
        console.error('Delete range error:', error);
        res.status(500).json({ error: 'Failed to delete range' });
    }
};
