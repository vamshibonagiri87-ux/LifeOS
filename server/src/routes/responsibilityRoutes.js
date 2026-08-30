import express from 'express';
import { body } from 'express-validator';
import { ResponsibilityController } from '../controllers/responsibilityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', ResponsibilityController.list);
router.post(
  '/',
  validate([body('title').notEmpty().withMessage('Title is required')]),
  ResponsibilityController.create
);

router.get('/:id', ResponsibilityController.getById);
router.put('/:id', ResponsibilityController.update);
router.delete('/:id', ResponsibilityController.delete);

router.post('/:id/status', ResponsibilityController.updateStatus);
router.post('/:id/duplicate', ResponsibilityController.duplicate);
router.get('/:id/explain-priority', ResponsibilityController.explainPriority);

export const responsibilityRoutes = router;
