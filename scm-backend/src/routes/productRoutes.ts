import express from 'express';
import { getProducts, getProductById } from '../controllers/productController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (Partners only)
router.get('/', authenticateToken, getProducts);
router.get('/:id', authenticateToken, getProductById);

export default router;
