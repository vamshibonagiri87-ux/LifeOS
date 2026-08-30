import { ResponsibilityService } from '../services/responsibilityService.js';

export class DashboardController {
  static async getDashboard(req, res, next) {
    try {
      const data = await ResponsibilityService.getDashboardMetrics(req.user.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}
