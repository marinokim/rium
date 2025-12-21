import express from 'express'
import pool from '../config/database.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Get all categories
router.get('/', async (req, res) => {
    try {
        // Select all categories ordered by ID or Name
        const result = await pool.query('SELECT * FROM categories ORDER BY id ASC')
        res.json(result.rows)
    } catch (error) {
        console.error('Error fetching categories:', error)
        res.status(500).json({ error: 'Failed to fetch categories' })
    }
})

// Create category
router.post('/', requireAdmin, async (req, res) => {
    const { name, color } = req.body
    try {
        // Generate slug: lowercase, replace spaces with hyphens, remove special chars
        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

        const result = await pool.query(
            'INSERT INTO categories (name, slug, color) VALUES ($1, $2, $3) RETURNING *',
            [name, slug, color || '#ffffff']
        )
        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error('Create category error:', error)
        res.status(500).json({ error: 'Failed to create category' })
    }
})

// Update category (Admin)
router.put('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params
    const { name, color } = req.body
    try {
        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

        const result = await pool.query(
            'UPDATE categories SET name = $1, slug = $2, color = $3 WHERE id = $4 RETURNING *',
            [name, slug, color || '#ffffff', id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error('Update category error:', error)
        res.status(500).json({ error: 'Failed to update category' })
    }
})

// Delete category (Admin)
router.delete('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params
    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        // Check if products exist in this category
        const productCheck = await client.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id])
        const productCount = parseInt(productCheck.rows[0].count)

        if (productCount > 0) {
            await client.query('ROLLBACK')
            return res.status(400).json({
                error: 'Cannot delete category containing products',
                count: productCount
            })
        }

        const result = await client.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id])

        if (result.rows.length === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({ error: 'Category not found' })
        }

        await client.query('COMMIT')
        res.json({ message: 'Category deleted successfully' })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Delete category error:', error)
        res.status(500).json({ error: 'Failed to delete category' })
    } finally {
        client.release()
    }
})

export default router
