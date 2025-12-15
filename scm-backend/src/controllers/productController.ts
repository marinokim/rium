import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// Get all products (Catalog)
export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: { isAvailable: true },
            include: {
                category: true
            },
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
            where: { id: Number(id) }
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

// Create Product
export const createProduct = async (req: Request, res: Response) => {
    try {
        const productData = req.body;
        const newProduct = await prisma.product.create({
            data: {
                ...productData,
                categoryId: Number(productData.categoryId),
                price: Number(productData.price),
                consumerPrice: productData.consumerPrice ? Number(productData.consumerPrice) : 0,
                supplyPrice: productData.supplyPrice ? Number(productData.supplyPrice) : 0,
                stockQuantity: productData.stockQuantity ? Number(productData.stockQuantity) : 0,
                quantityPerCarton: productData.quantityPerCarton ? Number(productData.quantityPerCarton) : 1,
                shippingFee: productData.shippingFee ? Number(productData.shippingFee) : 0,
                shippingFeeIndividual: productData.shippingFeeIndividual ? Number(productData.shippingFeeIndividual) : 0,
                shippingFeeCarton: productData.shippingFeeCarton ? Number(productData.shippingFeeCarton) : 0,
                isTaxFree: productData.isTaxFree === true || productData.isTaxFree === 'true',
                isAvailable: true
            }
        });
        res.status(201).json({ message: "Product created", product: newProduct });
    } catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({ error: "Failed to create product" });
    }
};

// Update Product
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productData = req.body;

        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                ...productData,
                categoryId: productData.categoryId ? Number(productData.categoryId) : undefined,
                price: productData.price ? Number(productData.price) : undefined,
                consumerPrice: productData.consumerPrice !== undefined ? Number(productData.consumerPrice) : undefined,
                supplyPrice: productData.supplyPrice !== undefined ? Number(productData.supplyPrice) : undefined,
                stockQuantity: productData.stockQuantity !== undefined ? Number(productData.stockQuantity) : undefined,
                quantityPerCarton: productData.quantityPerCarton !== undefined ? Number(productData.quantityPerCarton) : undefined,
                shippingFee: productData.shippingFee !== undefined ? Number(productData.shippingFee) : undefined,
                shippingFeeIndividual: productData.shippingFeeIndividual !== undefined ? Number(productData.shippingFeeIndividual) : undefined,
                shippingFeeCarton: productData.shippingFeeCarton !== undefined ? Number(productData.shippingFeeCarton) : undefined,
                isTaxFree: productData.isTaxFree !== undefined ? (productData.isTaxFree === true || productData.isTaxFree === 'true') : undefined
            }
        });
        res.json({ message: "Product updated", product: updatedProduct });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({ error: "Failed to update product" });
    }
};

// Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({
            where: { id: Number(id) }
        });
        res.json({ message: "Product deleted" });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }
};
