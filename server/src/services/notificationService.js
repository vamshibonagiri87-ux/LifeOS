import { DataStore } from '../models/dataStore.js';
import { emitUserEvent } from '../config/socket.js';

export class NotificationService {
  static async createNotification({ owner, responsibilityId, processingRunId, type, title, message }) {
    const notification = await DataStore.notifications.create({
      owner,
      responsibilityId,
      processingRunId,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date(),
    });

    // Stream real-time notification to user's room
    emitUserEvent(owner, 'NOTIFICATION_RECEIVED', notification);
    return notification;
  }

  static async getUserNotifications(owner) {
    return await DataStore.notifications.find({ owner }, { createdAt: -1 }, 50);
  }

  static async markAsRead(id, owner) {
    return await DataStore.notifications.findByIdAndUpdate(id, { isRead: true });
  }

  static async markAllAsRead(owner) {
    const notifs = await DataStore.notifications.find({ owner, isRead: false });
    for (const notif of notifs) {
      await DataStore.notifications.findByIdAndUpdate(notif._id || notif.id, { isRead: true });
    }
    return { success: true, count: notifs.length };
  }
}
