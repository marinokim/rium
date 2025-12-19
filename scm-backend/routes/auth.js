import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, companyName, contactPerson, phone, businessNumber: rawBusinessNumber } = req.body

        if (!rawBusinessNumber) {
            return res.status(400).json({ error: '사업자번호를 입력해주세요' })
        }

        const businessNumber = rawBusinessNumber.replace(/-/g, '')

        // Check if user exists (by business number)
        const bnCheck = await pool.query('SELECT id FROM users WHERE business_number = $1', [businessNumber])
        if (bnCheck.rows.length > 0) {
            return res.status(400).json({ error: '이미 등록된 사업자번호입니다' })
        }

        // Check if user exists (by email)
        const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email])
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: '이미 등록된 이메일입니다' })
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)

        // Insert user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, company_name, contact_person, phone, business_number) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, company_name`,
            [email, passwordHash, companyName, contactPerson, phone, businessNumber]
        )

        res.status(201).json({
            message: '회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.',
            user: result.rows[0]
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({ error: '회원가입 중 오류가 발생했습니다' })
    }
})

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, businessNumber: rawBusinessNumber, password } = req.body

        let user

        // Find user by Email (Priority) or Business Number
        if (email) {
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
            user = result.rows[0]
        } else if (rawBusinessNumber) {
            const businessNumber = rawBusinessNumber.replace(/-/g, '')
            const result = await pool.query('SELECT * FROM users WHERE business_number = $1', [businessNumber])
            user = result.rows[0]
        }

        if (!user) {
            return res.status(401).json({ error: '사용자를 찾을 수 없습니다' })
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash)
        if (!validPassword) {
            return res.status(401).json({ error: '비밀번호가 일치하지 않습니다' })
        }

        // Check approval
        if (!user.is_approved) {
            return res.status(403).json({ error: '관리자 승인 대기중입니다' })
        }

        // Set session (legacy support)
        req.session.userId = user.id
        req.session.email = user.email
        req.session.isAdmin = user.is_admin
        req.session.isApproved = user.is_approved

        // Generate JWT Token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                isAdmin: user.is_admin,
                isApproved: user.is_approved
            },
            process.env.JWT_SECRET || 'rium-scm-secret-2025',
            { expiresIn: '24h' }
        )

        res.json({
            message: '로그인 성공',
            token, // Send token to frontend
            user: {
                id: user.id,
                email: user.email,
                companyName: user.company_name,
                contactPerson: user.contact_person,
                isAdmin: user.is_admin,
                role: user.is_admin ? 'admin' : 'user',
                businessNumber: user.business_number,
                phone: user.phone
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: '로그인 중 오류가 발생했습니다' })
    }
})

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: '로그아웃 실패' })
        }
        res.json({ message: '로그아웃되었습니다' })
    })
})

// Get Current User (Session/Token Check)
router.get('/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const result = await pool.query('SELECT id, email, company_name, is_admin, business_number FROM users WHERE id = $1', [req.session.userId])
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' })
        }

        const user = result.rows[0]
        res.json({
            id: user.id,
            email: user.email,
            companyName: user.company_name,
            isAdmin: user.is_admin,
            role: user.is_admin ? 'admin' : 'user',
            businessNumber: user.business_number
        })
    } catch (error) {
        console.error('Get User Error:', error)
        res.status(500).json({ error: 'Server Error' })
    }
})

export default router
