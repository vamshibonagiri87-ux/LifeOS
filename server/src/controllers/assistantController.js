import { AIService } from '../services/aiService.js';
import { DataStore } from '../models/dataStore.js';
import { AppError } from '../middleware/errorMiddleware.js';

export class AssistantController {
  static async query(req, res, next) {
    try {
      const { query } = req.body;
      if (!query || !query.trim()) {
        throw new AppError('Query string is required', 400, 'MISSING_FIELDS');
      }

      // Gather active contextual data for user
      const responsibilities = await DataStore.responsibilities.find({
        owner: req.user.id,
        status: { $ne: 'COMPLETED' },
      });

      const upcomingDeadlines = responsibilities.filter((r) => r.deadline);
      const blockedItems = responsibilities.filter((r) => r.status === 'BLOCKED' || (r.missingRequirements && r.missingRequirements.length > 0));
      const missingRequirements = [];
      responsibilities.forEach((r) => {
        if (r.missingRequirements && r.missingRequirements.length > 0) {
          missingRequirements.push({ title: r.title, missing: r.missingRequirements });
        }
      });

      const integrations = await DataStore.integrations.find({ owner: req.user.id });

      const contextData = {
        responsibilities,
        upcomingDeadlines,
        blockedItems,
        missingRequirements,
        integrations: integrations.map((i) => ({ provider: i.provider, connected: i.isConnected })),
      };

      const answer = await AIService.answerAssistantQuery(query, contextData);

      res.status(200).json({
        success: true,
        data: {
          query,
          answer,
          contextSummary: {
            activeCount: responsibilities.length,
            blockedCount: blockedItems.length,
            upcomingDeadlinesCount: upcomingDeadlines.length,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
