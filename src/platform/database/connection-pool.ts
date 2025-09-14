/**
 * 🚀 ENTERPRISE DATABASE CONNECTION POOL - 2025 OPTIMIZED
 * Handles thousands of concurrent connections efficiently
 */

import { PrismaClient } from '@prisma/client';

// Global connection pool with intelligent management
let globalPrisma: PrismaClient | undefined;

// Connection pool configuration for high-traffic scenarios
// CRITICAL: Removed __internal config that was incompatible with Vercel Edge Runtime
const CONNECTION_CONFIG = {
  // Connection pool settings for high concurrency
  datasources: {
    db: {
      url: process['env']['DATABASE_URL'] || 'postgresql://localhost:5432/adrata',
    },
  },
  
  // Optimize for high-traffic scenarios
  log: process['env']['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  
  // Note: Removed __internal engine config as it's incompatible with Vercel Edge Runtime
  // Vercel handles connection pooling automatically
};

// Singleton pattern for connection reuse
export function getPrismaClient(): PrismaClient {
  if (!globalPrisma) {
    globalPrisma = new PrismaClient(CONNECTION_CONFIG);
    
    // Graceful shutdown handling
    process.on('beforeExit', async () => {
      await globalPrisma?.$disconnect();
    });
    
    process.on('SIGINT', async () => {
      await globalPrisma?.$disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await globalPrisma?.$disconnect();
      process.exit(0);
    });
  }
  
  return globalPrisma;
}

// Connection health monitoring
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latency: number;
  activeConnections?: number;
}> {
  const startTime = Date.now();
  
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    
    const latency = Date.now() - startTime;
    
    return {
      connected: true,
      latency,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      connected: false,
      latency: Date.now() - startTime,
    };
  }
}

// Query performance monitoring
export class QueryPerformanceMonitor {
  private static queryTimes = new Map<string, number[]>();
  
  static recordQuery(queryName: string, duration: number) {
    if (!this.queryTimes.has(queryName)) {
      this.queryTimes.set(queryName, []);
    }
    
    const times = this.queryTimes.get(queryName)!;
    times.push(duration);
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
  }
  
  static getQueryStats(queryName: string) {
    const times = this.queryTimes.get(queryName) || [];
    if (times['length'] === 0) return null;
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    return { avg, max, min, count: times.length };
  }
  
  static getAllStats() {
    const stats: Record<string, any> = {};
    for (const [queryName] of this.queryTimes) {
      stats[queryName] = this.getQueryStats(queryName);
    }
    return stats;
  }
}

// Optimized query wrapper with monitoring
export async function optimizedQuery<T>(
  queryName: string,
  queryFn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const prisma = getPrismaClient();
  
  try {
    const result = await queryFn(prisma);
    const duration = Date.now() - startTime;
    
    QueryPerformanceMonitor.recordQuery(queryName, duration);
    
    if (duration > 1000) {
      console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Query failed: ${queryName} after ${duration}ms`, error);
    throw error;
  }
}

export { globalPrisma as prisma };
