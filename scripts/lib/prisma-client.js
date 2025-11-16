/**
 * Shared Prisma Client Singleton for Scripts
 * 
 * Prevents connection pool exhaustion by reusing a single Prisma client instance
 * across all scripts. This is critical for preventing "connection failed" errors.
 */

const { PrismaClient } = require('@prisma/client');

// Global variable to store the singleton instance
let globalPrisma = null;

/**
 * Get or create the shared Prisma client instance
 * @returns {PrismaClient} Singleton Prisma client instance
 */
function getPrismaClient() {
  if (!globalPrisma) {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    require('dotenv').config(); // .env as fallback

    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!databaseUrl) {
      console.error('❌ [PRISMA] CRITICAL: DATABASE_URL or POSTGRES_URL environment variable not set');
      throw new Error('Database configuration error: DATABASE_URL or POSTGRES_URL must be set');
    }

    console.log('✅ [PRISMA] Creating shared client instance...');
    console.log('✅ [PRISMA] Database URL configured:', databaseUrl.substring(0, 50) + '...');

    // Create singleton Prisma client with optimized configuration
    globalPrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    // Graceful shutdown handlers
    const disconnect = async () => {
      if (globalPrisma) {
        try {
          await globalPrisma.$disconnect();
          console.log('✅ [PRISMA] Shared client disconnected');
        } catch (error) {
          // Ignore disconnect errors if already disconnected
          if (!error.message.includes('already been disconnected')) {
            console.warn('⚠️  [PRISMA] Disconnect warning:', error.message);
          }
        }
      }
    };

    process.on('beforeExit', disconnect);
    process.on('SIGINT', async () => {
      await disconnect();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      await disconnect();
      process.exit(0);
    });
  }

  return globalPrisma;
}

/**
 * Disconnect the shared Prisma client (use with caution)
 * Only call this at the very end of script execution
 * @returns {Promise<void>}
 */
async function disconnectPrismaClient() {
  if (globalPrisma) {
    try {
      await globalPrisma.$disconnect();
      globalPrisma = null;
      console.log('✅ [PRISMA] Shared client disconnected');
    } catch (error) {
      if (!error.message.includes('already been disconnected')) {
        console.warn('⚠️  [PRISMA] Disconnect warning:', error.message);
      }
      globalPrisma = null;
    }
  }
}

module.exports = {
  getPrismaClient,
  disconnectPrismaClient,
};





