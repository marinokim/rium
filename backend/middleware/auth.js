import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const verifyToken = (req) => {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rium_jwt_secret_key_2025')
            // Manually populate session from token
            req.session.userId = decoded.userId
            req.session.email = decoded.email
            req.session.isAdmin = decoded.isAdmin
            req.session.isApproved = decoded.isApproved
            return true
        } catch (err) {
            return false
        }
    }
    return false
}

// Middleware to check if user is authenticated
export const requireAuth = (req, res, next) => {
    // Check Session OR Token
    if (!req.session.userId) {
        if (!verifyToken(req)) {
            return res.status(401).json({ error: '로그인이 필요합니다' })
        }
    }
    next()
}

// Middleware to check if user is approved
export const requireApproved = async (req, res, next) => {
    if (!req.session.userId) {
        if (!verifyToken(req)) {
            return res.status(401).json({ error: '로그인이 필요합니다' })
        }
    }

    if (!req.session.isApproved) {
        return res.status(403).json({ error: '관리자 승인 대기중입니다' })
    }

    next()
}

// Middleware to check if user is admin
export const requireAdmin = async (req, res, next) => {
    if (!req.session.userId) {
        if (!verifyToken(req)) {
            return res.status(401).json({ error: '로그인이 필요합니다' })
        }
    }

    if (!req.session.isAdmin) {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' })
    }

    next()
}
