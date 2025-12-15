import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

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
        res.status(500).json({
            error: 'Failed to fetch quotes',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

// Get All Partners
export const getPartners = async (req: AuthRequest, res: Response) => {
    try {
        const partners = await prisma.user.findMany({
            where: { role: 'PARTNER' },
            select: {
                id: true,
                email: true,
                name: true,
                company: true,
                createdAt: true,
                isApproved: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ partners });
    } catch (error) {
        console.error('Get partners error:', error);
        res.status(500).json({ error: 'Failed to fetch partners' });
    }
};

// Approve Partner
export const approvePartner = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.update({
            where: { id: Number(id) },
            data: { isApproved: true }
        });
        res.json({ message: 'Partner approved successfully' });
    } catch (error) {
        console.error('Approve partner error:', error);
        res.status(500).json({ error: 'Failed to approve partner' });
    }
};
