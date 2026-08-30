import { NotificationService } from '../services/notificationService.js';

export class NotificationController {
  static async list(req, res, next) {
    try {
      const notifications = await NotificationService.getUserNotifications(req.user.id);
      res.status(200).json({
        success: true,
        data: { notifications },
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const updated = await NotificationService.markAsRead(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: { notification: updated },
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllAsRead(req.user.id);
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
