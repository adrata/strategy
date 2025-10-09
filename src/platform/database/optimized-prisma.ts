import { PrismaClient } from '@prisma/client';

/**
 * Optimized Prisma Client for Neon.tech + Vercel
 * 2025 Best Practices Implementation
 */

// Global Prisma instance with optimizations
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Connection pooling optimizations
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Query optimization
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Performance optimizations
  errorFormat: 'minimal',
});

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Optimized query helpers
export const optimizedQueries = {
  // Fast count queries
  async getCounts(table: string, workspaceId: string, statusField = 'status') {
    return prisma.$queryRawUnsafe(`
      SELECT ${statusField}, COUNT(*) as count 
      FROM ${table} 
      WHERE "workspaceId" = $1 AND "deletedAt" IS NULL 
      GROUP BY ${statusField}
    `, workspaceId);
  },

  // Optimized pagination
  async getPaginatedData(
    table: string,
    workspaceId: string,
    limit: number,
    offset: number,
    orderBy = 'globalRank',
    orderDirection = 'ASC'
  ) {
    return prisma.$queryRawUnsafe(`
      SELECT * FROM ${table} 
      WHERE "workspaceId" = $1 AND "deletedAt" IS NULL 
      ORDER BY "${orderBy}" ${orderDirection}
      LIMIT $2 OFFSET $3
    `, workspaceId, limit, offset);
  },

  // Batch operations
  async batchUpdate(table: string, updates: Array<{ id: string; data: any }>) {
    const promises = updates.map(({ id, data }) =>
      prisma.$executeRawUnsafe(`
        UPDATE ${table} 
        SET ${Object.keys(data).map((key, index) => `"${key}" = $${index + 2}`).join(', ')}
        WHERE id = $1
      `, id, ...Object.values(data))
    );
    return Promise.all(promises);
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
