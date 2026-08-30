import express from 'express';
import { DataStore } from '../models/dataStore.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const logs = await DataStore.processingLogs.find({}, { createdAt: -1 }, 100);
    res.status(200).json({
      success: true,
      data: { activity: logs },
    });
  } catch (err) {
    next(err);
  }
});

export const activityRoutes = router;
