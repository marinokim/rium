import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all products (Catalog)
export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json({ products });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// Get product details
export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product details' });
    }
};
