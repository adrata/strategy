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

// Track if we're already disconnecting to prevent double disconnects
let isDisconnecting = false;

// Safe disconnect function that prevents UV_HANDLE_CLOSING errors
async function safeDisconnect() {
  if (isDisconnecting) {
    return; // Already disconnecting, skip
  }
  
  isDisconnecting = true;
  
  try {
    if (prisma) {
      await prisma.$disconnect();
    }
  } catch (error) {
    // Ignore disconnect errors if already disconnected
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('already been disconnected') && 
        !errorMessage.includes('UV_HANDLE_CLOSING')) {
      console.warn('⚠️  [PRISMA] Disconnect warning:', errorMessage);
    }
  } finally {
    isDisconnecting = false;
  }
}

// Graceful shutdown - prevent multiple disconnect attempts
process.on('beforeExit', async () => {
  if (!isDisconnecting) {
    console.log('🔄 [PRISMA] Graceful shutdown initiated...');
    await safeDisconnect();
    console.log('✅ [PRISMA] Database connection closed');
  }
});

process.on('SIGINT', async () => {
  if (!isDisconnecting) {
    console.log('🔄 [PRISMA] SIGINT received, disconnecting...');
    await safeDisconnect();
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  if (!isDisconnecting) {
    console.log('🔄 [PRISMA] SIGTERM received, disconnecting...');
    await safeDisconnect();
    process.exit(0);
  }
});

export default prisma;
