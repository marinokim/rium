import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, toggleNewStatus, toggleProductAvailability } from '../controllers/productController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public/Partner Routes
// Public Routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected Routes (Admin only)
// router.use(authenticateToken);
// router.use(requireAdmin);

router.post('/', createProduct);
router.put('/:id', updateProduct);
router.patch('/:id/new-status', toggleNewStatus);
router.patch('/:id/availability', toggleProductAvailability);
router.delete('/:id', deleteProduct);

export default router;
