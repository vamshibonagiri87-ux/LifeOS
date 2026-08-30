import express from 'express';
import { DocumentController } from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('file'), DocumentController.upload);
router.get('/', DocumentController.list);
router.get('/:id', DocumentController.getById);
router.post('/:id/process', DocumentController.process);
router.delete('/:id', DocumentController.delete);

export const documentRoutes = router;
