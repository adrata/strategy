/**
 * 🗑️ DELETION SERVICE - 2025 Best Practices
 * 
 * Implements hybrid deletion strategy:
 * 1. Soft delete (immediate) - for data recovery and compliance
 * 2. Hard delete (eventual) - for performance and storage management
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DeletionConfig {
  // Soft delete retention periods (in days)
  retentionPeriods: {
    companies: number;    // 365 days
    people: number;       // 180 days  
    actions: number;      // 90 days
    audit_logs: number;   // 2555 days (7 years for compliance)
  };
  
  // Batch sizes for cleanup operations
  batchSizes: {
    companies: number;    // 100
    people: number;       // 500
    actions: number;      // 1000
    audit_logs: number;   // 2000
  };
}

export class DeletionService {
  private config: DeletionConfig;

  constructor(config?: Partial<DeletionConfig>) {
    this.config = {
      retentionPeriods: {
        companies: 365,    // 1 year
        people: 180,       // 6 months
        actions: 90,       // 3 months
        audit_logs: 2555,  // 7 years (compliance)
      },
      batchSizes: {
        companies: 100,
        people: 500,
        actions: 1000,
        audit_logs: 2000,
      },
      ...config,
    };
  }

  /**
   * 🗑️ SOFT DELETE - Mark record as deleted
   */
  async softDelete(entityType: 'companies' | 'people' | 'actions', id: string, userId: string): Promise<boolean> {
    try {
      const deletedAt = new Date();
      
      // First, get the user's workspace to ensure proper filtering
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      });
      
      if (!user) {
        console.error(`❌ [DELETION] User not found: ${userId}`);
        return false;
      }
      
      switch (entityType) {
        case 'companies':
          await prisma.companies.update({
            where: { 
              id,
              workspaceId: user.workspaceId,
              deletedAt: null // Only delete non-deleted records
            },
            data: { deletedAt },
          });
          break;
          
        case 'people':
          await prisma.people.update({
            where: { 
              id,
              workspaceId: user.workspaceId,
              deletedAt: null // Only delete non-deleted records
            },
            data: { deletedAt },
          });
          break;
          
        case 'actions':
          await prisma.actions.update({
            where: { 
              id,
              workspaceId: user.workspaceId,
              deletedAt: null // Only delete non-deleted records
            },
            data: { deletedAt },
          });
          break;
      }

      // Log the deletion for audit trail
      await this.logDeletion(entityType, id, userId, 'SOFT_DELETE');
      
      console.log(`✅ [DELETION] Soft deleted ${entityType} ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ [DELETION] Failed to soft delete ${entityType} ${id}:`, error);
      return false;
    }
  }

  /**
   * 🔄 RESTORE - Undo soft delete
   */
  async restore(entityType: 'companies' | 'people' | 'actions', id: string, userId: string): Promise<boolean> {
    try {
      // First, get the user's workspace to ensure proper filtering
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      });
      
      if (!user) {
        console.error(`❌ [DELETION] User not found: ${userId}`);
        return false;
      }
      
      switch (entityType) {
        case 'companies':
          await prisma.companies.update({
            where: { 
              id,
              workspaceId: user.workspaceId,
              deletedAt: { not: null } // Only restore soft-deleted records
            },
            data: { deletedAt: null },
          });
          break;
          
        case 'people':
          await prisma.people.update({
            where: { 
              id,
              workspaceId: user.workspaceId,
              deletedAt: { not: null } // Only restore soft-deleted records
            },
            data: { deletedAt: null },
          });
          break;
          
        case 'actions':
          await prisma.actions.update({
            where: { 
              id,
              workspaceId: user.workspaceId,
              deletedAt: { not: null } // Only restore soft-deleted records
            },
            data: { deletedAt: null },
          });
          break;
      }

      // Log the restoration
      await this.logDeletion(entityType, id, userId, 'RESTORE');
      
      console.log(`✅ [DELETION] Restored ${entityType} ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ [DELETION] Failed to restore ${entityType} ${id}:`, error);
      return false;
    }
  }

  /**
   * 💥 HARD DELETE - Permanently remove record
   */
  async hardDelete(entityType: 'companies' | 'people' | 'actions', id: string, userId: string): Promise<boolean> {
    try {
      // First, get the user's workspace to ensure proper filtering
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { workspaceId: true }
      });
      
      if (!user) {
        console.error(`❌ [DELETION] User not found: ${userId}`);
        return false;
      }
      
      switch (entityType) {
        case 'companies':
          await prisma.companies.delete({
            where: { 
              id,
              workspaceId: user.workspaceId
            },
          });
          break;
          
        case 'people':
          await prisma.people.delete({
            where: { 
              id,
              workspaceId: user.workspaceId
            },
          });
          break;
          
        case 'actions':
          await prisma.actions.delete({
            where: { 
              id,
              workspaceId: user.workspaceId
            },
          });
          break;
      }

      // Log the permanent deletion
      await this.logDeletion(entityType, id, userId, 'HARD_DELETE');
      
      console.log(`✅ [DELETION] Hard deleted ${entityType} ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ [DELETION] Failed to hard delete ${entityType} ${id}:`, error);
      return false;
    }
  }

  /**
   * 🧹 CLEANUP - Remove old soft-deleted records
   */
  async cleanupOldSoftDeletes(): Promise<{ [key: string]: number }> {
    const results: { [key: string]: number } = {};
    
    try {
      // Cleanup companies
      const companiesDeleted = await this.cleanupEntity(
        'companies',
        this.config.retentionPeriods.companies,
        this.config.batchSizes.companies
      );
      results.companies = companiesDeleted;

      // Cleanup people
      const peopleDeleted = await this.cleanupEntity(
        'people',
        this.config.retentionPeriods.people,
        this.config.batchSizes.people
      );
      results.people = peopleDeleted;

      // Cleanup actions
      const actionsDeleted = await this.cleanupEntity(
        'actions',
        this.config.retentionPeriods.actions,
        this.config.batchSizes.actions
      );
      results.actions = actionsDeleted;

      console.log(`✅ [CLEANUP] Completed:`, results);
      return results;
    } catch (error) {
      console.error(`❌ [CLEANUP] Failed:`, error);
      throw error;
    }
  }

  /**
   * 📊 ANALYTICS - Get deletion statistics
   */
  async getDeletionStats(): Promise<{
    softDeleted: { [key: string]: number };
    retentionCompliance: { [key: string]: number };
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Last 30 days

    const [companiesCount, peopleCount, actionsCount] = await Promise.all([
      prisma.companies.count({
        where: { deletedAt: { not: null } },
      }),
      prisma.people.count({
        where: { deletedAt: { not: null } },
      }),
      prisma.actions.count({
        where: { deletedAt: { not: null } },
      }),
    ]);

    return {
      softDeleted: {
        companies: companiesCount,
        people: peopleCount,
        actions: actionsCount,
      },
      retentionCompliance: {
        companies: await this.getRetentionCompliance('companies'),
        people: await this.getRetentionCompliance('people'),
        actions: await this.getRetentionCompliance('actions'),
      },
    };
  }

  // Private helper methods
  private async cleanupEntity(
    entityType: 'companies' | 'people' | 'actions',
    retentionDays: number,
    batchSize: number
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      // Get batch of old soft-deleted records
      const oldRecords = await this.getOldSoftDeletedRecords(entityType, cutoffDate, batchSize);
      
      if (oldRecords.length === 0) {
        hasMore = false;
        break;
      }

      // Hard delete the batch
      const ids = oldRecords.map(record => record.id);
      await this.hardDeleteBatch(entityType, ids);
      
      totalDeleted += ids.length;
      console.log(`🧹 [CLEANUP] Deleted ${ids.length} old ${entityType} records`);
    }

    return totalDeleted;
  }

  private async getOldSoftDeletedRecords(
    entityType: 'companies' | 'people' | 'actions',
    cutoffDate: Date,
    limit: number
  ): Promise<{ id: string }[]> {
    switch (entityType) {
      case 'companies':
        return await prisma.companies.findMany({
          where: {
            deletedAt: { not: null, lt: cutoffDate },
          },
          select: { id: true },
          take: limit,
        });
        
      case 'people':
        return await prisma.people.findMany({
          where: {
            deletedAt: { not: null, lt: cutoffDate },
          },
          select: { id: true },
          take: limit,
        });
        
      case 'actions':
        return await prisma.actions.findMany({
          where: {
            deletedAt: { not: null, lt: cutoffDate },
          },
          select: { id: true },
          take: limit,
        });
        
      default:
        return [];
    }
  }

  private async hardDeleteBatch(
    entityType: 'companies' | 'people' | 'actions',
    ids: string[]
  ): Promise<void> {
    switch (entityType) {
      case 'companies':
        await prisma.companies.deleteMany({
          where: { id: { in: ids } },
        });
        break;
        
      case 'people':
        await prisma.people.deleteMany({
          where: { id: { in: ids } },
        });
        break;
        
      case 'actions':
        await prisma.actions.deleteMany({
          where: { id: { in: ids } },
        });
        break;
    }
  }

  private async getRetentionCompliance(entityType: 'companies' | 'people' | 'actions'): Promise<number> {
    const retentionDays = this.config.retentionPeriods[entityType];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    switch (entityType) {
      case 'companies':
        return await prisma.companies.count({
          where: {
            deletedAt: { not: null, lt: cutoffDate },
          },
        });
        
      case 'people':
        return await prisma.people.count({
          where: {
            deletedAt: { not: null, lt: cutoffDate },
          },
        });
        
      case 'actions':
        return await prisma.actions.count({
          where: {
            deletedAt: { not: null, lt: cutoffDate },
          },
        });
        
      default:
        return 0;
    }
  }

  private async logDeletion(
    entityType: string,
    entityId: string,
    userId: string,
    action: 'SOFT_DELETE' | 'RESTORE' | 'HARD_DELETE'
  ): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          workspaceId: 'system', // You might want to get this from context
          userId,
          entityType,
          entityId,
          action,
          newValues: { action, timestamp: new Date().toISOString() },
        },
      });
    } catch (error) {
      console.error(`❌ [AUDIT] Failed to log deletion:`, error);
    }
  }
}

// Export singleton instance
export const deletionService = new DeletionService();
