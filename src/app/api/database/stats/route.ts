import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * GET /api/database/stats
 * 
 * Returns database statistics for the workspace
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace from query params
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Verify user has access to this workspace
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        isActive: true
      }
    });

    if (!workspaceUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get database statistics
    const stats = await getDatabaseStats(workspaceId);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Failed to fetch database stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch database stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get database statistics for workspace
 */
async function getDatabaseStats(workspaceId: string) {
  // Get total tables count
  const dmmf = prisma._dmmf;
  const totalTables = dmmf.datamodel.models.length;

  // Get total records across all tables
  let totalRecords = 0;
  const tableCounts = [];

  for (const model of dmmf.datamodel.models) {
    const tableName = model.dbName || model.name;
    try {
      const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const count = Number((result as any)[0]?.count || 0);
      totalRecords += count;
      tableCounts.push({ table: model.name, count });
    } catch (error) {
      console.warn(`Could not get count for table ${tableName}:`, error);
    }
  }

  // Get database size (approximate)
  let storageSize = 'Unknown';
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    storageSize = (result as any)[0]?.size || 'Unknown';
  } catch (error) {
    console.warn('Could not get database size:', error);
  }

  // Get last backup info (if available)
  let lastBackup;
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT MAX(created_at) as last_backup 
      FROM pg_stat_archiver 
      WHERE archived_count > 0
    `);
    lastBackup = (result as any)[0]?.last_backup;
  } catch (error) {
    // Backup info not available
  }

  return {
    totalTables,
    totalRecords,
    storageSize,
    lastBackup,
    tableCounts: tableCounts.slice(0, 10) // Top 10 tables by record count
  };
}
