import express from 'express';
import { updateQuoteStatus, getAllQuotes, getPartners, approvePartner } from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require Admin role
router.use(authenticateToken, requireAdmin);

router.get('/quotes', getAllQuotes);
router.put('/quotes/:id', updateQuoteStatus);

router.get('/users', getPartners);
router.put('/users/:id/approve', approvePartner);

export default router;
