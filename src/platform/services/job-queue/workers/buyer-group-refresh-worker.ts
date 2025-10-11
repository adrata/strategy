/**
 * BUYER GROUP REFRESH WORKER
 * 
 * Background worker that processes buyer group refresh jobs
 * Triggered by webhooks, manual requests, or scheduled refreshes
 */

import { Job } from 'bullmq';
import { queueManager, JobData, RefreshBuyerGroupPayload } from '../queue-manager';
import { logger } from '../../observability/logger';
import { metrics, MetricNames } from '../../observability/metrics';
import { BuyerGroupEngine } from '@/platform/intelligence/buyer-group/buyer-group-engine';
import type { PipelineContext } from '@/platform/intelligence/shared/orchestration';

/**
 * Process buyer group refresh job
 */
async function processBuyerGroupRefresh(job: Job<JobData>): Promise<any> {
  const payload = job.data.payload as RefreshBuyerGroupPayload;
  
  logger.info('refresh.started', {
    companyId: payload.companyId,
    companyName: payload.companyName,
    reason: payload.reason,
  });

  const { prisma } = await import('@/platform/database/prisma-client');

  // Update refresh log to processing
  const refreshLog = await prisma.buyerGroupRefreshLog.create({
    data: {
      companyId: payload.companyId,
      workspaceId: job.data.workspaceId || 'system',
      reason: payload.reason,
      triggeredBy: payload.triggeredBy,
      status: 'processing',
      startedAt: new Date(),
    },
  });

  try {
    // Create buyer group engine context
    const context: PipelineContext = {
      workspaceId: job.data.workspaceId || 'system',
      userId: job.data.userId || 'system',
      enrichmentLevel: payload.enrichmentLevel || 'enrich',
      config: {},
      metadata: {
        startTime: Date.now(),
        stepCount: 0,
        currentStep: 'refresh',
      },
    };

    // Execute buyer group discovery
    const engine = new BuyerGroupEngine(context);
    
    const result = await engine.discover({
      companyName: payload.companyName,
      enrichmentLevel: payload.enrichmentLevel || 'enrich',
      workspaceId: job.data.workspaceId || 'system',
      options: {
        saveToDatabase: true,
      },
    });

    // Update refresh log to completed
    await prisma.buyerGroupRefreshLog.update({
      where: { id: refreshLog.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        changes: {
          totalMembers: result.buyerGroup.totalMembers,
          cohesionScore: result.buyerGroup.cohesionScore,
          overallConfidence: result.buyerGroup.overallConfidence,
          processingTime: result.processingTime,
          costEstimate: result.costEstimate,
        },
      },
    });

    logger.info('refresh.completed', {
      companyId: payload.companyId,
      companyName: payload.companyName,
      totalMembers: result.buyerGroup.totalMembers,
      processingTime: result.processingTime,
    });

    metrics.histogram('refresh.duration', result.processingTime, {
      reason: payload.reason,
      enrichmentLevel: payload.enrichmentLevel || 'enrich',
    });

    // TODO: Send notification to user
    // await notifyUser(job.data.userId, `Buyer group updated for ${payload.companyName}`);

    return result;
  } catch (error) {
    // Update refresh log to failed
    await prisma.buyerGroupRefreshLog.update({
      where: { id: refreshLog.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    logger.error('refresh.failed', error as Error, {
      companyId: payload.companyId,
      companyName: payload.companyName,
    });

    throw error;
  }
}

/**
 * Register the worker
 */
export function registerBuyerGroupRefreshWorker(): void {
  queueManager.registerWorker(
    'refresh-buyer-group',
    processBuyerGroupRefresh,
    {
      concurrency: 3, // Process 3 refreshes in parallel
      limiter: {
        max: 10, // Max 10 jobs per minute
        duration: 60000,
      },
    }
  );

  logger.info('worker.buyer_group_refresh.registered', {
    concurrency: 3,
    rateLimit: '10 jobs/minute',
  });
}

export default registerBuyerGroupRefreshWorker;

