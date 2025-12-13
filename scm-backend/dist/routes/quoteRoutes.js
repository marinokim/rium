import express from 'express';
import { createQuote, getMyQuotes } from '../controllers/quoteController.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
router.post('/', authenticateToken, createQuote);
router.get('/', authenticateToken, getMyQuotes);
export default router;
