/**
 * 🗑️ SOFT DELETE SERVICE
 * 
 * Utility service for managing soft deletion operations
 * Implements 2025 best practices for data recovery and audit trails
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SoftDeleteOptions {
  includeDeleted?: boolean;
  deletedOnly?: boolean;
}

export interface SoftDeleteResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    operation: 'soft_delete' | 'restore' | 'hard_delete';
    deletedAt?: string;
    restoredAt?: string;
    userId: string;
    recoverable: boolean;
  };
}

export class SoftDeleteService {
  
  /**
   * Apply soft delete filters to Prisma where clause
   * By default, excludes soft-deleted records unless explicitly requested
   */
  static applySoftDeleteFilter(where: any = {}, options: SoftDeleteOptions = {}): any {
    if (options.deletedOnly) {
      return {
        ...where,
        deletedAt: { not: null }
      };
    }
    
    if (!options.includeDeleted) {
      return {
        ...where,
        deletedAt: null
      };
    }
    
    return where;
  }

  /**
   * Soft delete a record by setting deletedAt timestamp
   */
  static async softDelete(model: any, where: any, userId: string): Promise<SoftDeleteResult> {
    try {
      const deletedAt = new Date();
      
      const result = await model.update({
        where: {
          ...where,
          deletedAt: null // Only delete non-deleted records
        },
        data: {
          deletedAt,
          updatedAt: deletedAt
        }
      });

      return {
        success: true,
        data: result,
        metadata: {
          operation: 'soft_delete',
          deletedAt: deletedAt.toISOString(),
          userId,
          recoverable: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Soft delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          operation: 'soft_delete',
          userId,
          recoverable: false
        }
      };
    }
  }

  /**
   * Restore a soft-deleted record by setting deletedAt to null
   */
  static async restore(model: any, where: any, userId: string): Promise<SoftDeleteResult> {
    try {
      const restoredAt = new Date();
      
      const result = await model.update({
        where: {
          ...where,
          deletedAt: { not: null } // Only restore deleted records
        },
        data: {
          deletedAt: null,
          updatedAt: restoredAt
        }
      });

      return {
        success: true,
        data: result,
        metadata: {
          operation: 'restore',
          restoredAt: restoredAt.toISOString(),
          userId,
          recoverable: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          operation: 'restore',
          userId,
          recoverable: false
        }
      };
    }
  }

  /**
   * Permanently delete soft-deleted records (hard delete)
   * WARNING: This is irreversible - use with extreme caution
   */
  static async hardDelete(model: any, where: any, userId: string): Promise<SoftDeleteResult> {
    try {
      // Only allow hard delete of already soft-deleted records
      const result = await model.delete({
        where: {
          ...where,
          deletedAt: { not: null } // Only hard delete soft-deleted records
        }
      });

      return {
        success: true,
        data: result,
        metadata: {
          operation: 'hard_delete',
          userId,
          recoverable: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Hard delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          operation: 'hard_delete',
          userId,
          recoverable: false
        }
      };
    }
  }

  /**
   * Get soft-deleted records for recovery purposes
   */
  static async getDeleted(model: any, where: any = {}): Promise<any[]> {
    try {
      return await model.findMany({
        where: {
          ...where,
          deletedAt: { not: null }
        },
        orderBy: {
          deletedAt: 'desc' // Most recently deleted first
        }
      });
    } catch (error) {
      console.error('Error fetching deleted records:', error);
      return [];
    }
  }

  /**
   * Count soft-deleted records
   */
  static async countDeleted(model: any, where: any = {}): Promise<number> {
    try {
      return await model.count({
        where: {
          ...where,
          deletedAt: { not: null }
        }
      });
    } catch (error) {
      console.error('Error counting deleted records:', error);
      return 0;
    }
  }

  /**
   * Cleanup old soft-deleted records (for data retention policies)
   * Permanently deletes records soft-deleted before the specified date
   */
  static async cleanupOldDeleted(
    model: any, 
    olderThanDays: number, 
    where: any = {},
    userId: string
  ): Promise<{ deletedCount: number; error?: string }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await model.deleteMany({
        where: {
          ...where,
          deletedAt: {
            not: null,
            lt: cutoffDate
          }
        }
      });

      console.log(`🧹 [CLEANUP] Permanently deleted ${result.count} records older than ${olderThanDays} days by user ${userId}`);
      
      return { deletedCount: result.count };
    } catch (error) {
      const errorMessage = `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('🚨 [CLEANUP ERROR]', errorMessage);
      return { deletedCount: 0, error: errorMessage };
    }
  }
}

/**
 * Utility functions for common soft delete operations
 */

export const withSoftDelete = {
  /**
   * Create a findMany query that excludes soft-deleted records
   */
  findMany: (model: any, options: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number } = {}) => {
    return model.findMany({
      ...options,
      where: SoftDeleteService.applySoftDeleteFilter(options.where)
    });
  },

  /**
   * Create a findFirst query that excludes soft-deleted records
   */
  findFirst: (model: any, options: { where?: any; include?: any; orderBy?: any } = {}) => {
    return model.findFirst({
      ...options,
      where: SoftDeleteService.applySoftDeleteFilter(options.where)
    });
  },

  /**
   * Create a findUnique query that excludes soft-deleted records
   */
  findUnique: (model: any, options: { where: any; include?: any } = { where: {} }) => {
    return model.findFirst({
      ...options,
      where: SoftDeleteService.applySoftDeleteFilter(options.where)
    });
  },

  /**
   * Create a count query that excludes soft-deleted records
   */
  count: (model: any, options: { where?: any } = {}) => {
    return model.count({
      ...options,
      where: SoftDeleteService.applySoftDeleteFilter(options.where)
    });
  }
};
