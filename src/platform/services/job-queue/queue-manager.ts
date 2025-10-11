/**
 * JOB QUEUE MANAGER
 * 
 * Simplified background job processing
 * Following 2025 best practices: retry logic, idempotency, monitoring
 */

import { createLogger } from '@/platform/utils/logger';

const logger = createLogger('QueueManager');

// Job types
export type JobType = 
  | 'refresh-buyer-group'
  | 'enrich-contacts'
  | 'deep-research'
  | 'webhook-process';

export interface JobData {
  [key: string]: any;
}

export interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}

export interface Job {
  id: string;
  type: JobType;
  data: JobData;
  options: JobOptions;
  attempts: number;
  maxAttempts: number;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// Simple in-memory queue implementation
class SimpleQueue {
  private jobs: Map<string, Job> = new Map();
  private processing: Set<string> = new Set();
  private workers: Map<JobType, (job: Job) => Promise<void>> = new Map();

  async add(type: JobType, data: JobData, options: JobOptions = {}): Promise<Job> {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      options: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        ...options
      },
      attempts: 0,
      maxAttempts: options.attempts || 3,
      status: 'waiting',
      createdAt: new Date()
    };

    this.jobs.set(job.id, job);
    logger.info(`Job added: ${job.id} (${type})`);

    // Process job immediately if no delay
    if (!options.delay) {
      this.processJob(job.id);
    } else {
      setTimeout(() => this.processJob(job.id), options.delay);
    }

    return job;
  }

  async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'waiting') {
      return;
    }

    if (this.processing.has(jobId)) {
      return;
    }

    this.processing.add(jobId);
    job.status = 'active';
    job.processedAt = new Date();
    job.attempts++;

    try {
      const worker = this.workers.get(job.type);
      if (!worker) {
        throw new Error(`No worker registered for job type: ${job.type}`);
      }

      await worker(job);
      
      job.status = 'completed';
      job.completedAt = new Date();
      logger.info(`Job completed: ${jobId}`);
    } catch (error) {
      job.error = error instanceof Error ? error.message : String(error);
      
      if (job.attempts < job.maxAttempts) {
        job.status = 'waiting';
        const delay = job.options.backoff?.type === 'exponential' 
          ? job.options.backoff.delay * Math.pow(2, job.attempts - 1)
          : job.options.backoff?.delay || 1000;
        
        logger.warn(`Job failed, retrying in ${delay}ms: ${jobId} (attempt ${job.attempts}/${job.maxAttempts})`);
        setTimeout(() => this.processJob(jobId), delay);
      } else {
        job.status = 'failed';
        logger.error(`Job failed permanently: ${jobId}`, error);
      }
    } finally {
      this.processing.delete(jobId);
    }
  }

  registerWorker(type: JobType, worker: (job: Job) => Promise<void>): void {
    this.workers.set(type, worker);
    logger.info(`Worker registered for job type: ${type}`);
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  getJobs(status?: Job['status']): Job[] {
    const jobs = Array.from(this.jobs.values());
    return status ? jobs.filter(job => job.status === status) : jobs;
  }
}

// Global queue instance
const queue = new SimpleQueue();

export class QueueManager {
  static async addJob(type: JobType, data: JobData, options?: JobOptions): Promise<Job> {
    return queue.add(type, data, options);
  }

  static registerWorker(type: JobType, worker: (job: Job) => Promise<void>): void {
    queue.registerWorker(type, worker);
  }

  static getJob(jobId: string): Job | undefined {
    return queue.getJob(jobId);
  }

  static getJobs(status?: Job['status']): Job[] {
    return queue.getJobs(status);
  }
}

// Export the queue instance for direct access if needed
export { queue };