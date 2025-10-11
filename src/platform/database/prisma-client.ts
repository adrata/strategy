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

// Validate environment variables
const databaseUrl = process['env']['DATABASE_URL'] || process['env']['POSTGRES_URL'];
if (!databaseUrl) {
  console.error('❌ [PRISMA] CRITICAL: DATABASE_URL or POSTGRES_URL environment variable not set');
  console.error('❌ [PRISMA] This will cause authentication failures in production');
  throw new Error('Database configuration error: DATABASE_URL or POSTGRES_URL must be set');
}

console.log('✅ [PRISMA] Database URL configured:', databaseUrl.substring(0, 50) + '...');

// Create singleton Prisma client with optimized configuration
export const prisma = globalThis.__prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process['env']['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
});

// CRITICAL: Always store singleton to prevent connection exhaustion in production
globalThis.__prisma = prisma;

// Test database connection on initialization
prisma.$connect()
  .then(() => {
    console.log('✅ [PRISMA] Database connection established successfully');
  })
  .catch((error) => {
    console.error('❌ [PRISMA] Failed to connect to database:', error);
    console.error('❌ [PRISMA] This will cause authentication failures');
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  console.log('🔄 [PRISMA] Graceful shutdown initiated...');
  await prisma.$disconnect();
  console.log('✅ [PRISMA] Database connection closed');
});

process.on('SIGINT', async () => {
  console.log('🔄 [PRISMA] SIGINT received, disconnecting...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 [PRISMA] SIGTERM received, disconnecting...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
