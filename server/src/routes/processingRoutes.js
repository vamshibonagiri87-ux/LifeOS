import express from 'express';
import { ProcessingController } from '../controllers/processingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', ProcessingController.list);
router.get('/:id', ProcessingController.getById);
router.get('/:id/timeline', ProcessingController.getTimeline);
router.post('/:id/pause', ProcessingController.pause);
router.post('/:id/resume', ProcessingController.resume);
router.post('/:id/cancel', ProcessingController.cancel);

export const processingRoutes = router;
