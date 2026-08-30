import { ProcessingQueue } from './processingQueue.js';
import { DataStore } from '../models/dataStore.js';
import { AgentOrchestrator } from '../agents/orchestrator.js';

export class DocumentQueue {
  static async addDocumentJob(documentId, owner) {
    setImmediate(async () => {
      try {
        const doc = await DataStore.documents.findById(documentId);
        if (!doc) return;

        // Create Source from document
        const source = await DataStore.sources.create({
          owner,
          type: 'DOCUMENT',
          externalId: documentId,
          title: doc.fileName,
          content: doc.extractedText,
          metadata: { fileType: doc.fileType, fileSize: doc.fileSize },
          sourceDate: new Date(),
          processingStatus: 'PENDING',
        });

        // Run agent orchestration
        const result = await AgentOrchestrator.processSource(source._id || source.id, owner);
        
        await DataStore.documents.findByIdAndUpdate(documentId, {
          processingStatus: result.success ? 'PROCESSED' : 'FAILED',
          extractedResponsibilitiesCount: result.responsibilities?.length || 0,
        });
      } catch (err) {
        console.error('[DocumentQueue] Document extraction error:', err);
      }
    });

    return { id: `doc-job-${Date.now()}`, documentId, status: 'queued' };
  }
}
