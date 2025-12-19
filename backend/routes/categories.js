import express from 'express'
import pool from '../config/database.js'

const router = express.Router()

// Get all categories
router.get('/', async (req, res) => {
    const client = await pool.connect()
    try {
        const result = await client.query('SELECT * FROM categories ORDER BY id ASC')
        res.json({ categories: result.rows })
    } catch (error) {
        console.error('Get categories error:', error)
        res.status(500).json({ error: 'Failed to fetch categories' })
    } finally {
        client.release()
    }
})

// Create category
router.post('/', async (req, res) => {
    const { name, slug } = req.body
    if (!name || !slug) {
        return res.status(400).json({ error: 'Name and slug are required' })
    }

    const client = await pool.connect()
    try {
        // Check duplicate slug
        const check = await client.query('SELECT id FROM categories WHERE slug = $1', [slug])
        if (check.rows.length > 0) {
            return res.status(409).json({ error: 'Category slug already exists' })
        }

        const result = await client.query(
            'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *',
            [name, slug]
        )
        res.status(201).json({ category: result.rows[0] })
    } catch (error) {
        console.error('Create category error:', error)
        res.status(500).json({ error: 'Failed to create category' })
    } finally {
        client.release()
    }
})

// Delete category
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const client = await pool.connect()
    try {
        await client.query('DELETE FROM categories WHERE id = $1', [id])
        res.json({ message: 'Category deleted successfully' })
    } catch (error) {
        console.error('Delete category error:', error)
        res.status(500).json({ error: 'Failed to delete category' })
    } finally {
        client.release()
    }
})

export default router
