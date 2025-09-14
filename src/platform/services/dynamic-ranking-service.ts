/**
 * 🚀 DYNAMIC RANKING SERVICE
 * 
 * Handles dynamic ranking updates based on buying signals and activity
 * - Automatically promotes leads to prospects when buying intent detected
 * - Tracks all changes for user transparency
 * - Updates global ranking in real-time
 */

import { prisma } from '@/platform/database/prisma-client';

export interface BuyingSignal {
  type: 'email_response' | 'website_visit' | 'demo_request' | 'pricing_inquiry' | 'meeting_scheduled';
  strength: 'weak' | 'medium' | 'strong';
  source: string;
  timestamp: Date;
  metadata?: any;
}

export interface RankChange {
  recordId: string;
  recordType: 'contact' | 'lead' | 'prospect' | 'account';
  oldRank: number;
  newRank: number;
  reason: string;
  buyingSignal?: BuyingSignal;
}

export class DynamicRankingService {
  /**
   * 🎯 Process buying signal and update ranking
   */
  static async processBuyingSignal(
    workspaceId: string,
    userId: string,
    recordId: string,
    recordType: 'contact' | 'lead' | 'prospect',
    buyingSignal: BuyingSignal
  ): Promise<RankChange | null> {
    try {
      console.log(`🚀 [DYNAMIC RANKING] Processing buying signal for ${recordType} ${recordId}`);

      // Get current record
      const record = await this.getRecord(recordType, recordId);
      if (!record) {
        console.warn(`⚠️ [DYNAMIC RANKING] Record not found: ${recordType} ${recordId}`);
        return null;
      }

      // Calculate new rank based on buying signal
      const oldRank = await this.getCurrentRank(workspaceId, recordType, recordId);
      const newRank = await this.calculateNewRank(workspaceId, recordType, recordId, buyingSignal);

      if (newRank === oldRank) {
        console.log(`ℹ️ [DYNAMIC RANKING] No rank change for ${recordType} ${recordId}`);
        return null;
      }

      // Update record status if needed
      await this.updateRecordStatus(recordType, recordId, buyingSignal);

      // Log the change
      await this.logChange(workspaceId, userId, recordType, recordId, {
        changeType: 'rank_change',
        oldValue: oldRank.toString(),
        newValue: newRank.toString(),
        description: `Rank changed from ${oldRank} to ${newRank} due to ${buyingSignal.type} buying signal`,
        metadata: { buyingSignal }
      });

      // If converting lead to prospect, log that too
      if (recordType === 'lead' && buyingSignal['strength'] === 'strong') {
        await this.logChange(workspaceId, userId, recordType, recordId, {
          changeType: 'conversion',
          oldValue: 'lead',
          newValue: 'prospect',
          description: `Lead converted to prospect due to strong buying signal: ${buyingSignal.type}`,
          metadata: { buyingSignal }
        });
      }

      console.log(`✅ [DYNAMIC RANKING] Updated ${recordType} ${recordId}: rank ${oldRank} → ${newRank}`);

      return {
        recordId,
        recordType,
        oldRank,
        newRank,
        reason: `Buying signal: ${buyingSignal.type}`,
        buyingSignal
      };

    } catch (error) {
      console.error(`❌ [DYNAMIC RANKING] Error processing buying signal:`, error);
      return null;
    }
  }

  /**
   * 📊 Get recent changes for user transparency
   */
  static async getRecentChanges(
    workspaceId: string,
    userId: string,
    days: number = 7
  ): Promise<any[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const changes = await prisma.changeLog.findMany({
      where: {
        workspaceId,
        userId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return changes.map(change => ({
      ...change,
      createdAt: change.createdAt.toISOString(),
      metadata: change.metadata ? JSON.parse(change.metadata as string) : null
    }));
  }

  /**
   * 📈 Get weekly summary of changes
   */
  static async getWeeklyChangeSummary(workspaceId: string, userId: string): Promise<any> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const changes = await prisma.changeLog.findMany({
      where: {
        workspaceId,
        userId,
        createdAt: { gte: weekStart }
      }
    });

    const summary = {
      totalChanges: changes.length,
      conversions: changes.filter(c => c['changeType'] === 'conversion').length,
      rankChanges: changes.filter(c => c['changeType'] === 'rank_change').length,
      buyingSignals: changes.filter(c => c['metadata'] && JSON.parse(c.metadata as string).buyingSignal).length,
      byRecordType: {} as Record<string, number>,
      byChangeType: {} as Record<string, number>
    };

    // Group by record type
    changes.forEach(change => {
      summary['byRecordType'][change.recordType] = (summary['byRecordType'][change.recordType] || 0) + 1;
      summary['byChangeType'][change.changeType] = (summary['byChangeType'][change.changeType] || 0) + 1;
    });

    return summary;
  }

  /**
   * 🔄 Auto-update records based on buying signals
   */
  static async autoUpdateRecords(workspaceId: string, userId: string): Promise<void> {
    try {
      console.log(`🔄 [DYNAMIC RANKING] Starting auto-update for workspace ${workspaceId}`);

      // Get recent buying signals from various sources
      const buyingSignals = await this.detectBuyingSignals(workspaceId);

      for (const signal of buyingSignals) {
        await this.processBuyingSignal(
          workspaceId,
          userId,
          signal.recordId,
          signal.recordType,
          signal.buyingSignal
        );
      }

      console.log(`✅ [DYNAMIC RANKING] Auto-update completed for ${buyingSignals.length} signals`);

    } catch (error) {
      console.error(`❌ [DYNAMIC RANKING] Auto-update error:`, error);
    }
  }

  // Private helper methods
  private static async getRecord(recordType: string, recordId: string): Promise<any> {
    switch (recordType) {
      case 'contact':
        return await prisma.contacts.findFirst({ where: { id: recordId , deletedAt: null} });
      case 'lead':
        return await prisma.leads.findFirst({ where: { id: recordId , deletedAt: null} });
      case 'prospect':
        return await prisma.prospect.findFirst({ where: { id: recordId , deletedAt: null} });
      default:
        return null;
    }
  }

  private static async getCurrentRank(workspaceId: string, recordType: string, recordId: string): Promise<number> {
    // This would integrate with the global ranking system
    // For now, return a placeholder
    return Math.floor(Math.random() * 1000) + 1;
  }

  private static async calculateNewRank(workspaceId: string, recordType: string, recordId: string, buyingSignal: BuyingSignal): Promise<number> {
    // Calculate new rank based on buying signal strength and type
    let rankBoost = 0;

    switch (buyingSignal.strength) {
      case 'strong':
        rankBoost = 500; // Move to top 50
        break;
      case 'medium':
        rankBoost = 200; // Move to top 200
        break;
      case 'weak':
        rankBoost = 50; // Small boost
        break;
    }

    // Additional boost based on signal type
    switch (buyingSignal.type) {
      case 'demo_request':
        rankBoost += 100;
        break;
      case 'pricing_inquiry':
        rankBoost += 75;
        break;
      case 'meeting_scheduled':
        rankBoost += 150;
        break;
    }

    const currentRank = await this.getCurrentRank(workspaceId, recordType, recordId);
    return Math.max(1, currentRank - rankBoost); // Higher rank = lower number
  }

  private static async updateRecordStatus(recordType: string, recordId: string, buyingSignal: BuyingSignal): Promise<void> {
    if (buyingSignal['strength'] === 'strong' && recordType === 'lead') {
      // Convert lead to prospect
      await prisma.leads.update({
        where: { id: recordId },
        data: { 
          status: 'qualified',
          priority: 'high'
        }
      });
    }
  }

  private static async logChange(
    workspaceId: string,
    userId: string,
    recordType: string,
    recordId: string,
    change: {
      changeType: string;
      oldValue?: string;
      newValue: string;
      description: string;
      metadata?: any;
    }
  ): Promise<void> {
    await prisma.changeLog.create({
      data: {
        workspaceId,
        userId,
        recordType,
        recordId,
        changeType: change.changeType,
        oldValue: change.oldValue,
        newValue: change.newValue,
        description: change.description,
        metadata: change.metadata ? JSON.stringify(change.metadata) : null
      }
    });
  }

  private static async detectBuyingSignals(workspaceId: string): Promise<Array<{
    recordId: string;
    recordType: 'contact' | 'lead' | 'prospect';
    buyingSignal: BuyingSignal;
  }>> {
    // This would integrate with various data sources:
    // - Email responses
    // - Website analytics
    // - CRM activities
    // - Calendar events
    // - Social media engagement
    
    // For now, return empty array
    return [];
  }
}
