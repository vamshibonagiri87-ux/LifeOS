import { DataStore } from '../models/dataStore.js';
import { AppError } from '../middleware/errorMiddleware.js';

export class ProcessingController {
  static async list(req, res, next) {
    try {
      const runs = await DataStore.processingRuns.find({ owner: req.user.id }, { createdAt: -1 }, 50);
      res.status(200).json({
        success: true,
        data: { processingRuns: runs },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const run = await DataStore.processingRuns.findById(req.params.id);
      if (!run || String(run.owner) !== String(req.user.id)) {
        throw new AppError('Processing run not found', 404, 'NOT_FOUND');
      }
      res.status(200).json({
        success: true,
        data: { processingRun: run },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTimeline(req, res, next) {
    try {
      const run = await DataStore.processingRuns.findById(req.params.id);
      if (!run || String(run.owner) !== String(req.user.id)) {
        throw new AppError('Processing run not found', 404, 'NOT_FOUND');
      }
      const logs = await DataStore.processingLogs.find({ processingRunId: req.params.id }, { createdAt: 1 });
      res.status(200).json({
        success: true,
        data: { processingRun: run, timeline: logs },
      });
    } catch (err) {
      next(err);
    }
  }

  static async pause(req, res, next) {
    try {
      const updated = await DataStore.processingRuns.findByIdAndUpdate(req.params.id, { status: 'PAUSED' });
      res.status(200).json({ success: true, data: { processingRun: updated } });
    } catch (err) {
      next(err);
    }
  }

  static async resume(req, res, next) {
    try {
      const updated = await DataStore.processingRuns.findByIdAndUpdate(req.params.id, { status: 'RUNNING' });
      res.status(200).json({ success: true, data: { processingRun: updated } });
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req, res, next) {
    try {
      const updated = await DataStore.processingRuns.findByIdAndUpdate(req.params.id, { status: 'CANCELLED' });
      res.status(200).json({ success: true, data: { processingRun: updated } });
    } catch (err) {
      next(err);
    }
  }
}
