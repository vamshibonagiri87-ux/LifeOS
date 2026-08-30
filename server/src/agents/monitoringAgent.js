import { DataStore } from '../models/dataStore.js';
import { emitUserEvent } from '../config/socket.js';
import { NotificationService } from '../services/notificationService.js';

export class MonitoringAgent {
  static async logStep({ processingRunId, sourceId, owner, agent, level = 'INFO', message, metadata = {} }) {
    const log = await DataStore.processingLogs.create({
      processingRunId,
      sourceId,
      agent,
      level,
      message,
      metadata,
      createdAt: new Date(),
    });

    // Stream real-time event to connected frontend
    emitUserEvent(owner, 'PROCESSING_EVENT', {
      processingRunId,
      sourceId,
      agent,
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    });

    return log;
  }

  static async notifyCompletion({ owner, sourceId, processingRunId, responsibilities = [] }) {
    if (responsibilities.length === 0) return;

    const criticalCount = responsibilities.filter((r) => r.priority === 'CRITICAL').length;
    const topItem = responsibilities[0];

    let title = `AI Processed ${responsibilities.length} Responsibility(ies)`;
    let message = `Identified: "${topItem?.title}". Priority: ${topItem?.priority}.`;

    if (criticalCount > 0) {
      title = `⚠️ Urgent: ${criticalCount} Critical Obligation(s) Detected`;
    }

    await NotificationService.createNotification({
      owner,
      processingRunId,
      responsibilityId: topItem?._id || topItem?.id,
      type: criticalCount > 0 ? 'URGENT_DEADLINE' : 'NEW_RESPONSIBILITY',
      title,
      message,
    });
  }
}
