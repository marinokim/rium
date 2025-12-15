import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public/Partner Routes
router.get('/', authenticateToken, getProducts);
router.get('/:id', authenticateToken, getProductById);

// Admin Routes
router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

export default router;
