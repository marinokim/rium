import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Create Quote Request
export const createQuote = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'User ID missing' });
        const { items, message } = req.body; // items: { productId, quantity }[]
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in quote request' });
        }
        // 1. Generate Quote Number (Q + Timestamp)
        const quoteNumber = `Q${Date.now()}`;
        // 2. Create Quote and Items in Transaction
        const quote = await prisma.$transaction(async (tx) => {
            // Create the Quote
            const newQuote = await tx.quote.create({
                data: {
                    quoteNumber,
                    userId,
                    message,
                    status: 'PENDING'
                }
            });
            // Create Quote Items
            for (const item of items) {
                await tx.quoteItem.create({
                    data: {
                        quoteId: newQuote.id,
                        productId: item.productId,
                        quantity: item.quantity
                    }
                });
            }
            return newQuote;
        });
        res.status(201).json({ message: 'Quote requested successfully', quote });
    }
    catch (error) {
        console.error('Create quote error:', error);
        res.status(500).json({ error: 'Failed to create quote' });
    }
};
// Get My Quotes
export const getMyQuotes = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'User ID missing' });
        const quotes = await prisma.quote.findMany({
            where: { userId },
            include: {
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ quotes });
    }
    catch (error) {
        console.error('Get quotes error:', error);
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
};
