import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/env.js';
import { AgentOrchestrator } from '../agents/orchestrator.js';

let redisConnection = null;
let isRedisActive = false;
let bullProcessingQueue = null;

// Initialize Redis if configured
if (config.redisUrl || process.env.REDIS_URL) {
  try {
    redisConnection = new IORedis(config.redisUrl || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      connectTimeout: 2000,
    });

    redisConnection.connect().then(() => {
      isRedisActive = true;
      console.log('[Queue] Redis connected for BullMQ processing queue');
      
      bullProcessingQueue = new Queue('processing-queue', { connection: redisConnection });
      
      // Initialize BullMQ worker
      new Worker(
        'processing-queue',
        async (job) => {
          const { sourceId, owner } = job.data;
          return await AgentOrchestrator.processSource(sourceId, owner);
        },
        { connection: redisConnection }
      );
    }).catch((err) => {
      isRedisActive = false;
      console.warn(`[Queue] Redis connection failed (${err.message}). Using In-Memory Background Queue Fallback.`);
    });
  } catch (e) {
    isRedisActive = false;
    console.warn('[Queue] Redis not available. Using In-Memory queue fallback.');
  }
} else {
  console.log('[Queue] No REDIS_URL provided. In-Memory async processing active.');
}

export class ProcessingQueue {
  static async addJob(sourceId, owner, options = {}) {
    if (isRedisActive && bullProcessingQueue) {
      return await bullProcessingQueue.add(
        'process-source',
        { sourceId, owner },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          ...options,
        }
      );
    }

    // In-memory async background execution fallback
    setImmediate(async () => {
      try {
        await AgentOrchestrator.processSource(sourceId, owner);
      } catch (err) {
        console.error('[ProcessingQueue:InMemory] Background processing error:', err);
      }
    });

    return { id: `inmem-job-${Date.now()}`, sourceId, status: 'queued' };
  }
}
