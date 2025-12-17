import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public? Or Protected? 
// getCategories might be needed for frontend list even for non-admins? 
// But "Category Management" is admin feature.
// Let's protect everything with authenticateToken. 
// Read is open to Partners? (e.g. for selection).
// Mutations require Admin.

router.get('/', getCategories);

router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
