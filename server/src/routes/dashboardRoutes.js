import express from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, DashboardController.getDashboard);

export const dashboardRoutes = router;
