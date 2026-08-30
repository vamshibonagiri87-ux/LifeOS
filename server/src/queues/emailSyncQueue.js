import { ProcessingQueue } from './processingQueue.js';
import { GmailIntegration } from '../integrations/gmailIntegration.js';

export class EmailSyncQueue {
  static async addSyncJob(owner) {
    // In-memory or worker background execution
    setImmediate(async () => {
      try {
        const gmail = new GmailIntegration();
        await gmail.sync(owner);
      } catch (err) {
        console.error('[EmailSyncQueue] Sync error:', err.message);
      }
    });
    return { id: `sync-job-${Date.now()}`, owner, status: 'queued' };
  }
}
