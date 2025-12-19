import express from 'express'
import cors from 'cors'
import session from 'express-session'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import cartRoutes from './routes/cart.js'
import quoteRoutes from './routes/quotes.js'
import dashboardRoutes from './routes/dashboard.js'
import notificationRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes from './routes/upload.js'
import excelRoutes from './routes/excel.js'
import proposalRoutes from './routes/proposalRoutes.js'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
app.set('trust proxy', 1) // Trust first proxy (Render/Heroku)
const PORT = process.env.PORT || 5002

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:8080',
        'http://localhost:5003',
        process.env.FRONTEND_URL,
        'https://rium-homepage.onrender.com', // Rium Homepage
        'https://rium-scm-backend.onrender.com',
        'https://arontec-home.onrender.com',
        'https://arontec.co.kr',
        'https://www.arontec.co.kr',
        'https://scm.arontec.co.kr',
        'https://b2b.arontec.co.kr'
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'rium-scm-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Always true for Render HTTPS
        httpOnly: true,
        sameSite: 'none', // Always allow cross-site (required for separate frontend/backend)
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/quotes', quoteRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/excel', excelRoutes)
app.use('/api/proposals', proposalRoutes)

// Serve uploads directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Root route for Render health check
app.get('/', (req, res) => {
    res.status(200).send('Rium SCM Backend is running')
})

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Arontec B2B SCM API is running' })
})

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Something went wrong!' })
})

import { runMigrations } from './migrations.js'

// ... (existing imports)

// Run migrations before starting server
runMigrations().then(() => {
    const HOST = '0.0.0.0'
    app.listen(PORT, HOST, () => {
        console.log(`🚀 Server running on http://${HOST}:${PORT}`)
        console.log(`📅 Server started at ${new Date().toISOString()}`)
    })
})
