import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * GET /api/database/tables/[tableName]/count
 * 
 * Returns the count of records in a specific table
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tableName: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tableName } = params;
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

    // Get count for the specific table
    try {
      const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const count = Number((result as any)[0]?.count || 0);

      return NextResponse.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.warn(`Could not get count for table ${tableName}:`, error);
      return NextResponse.json({
        success: true,
        data: { count: 0 }
      });
    }

  } catch (error) {
    console.error('Failed to fetch table count:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch table count',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
