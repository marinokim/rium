import express from 'express';
import { createQuote, getMyQuotes, downloadQuoteExcel, deleteQuotes, proxyImage } from '../controllers/quoteController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/proxy-image', authenticateToken, proxyImage); // Add proxy route
router.post('/', authenticateToken, createQuote);
router.get('/', authenticateToken, getMyQuotes);
router.delete('/', authenticateToken, deleteQuotes);
router.get('/:id/download/excel', authenticateToken, downloadQuoteExcel);

export default router;
