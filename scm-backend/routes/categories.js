import express from 'express'
import pool from '../config/database.js'

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

export default router
