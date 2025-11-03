import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * GET /api/database/tables
 * 
 * Returns list of all database tables with metadata
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

    // Get all tables from Prisma schema introspection
    const tables = await getDatabaseTables(workspaceId);

    return NextResponse.json({
      success: true,
      data: tables
    });

  } catch (error) {
    console.error('Failed to fetch database tables:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch database tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get all database tables with metadata
 */
async function getDatabaseTables(workspaceId: string) {
  // Define table categories based on Prisma schema
  const tableCategories = {
    core: ['users', 'workspaces', 'companies', 'people'],
    auth: ['auth_sessions', 'roles', 'permissions', 'role_permissions', 'user_roles', 'workspace_users', 'reset_tokens'],
    activity: ['actions', 'audit_logs'],
    products: ['OasisChannel', 'OasisChannelMember', 'OasisDirectMessage', 'OasisDMParticipant', 'OasisMessage', 'OasisReaction', 'StacksProject', 'StacksEpoch', 'StacksStory', 'StacksTask', 'BuyerGroups', 'BuyerGroupMembers', 'grand_central_connections', 'grand_central_workflows', 'grand_central_executions']
  };

  const tables = [];

  // Get table information from Prisma DMMF
  const dmmf = prisma._dmmf;
  
  for (const model of dmmf.datamodel.models) {
    const tableName = model.dbName || model.name;
    
    // Determine category
    let category: 'core' | 'auth' | 'activity' | 'products' = 'core';
    for (const [cat, tableList] of Object.entries(tableCategories)) {
      if (tableList.includes(model.name)) {
        category = cat as any;
        break;
      }
    }

    // Get row count for this table
    let rowCount = 0;
    try {
      // Use dynamic query to get count
      const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
      rowCount = Number((result as any)[0]?.count || 0);
    } catch (error) {
      console.warn(`Could not get row count for table ${tableName}:`, error);
    }

    // Get columns information
    const columns = model.fields.map(field => ({
      name: field.name,
      type: field.type,
      nullable: !field.isRequired,
      defaultValue: field.default,
      isPrimaryKey: field.isId,
      isForeignKey: !!field.relationName,
      foreignTable: field.relationName ? field.relationName : undefined,
      foreignColumn: field.relationName ? field.relationName : undefined,
      description: field.documentation
    }));

    // Get relationships
    const relationships = model.fields
      .filter(field => field.relationName)
      .map(field => ({
        type: field.isList ? 'one-to-many' : 'one-to-one',
        targetTable: field.type,
        targetColumn: field.name,
        sourceColumn: field.name,
        onDelete: 'CASCADE' as const,
        onUpdate: 'CASCADE' as const
      }));

    tables.push({
      name: model.name,
      category,
      rowCount,
      columns,
      indexes: [], // TODO: Get actual indexes from database
      relationships,
      lastModified: new Date()
    });
  }

  return tables;
}
