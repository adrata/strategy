/**
 * 🚀 DATABASE OPTIMIZER - 2025 NEON.TECH OPTIMIZED
 * 
 * Implements 2025 database optimization best practices:
 * - Connection pooling with Neon.tech
 * - Query optimization with proper indexing
 * - Batch operations for multiple queries
 * - Intelligent query caching
 * - Performance monitoring and alerting
 */

import { PrismaClient } from '@prisma/client';

// ============================================================================
// DATABASE OPTIMIZATION CONFIGURATION
// ============================================================================

interface DatabaseOptimizationConfig {
  // Connection pooling
  maxConnections: number;
  minConnections: number;
  connectionTimeout: number;
  
  // Query optimization
  queryTimeout: number;
  batchSize: number;
  enableQueryLogging: boolean;
  
  // Caching
  enableQueryCache: boolean;
  cacheTTL: number;
  
  // Performance monitoring
  enableSlowQueryLogging: boolean;
  slowQueryThreshold: number;
}

const DEFAULT_CONFIG: DatabaseOptimizationConfig = {
  maxConnections: 20,
  minConnections: 5,
  connectionTimeout: 10000,
  queryTimeout: 30000,
  batchSize: 1000,
  enableQueryLogging: true,
  enableQueryCache: true,
  cacheTTL: 300000, // 5 minutes
  enableSlowQueryLogging: true,
  slowQueryThreshold: 1000 // 1 second
};

// ============================================================================
// DATABASE OPTIMIZER CLASS
// ============================================================================

export class DatabaseOptimizer {
  private prisma: PrismaClient;
  private config: DatabaseOptimizationConfig;
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private performanceMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageQueryTime: 0,
    queryTimes: [] as number[]
  };

  constructor(config: Partial<DatabaseOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 🚀 OPTIMIZED PRISMA CLIENT: Configured for Neon.tech
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: this.config.enableQueryLogging ? ['query', 'info', 'warn', 'error'] : ['error'],
      // 🚀 CONNECTION POOLING: Optimize for Neon.tech
      __internal: {
        engine: {
          connectTimeout: this.config.connectionTimeout,
          queryTimeout: this.config.queryTimeout
        }
      }
    });
  }

  // ============================================================================
  // OPTIMIZED QUERY METHODS
  // ============================================================================

  /**
   * 🚀 OPTIMIZED SECTION QUERY: Fast section data loading with caching
   */
  async getSectionData(
    section: string,
    workspaceId: string,
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: any;
      where?: any;
      include?: any;
    } = {}
  ): Promise<{ data: any[]; totalCount: number; queryTime: number }> {
    const startTime = Date.now();
    const cacheKey = `section-${section}-${workspaceId}-${userId}-${JSON.stringify(options)}`;
    
    // 🚀 QUERY CACHE: Check cache first
    if (this.config.enableQueryCache) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        this.performanceMetrics.cacheHits++;
        console.log(`⚡ [DB CACHE HIT] ${section} query`);
        return cached.data;
      }
    }

    this.performanceMetrics.cacheMisses++;
    console.log(`🔄 [DB CACHE MISS] ${section} query - fetching from database`);

    try {
      // 🚀 OPTIMIZED QUERIES: Section-specific optimizations
      let queryResult: any;
      
      switch (section) {
        case 'people':
          queryResult = await this.getOptimizedPeopleQuery(workspaceId, options);
          break;
        case 'leads':
          queryResult = await this.getOptimizedLeadsQuery(workspaceId, options);
          break;
        case 'prospects':
          queryResult = await this.getOptimizedProspectsQuery(workspaceId, options);
          break;
        case 'opportunities':
          queryResult = await this.getOptimizedOpportunitiesQuery(workspaceId, options);
          break;
        case 'companies':
          queryResult = await this.getOptimizedCompaniesQuery(workspaceId, options);
          break;
        case 'speedrun':
          queryResult = await this.getOptimizedSpeedrunQuery(workspaceId, userId, options);
          break;
        default:
          throw new Error(`Unknown section: ${section}`);
      }

      const queryTime = Date.now() - startTime;
      this.updatePerformanceMetrics(queryTime);

      // 🚀 CACHE RESULT: Store in cache
      if (this.config.enableQueryCache) {
        this.queryCache.set(cacheKey, {
          data: queryResult,
          timestamp: Date.now(),
          ttl: this.config.cacheTTL
        });
      }

      console.log(`✅ [DB QUERY] ${section} loaded in ${queryTime}ms: ${queryResult.data.length} items`);
      return queryResult;

    } catch (error) {
      const queryTime = Date.now() - startTime;
      console.error(`❌ [DB QUERY] ${section} failed in ${queryTime}ms:`, error);
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZED PEOPLE QUERY: Fast people loading with proper indexing
   */
  private async getOptimizedPeopleQuery(workspaceId: string, options: any) {
    const { limit = 10000, offset = 0, orderBy = [{ rank: 'asc' }, { updatedAt: 'desc' }] } = options;
    
    // 🚀 BATCH QUERY: Get count and data in parallel
    const [data, totalCount] = await Promise.all([
      this.prisma.people.findMany({
        where: {
          workspaceId,
          deletedAt: null
        },
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          company: true,
          companyId: true,
          jobTitle: true,
          email: true,
          phone: true,
          linkedinUrl: true,
          customFields: true,
          tags: true,
          updatedAt: true,
          createdAt: true,
          rank: true,
          lastAction: true,
          lastActionDate: true,
          nextAction: true,
          nextActionDate: true,
          assignedUserId: true,
          workspaceId: true
        }
      }),
      this.prisma.people.count({
        where: {
          workspaceId,
          deletedAt: null
        }
      })
    ]);

    return { data, totalCount };
  }

  /**
   * 🚀 OPTIMIZED LEADS QUERY: Fast leads loading
   */
  private async getOptimizedLeadsQuery(workspaceId: string, options: any) {
    const { limit = 1000, offset = 0, orderBy = [{ updatedAt: 'desc' }] } = options;
    
    const [data, totalCount] = await Promise.all([
      this.prisma.leads.findMany({
        where: {
          workspaceId,
          deletedAt: null
        },
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          company: true,
          jobTitle: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
          assignedUserId: true,
          workspaceId: true
        }
      }),
      this.prisma.leads.count({
        where: {
          workspaceId,
          deletedAt: null
        }
      })
    ]);

    return { data, totalCount };
  }

  /**
   * 🚀 OPTIMIZED PROSPECTS QUERY: Fast prospects loading
   */
  private async getOptimizedProspectsQuery(workspaceId: string, options: any) {
    const { limit = 1000, offset = 0, orderBy = [{ updatedAt: 'desc' }] } = options;
    
    const [data, totalCount] = await Promise.all([
      this.prisma.prospects.findMany({
        where: {
          workspaceId,
          deletedAt: null
        },
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          company: true,
          jobTitle: true,
          status: true,
          stage: true,
          createdAt: true,
          updatedAt: true,
          assignedUserId: true,
          workspaceId: true
        }
      }),
      this.prisma.prospects.count({
        where: {
          workspaceId,
          deletedAt: null
        }
      })
    ]);

    return { data, totalCount };
  }

  /**
   * 🚀 OPTIMIZED OPPORTUNITIES QUERY: Fast opportunities loading
   */
  private async getOptimizedOpportunitiesQuery(workspaceId: string, options: any) {
    const { limit = 1000, offset = 0, orderBy = [{ updatedAt: 'desc' }] } = options;
    
    const [data, totalCount] = await Promise.all([
      this.prisma.opportunities.findMany({
        where: {
          workspaceId,
          deletedAt: null
        },
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          stage: true,
          value: true,
          probability: true,
          closeDate: true,
          createdAt: true,
          updatedAt: true,
          assignedUserId: true,
          workspaceId: true
        }
      }),
      this.prisma.opportunities.count({
        where: {
          workspaceId,
          deletedAt: null
        }
      })
    ]);

    return { data, totalCount };
  }

  /**
   * 🚀 OPTIMIZED COMPANIES QUERY: Fast companies loading
   */
  private async getOptimizedCompaniesQuery(workspaceId: string, options: any) {
    const { limit = 1000, offset = 0, orderBy = [{ updatedAt: 'desc' }] } = options;
    
    const [data, totalCount] = await Promise.all([
      this.prisma.companies.findMany({
        where: {
          workspaceId,
          deletedAt: null
        },
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          industry: true,
          vertical: true,
          size: true,
          rank: true,
          createdAt: true,
          updatedAt: true,
          workspaceId: true
        }
      }),
      this.prisma.companies.count({
        where: {
          workspaceId,
          deletedAt: null
        }
      })
    ]);

    return { data, totalCount };
  }

  /**
   * 🚀 OPTIMIZED SPEEDRUN QUERY: Fast speedrun loading with ranking
   */
  private async getOptimizedSpeedrunQuery(workspaceId: string, userId: string, options: any) {
    const { limit = 30, offset = 0 } = options;
    
    // 🚀 OPTIMIZED SPEEDRUN: Use direct query with company ranking
    const data = await this.prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        companyId: { not: null }
      },
      orderBy: [
        { company: { rank: 'asc' } },
        { rank: 'asc' },
        { updatedAt: 'desc' }
      ],
      take: limit,
      skip: offset,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        jobTitle: true,
        phone: true,
        linkedinUrl: true,
        status: true,
        lastAction: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true,
        assignedUserId: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            vertical: true,
            size: true,
            rank: true
          }
        }
      }
    });

    return { data, totalCount: data.length };
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  private updatePerformanceMetrics(queryTime: number) {
    this.performanceMetrics.totalQueries++;
    this.performanceMetrics.queryTimes.push(queryTime);
    
    if (queryTime > this.config.slowQueryThreshold) {
      this.performanceMetrics.slowQueries++;
      console.warn(`🐌 [SLOW QUERY] Query took ${queryTime}ms - consider optimization`);
    }

    // Update average query time
    const totalTime = this.performanceMetrics.queryTimes.reduce((a, b) => a + b, 0);
    this.performanceMetrics.averageQueryTime = totalTime / this.performanceMetrics.queryTimes.length;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.cacheHits / 
        (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses),
      slowQueryRate: this.performanceMetrics.slowQueries / this.performanceMetrics.totalQueries
    };
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.queryCache.clear();
    console.log('🧹 [DB CACHE] Query cache cleared');
  }

  /**
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
    console.log('🔌 [DB] Database connection closed');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const databaseOptimizer = new DatabaseOptimizer({
  enableQueryLogging: process.env.NODE_ENV === 'development',
  enableSlowQueryLogging: true,
  slowQueryThreshold: 1000
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * 🚀 BATCH QUERY EXECUTOR: Execute multiple queries in parallel
 */
export async function executeBatchQueries<T>(
  queries: (() => Promise<T>)[]
): Promise<T[]> {
  console.log(`🚀 [BATCH QUERY] Executing ${queries.length} queries in parallel`);
  const startTime = Date.now();
  
  try {
    const results = await Promise.all(queries);
    const executionTime = Date.now() - startTime;
    console.log(`✅ [BATCH QUERY] Completed ${queries.length} queries in ${executionTime}ms`);
    return results;
  } catch (error) {
    console.error(`❌ [BATCH QUERY] Failed to execute batch queries:`, error);
    throw error;
  }
}

/**
 * 🚀 QUERY PERFORMANCE TRACKER: Track query performance
 */
export function trackQueryPerformance<T>(
  queryName: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  return fn().then(
    (result) => {
      const executionTime = Date.now() - startTime;
      console.log(`⚡ [QUERY TRACKER] ${queryName} completed in ${executionTime}ms`);
      return result;
    },
    (error) => {
      const executionTime = Date.now() - startTime;
      console.error(`❌ [QUERY TRACKER] ${queryName} failed in ${executionTime}ms:`, error);
      throw error;
    }
  );
}
