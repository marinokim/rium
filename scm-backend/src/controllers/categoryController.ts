import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { id: 'asc' }
        });
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

// Create Category
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, slug, color } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ error: 'Name and slug are required' });
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                color: color || '#e0e0e0'
            }
        });
        res.status(201).json({ message: 'Category created', category });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category (Slug might be duplicate)' });
    }
};

// Update Category
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, slug, color } = req.body;

        const category = await prisma.category.update({
            where: { id: Number(id) },
            data: { name, slug, color }
        });
        res.json({ message: 'Category updated', category });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
};

// Delete Category
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Optional: Check if products exist? Prisma might throw error on constraint violation
        // We can just try delete and catch error.

        await prisma.category.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Delete category error:', error);
        // Likely foreign key constraint if products exist
        res.status(500).json({ error: 'Failed to delete category. Ensure no products are linked.' });
    }
};
