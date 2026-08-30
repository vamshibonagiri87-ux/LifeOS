import express from 'express';
import { AssistantController } from '../controllers/assistantController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/query', AssistantController.query);

export const assistantRoutes = router;
