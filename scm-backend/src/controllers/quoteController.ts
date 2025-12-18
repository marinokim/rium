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

// Download Quote as Excel
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

        // Arontec Style Formatting
        const wb = XLSX.utils.book_new();

        // Row 1: Header Info
        const headerInfo = [
            ['RIUM', '', '', '', '당사가 운영하는 모든 상품은 폐쇄몰을 제외한 온라인 판매를 급하며, 판매 시 상품 공급이 중단됩니다.', '', '', '', '', '', '', '', '', `(리움)_제안_${new Date().toISOString().split('T')[0]}`]
        ];

        // Row 2: Columns
        const columns = [
            '순번', '품절여부', '고유번호', '상품명', '상품이미지',
            '모델명', '옵션', '실명', '제조일', '원산지',
            '카톤입수량', '기본수량', '소비자가', '공급가(부가세포함)', '배송비(부가세포함)',
            '대표이미지', '상세이미지', '비고'
        ];

        // Row 3+: Data
        const dataRows = quote.items.map((item, index) => {
            const p = item.product as any;
            return [
                index + 1, // 순번
                p.isAvailable ? '' : '품절', // 품절여부
                p.id, // 고유번호
                p.name, // 상품명
                '', // 상품이미지 (Visual placeholder, empty due to tech limit)
                p.modelNo || '-', // 모델명
                p.productOptions || '', // 옵션
                p.brand || '', // 실명
                '', // 제조일
                p.origin || '중국', // 원산지
                p.quantityPerCarton || 1, // 카톤입수량
                1, // 기본수량 (Typical MOQ)
                p.consumerPrice || 0, // 소비자가
                item.price, // 공급가
                p.shippingFee || 0, // 배송비
                p.imageUrl || '', // 대표이미지 (URL)
                p.detailUrl ? `<img src="${p.detailUrl}">` : '', // 상세이미지 (HTML Tag style)
                p.remarks || '' // 비고
            ];
        });

        const wsData = [...headerInfo, columns, ...dataRows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Merge Row 1 Cells (A1:D1) - pure visual if supported, often ignored by basic readers but good property
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // A1:D1

        // Column Widths
        ws['!cols'] = [
            { wch: 5 }, { wch: 8 }, { wch: 8 }, { wch: 40 }, { wch: 15 },
            { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
            { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
            { wch: 50 }, { wch: 50 }, { wch: 20 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, `Quote_${quote.quoteNumber}`);

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Quote_${quote.quoteNumber}.xlsx`);
        res.send(buffer);

    } catch (error) {
        console.error('Download quote error:', error);
        res.status(500).json({ error: 'Failed to download quote' });
    }
};
