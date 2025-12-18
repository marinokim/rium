import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// Get all products (Catalog)
// Get all products (Catalog) with Pagination
export const getProducts = async (req: Request, res: Response) => {
    try {
        const { isNew, limit, page } = req.query;

        // Pagination setup
        const pageNum = page ? Number(page) : 1;
        const limitNum = limit ? Number(limit) : 20; // Default 20
        const skip = (pageNum - 1) * limitNum;

        // Build filter
        const where: any = { isAvailable: true };

        // If isNew=true is passed, strict filter by isNew column if it exists in schema
        // Or if we interpret 'New' as 'Recently Added', the current code just sorts.
        // User explicitly said "Checked as New", so we must filter by 'isNew' column.
        if (isNew === 'true') {
            // Assuming schema has isNew boolean. 
            // If schema doesn't have it, this might crash or be ignored depending on Prisma strictness.
            // We will check schema next, but for now let's add the filter.
            where.isNew = true;
        }

        // Transaction to get both count and data
        const [total, products] = await prisma.$transaction([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                include: {
                    category: true
                },
                orderBy: isNew === 'true' ? { createdAt: 'desc' } : { name: 'asc' },
                take: limitNum,
                skip: skip
            })
        ]);

        res.json({
            products,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            error: 'Failed to fetch products',
            details: error instanceof Error ? error.message : String(error)
        });
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
        const {
            name, brand, modelNo, description,
            price, consumerPrice, supplyPrice,
            stockQuantity, quantityPerCarton,
            shippingFee, shippingFeeIndividual, shippingFeeCarton,
            manufacturer, origin, isTaxFree,
            imageUrl, detailUrl, productSpec, productOptions, remarks,
            categoryId, isAvailable, isNew
        } = req.body;

        const newProduct = await prisma.product.create({
            data: {
                name,
                brand,
                modelNo,
                description,
                price: Number(price),
                consumerPrice: consumerPrice ? Number(consumerPrice) : 0,
                supplyPrice: supplyPrice ? Number(supplyPrice) : 0,
                stockQuantity: stockQuantity ? Number(stockQuantity) : 0,
                quantityPerCarton: quantityPerCarton ? Number(quantityPerCarton) : 1,
                shippingFee: shippingFee ? Number(shippingFee) : 0,
                shippingFeeIndividual: shippingFeeIndividual ? Number(shippingFeeIndividual) : 0,
                shippingFeeCarton: shippingFeeCarton ? Number(shippingFeeCarton) : 0,
                manufacturer,
                origin,
                isTaxFree: isTaxFree === true || isTaxFree === 'true',
                imageUrl,
                detailUrl,
                productSpec,
                productOptions,
                remarks,
                categoryId: Number(categoryId),
                isAvailable: isAvailable !== undefined ? isAvailable : true,
                isNew: isNew !== undefined ? isNew : false
            }
        });
        res.status(201).json({ message: "Product created", product: newProduct });
    } catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({
            error: "Failed to create product",
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

// Update Product
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name, brand, modelNo, description,
            price, consumerPrice, supplyPrice,
            stockQuantity, quantityPerCarton,
            shippingFee, shippingFeeIndividual, shippingFeeCarton,
            manufacturer, origin, isTaxFree,
            imageUrl, detailUrl, productSpec, productOptions, remarks,
            categoryId, isAvailable, isNew
        } = req.body;

        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                name,
                brand,
                modelNo,
                description,
                price: price !== undefined ? Number(price) : undefined,
                consumerPrice: consumerPrice !== undefined ? Number(consumerPrice) : undefined,
                supplyPrice: supplyPrice !== undefined ? Number(supplyPrice) : undefined,
                stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
                quantityPerCarton: quantityPerCarton !== undefined ? Number(quantityPerCarton) : undefined,
                shippingFee: shippingFee !== undefined ? Number(shippingFee) : undefined,
                shippingFeeIndividual: shippingFeeIndividual !== undefined ? Number(shippingFeeIndividual) : undefined,
                shippingFeeCarton: shippingFeeCarton !== undefined ? Number(shippingFeeCarton) : undefined,
                manufacturer,
                origin,
                isTaxFree: isTaxFree !== undefined ? (isTaxFree === true || isTaxFree === 'true') : undefined,
                imageUrl,
                detailUrl,
                productSpec,
                productOptions,
                remarks,
                categoryId: categoryId ? Number(categoryId) : undefined,
                isAvailable,
                isNew
            }
        });
        res.json({ message: "Product updated", product: updatedProduct });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({
            error: "Failed to update product",
            details: error instanceof Error ? error.message : String(error)
        });
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
        res.status(500).json({
            error: "Failed to delete product",
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
// Toggle New Status
export const toggleNewStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isNew } = req.body;

        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: { isNew }
        });

        res.json({ message: "Product status updated", product: updatedProduct });
    } catch (error) {
        console.error("Toggle new status error:", error);
        res.status(500).json({
            error: "Failed to update product status",
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
// Toggle Product Availability
export const toggleProductAvailability = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body;

        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: { isAvailable }
        });

        res.json({ message: "Product availability updated", product: updatedProduct });
    } catch (error) {
        console.error("Toggle availability error:", error);
        res.status(500).json({
            error: "Failed to update product availability",
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
