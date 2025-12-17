import express from 'express';
import multer from 'multer';
import { uploadExcel, replaceSource, registerRange } from '../controllers/excelController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes here should likely be admin protected
// router.use(authenticateToken);
// router.use(requireAdmin);

// Temporary: Allow public for testing
router.post('/upload', upload.single('file'), uploadExcel);
router.post('/replace-source', upload.single('file'), replaceSource);
router.post('/register-range', registerRange);

export default router;
