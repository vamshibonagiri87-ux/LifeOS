import { DataStore } from '../models/dataStore.js';
import { NotificationService } from '../services/notificationService.js';

export class ReminderQueue {
  static async checkUpcomingDeadlines() {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 3600 * 1000);

    const activeResponsibilities = await DataStore.responsibilities.find({
      status: { $nin: ['COMPLETED', 'CANCELLED'] },
      deadline: { $lte: next24h },
    });

    for (const item of activeResponsibilities) {
      if (item.deadline) {
        await NotificationService.createNotification({
          owner: item.owner,
          responsibilityId: item._id || item.id,
          type: 'URGENT_DEADLINE',
          title: `⚠️ Upcoming Deadline: ${item.title}`,
          message: `Due within 24 hours (${new Date(item.deadline).toLocaleDateString()}). Priority: ${item.priority}.`,
        });
      }
    }
  }
}
