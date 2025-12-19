import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import * as XLSX from 'xlsx';

// Create Quote Request
export const createQuote = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'User ID missing' });

        const { items, message } = req.body; // items: { productId, quantity }[]

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in quote request' });
        }

        // 1. Generate Quote Number (Q + Timestamp)
        const quoteNumber = `Q${Date.now()}`;

        // 2. Create Quote and Items in Transaction
        const quote = await prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            const quoteItemsData = [];

            // 1. Calculate Total & Prepare Items
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: Number(item.productId) }
                });

                if (!product) {
                    throw new Error(`Product ID ${item.productId} not found`);
                }

                const quantity = Number(item.quantity);
                const price = product.price;
                totalAmount += price * quantity;

                quoteItemsData.push({
                    productId: product.id,
                    quantity,
                    price
                });
            }

            // 2. Create Quote
            const newQuote = await tx.quote.create({
                data: {
                    quoteNumber,
                    userId: Number(userId),
                    message,
                    status: 'PENDING',
                    totalAmount
                }
            });

            // 3. Create Quote Items
            for (const itemData of quoteItemsData) {
                await tx.quoteItem.create({
                    data: {
                        quoteId: newQuote.id,
                        ...itemData
                    }
                });
            }

            return newQuote;
        });

        res.status(201).json({ message: 'Quote requested successfully', quote });
    } catch (error) {
        console.error('Create quote error:', error);
        res.status(500).json({ error: 'Failed to create quote' });
    }
};

// Get My Quotes
export const getMyQuotes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'User ID missing' });

        const quotes = await prisma.quote.findMany({
            where: { userId: Number(userId) },
            include: {
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ quotes });
    } catch (error) {
        console.error('Get quotes error:', error);
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
};

// Download Quote as Excel (Backend Generation)
export const downloadQuoteExcel = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const quoteId = Number(req.params.id);

        if (!userId) return res.status(401).json({ error: 'User ID missing' });

        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        // Import ExcelJS dynamically or at top level (using require/import)
        // Since we are in module mode, we use import at top, but let's assume it's imported above or we import here if needed.
        // Dynamic imports for ExcelJS generation
        let fetch: any;
        try {
            fetch = (await import('node-fetch')).default;
        } catch (e) {
            console.warn('node-fetch import failed, falling back to global fetch');
            fetch = global.fetch;
        }

        const ExcelJS = await import('exceljs');
        const fs = await import('fs');
        const path = await import('path');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('제안서');

        // Define columns
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
        ];

        // Insert Title Row (Row 1)
        worksheet.insertRow(1, []);
        worksheet.mergeCells('A1:C1');
        worksheet.mergeCells('D1:R1');

        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'RIUM';
        titleCell.font = { name: 'Arial', size: 20, bold: true, color: { argb: '003366' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        const warningCell = worksheet.getCell('D1');
        warningCell.value = '■ 당사가 운영하는 모든 상품은 폐쇄몰을 제외한 온라인 판매를 금하며, 판매 시 상품 공급이 중단됩니다.';
        warningCell.font = { name: 'Malgun Gothic', size: 12, bold: true, color: { argb: 'FF0000' } };
        warningCell.alignment = { vertical: 'middle', horizontal: 'left' };

        worksheet.getRow(1).height = 30;

        // Style Header (Row 2)
        const headerRow = worksheet.getRow(2);
        headerRow.font = { bold: true };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CCE5FF' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(2).height = 20;

        // Add Data Rows
        for (let i = 0; i < quote.items.length; i++) {
            const item = quote.items[i];
            const p = item.product;
            const row = worksheet.getRow(i + 3);

            row.values = {
                no: i + 1,
                status: p.isAvailable ? '' : '품절',
                id: p.id,
                name: p.name,
                image: '', // Visual Image placeholder
                model: p.modelNo || '-',
                option: p.productOptions || '',
                desc: p.description || '',
                manufacturer: p.manufacturer || '',
                origin: p.origin || '상세페이지 참조',
                cartonQty: p.quantityPerCarton || 1,
                defaultQty: 1,
                consumerPrice: p.consumerPrice || item.price * 1.5,
                supplyPrice: item.price,
                shipping: p.shippingFee || 0,
                imageUrl: p.imageUrl || '',
                detailUrl: p.detailUrl || '',
                remarks: p.remarks || ''
            };

            // Set Row Height for Image
            row.height = 100;
            row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            // Image Embedding
            if (p.imageUrl) {
                try {
                    let imageBuffer: any = null; // Use any to bypass Buffer type mismatch
                    let extension: 'png' | 'jpeg' = 'jpeg';

                    if (p.imageUrl.startsWith('/') && !p.imageUrl.startsWith('//')) {
                        // Local File
                        const localPath = path.join(process.cwd(), p.imageUrl);
                        if (fs.existsSync(localPath)) {
                            imageBuffer = fs.readFileSync(localPath);
                        } else {
                            console.warn(`Local image not found: ${localPath}`);
                        }
                    } else if (p.imageUrl.startsWith('http')) {
                        // Remote URL
                        // Note: Requires node-fetch or native fetch (Node 18+)
                        // Since we are in `ts-node` context, ensure fetch is available.
                        // Assuming fetch is globally available or polyfilled. If not, dynamic import above helps.
                        try {
                            const res = await fetch(p.imageUrl);
                            if (res.ok) {
                                const arrayBuffer = await res.arrayBuffer();
                                imageBuffer = Buffer.from(arrayBuffer as any);
                            } else {
                                console.warn(`Fetch failed ${p.imageUrl}: ${res.status}`);
                                row.getCell(5).value = `HTTP ${res.status}: ${p.imageUrl}`;
                            }
                        } catch (fetchErr) {
                            console.warn(`Fetch error ${p.imageUrl}:`, fetchErr);
                            row.getCell(5).value = `Fetch Err: ${p.imageUrl}`;
                        }
                    }

                    if (imageBuffer) {
                        if (p.imageUrl.toLowerCase().endsWith('.png')) extension = 'png';
                        const imageId = workbook.addImage({
                            buffer: imageBuffer,
                            extension: extension,
                        });

                        worksheet.addImage(imageId, {
                            tl: { col: 4, row: i + 2 } as any, // Column E (index 4)
                            br: { col: 5, row: i + 3 } as any,
                            editAs: 'oneCell'
                        });
                        row.height = 100; // Re-force row height on success
                    } else {
                        // If no image buffer, keep the text value set above for debugging
                        if (!row.getCell(5).value) {
                            row.getCell(5).value = `No Buffer: ${p.imageUrl}`;
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to embed image for product ${p.id}:`, err);
                    row.getCell(5).value = `Err: ${err}`;
                }
            } else {
                row.getCell(5).value = 'No URL';
            }

            // Force row height continuously
            row.height = 100;
        } // End Loop

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Quote_${quote.quoteNumber}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Download quote error:', error);
        res.status(500).json({ error: 'Failed to download quote' });
    }
};

// Delete Quotes (Bulk or Single)
export const deleteQuotes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { ids } = req.body; // Expect array of IDs

        if (!userId) return res.status(401).json({ error: 'User ID missing' });
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid IDs' });

        const deleteResult = await prisma.quote.deleteMany({
            where: {
                id: { in: ids.map(Number) },
                // userId: Number(userId) // Optional security
            }
        });

        res.json({ success: true, count: deleteResult.count });

    } catch (error) {
        console.error('Delete quotes error:', error);
        res.status(500).json({ error: 'Failed to delete quotes' });
    }
};

// Proxy Image for Excel embedding
export const proxyImage = async (req: AuthRequest, res: Response) => {
    try {
        const imageUrl = req.query.url as string;
        if (!imageUrl) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Simple fetch using global fetch (Node 18+)
        const response = await fetch(imageUrl);

        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch image');
        }

        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        console.error('Proxy image error:', error);
        res.status(500).json({ error: 'Failed to proxy image' });
    }
};
