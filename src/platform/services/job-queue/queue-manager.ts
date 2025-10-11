/**
 * JOB QUEUE MANAGER
 * 
 * Background job processing with BullMQ
 * Following 2025 best practices: retry logic, idempotency, monitoring
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { logger } from '../observability/logger';
import { metrics, MetricNames } from '../observability/metrics';
import IORedis from 'ioredis';

// Job types
export type JobType = 
  | 'refresh-buyer-group'
  | 'enrich-contacts'
  | 'deep-research'
  | 'webhook-process';

export interface JobData {
  type: JobType;
  payload: any;
  workspaceId?: string;
  userId?: string;
  idempotencyKey?: string;
}

export interface RefreshBuyerGroupPayload {
  companyId: string;
  companyName: string;
  reason: string;
  triggeredBy?: string;
  enrichmentLevel?: 'identify' | 'enrich' | 'deep_research';
}

class QueueManager {
  private queues: Map<JobType, Queue> = new Map();
  private workers: Map<JobType, Worker> = new Map();
  private queueEvents: Map<JobType, QueueEvents> = new Map();
  private connection: IORedis;

  constructor() {
    // Redis connection
    this.connection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null, // Required for BullMQ
    });

    this.initializeQueues();
  }

  /**
   * Initialize all queues
   */
  private initializeQueues(): void {
    const jobTypes: JobType[] = [
      'refresh-buyer-group',
      'enrich-contacts',
      'deep-research',
      'webhook-process'
    ];

    for (const type of jobTypes) {
      this.createQueue(type);
    }
  }

  /**
   * Create a queue for a job type
   */
  private createQueue(type: JobType): void {
    const queue = new Queue(type, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s
        },
        removeOnComplete: 100, // Keep last 100 completed
        removeOnFail: 500, // Keep last 500 failed
      },
    });

    this.queues.set(type, queue);

    // Set up queue events for monitoring
    const queueEvents = new QueueEvents(type, {
      connection: this.connection,
    });

    queueEvents.on('completed', ({ jobId }) => {
      logger.info('job.completed', { jobType: type, jobId });
      metrics.increment(MetricNames.JOB_COMPLETED, 1, { jobType: type });
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error('job.failed', undefined, { jobType: type, jobId, failedReason });
      metrics.increment(MetricNames.JOB_FAILED, 1, { jobType: type });
    });

    this.queueEvents.set(type, queueEvents);

    logger.info('queue.created', { jobType: type });
  }

  /**
   * Enqueue a job
   */
  async enqueue(type: JobType, payload: any, options?: {
    priority?: number;
    delay?: number;
    idempotencyKey?: string;
  }): Promise<Job> {
    const queue = this.queues.get(type);
    
    if (!queue) {
      throw new Error(`Queue not found for type: ${type}`);
    }

    const jobData: JobData = {
      type,
      payload,
      idempotencyKey: options?.idempotencyKey,
    };

    const job = await queue.add(type, jobData, {
      priority: options?.priority,
      delay: options?.delay,
      jobId: options?.idempotencyKey, // Use idempotency key as job ID
    });

    logger.info('job.enqueued', {
      jobType: type,
      jobId: job.id,
      payload: JSON.stringify(payload),
    });

    metrics.increment(MetricNames.JOB_ENQUEUED, 1, { jobType: type });

    return job;
  }

  /**
   * Register a worker to process jobs
   */
  registerWorker(
    type: JobType,
    processor: (job: Job<JobData>) => Promise<any>,
    options?: {
      concurrency?: number;
      limiter?: {
        max: number;
        duration: number;
      };
    }
  ): void {
    const worker = new Worker(
      type,
      async (job: Job<JobData>) => {
        const startTime = Date.now();

        logger.info('job.started', {
          jobType: type,
          jobId: job.id,
          attemptNumber: job.attemptsMade + 1,
        });

        metrics.increment(MetricNames.JOB_STARTED, 1, { jobType: type });

        try {
          const result = await processor(job);
          
          const duration = Date.now() - startTime;
          
          logger.info('job.processing.completed', {
            jobType: type,
            jobId: job.id,
            duration,
          });

          metrics.histogram(MetricNames.JOB_DURATION, duration, { jobType: type });

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          logger.error('job.processing.failed', error as Error, {
            jobType: type,
            jobId: job.id,
            duration,
            attemptNumber: job.attemptsMade + 1,
          });

          throw error; // Will trigger retry
        }
      },
      {
        connection: this.connection,
        concurrency: options?.concurrency || 3,
        limiter: options?.limiter,
      }
    );

    this.workers.set(type, worker);

    logger.info('worker.registered', {
      jobType: type,
      concurrency: options?.concurrency || 3,
    });
  }

  /**
   * Get queue for a job type
   */
  getQueue(type: JobType): Queue | undefined {
    return this.queues.get(type);
  }

  /**
   * Get job by ID
   */
  async getJob(type: JobType, jobId: string): Promise<Job | undefined> {
    const queue = this.queues.get(type);
    
    if (!queue) {
      return undefined;
    }

    return await queue.getJob(jobId);
  }

  /**
   * Get job status
   */
  async getJobStatus(type: JobType, jobId: string): Promise<{
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'not_found';
    progress?: number;
    result?: any;
    error?: string;
  }> {
    const job = await this.getJob(type, jobId);

    if (!job) {
      return { status: 'not_found' };
    }

    const state = await job.getState();

    return {
      status: state as any,
      progress: job.progress as number,
      result: job.returnvalue,
      error: job.failedReason,
    };
  }

  /**
   * Close all queues and workers
   */
  async close(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.close();
    }

    for (const queue of this.queues.values()) {
      await queue.close();
    }

    for (const queueEvents of this.queueEvents.values()) {
      await queueEvents.close();
    }

    await this.connection.quit();

    logger.info('queue.manager.closed');
  }
}

// Export singleton instance
export const queueManager = new QueueManager();

export default queueManager;

