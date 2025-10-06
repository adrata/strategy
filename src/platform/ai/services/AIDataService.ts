/**
 * 🗄️ AI DATA SERVICE
 * 
 * Universal data access service for AI operations
 * Handles all CRUD operations the AI can perform
 */

import { PrismaClient } from '@prisma/client';
import { SoftDeleteService } from '../../services/softDeleteService';

// Validate required environment variables
if (!process['env']['DATABASE_URL']) {
  throw new Error("DATABASE_URL environment variable is required");
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process['env']['DATABASE_URL'],
    },
  },
});

export interface DataQuery {
  model: string;
  operation: 'create' | 'read' | 'update' | 'delete' | 'restore';
  data?: any;
  where?: any;
  include?: any;
  select?: any;
  orderBy?: any;
  take?: number;
  skip?: number;
}

export interface DataResult {
  success: boolean;
  data?: any;
  error?: string;
  count?: number;
  metadata?: any;
}

export class AIDataService {
  
  /**
   * Execute any data operation the AI needs
   */
  static async executeQuery(query: DataQuery, workspaceId: string, userId: string): Promise<DataResult> {
    try {
      // Add workspace isolation to all queries
      const secureWhere = {
        ...query.where,
        workspaceId
      };

      switch (query.operation) {
        case 'create':
          return await this.handleCreate(query.model, { ...query.data, workspaceId }, userId);
        
        case 'read':
          return await this.handleRead(query.model, secureWhere, query);
        
        case 'update':
          return await this.handleUpdate(query.model, secureWhere, query.data, userId);
        
        case 'delete':
          return await this.handleDelete(query.model, secureWhere, userId);
        
        case 'restore':
          return await this.handleRestore(query.model, secureWhere, userId);
        
        default:
          return { success: false, error: 'Invalid operation' };
      }
    } catch (error) {
      console.error('AI Data Service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * CREATE operations
   */
  private static async handleCreate(model: string, data: any, userId: string): Promise<DataResult> {
    try {
      let result;
      
      switch (model.toLowerCase()) {
        case 'lead':
          result = await prisma.leads.create({
            data: {
              ...data,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          break;
          
        case 'opportunity':
          result = await prisma.opportunities.create({
            data: {
              ...data,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          break;
          
        case 'leadnote':
          result = await prisma.leadsNote.create({
            data: {
              ...data,
              createdAt: new Date()
            }
          });
          break;
          
        case 'activity':
          result = await prisma.activity.create({
            data: {
              ...data,
              createdAt: new Date()
            }
          });
          break;
          
        default:
          return { success: false, error: `Create operation not supported for model: ${model}` };
      }
      
      return { 
        success: true, 
        data: result,
        metadata: { operation: 'create', model, userId }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Create failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * READ operations (excludes soft-deleted records by default)
   */
  private static async handleRead(model: string, where: any, query: DataQuery): Promise<DataResult> {
    try {
      let result;
      let count;
      
      // Apply soft delete filter by default (excludes deletedAt != null)
      const filteredWhere = SoftDeleteService.applySoftDeleteFilter(where);
      
      switch (model.toLowerCase()) {
        case 'lead':
          if (query['take'] === 1) {
            result = await prisma.leads.findFirst({
              where: filteredWhere,
              include: query.include,
              select: query.select,
              orderBy: query.orderBy
            });
          } else {
            result = await prisma.leads.findMany({
              where: filteredWhere,
              include: query.include,
              select: query.select,
              orderBy: query.orderBy,
              take: query.take,
              skip: query.skip
            });
            count = await prisma.leads.count({ where: filteredWhere });
          }
          break;
          
        case 'opportunity':
          if (query['take'] === 1) {
            result = await prisma.opportunities.findFirst({
              where: filteredWhere,
              include: query.include,
              select: query.select,
              orderBy: query.orderBy
            });
          } else {
            result = await prisma.opportunities.findMany({
              where: filteredWhere,
              include: query.include,
              select: query.select,
              orderBy: query.orderBy,
              take: query.take,
              skip: query.skip
            });
            count = await prisma.opportunities.count({ where: filteredWhere });
          }
          break;
          
        case 'prospect':
          if (query['take'] === 1) {
            result = await prisma.prospect.findFirst({
              where: filteredWhere,
              include: query.include,
              select: query.select,
              orderBy: query.orderBy
            });
          } else {
            result = await prisma.prospect.findMany({
              where: filteredWhere,
              include: query.include,
              select: query.select,
              orderBy: query.orderBy,
              take: query.take,
              skip: query.skip
            });
            count = await prisma.prospect.count({ where: filteredWhere });
          }
          break;
          
        case 'contact':
          if (query['take'] === 1) {
            result = await prisma.contacts.findFirst({
              where: filteredWhere,
              include: query.include,
              select: query.select,
              orderBy: query.orderBy
            });
          } else {
            result = await prisma.contacts.findMany({
              where: filteredWhere,
              include: query.include,
              select: query.select,
              orderBy: query.orderBy,
              take: query.take,
              skip: query.skip
            });
            count = await prisma.contacts.count({ where: filteredWhere });
          }
          break;
          
        case 'account':
          if (query['take'] === 1) {
            result = await prisma.accounts.findFirst({
              where: filteredWhere,
              include: query.include,
              select: query.select,
              orderBy: query.orderBy
            });
          } else {
            result = await prisma.accounts.findMany({
              where: filteredWhere,
              include: query.include,
              select: query.select,
              orderBy: query.orderBy,
              take: query.take,
              skip: query.skip
            });
            count = await prisma.accounts.count({ where: filteredWhere });
          }
          break;
          
        case 'leadnote':
          result = await prisma.leadsNote.findMany({
            where: filteredWhere,
            include: query.include,
            orderBy: query.orderBy || { createdAt: 'desc' },
            take: query.take,
            skip: query.skip
          });
          count = await prisma.leadsNote.count({ where: filteredWhere });
          break;
          
        case 'activity':
          result = await prisma.activity.findMany({
            where: filteredWhere,
            include: query.include,
            orderBy: query.orderBy || { createdAt: 'desc' },
            take: query.take,
            skip: query.skip
          });
          count = await prisma.activity.count({ where: filteredWhere });
          break;
          
        default:
          return { success: false, error: `Read operation not supported for model: ${model}` };
      }
      
      return { 
        success: true, 
        data: result,
        count,
        metadata: { operation: 'read', model, recordCount: Array.isArray(result) ? result.length : 1 }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Read failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * UPDATE operations
   */
  private static async handleUpdate(model: string, where: any, data: any, userId: string): Promise<DataResult> {
    try {
      let result;
      
      switch (model.toLowerCase()) {
        case 'lead':
          result = await prisma.leads.update({
            where: { id: where.id, workspaceId: where.workspaceId },
            data: {
              ...data,
              updatedAt: new Date()
            }
          });
          break;
          
        case 'opportunity':
          result = await prisma.opportunities.update({
            where: { id: where.id, workspaceId: where.workspaceId },
            data: {
              ...data,
              updatedAt: new Date()
            }
          });
          break;
          
        case 'leadnote':
          result = await prisma.leadsNote.update({
            where: { id: where.id },
            data: {
              ...data,
              updatedAt: new Date()
            }
          });
          break;
          
        default:
          return { success: false, error: `Update operation not supported for model: ${model}` };
      }
      
      return { 
        success: true, 
        data: result,
        metadata: { operation: 'update', model, userId }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * DELETE operations (soft delete with deletedAt timestamp - 2025 best practice)
   * This provides audit trails, data recovery, and compliance benefits
   */
  private static async handleDelete(model: string, where: any, userId: string): Promise<DataResult> {
    try {
      let result;
      const deletedAt = new Date();
      
      switch (model.toLowerCase()) {
        case 'lead':
          // Soft delete using deletedAt timestamp (modern best practice)
          result = await prisma.leads.update({
            where: { 
              id: where.id, 
              workspaceId: where.workspaceId,
              deletedAt: null // Only delete non-deleted records
            },
            data: {
              deletedAt,
              updatedAt: deletedAt,
              // Optionally keep status for business logic, but deletedAt is primary indicator
              status: 'archived'
            }
          });
          break;
          
        case 'prospect':
          // Soft delete for prospects
          result = await prisma.prospect.update({
            where: { 
              id: where.id, 
              workspaceId: where.workspaceId,
              deletedAt: null
            },
            data: {
              deletedAt,
              updatedAt: deletedAt
            }
          });
          break;
          
        case 'contact':
          // Soft delete for contacts
          result = await prisma.contacts.update({
            where: { 
              id: where.id, 
              workspaceId: where.workspaceId,
              deletedAt: null
            },
            data: {
              deletedAt,
              updatedAt: deletedAt
            }
          });
          break;
          
        case 'account':
          // Soft delete for accounts
          result = await prisma.accounts.update({
            where: { 
              id: where.id, 
              workspaceId: where.workspaceId,
              deletedAt: null
            },
            data: {
              deletedAt,
              updatedAt: deletedAt
            }
          });
          break;
          
        case 'opportunity':
          // Soft delete for opportunities
          result = await prisma.opportunities.update({
            where: { 
              id: where.id, 
              workspaceId: where.workspaceId,
              deletedAt: null
            },
            data: {
              deletedAt,
              updatedAt: deletedAt,
              // Keep stage for business logic
              stage: 'archived'
            }
          });
          break;
          
        case 'leadnote':
          // Soft delete for notes (preserves audit trail)
          result = await prisma.leadsNote.update({
            where: { 
              id: where.id,
              deletedAt: null
            },
            data: {
              deletedAt,
              updatedAt: deletedAt
            }
          });
          break;
          
        default:
          return { success: false, error: `Delete operation not supported for model: ${model}` };
      }
      
      return { 
        success: true, 
        data: result,
        metadata: { 
          operation: 'soft_delete', 
          model, 
          userId,
          deletedAt: deletedAt.toISOString(),
          recoverable: true
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Soft delete failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * RESTORE operations (undelete soft-deleted records)
   * Allows recovery from accidental deletions
   */
  private static async handleRestore(model: string, where: any, userId: string): Promise<DataResult> {
    try {
      let result;
      
      switch (model.toLowerCase()) {
        case 'lead':
          result = await prisma.leads.update({
            where: { 
              id: where.id, 
              workspaceId: where.workspaceId,
              deletedAt: { not: null } // Only restore deleted records
            },
            data: {
              deletedAt: null,
              updatedAt: new Date(),
              status: 'active' // Restore to active status
            }
          });
          break;
          
        case 'prospect':
          result = await prisma.prospect.update({
            where: { 
              id: where.id, 
              workspaceId: where.workspaceId,
              deletedAt: { not: null }
            },
            data: {
              deletedAt: null,
              updatedAt: new Date()
            }
          });
          break;
          
        case 'contact':
          result = await prisma.contacts.update({
            where: { 
              id: where.id, 
              workspaceId: where.workspaceId,
              deletedAt: { not: null }
            },
            data: {
              deletedAt: null,
              updatedAt: new Date()
            }
          });
          break;
          
        case 'account':
          result = await prisma.accounts.update({
            where: { 
              id: where.id, 
              workspaceId: where.workspaceId,
              deletedAt: { not: null }
            },
            data: {
              deletedAt: null,
              updatedAt: new Date()
            }
          });
          break;
          
        case 'opportunity':
          result = await prisma.opportunities.update({
            where: { 
              id: where.id, 
              workspaceId: where.workspaceId,
              deletedAt: { not: null }
            },
            data: {
              deletedAt: null,
              updatedAt: new Date(),
              stage: 'active' // Restore to active stage
            }
          });
          break;
          
        case 'leadnote':
          result = await prisma.leadsNote.update({
            where: { 
              id: where.id,
              deletedAt: { not: null }
            },
            data: {
              deletedAt: null,
              updatedAt: new Date()
            }
          });
          break;
          
        default:
          return { success: false, error: `Restore operation not supported for model: ${model}` };
      }
      
      return { 
        success: true, 
        data: result,
        metadata: { 
          operation: 'restore', 
          model, 
          userId,
          restoredAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get analytics and insights
   */
  static async getAnalytics(workspaceId: string, type: 'pipeline' | 'speedrun' | 'general'): Promise<DataResult> {
    try {
      let analytics;
      
      switch (type) {
        case 'pipeline':
          analytics = await this.getPipelineAnalytics(workspaceId);
          break;
        case 'speedrun':
          analytics = await this.getSpeedrunAnalytics(workspaceId);
          break;
        case 'general':
          analytics = await this.getGeneralAnalytics(workspaceId);
          break;
      }
      
      return { success: true, data: analytics };
    } catch (error) {
      return { 
        success: false, 
        error: `Analytics failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Pipeline analytics
   */
  private static async getPipelineAnalytics(workspaceId: string) {
    const [
      totalLeads,
      qualifiedLeads,
      newLeads,
      contactedLeads,
      totalOpportunities,
      activeOpportunities,
      wonOpportunities,
      lostOpportunities,
      totalValue,
      wonValue
    ] = await Promise.all([
      prisma.leads.count({ where: { workspaceId , deletedAt: null} }),
      prisma.leads.count({ where: { workspaceId, status: 'qualified' , deletedAt: null} }),
      prisma.leads.count({ where: { workspaceId, status: 'new' , deletedAt: null} }),
      prisma.leads.count({ where: { workspaceId, status: 'contacted' , deletedAt: null} }),
      prisma.opportunities.count({ where: { workspaceId , deletedAt: null} }),
      prisma.opportunities.count({ where: { workspaceId, stage: { notIn: ['closed-won', 'closed-lost'] }, deletedAt: null } }),
      prisma.opportunities.count({ where: { workspaceId, stage: 'closed-won' , deletedAt: null} }),
      prisma.opportunities.count({ where: { workspaceId, stage: 'closed-lost' , deletedAt: null} }),
      prisma.opportunities.aggregate({ where: { workspaceId , deletedAt: null}, _sum: { value: true } }),
      prisma.opportunities.aggregate({ where: { workspaceId, stage: 'closed-won' , deletedAt: null}, _sum: { value: true } })
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((totalOpportunities / totalLeads) * 100) : 0;
    const winRate = totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0;

    return {
      leads: {
        total: totalLeads,
        qualified: qualifiedLeads,
        new: newLeads,
        contacted: contactedLeads
      },
      opportunities: {
        total: totalOpportunities,
        active: activeOpportunities,
        won: wonOpportunities,
        lost: lostOpportunities
      },
      metrics: {
        conversionRate,
        winRate,
        totalValue: totalValue._sum.value || 0,
        wonValue: wonValue._sum.value || 0
      }
    };
  }

  /**
   * Speedrun analytics
   */
  private static async getSpeedrunAnalytics(workspaceId: string) {
    // This would integrate with Speedrun-specific data
    const readyProspects = await prisma.leads.count({ 
      where: { workspaceId, status: 'ready' , deletedAt: null} 
    });
    
    const completedToday = await prisma.leads.count({
      where: {
        workspaceId,
        status: 'completed',
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        , deletedAt: null}
      }
    });

    return {
      prospects: {
        ready: readyProspects,
        completedToday
      },
      performance: {
        dailyTarget: 30, // This could be configurable
        completionRate: Math.round((completedToday / 30) * 100)
      }
    };
  }

  /**
   * General analytics
   */
  private static async getGeneralAnalytics(workspaceId: string) {
    const [leadCount, opportunityCount, userCount] = await Promise.all([
      prisma.leads.count({ where: { workspaceId , deletedAt: null} }),
      prisma.opportunities.count({ where: { workspaceId , deletedAt: null} }),
      prisma.usersWorkspace.count({ where: { workspaceId } })
    ]);

    return {
      overview: {
        leads: leadCount,
        opportunities: opportunityCount,
        users: userCount
      }
    };
  }

  /**
   * Search across all data
   */
  static async search(query: string, workspaceId: string, models: string[] = ['lead', 'opportunity']): Promise<DataResult> {
    try {
      const results: any = {};
      
      if (models.includes('lead')) {
        results['leads'] = await prisma.leads.findMany({
          where: {
            workspaceId,
            OR: [
              { fullName: { contains: query, mode: 'insensitive' , deletedAt: null} },
              { company: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { jobTitle: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 10
        });
      }
      
      if (models.includes('opportunity')) {
        results['opportunities'] = await prisma.opportunities.findMany({
          where: {
            workspaceId,
            OR: [
              { name: { contains: query, mode: 'insensitive' , deletedAt: null} },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 10
        });
      }
      
      return { success: true, data: results };
    } catch (error) {
      return { 
        success: false, 
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Validate data before operations
   */
  static validateData(model: string, data: any, operation: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    switch (model.toLowerCase()) {
      case 'lead':
        if (operation === 'create') {
          if (!data['firstName'] && !data.fullName) errors.push('First name or full name is required');
          if (!data.email) errors.push('Email is required');
          if (!data.workspaceId) errors.push('Workspace ID is required');
        }
        break;
        
      case 'opportunity':
        if (operation === 'create') {
          if (!data.name) errors.push('Opportunity name is required');
          if (!data.stage) errors.push('Stage is required');
          if (!data.workspaceId) errors.push('Workspace ID is required');
        }
        break;
    }
    
    return { valid: errors['length'] === 0, errors };
  }

  /**
   * Cleanup and disconnect
   */
  static async disconnect() {
    }
}
