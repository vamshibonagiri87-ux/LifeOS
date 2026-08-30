import express from 'express';
import { SourceController } from '../controllers/sourceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', SourceController.list);
router.get('/:id', SourceController.getById);
router.post('/:id/process', SourceController.process);
router.delete('/:id', SourceController.delete);

export const sourceRoutes = router;
