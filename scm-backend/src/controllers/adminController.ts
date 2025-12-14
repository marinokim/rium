import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Update Quote Status (Shipping Info)
export const updateQuoteStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, message } = req.body;

        // Validate Status
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updatedQuote = await prisma.quote.update({
            where: { id: Number(id) },
            data: {
                status,
                message
            }
        });

        res.json({ message: 'Quote status updated', quote: updatedQuote });
    } catch (error) {
        console.error('Update quote error:', error);
        res.status(500).json({ error: 'Failed to update quote' });
    }
};

// Get All Quotes (Admin View)
export const getAllQuotes = async (req: AuthRequest, res: Response) => {
    try {
        const quotes = await prisma.quote.findMany({
            include: {
                user: {
                    select: { name: true, company: true, email: true }
                },
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ quotes });
    } catch (error) {
        console.error('Get all quotes error:', error);
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
};
