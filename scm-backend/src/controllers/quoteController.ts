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
        // Optional: Check ownership? 
        // if (quote.userId !== Number(userId) && req.user.role !== 'ADMIN') ...

        // Prepare Data for Excel
        const data: any[] = quote.items.map((item, index) => {
            const p = item.product as any;
            return {
                'No': index + 1,
                'Product Name': p.name,
                'Model No': p.modelNo || '-',
                'Spec': p.productSpec || '-',
                'Quantity': item.quantity,
                'Unit Price': item.price,
                'Supply Price': item.price * 0.9,
                'Amount': item.price * item.quantity,
                'Remark': p.remarks || ''
            };
        });

        // Add Summary Row
        data.push({
            'No': '', 'Product Name': 'Total', 'Model No': '', 'Spec': '',
            'Quantity': data.reduce((sum, r) => sum + (r['Quantity'] as number), 0),
            'Unit Price': 0, 'Supply Price': 0,
            'Amount': quote.totalAmount, 'Remark': ''
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Adjust Column Widths (Optional)
        ws['!cols'] = [
            { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
            { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
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
