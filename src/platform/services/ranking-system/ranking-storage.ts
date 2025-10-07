/**
 * 🗄️ RANKING STORAGE
 * 
 * High-performance ranking storage using Upstash Redis sorted sets
 */

import { kv } from '@vercel/kv';
import type { RankingScore } from './types';

export class RankingStorage {
  private keyPrefix: string = 'ranking';
  private isRedisAvailable: boolean = false;

  constructor() {
    // Check if Redis environment variables are available
    this.isRedisAvailable = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
    
    if (this.isRedisAvailable) {
      console.log('🗄️ [RANKING] Upstash Redis storage initialized');
    } else {
      console.warn('⚠️ [RANKING] Redis not configured - using fallback storage');
    }
  }

  /**
   * 📊 Get entity ranking score
   */
  async getEntityScore(workspaceId: string, entityId: string, entityType: string): Promise<number> {
    try {
      if (!this.isRedisAvailable) {
        return 0;
      }

      const key = this.getRankingKey(workspaceId, entityType);
      const score = await kv.zscore(key, entityId);
      return typeof score === 'number' ? score : 0;
    } catch (error) {
      console.error(`❌ [RANKING] Error getting entity score:`, error);
      return 0;
    }
  }

  /**
   * 🏆 Get entity rank position
   */
  async getEntityRank(workspaceId: string, entityId: string, entityType: string): Promise<number> {
    try {
      if (!this.isRedisAvailable) {
        return 0;
      }

      const key = this.getRankingKey(workspaceId, entityType);
      const rank = await kv.zrevrank(key, entityId);
      return typeof rank === 'number' ? rank + 1 : 0; // Convert 0-based to 1-based ranking
    } catch (error) {
      console.error(`❌ [RANKING] Error getting entity rank:`, error);
      return 0;
    }
  }

  /**
   * 📈 Update entity score
   */
  async updateEntityScore(workspaceId: string, entityId: string, entityType: string, score: number): Promise<void> {
    try {
      if (!this.isRedisAvailable) {
        console.warn(`⚠️ [RANKING] Redis not available - skipping score update for ${entityType} ${entityId}`);
        return;
      }

      const key = this.getRankingKey(workspaceId, entityType);
      await kv.zadd(key, { score, member: entityId });
      console.log(`📈 [RANKING] Updated ${entityType} ${entityId} score to ${score}`);
    } catch (error) {
      console.error(`❌ [RANKING] Error updating entity score:`, error);
    }
  }

  /**
   * 🏆 Get entity rankings
   */
  async getEntityRankings(workspaceId: string, entityType: string, limit: number = 100): Promise<RankingScore[]> {
    try {
      // If Redis is not available, return empty rankings
      if (!this.isRedisAvailable) {
        console.warn(`⚠️ [RANKING] Redis not available - returning empty rankings for ${entityType}`);
        return [];
      }

      const key = this.getRankingKey(workspaceId, entityType);
      const results = await kv.zrange(key, 0, limit - 1, { withScores: true, rev: true });
      
      const rankings: RankingScore[] = [];
      let rank = 1;
      
      for (const [entityId, score] of results as [string, number][]) {
        rankings.push({
          entityId: entityId as string,
          entityType,
          score: score as number,
          rank,
          factors: [], // TODO: Implement factor tracking
          lastUpdated: new Date()
        });
        rank++;
      }
      
      return rankings;
    } catch (error) {
      console.error(`❌ [RANKING] Error getting entity rankings:`, error);
      return [];
    }
  }

  /**
   * 📊 Get entity ranking details
   */
  async getEntityRanking(workspaceId: string, entityId: string, entityType: string): Promise<RankingScore | null> {
    try {
      const score = await this.getEntityScore(workspaceId, entityId, entityType);
      const rank = await this.getEntityRank(workspaceId, entityId, entityType);
      
      if (score === 0 && rank === 0) {
        return null;
      }
      
      return {
        entityId,
        entityType,
        score,
        rank,
        factors: [], // TODO: Implement factor tracking
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`❌ [RANKING] Error getting entity ranking:`, error);
      return null;
    }
  }

  /**
   * 🧹 Clear ranking data
   */
  async clearRankings(workspaceId: string, entityType?: string): Promise<void> {
    try {
      if (!this.isRedisAvailable) {
        console.warn(`⚠️ [RANKING] Redis not available - skipping clear rankings for ${workspaceId}`);
        return;
      }

      if (entityType) {
        const key = this.getRankingKey(workspaceId, entityType);
        await kv.del(key);
      } else {
        // Clear all rankings for workspace
        const pattern = `${this.keyPrefix}:${workspaceId}:*`;
        // Note: Upstash doesn't support pattern deletion, so we need to track keys
        // For now, we'll implement a simple approach
        const entityTypes = ['people', 'leads', 'opportunities', 'companies', 'prospects'];
        for (const type of entityTypes) {
          const key = this.getRankingKey(workspaceId, type);
          await kv.del(key);
        }
      }
      
      console.log(`🧹 [RANKING] Cleared rankings for ${workspaceId}${entityType ? `:${entityType}` : ''}`);
    } catch (error) {
      console.error(`❌ [RANKING] Error clearing rankings:`, error);
    }
  }

  /**
   * 📊 Get ranking statistics
   */
  async getRankingStats(workspaceId: string, entityType: string): Promise<{
    totalEntities: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  }> {
    try {
      if (!this.isRedisAvailable) {
        return {
          totalEntities: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0
        };
      }

      const key = this.getRankingKey(workspaceId, entityType);
      
      const [totalEntities, highestScore, lowestScore] = await Promise.all([
        kv.zcard(key),
        kv.zrange(key, 0, 0, { withScores: true, rev: true }).then(results => 
          results.length > 0 ? results[0][1] as number : 0
        ),
        kv.zrange(key, 0, 0, { withScores: true }).then(results => 
          results.length > 0 ? results[0][1] as number : 0
        )
      ]);
      
      // Calculate average score
      const allScores = await kv.zrange(key, 0, -1, { withScores: true });
      const averageScore = allScores.length > 0 
        ? (allScores as [string, number][]).reduce((sum, [, score]) => sum + score, 0) / allScores.length 
        : 0;
      
      return {
        totalEntities: totalEntities as number,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: highestScore as number,
        lowestScore: lowestScore as number
      };
    } catch (error) {
      console.error(`❌ [RANKING] Error getting ranking stats:`, error);
      return {
        totalEntities: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0
      };
    }
  }

  // Private helper methods
  private getRankingKey(workspaceId: string, entityType: string): string {
    return `${this.keyPrefix}:${workspaceId}:${entityType}`;
  }
}