import prisma from '../lib/prisma.js';
// Get all products (Catalog)
export const getProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { isAvailable: true },
            orderBy: { name: 'asc' }
        });
        res.json({ products });
    }
    catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};
// Get product details
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: Number(id) }
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ product });
    }
    catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product details' });
    }
};
