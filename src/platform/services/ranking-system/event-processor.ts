/**
 * 🎯 RANKING EVENT PROCESSOR
 * 
 * Handles event queue processing and database trigger integration
 */

// Lazy import prisma to avoid client-side execution
let prisma: any = null;
async function getPrisma() {
  if (!prisma && typeof window === "undefined") {
    const { prisma: prismaClient } = await import('../../database/prisma-client');
    prisma = prismaClient;
  }
  return prisma;
}
import type { RankingEvent, RankingMetrics } from './types';

export class RankingEventProcessor {
  
  /**
   * 📥 Add ranking event to queue
   */
  async addRankingEvent(event: Omit<RankingEvent, 'id' | 'timestamp' | 'processed'>): Promise<string> {
    try {
      const prismaClient = await getPrisma();
      if (!prismaClient) {
        throw new Error('Database not available');
      }
      
      const rankingEvent = await prismaClient.rankingEvent.create({
        data: {
          workspaceId: event.workspaceId,
          userId: event.userId,
          eventType: event.eventType,
          entityType: event.entityType,
          entityId: event.entityId,
          eventData: event.eventData,
          impactScore: event.impactScore,
          processed: false
        }
      });
      
      console.log(`📥 [RANKING] Added event to queue: ${event.eventType} for ${event.entityType} ${event.entityId}`);
      return rankingEvent.id;
      
    } catch (error) {
      console.error(`❌ [RANKING] Error adding event to queue:`, error);
      throw error;
    }
  }

  /**
   * 📋 Get pending ranking events
   */
  async getPendingEvents(workspaceId: string, limit: number = 100): Promise<RankingEvent[]> {
    try {
      const prismaClient = await getPrisma();
      if (!prismaClient) {
        throw new Error('Database not available');
      }
      
      const events = await prismaClient.rankingEvent.findMany({
        where: {
          workspaceId,
          processed: false
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: limit
      });
      
      return events.map(event => ({
        id: event.id,
        workspaceId: event.workspaceId,
        userId: event.userId,
        eventType: event.eventType,
        entityType: event.entityType as any,
        entityId: event.entityId,
        eventData: event.eventData as Record<string, any>,
        impactScore: event.impactScore,
        timestamp: event.createdAt,
        processed: event.processed
      }));
      
    } catch (error) {
      console.error(`❌ [RANKING] Error getting pending events:`, error);
      return [];
    }
  }

  /**
   * ✅ Mark event as processed
   */
  async markEventProcessed(eventId: string): Promise<void> {
    try {
      const prismaClient = await getPrisma();
      if (!prismaClient) {
        throw new Error('Database not available');
      }
      
      await prismaClient.rankingEvent.update({
        where: { id: eventId },
        data: { 
          processed: true,
          processedAt: new Date()
        }
      });
    } catch (error) {
      console.error(`❌ [RANKING] Error marking event as processed:`, error);
    }
  }

  /**
   * ❌ Mark event as failed
   */
  async markEventFailed(eventId: string, errorMessage: string): Promise<void> {
    try {
      const prismaClient = await getPrisma();
      if (!prismaClient) {
        throw new Error('Database not available');
      }
      
      await prismaClient.rankingEvent.update({
        where: { id: eventId },
        data: { 
          processed: false,
          errorMessage,
          retryCount: { increment: 1 }
        }
      });
    } catch (error) {
      console.error(`❌ [RANKING] Error marking event as failed:`, error);
    }
  }

  /**
   * 📊 Get queue size
   */
  async getQueueSize(workspaceId: string): Promise<number> {
    try {
      const prismaClient = await getPrisma();
      if (!prismaClient) {
        return 0;
      }
      
      return await prismaClient.rankingEvent.count({
        where: {
          workspaceId,
          processed: false
        }
      });
    } catch (error) {
      console.error(`❌ [RANKING] Error getting queue size:`, error);
      return 0;
    }
  }

  /**
   * 📈 Get ranking metrics
   */
  async getMetrics(workspaceId: string): Promise<RankingMetrics> {
    try {
      const prismaClient = await getPrisma();
      if (!prismaClient) {
        return { totalEvents: 0, processedEvents: 0, failedEvents: 0, successRate: 0 };
      }
      
      const [totalEvents, processedEvents, failedEvents] = await Promise.all([
        prismaClient.rankingEvent.count({
          where: { workspaceId }
        }),
        prismaClient.rankingEvent.count({
          where: { workspaceId, processed: true }
        }),
        prismaClient.rankingEvent.count({
          where: { 
            workspaceId, 
            processed: false,
            retryCount: { gt: 0 }
          }
        })
      ]);

      const lastProcessed = await prismaClient.rankingEvent.findFirst({
        where: { workspaceId, processed: true },
        orderBy: { processedAt: 'desc' },
        select: { processedAt: true }
      });

      return {
        totalEvents,
        processedEvents,
        failedEvents,
        averageProcessingTime: 0, // TODO: Calculate from processing logs
        lastProcessedAt: lastProcessed?.processedAt || new Date(),
        queueSize: await this.getQueueSize(workspaceId)
      };
      
    } catch (error) {
      console.error(`❌ [RANKING] Error getting metrics:`, error);
      return {
        totalEvents: 0,
        processedEvents: 0,
        failedEvents: 0,
        averageProcessingTime: 0,
        lastProcessedAt: new Date(),
        queueSize: 0
      };
    }
  }

  /**
   * 🧹 Clean up old processed events
   */
  async cleanupOldEvents(workspaceId: string, olderThanDays: number = 7): Promise<number> {
    try {
      const prismaClient = await getPrisma();
      if (!prismaClient) {
        return 0;
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const result = await prismaClient.rankingEvent.deleteMany({
        where: {
          workspaceId,
          processed: true,
          processedAt: { lt: cutoffDate }
        }
      });
      
      console.log(`🧹 [RANKING] Cleaned up ${result.count} old events`);
      return result.count;
      
    } catch (error) {
      console.error(`❌ [RANKING] Error cleaning up old events:`, error);
      return 0;
    }
  }
}
