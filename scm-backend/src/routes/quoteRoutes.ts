import express from 'express';
import { createQuote, getMyQuotes, downloadQuoteExcel, deleteQuotes } from '../controllers/quoteController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createQuote);
router.get('/', authenticateToken, getMyQuotes);
router.delete('/', authenticateToken, deleteQuotes);
router.get('/:id/download/excel', authenticateToken, downloadQuoteExcel);

export default router;
