import { DataStore } from '../models/dataStore.js';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import { ProcessingQueue } from '../queues/processingQueue.js';
import { AppError } from '../middleware/errorMiddleware.js';

export class SourceController {
  static async list(req, res, next) {
    try {
      const sources = await DataStore.sources.find({ owner: req.user.id }, { createdAt: -1 }, 100);
      res.status(200).json({
        success: true,
        data: { sources },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const source = await DataStore.sources.findById(req.params.id);
      if (!source || String(source.owner) !== String(req.user.id)) {
        throw new AppError('Source not found', 404, 'NOT_FOUND');
      }
      res.status(200).json({
        success: true,
        data: { source },
      });
    } catch (err) {
      next(err);
    }
  }

  static async process(req, res, next) {
    try {
      const source = await DataStore.sources.findById(req.params.id);
      if (!source || String(source.owner) !== String(req.user.id)) {
        throw new AppError('Source not found', 404, 'NOT_FOUND');
      }

      await ProcessingQueue.addJob(source._id || source.id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Processing initiated in background',
        data: { sourceId: source._id || source.id, status: 'QUEUED' },
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const source = await DataStore.sources.findById(req.params.id);
      if (!source || String(source.owner) !== String(req.user.id)) {
        throw new AppError('Source not found', 404, 'NOT_FOUND');
      }
      await DataStore.sources.findByIdAndDelete(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Source deleted',
      });
    } catch (err) {
      next(err);
    }
  }
}
