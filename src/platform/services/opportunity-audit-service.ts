/**
 * 🎯 OPPORTUNITY AUDIT SERVICE
 * 
 * Tracks close date changes and provides analytics for opportunities
 * This service integrates with your existing AuditLog and ChangeLog tables
 */

import { prisma } from '@/lib/prisma';

export interface CloseDateChange {
  id: string;
  opportunityId: string;
  oldCloseDate: Date | null;
  newCloseDate: Date | null;
  userId: string;
  workspaceId: string;
  timestamp: Date;
  reason?: string;
}

export interface OpportunityWithChangeCount {
  id: string;
  name: string;
  expectedCloseDate: Date | null;
  actualCloseDate: Date | null;
  closeDateChangeCount: number;
  lastCloseDateChange?: Date;
  workspaceId: string;
}

export class OpportunityAuditService {
  
  /**
   * 🔍 Track when someone changes the close date on an opportunity
   */
  static async trackCloseDateChange(
    opportunityId: string,
    oldCloseDate: Date | null,
    newCloseDate: Date | null,
    userId: string,
    workspaceId: string,
    reason?: string
  ): Promise<void> {
    try {
      console.log(`📅 [OPPORTUNITY AUDIT] Tracking close date change for opportunity ${opportunityId}`);
      
      // 1. Log to AuditLog table
      await prisma.auditLog.create({
        data: {
          userId,
          workspaceId,
          action: 'close_date_changed',
          resource: opportunityId,
          resourceType: 'opportunity',
          details: {
            oldCloseDate: oldCloseDate?.toISOString(),
            newCloseDate: newCloseDate?.toISOString(),
            changeType: 'close_date_modification',
            reason: reason || 'User updated opportunity close date',
            timestamp: new Date().toISOString()
          },
          ipAddress: '127.0.0.1', // This would come from your request context
          userAgent: 'Opportunity Update', // This would come from your request context
          platform: 'web', // This would come from your platform detection
          category: 'opportunity_update',
          severity: 'info'
        }
      });
      
      // 2. Log to ChangeLog table for detailed tracking
      await prisma.changeLog.create({
        data: {
          workspaceId,
          userId,
          recordType: 'opportunity',
          recordId: opportunityId,
          changeType: 'close_date_update',
          oldValue: oldCloseDate?.toISOString() || 'null',
          newValue: newCloseDate?.toISOString() || 'null',
          description: `Close date changed from ${oldCloseDate?.toISOString().split('T')[0] || 'Not Set'} to ${newCloseDate?.toISOString().split('T')[0] || 'Not Set'}`,
          metadata: {
            fieldChanged: 'expectedCloseDate',
            changeReason: reason || 'User modification',
            timestamp: new Date().toISOString(),
            oldDate: oldCloseDate?.toISOString(),
            newDate: newCloseDate?.toISOString()
          }
        }
      });
      
      console.log(`✅ [OPPORTUNITY AUDIT] Close date change tracked successfully for ${opportunityId}`);
      
    } catch (error) {
      console.error('❌ [OPPORTUNITY AUDIT] Error tracking close date change:', error);
      // Don't throw - we don't want to break the main opportunity update flow
    }
  }
  
  /**
   * 📊 Get the number of times close date has been changed for a specific opportunity
   */
  static async getCloseDateChangeCount(opportunityId: string): Promise<number> {
    try {
      const changeCount = await prisma.changeLog.count({
        where: {
          recordId: opportunityId,
          recordType: 'opportunity',
          changeType: 'close_date_update'
        }
      });
      
      return changeCount;
    } catch (error) {
      console.error('❌ [OPPORTUNITY AUDIT] Error getting close date change count:', error);
      return 0;
    }
  }
  
  /**
   * 📈 Get all opportunities with their close date change counts
   */
  static async getOpportunitiesWithCloseDateChanges(workspaceId: string): Promise<OpportunityWithChangeCount[]> {
    try {
      const opportunities = await prisma.opportunities.findMany({
        where: { workspaceId },
        select: {
          id: true,
          name: true,
          expectedCloseDate: true,
          actualCloseDate: true,
          workspaceId: true
        }
      });
      
      // Get change counts for each opportunity
      const opportunitiesWithChanges = await Promise.all(
        opportunities.map(async (opp) => {
          const changeCount = await this.getCloseDateChangeCount(opp.id);
          
          // Get the last change timestamp
          const lastChange = await prisma.changeLog.findFirst({
            where: {
              recordId: opp.id,
              recordType: 'opportunity',
              changeType: 'close_date_update'
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
          });
          
          return {
            ...opp,
            closeDateChangeCount: changeCount,
            lastCloseDateChange: lastChange?.createdAt
          };
        })
      );
      
      // Sort by change count (highest first) to identify most volatile opportunities
      return opportunitiesWithChanges.sort((a, b) => b.closeDateChangeCount - a.closeDateChangeCount);
      
    } catch (error) {
      console.error('❌ [OPPORTUNITY AUDIT] Error getting opportunities with change counts:', error);
      return [];
    }
  }
  
  /**
   * 🚨 Get opportunities with high close date volatility (frequent changes)
   */
  static async getHighVolatilityOpportunities(workspaceId: string, threshold: number = 3): Promise<OpportunityWithChangeCount[]> {
    try {
      const opportunities = await this.getOpportunitiesWithCloseDateChanges(workspaceId);
      return opportunities.filter(opp => opp.closeDateChangeCount >= threshold);
    } catch (error) {
      console.error('❌ [OPPORTUNITY AUDIT] Error getting high volatility opportunities:', error);
      return [];
    }
  }
  
  /**
   * 📅 Get close date change history for a specific opportunity
   */
  static async getCloseDateChangeHistory(opportunityId: string): Promise<CloseDateChange[]> {
    try {
      const changes = await prisma.changeLog.findMany({
        where: {
          recordId: opportunityId,
          recordType: 'opportunity',
          changeType: 'close_date_update'
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          workspaceId: true,
          userId: true,
          createdAt: true,
          oldValue: true,
          newValue: true,
          metadata: true
        }
      });
      
      return changes.map(change => ({
        id: change.id,
        opportunityId,
        oldCloseDate: change['oldValue'] === 'null' ? null : new Date(change.oldValue),
        newCloseDate: change['newValue'] === 'null' ? null : new Date(change.newValue),
        userId: change.userId,
        workspaceId: change.workspaceId,
        timestamp: change.createdAt,
        reason: change.metadata?.changeReason as string
      }));
      
    } catch (error) {
      console.error('❌ [OPPORTUNITY AUDIT] Error getting close date change history:', error);
      return [];
    }
  }
  
  /**
   * 📊 Get analytics on close date changes across a workspace
   */
  static async getCloseDateChangeAnalytics(workspaceId: string) {
    try {
      const opportunities = await this.getOpportunitiesWithCloseDateChanges(workspaceId);
      
      const totalOpportunities = opportunities.length;
      const opportunitiesWithChanges = opportunities.filter(opp => opp.closeDateChangeCount > 0);
      const totalChanges = opportunities.reduce((sum, opp) => sum + opp.closeDateChangeCount, 0);
      
      const averageChangesPerOpportunity = totalOpportunities > 0 ? totalChanges / totalOpportunities : 0;
      const changeRate = totalOpportunities > 0 ? (opportunitiesWithChanges.length / totalOpportunities) * 100 : 0;
      
      // Find most volatile opportunities
      const mostVolatile = opportunities
        .filter(opp => opp.closeDateChangeCount > 0)
        .slice(0, 5);
      
      return {
        totalOpportunities,
        opportunitiesWithChanges: opportunitiesWithChanges.length,
        totalCloseDateChanges: totalChanges,
        averageChangesPerOpportunity: Math.round(averageChangesPerOpportunity * 100) / 100,
        changeRate: Math.round(changeRate * 100) / 100,
        mostVolatileOpportunities: mostVolatile,
        summary: {
          lowVolatility: opportunities.filter(opp => opp['closeDateChangeCount'] === 0).length,
          mediumVolatility: opportunities.filter(opp => opp.closeDateChangeCount >= 1 && opp.closeDateChangeCount <= 2).length,
          highVolatility: opportunities.filter(opp => opp.closeDateChangeCount >= 3).length
        }
      };
      
    } catch (error) {
      console.error('❌ [OPPORTUNITY AUDIT] Error getting analytics:', error);
      return null;
    }
  }
  
  /**
   * 🔄 Update opportunity with audit tracking
   * Use this instead of direct prisma.opportunities.update() to ensure audit logging
   */
  static async updateOpportunityWithAudit(
    opportunityId: string,
    updateData: any,
    userId: string,
    workspaceId: string
  ): Promise<void> {
    try {
      // Get current opportunity data
      const currentOpportunity = await prisma.opportunities.findUnique({
        where: { id: opportunityId },
        select: { expectedCloseDate: true }
      });
      
      if (!currentOpportunity) {
        throw new Error(`Opportunity ${opportunityId} not found`);
      }
      
      // Check if close date is being changed
      if (updateData['expectedCloseDate'] && 
          updateData.expectedCloseDate.getTime() !== currentOpportunity.expectedCloseDate?.getTime()) {
        
        // Track the close date change
        await this.trackCloseDateChange(
          opportunityId,
          currentOpportunity.expectedCloseDate,
          updateData.expectedCloseDate,
          userId,
          workspaceId,
          updateData.closeDateChangeReason || 'Opportunity update'
        );
      }
      
      // Update the opportunity
      await prisma.opportunities.update({
        where: { id: opportunityId },
        data: updateData
      });
      
      console.log(`✅ [OPPORTUNITY AUDIT] Opportunity ${opportunityId} updated with audit tracking`);
      
    } catch (error) {
      console.error('❌ [OPPORTUNITY AUDIT] Error updating opportunity with audit:', error);
      throw error; // Re-throw to let calling code handle the error
    }
  }
}

// Export utility functions for easy use
export const trackCloseDateChange = OpportunityAuditService.trackCloseDateChange;
export const getCloseDateChangeCount = OpportunityAuditService.getCloseDateChangeCount;
export const getOpportunitiesWithCloseDateChanges = OpportunityAuditService.getOpportunitiesWithCloseDateChanges;
export const getHighVolatilityOpportunities = OpportunityAuditService.getHighVolatilityOpportunities;
export const getCloseDateChangeHistory = OpportunityAuditService.getCloseDateChangeHistory;
export const getCloseDateChangeAnalytics = OpportunityAuditService.getCloseDateChangeAnalytics;
export const updateOpportunityWithAudit = OpportunityAuditService.updateOpportunityWithAudit;
