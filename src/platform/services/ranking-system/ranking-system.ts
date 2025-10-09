/**
 * 🏆 UNIFIED RANKING SYSTEM
 * 
 * Main ranking system that orchestrates event-driven ranking updates.
 * Uses Redis sorted sets for high-performance ranking storage.
 */

import { prisma } from '../../database/prisma-client';
import { RankingEventProcessor } from './event-processor';
import { RankingStorage } from './ranking-storage';
import { RankingCalculator } from './ranking-calculator';
import type {
  RankingEvent,
  RankingUpdate,
  RankingScore,
  SystemRanking,
  RankingConfig,
  RankingMetrics
} from './types';

export class RankingSystem {
  private static instance: RankingSystem;
  private eventProcessor: RankingEventProcessor;
  private storage: RankingStorage;
  private calculator: RankingCalculator;
  private config: RankingConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.eventProcessor = new RankingEventProcessor();
    this.storage = new RankingStorage();
    this.calculator = new RankingCalculator();
  }

  static getInstance(): RankingSystem {
    if (!RankingSystem.instance) {
      RankingSystem.instance = new RankingSystem();
    }
    return RankingSystem.instance;
  }

  /**
   * 🎯 Process a ranking event and update system-wide ranks
   */
  async processRankingEvent(event: RankingEvent): Promise<RankingUpdate[]> {
    try {
      console.log(`🏆 [RANKING] Processing event: ${event.eventType} for ${event.entityType} ${event.entityId}`);

      // 1. Calculate impact score for the event
      const impactScore = this.calculator.calculateEventImpact(event, this.config);
      
      // 2. Get affected entities (related contacts, companies, etc.)
      const affectedEntities = await this.getAffectedEntities(event);
      
      // 3. Calculate new ranking scores
      const rankingUpdates: RankingUpdate[] = [];
      
      for (const entity of affectedEntities) {
        const currentScore = await this.storage.getEntityScore(event.workspaceId, entity.id, entity.type);
        const newScore = this.calculator.calculateNewScore(currentScore, impactScore, event);
        
        if (newScore !== currentScore) {
          const oldRank = await this.storage.getEntityRank(event.workspaceId, entity.id, entity.type);
          
          // Update score in Redis
          await this.storage.updateEntityScore(event.workspaceId, entity.id, entity.type, newScore);
          
          // Get new rank after update
          const newRank = await this.storage.getEntityRank(event.workspaceId, entity.id, entity.type);
          
          rankingUpdates.push({
            entityId: entity.id,
            entityType: entity.type,
            oldRank,
            newRank,
            score: newScore,
            reason: this.generateRankingReason(event, impactScore),
            timestamp: new Date()
          });
        }
      }
      
      // 4. Log ranking changes
      await this.logRankingChanges(event.workspaceId, event.userId, rankingUpdates);
      
      // 5. Trigger real-time updates
      await this.triggerRealTimeUpdates(event.workspaceId, rankingUpdates);
      
      console.log(`✅ [RANKING] Updated ${rankingUpdates.length} entities for event ${event.eventType}`);
      return rankingUpdates;

    } catch (error) {
      console.error(`❌ [RANKING] Error processing event ${event.eventType}:`, error);
      throw error;
    }
  }

  /**
   * 📊 Get system-wide rankings for a workspace
   */
  async getSystemRankings(workspaceId: string, entityType: string, limit: number = 100): Promise<RankingScore[]> {
    try {
      const rankings = await this.storage.getEntityRankings(workspaceId, entityType, limit);
      
      return rankings;
    } catch (error) {
      console.error(`❌ [RANKING] Error getting system rankings:`, error);
      throw error;
    }
  }

  /**
   * 🔄 Process all pending ranking events
   */
  async processPendingEvents(workspaceId: string): Promise<RankingMetrics> {
    try {
      console.log(`🔄 [RANKING] Processing pending events for workspace ${workspaceId}`);
      
      const events = await this.eventProcessor.getPendingEvents(workspaceId);
      let processedCount = 0;
      let failedCount = 0;
      const startTime = Date.now();
      
      for (const event of events) {
        try {
          await this.processRankingEvent(event);
          await this.eventProcessor.markEventProcessed(event.id);
          processedCount++;
        } catch (error) {
          console.error(`❌ [RANKING] Failed to process event ${event.id}:`, error);
          await this.eventProcessor.markEventFailed(event.id, error.message);
          failedCount++;
        }
      }
      
      const processingTime = Date.now() - startTime;
      const averageTime = events.length > 0 ? processingTime / events.length : 0;
      
      return {
        totalEvents: events.length,
        processedEvents: processedCount,
        failedEvents: failedCount,
        averageProcessingTime: averageTime,
        lastProcessedAt: new Date(),
        queueSize: await this.eventProcessor.getQueueSize(workspaceId)
      };
      
    } catch (error) {
      console.error(`❌ [RANKING] Error processing pending events:`, error);
      throw error;
    }
  }

  /**
   * 🎯 Get ranking for a specific entity
   */
  async getEntityRanking(workspaceId: string, entityId: string, entityType: string): Promise<RankingScore | null> {
    try {
      return await this.storage.getEntityRanking(workspaceId, entityId, entityType);
    } catch (error) {
      console.error(`❌ [RANKING] Error getting entity ranking:`, error);
      return null;
    }
  }

  /**
   * 🔧 Update ranking configuration
   */
  updateConfig(newConfig: Partial<RankingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(`🔧 [RANKING] Configuration updated`);
  }

  /**
   * 📈 Get ranking metrics
   */
  async getRankingMetrics(workspaceId: string): Promise<RankingMetrics> {
    return await this.eventProcessor.getMetrics(workspaceId);
  }

  // Private helper methods
  private async getAffectedEntities(event: RankingEvent): Promise<Array<{id: string, type: string}>> {
    // For now, just return the direct entity
    // TODO: Add relationship logic when needed
    return [{ id: event.entityId, type: event.entityType }];
  }

  private async logRankingChanges(workspaceId: string, userId: string, updates: RankingUpdate[]): Promise<void> {
    for (const update of updates) {
      await prisma.events.create({
        data: {
          workspaceId,
          userId,
          calendarId: 'system', // Use a system calendar ID
          title: 'Ranking Updated',
          description: `${update.entityType} ${update.entityId} rank changed from ${update.oldRank} to ${update.newRank}: ${update.reason}`,
          startTime: update.timestamp,
          endTime: update.timestamp,
          updatedAt: update.timestamp,
          attendees: {
            entityId: update.entityId,
            entityType: update.entityType,
            oldRank: update.oldRank,
            newRank: update.newRank,
            score: update.score,
            reason: update.reason
          }
        }
      });
    }
  }

  private async triggerRealTimeUpdates(workspaceId: string, updates: RankingUpdate[]): Promise<void> {
    // TODO: Implement WebSocket updates for real-time UI updates
    console.log(`📡 [RANKING] Triggering real-time updates for ${updates.length} entities`);
  }

  private generateRankingReason(event: RankingEvent, impactScore: number): string {
    const eventDescriptions: Record<string, string> = {
      'email_replied': 'Email response received',
      'meeting_scheduled': 'Meeting scheduled',
      'opportunity_won': 'Opportunity won',
      'lead_converted': 'Lead converted',
      'contact_viewed': 'Contact viewed',
      'email_opened': 'Email opened',
      'email_clicked': 'Email clicked'
    };
    
    return eventDescriptions[event.eventType] || `Activity: ${event.eventType}`;
  }

  private getDefaultConfig(): RankingConfig {
    return {
      eventWeights: {
        'opportunity_won': 100,
        'opportunity_stage_changed': 50,
        'email_replied': 40,
        'meeting_scheduled': 35,
        'lead_converted': 30,
        'email_opened': 20,
        'email_clicked': 25,
        'contact_viewed': 10,
        'email_sent': 5,
        'contact_created': 3
      },
      decayFactor: 0.95, // 5% decay per day
      maxScore: 1000,
      minScore: 0,
      batchSize: 50,
      processingInterval: 5000, // 5 seconds
      redisKeyPrefix: 'ranking',
      rankingTtl: 86400 // 24 hours
    };
  }

  /**
   * 🎯 Get dynamic goals for UI components
   */
  async getDynamicGoals(workspaceId: string): Promise<any[]> {
    try {
      // Get system rankings for dynamic goal calculation
      const rankings = await this.getSystemRankings(workspaceId, 'people', 100);
      
      // Calculate dynamic goals based on rankings
      const goals = [
        {
          label: 'High Priority Contacts',
          value: rankings.filter(r => r.score > 80).length,
          target: Math.max(10, Math.floor(rankings.length * 0.2)),
          isProgress: true,
          color: 'green'
        },
        {
          label: 'Active Opportunities',
          value: rankings.filter(r => r.entityType === 'opportunities').length,
          target: Math.max(5, Math.floor(rankings.length * 0.1)),
          isProgress: true,
          color: 'blue'
        },
        {
          label: 'Engagement Score',
          value: Math.round(rankings.reduce((sum, r) => sum + r.score, 0) / rankings.length || 0),
          target: 70,
          isProgress: true,
          color: 'purple'
        }
      ];

      return goals;
    } catch (error) {
      console.error('❌ [RANKING] Error getting dynamic goals:', error);
      return [];
    }
  }
}
