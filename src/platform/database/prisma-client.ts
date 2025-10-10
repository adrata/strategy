/**
 * 🚀 SINGLETON PRISMA CLIENT - PERFORMANCE OPTIMIZED
 * 
 * Single database connection pool shared across all API routes
 * Prevents connection exhaustion and improves performance
 */

import { PrismaClient } from '@prisma/client';

// Global variable to store the singleton instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create singleton Prisma client with optimized configuration
export const prisma = globalThis.__prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process['env']['DATABASE_URL'] || 
           process['env']['POSTGRES_URL'] || 
           "postgresql://localhost:5432/adrata",
    },
  },
  log: process['env']['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
});

// CRITICAL: Always store singleton to prevent connection exhaustion in production
globalThis.__prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  });

export default prisma;
