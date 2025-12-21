import express from 'express'
import pool from '../config/database.js'
import { requireApproved } from '../middleware/auth.js'

const router = express.Router()

// Get dashboard data
router.get('/', requireApproved, async (req, res) => {
    try {
        // Get notifications
        const notificationsResult = await pool.query(`
      SELECT * FROM notifications 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 5
    `)

        // Get recent quotes
        const quotesResult = await pool.query(`
      SELECT * FROM quotes 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [req.session.userId])

        // --- NEW: Dashboard Stats ---
        const userId = req.session.userId

        // 1. My Proposals Count
        const proposalCountRes = await pool.query('SELECT COUNT(*) FROM proposal_history WHERE user_id = $1', [userId])
        const proposalCount = parseInt(proposalCountRes.rows[0].count)

        // 2. Pending Quotes (Waiting Approval)
        // Assuming 'pending' or NULL is the initial state
        const pendingQuotesRes = await pool.query("SELECT COUNT(*) FROM quotes WHERE user_id = $1 AND (status = 'pending' OR status IS NULL)", [userId])
        const pendingQuotesCount = parseInt(pendingQuotesRes.rows[0].count)

        // 3. Active Orders (Processing/Shipped)
        const activeOrdersRes = await pool.query("SELECT COUNT(*) FROM quotes WHERE user_id = $1 AND status IN ('approved', 'processing', 'shipped', 'delivered')", [userId])
        const activeOrdersCount = parseInt(activeOrdersRes.rows[0].count)

        // 4. Monthly Performance (Total Amount of Quotes/Orders this month)
        const perfRes = await pool.query(`
            SELECT SUM(total_amount) as total 
            FROM quotes 
            WHERE user_id = $1 
              AND created_at >= date_trunc('month', CURRENT_DATE)
              AND status != 'cancelled'
        `, [userId])
        const monthPerf = parseInt(perfRes.rows[0].total || 0)

        res.json({
            notifications: notificationsResult.rows,
            recentQuotes: quotesResult.rows,
            stats: {
                proposals: proposalCount,
                pendingQuotes: pendingQuotesCount,
                activeOrders: activeOrdersCount,
                monthPerformance: monthPerf
            }
        })
    } catch (error) {
        console.error('Get dashboard error:', error)
        res.status(500).json({ error: 'Failed to get dashboard data' })
    }
})

export default router
