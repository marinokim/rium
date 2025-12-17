import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import prisma from '../lib/prisma.js';

// Helper to sanitise string
const sanitize = (str: any): string => {
    if (!str) return '';
    return String(str).trim().replace(/"/g, ''); // Basic sanitization, similar to Arontec
};

// Helper to parse price
const parsePrice = (price: any): number => {
    if (!price) return 0;
    const cleanPrice = String(price).replace(/[,원]/g, '').trim();
    return parseInt(cleanPrice) || 0;
};

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

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Identify category map to reduce DB calls
        const categories = await prisma.category.findMany();
        const categoryMap = new Map(categories.map(c => [c.name, c.id]));

        for (const [index, row] of data.entries()) {
            const rowNum = index + 2; // Excel row number (1-header)
            try {
                // Determine keys (Korean or English support from Arontec)
                const r = row as any;
                const brand = sanitize(r['Brand'] || r['브랜드']);
                const modelName = sanitize(r['ModelName'] || r['모델명']);
                // Note: Arontec used 'ModelNo' or '모델번호', but Rium schema uses 'modelNo'
                const modelNo = sanitize(r['ModelNo'] || r['모델번호']);
                const categoryName = sanitize(r['Category'] || r['카테고리']);
                const description = sanitize(r['Description'] || r['상세설명']);

                const b2bPrice = parsePrice(r['B2BPrice'] || r['실판매가'] || r['판매가'] || r['B2B가']);
                const consumerPrice = parsePrice(r['ConsumerPrice'] || r['소비자가'] || r['소가']);
                // Default supplyPrice logic from Arontec
                let supplyPrice = parsePrice(r['SupplyPrice'] || r['공급가'] || r['매입가'] || 0);
                if (supplyPrice === 0 && b2bPrice > 0) supplyPrice = b2bPrice;

                const stockQuantity = parsePrice(r['Stock'] || r['재고']);

                // Image Handling
                const extractUrl = (raw: any) => {
                    const str = sanitize(raw);
                    if (!str) return '';
                    const imgMatch = str.match(/<img[^>]+src\s*=\s*(?:['"]([^'"]+)['"]|(\S+))/i);
                    if (imgMatch) {
                        let url = imgMatch[1] || imgMatch[2];
                        return url ? url.replace(/[\/>]+$/, '') : str;
                    }
                    return str;
                };
                const imageUrl = extractUrl(r['ImageURL'] || r['이미지URL']);
                // Detail URL (Keep HTML if present)
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

                // Upsert Logic (Prefer model_no, then model_name)
                // Prisma upsert requires a unique identifier.
                // Since model_no might not be unique in schema (check schema?), we find first.
                // Arontec logic: Find by modelNo, if not -> Find by modelName. Then Update or Insert.

                let existingProduct = null;
                if (modelNo) {
                    existingProduct = await prisma.product.findFirst({ where: { modelNo } });
                }
                if (!existingProduct) {
                    existingProduct = await prisma.product.findFirst({ where: { modelNo: modelName } }); // Fallback or strict name match?
                    // Arontec code: SELECT id FROM products WHERE model_name = $1
                    if (!existingProduct) {
                        existingProduct = await prisma.product.findFirst({ where: { name: modelName } });
                    }
                }

                const productData = {
                    categoryId: categoryId || undefined,
                    brand,
                    description,
                    imageUrl,
                    price: b2bPrice, // Mapping 'b2bPrice' to 'price' (Selling Price)
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
                    modelNo: modelNo || modelName, // Fallback modelNo to name if empty?
                    productSpec,
                    remarks,
                    name: modelName,
                    isAvailable: true
                };

                if (existingProduct) {
                    // Update
                    await prisma.product.update({
                        where: { id: existingProduct.id },
                        data: {
                            ...productData,
                            // For update, categoryId can be undefined (no change) or null (if schema allowed, but it doesn't).
                            // If we want to allow updating category, we pass it if it exists.
                            // However, productData.categoryId is number | undefined.
                            // If specific logic needed for category update:
                            categoryId: categoryId || undefined
                        }
                    });
                } else {
                    // Create
                    if (!categoryId) {
                        throw new Error('Category is required for new products');
                    }


                    await prisma.product.create({
                        data: {
                            ...productData,
                            name: modelName,
                            modelNo: modelNo || modelName,
                            categoryId: categoryId // Guaranteed number here
                        }
                    });
                }
                successCount++;

            } catch (err) {
                errorCount++;
                errors.push(`Row ${rowNum}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        res.json({
            message: 'Excel processing completed',
            success: successCount,
            failed: errorCount,
            errors: errors
        });

    } catch (error) {
        console.error('Excel upload error:', error);
        res.status(500).json({ error: 'Failed to process Excel file' });
    }
};
