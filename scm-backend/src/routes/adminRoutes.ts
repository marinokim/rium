import express from 'express';
import { updateQuoteStatus, getAllQuotes } from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require Admin role
router.use(authenticateToken, requireAdmin);

router.get('/quotes', getAllQuotes);
router.put('/quotes/:id', updateQuoteStatus);

export default router;
