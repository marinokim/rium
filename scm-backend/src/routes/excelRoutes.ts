import express from 'express';
import multer from 'multer';
import { uploadExcel } from '../controllers/excelController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes here should likely be admin protected
// All routes here should likely be admin protected
// router.use(authenticateToken);
// router.use(requireAdmin);

// Temporary: Allow public upload for testing
router.post('/upload', upload.single('file'), uploadExcel);

export default router;
