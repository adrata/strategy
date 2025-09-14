/**
 * 🚀 OPTIMIZED DATABASE QUERIES - 2025 PERFORMANCE EDITION
 * Pre-built, indexed queries for lightning-fast data retrieval
 */

import { getPrismaClient, optimizedQuery, QueryPerformanceMonitor } from './connection-pool';
import { cache } from '../services';

export class OptimizedQueries {
  
  /**
   * 🎯 PIPELINE DATA: Ultra-optimized query with minimal joins
   */
  static async getPipelineData(workspaceId: string, userId: string) {
    return await cache.get(
      `pipeline-${workspaceId}-${userId}`,
      async () => {
        return await optimizedQuery('pipeline-data', async (prisma) => {
          // Parallel queries for maximum performance
          const [opportunities, leads, prospects] = await Promise.all([
            // Opportunities with minimal joins
            prisma.opportunities.findMany({
              where: {
                workspaceId,
                assignedUserId: userId,
                deletedAt: null,
                stage: {
                  notIn: ['closed-won', 'closed-lost', 'closed-lost-to-competition']
                }
              },
              select: {
                id: true,
                name: true,
                stage: true,
                amount: true,
                probability: true,
                expectedCloseDate: true,
                updatedAt: true,
                accountId: true,
                // Minimal account data
                account: {
                  select: {
                    id: true,
                    name: true,
                    industry: true
                  }
                }
              },
              orderBy: [
                { updatedAt: 'desc' }
              ],
              take: 100 // Reasonable limit
            }),
            
            // Leads with engagement data
            prisma.leads.findMany({
              where: {
                workspaceId,
                assignedUserId: userId,
                deletedAt: null,
                status: {
                  in: ['new', 'contacted', 'qualified', 'follow-up']
                }
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                fullName: true,
                email: true,
                company: true,
                jobTitle: true,
                status: true,
                priority: true,
                estimatedValue: true,
                updatedAt: true,
                // Recent activities only
                activities: {
                  select: {
                    id: true,
                    type: true,
                    outcome: true,
                    completedAt: true,
                    createdAt: true
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 3
                }
              },
              orderBy: [
                { priority: 'desc' },
                { updatedAt: 'desc' }
              ],
              take: 100
            }),
            
            // Prospects (people without leads/opportunities)
            prisma.people.findMany({
              where: {
                workspaceId,
                assignedUserId: userId
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                fullName: true,
                email: true,
                company: true,
                title: true,
                department: true,
                updatedAt: true
              },
              orderBy: { updatedAt: 'desc' },
              take: 50
            })
          ]);
          
          return {
            opportunities,
            leads,
            prospects,
            summary: {
              totalOpportunities: opportunities.length,
              totalLeads: leads.length,
              totalProspects: prospects.length,
              lastUpdated: new Date().toISOString()
            }
          };
        });
      },
      {
        ttl: 2 * 60 * 1000, // 2 minutes cache
        tags: [`workspace-${workspaceId}`, `user-${userId}`, 'pipeline'],
        priority: 'high'
      }
    );
  }
  
  /**
   * 🎯 DASHBOARD METRICS: Aggregated counts with caching
   */
  static async getDashboardMetrics(workspaceId: string, userId: string) {
    return await cache.get(
      `dashboard-${workspaceId}-${userId}`,
      async () => {
        return await optimizedQuery('dashboard-metrics', async (prisma) => {
          // Use aggregation queries for better performance
          const [
            opportunityStats,
            leadStats,
            prospectStats,
            recentActivity
          ] = await Promise.all([
            // Opportunity aggregations
            prisma.opportunities.aggregate({
              where: {
                workspaceId,
                assignedUserId: userId,
                deletedAt: null
              },
              _count: { id: true },
              _sum: { amount: true },
              _avg: { probability: true }
            }),
            
            // Lead counts by status
            prisma.leads.groupBy({
              by: ['status'],
              where: {
                workspaceId,
                assignedUserId: userId,
                deletedAt: null
              },
              _count: { id: true }
            }),
            
            // Prospect count
            prisma.people.count({
              where: {
                workspaceId,
                assignedUserId: userId
              }
            }),
            
            // Recent activity count
            prisma.activity.count({
              where: {
                workspaceId,
                userId,
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
              }
            })
          ]);
          
          // Transform lead stats
          const leadsByStatus = leadStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id;
            return acc;
          }, {} as Record<string, number>);
          
          return {
            opportunities: {
              total: opportunityStats._count.id,
              totalValue: opportunityStats._sum.amount || 0,
              averageProbability: opportunityStats._avg.probability || 0
            },
            leads: {
              total: leadStats.reduce((sum, stat) => sum + stat._count.id, 0),
              byStatus: leadsByStatus
            },
            prospects: {
              total: prospectStats
            },
            activity: {
              recentCount: recentActivity
            },
            lastUpdated: new Date().toISOString()
          };
        });
      },
      {
        ttl: 5 * 60 * 1000, // 5 minutes cache
        tags: [`workspace-${workspaceId}`, `user-${userId}`, 'dashboard'],
        priority: 'medium'
      }
    );
  }
  
  /**
   * 🎯 SINGLE RECORD: Optimized individual record queries
   */
  static async getLeadById(id: string) {
    return await cache.get(
      `lead-${id}`,
      async () => {
        return await optimizedQuery('lead-by-id', async (prisma) => {
          return await prisma.leads.findFirst({
            where: { id , deletedAt: null},
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              workEmail: true,
              phone: true,
              company: true,
              jobTitle: true,
              department: true,
              status: true,
              priority: true,
              source: true,
              estimatedValue: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
              assignedUser: {
                select: { id: true, name: true, email: true }
              },
              // Recent activities
              activities: {
                select: {
                  id: true,
                  type: true,
                  outcome: true,
                  description: true,
                  completedAt: true,
                  createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take: 10
              }
            }
          });
        });
      },
      {
        ttl: 10 * 60 * 1000, // 10 minutes cache
        tags: [`lead-${id}`],
        priority: 'medium'
      }
    );
  }
  
  /**
   * 🎯 SEARCH QUERIES: Optimized full-text search
   */
  static async searchPeople(workspaceId: string, query: string, limit = 20) {
    return await cache.get(
      `search-people-${workspaceId}-${query}-${limit}`,
      async () => {
        return await optimizedQuery('search-people', async (prisma) => {
          // Use PostgreSQL full-text search for better performance
          return await prisma.people.findMany({
            where: {
              workspaceId,
              OR: [
                { fullName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { company: { contains: query, mode: 'insensitive' } },
                { title: { contains: query, mode: 'insensitive' } }
              ]
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              company: true,
              title: true,
              department: true,
              updatedAt: true
            },
            orderBy: [
              { updatedAt: 'desc' }
            ],
            take: limit
          });
        });
      },
      {
        ttl: 5 * 60 * 1000, // 5 minutes cache
        tags: [`workspace-${workspaceId}`, 'search'],
        priority: 'low'
      }
    );
  }
  
  /**
   * 🎯 BULK OPERATIONS: Optimized batch processing
   */
  static async bulkUpdateLeadStatus(leadIds: string[], status: string, userId: string) {
    // Invalidate cache for affected leads
    leadIds.forEach(id => {
      cache.invalidate(`lead-${id}`);
    });
    
    // Invalidate user's pipeline cache
    cache.invalidate(`pipeline-*-${userId}`);
    cache.invalidate(`dashboard-*-${userId}`);
    
    return await optimizedQuery('bulk-update-leads', async (prisma) => {
      return await prisma.leads.updateMany({
        where: {
          id: { in: leadIds }
        },
        data: {
          status,
          updatedAt: new Date()
        }
      });
    });
  }
  
  /**
   * 📊 PERFORMANCE MONITORING: Query performance insights
   */
  static getQueryPerformanceStats() {
    return QueryPerformanceMonitor.getAllStats();
  }
  
  /**
   * 🧹 CACHE MANAGEMENT: Intelligent cache invalidation
   */
  static invalidateUserCache(userId: string) {
    return cache.invalidate([
      `pipeline-*-${userId}`,
      `dashboard-*-${userId}`,
      `user-${userId}`
    ]);
  }
  
  static invalidateWorkspaceCache(workspaceId: string) {
    return cache.invalidate([
      `workspace-${workspaceId}`
    ]);
  }
}

// Export convenience functions
export const queries = {
  pipeline: OptimizedQueries.getPipelineData,
  dashboard: OptimizedQueries.getDashboardMetrics,
  lead: OptimizedQueries.getLeadById,
  search: OptimizedQueries.searchPeople,
  bulkUpdate: OptimizedQueries.bulkUpdateLeadStatus,
  stats: OptimizedQueries.getQueryPerformanceStats,
  invalidate: {
    user: OptimizedQueries.invalidateUserCache,
    workspace: OptimizedQueries.invalidateWorkspaceCache,
  }
};
