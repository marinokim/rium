import prisma from '../lib/prisma.js';
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
            where: { userId: Number(userId) },
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
