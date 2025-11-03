import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * POST /api/database/record - Create a new record
 * PATCH /api/database/record - Update an existing record
 * DELETE /api/database/record - Delete a record
 */
export async function POST(request: NextRequest) {
  return handleRecordOperation(request, 'create');
}

export async function PATCH(request: NextRequest) {
  return handleRecordOperation(request, 'update');
}

export async function DELETE(request: NextRequest) {
  return handleRecordOperation(request, 'delete');
}

async function handleRecordOperation(request: NextRequest, operation: 'create' | 'update' | 'delete') {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tableName, data, where, workspaceId } = body;

    if (!tableName || !workspaceId) {
      return NextResponse.json({ error: 'Table name and workspace ID are required' }, { status: 400 });
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

    // Check permissions based on operation
    const hasPermission = await checkRecordPermission(workspaceUser.role, operation, tableName);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find the Prisma model
    const dmmf = prisma._dmmf;
    const model = dmmf.datamodel.models.find(m => m.name === tableName);
    
    if (!model) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Ensure workspace isolation
    const hasWorkspaceField = model.fields.some(f => f.name === 'workspaceId');
    if (hasWorkspaceField && operation === 'create') {
      data.workspaceId = workspaceId;
    }

    let result;
    const startTime = Date.now();

    switch (operation) {
      case 'create':
        if (!data) {
          return NextResponse.json({ error: 'Data is required for create operation' }, { status: 400 });
        }
        
        // Use dynamic model access
        result = await (prisma as any)[model.name].create({
          data: sanitizeData(data, model),
        });
        break;

      case 'update':
        if (!data || !where) {
          return NextResponse.json({ error: 'Data and where clause are required for update operation' }, { status: 400 });
        }
        
        // Add workspace filter for security
        const updateWhere = hasWorkspaceField 
          ? { ...where, workspaceId }
          : where;
        
        result = await (prisma as any)[model.name].update({
          where: updateWhere,
          data: sanitizeData(data, model),
        });
        break;

      case 'delete':
        if (!where) {
          return NextResponse.json({ error: 'Where clause is required for delete operation' }, { status: 400 });
        }
        
        // Add workspace filter for security
        const deleteWhere = hasWorkspaceField 
          ? { ...where, workspaceId }
          : where;
        
        // Check if table supports soft delete
        const hasDeletedAt = model.fields.some(f => f.name === 'deletedAt');
        
        if (hasDeletedAt) {
          // Soft delete
          result = await (prisma as any)[model.name].update({
            where: deleteWhere,
            data: { deletedAt: new Date() },
          });
        } else {
          // Hard delete
          result = await (prisma as any)[model.name].delete({
            where: deleteWhere,
          });
        }
        break;
    }

    const executionTime = Date.now() - startTime;

    // Log the operation for audit
    await logAuditOperation(session.user.id, workspaceId, tableName, operation, where, data);

    return NextResponse.json({
      success: true,
      data: result,
      executionTime
    });

  } catch (error) {
    console.error(`Record ${operation} operation failed:`, error);
    return NextResponse.json({ 
      error: `Record ${operation} operation failed`,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Check if user has permission to perform the operation
 */
async function checkRecordPermission(
  userRole: string, 
  operation: 'create' | 'update' | 'delete', 
  tableName: string
): Promise<boolean> {
  // Super admins can do everything
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  // Workspace admins can do everything in their workspace
  if (userRole === 'WORKSPACE_ADMIN') {
    return true;
  }

  // Managers can read and write most data
  if (userRole === 'MANAGER') {
    return operation !== 'delete' || !isSystemTable(tableName);
  }

  // Sellers can read and write their assigned data
  if (userRole === 'SELLER') {
    return operation === 'create' || operation === 'update';
  }

  // Viewers can only read
  if (userRole === 'VIEWER') {
    return false;
  }

  return false;
}

/**
 * Check if table is a system table that requires special permissions
 */
function isSystemTable(tableName: string): boolean {
  const systemTables = [
    'users', 'workspaces', 'roles', 'permissions', 'role_permissions', 
    'user_roles', 'workspace_users', 'auth_sessions', 'audit_logs'
  ];
  return systemTables.includes(tableName);
}

/**
 * Sanitize data before database operation
 */
function sanitizeData(data: any, model: any): any {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Check if field exists in model
    const field = model.fields.find((f: any) => f.name === key);
    if (!field) {
      continue; // Skip unknown fields
    }

    // Handle different field types
    if (field.type === 'DateTime' && value) {
      sanitized[key] = new Date(value as string);
    } else if (field.type === 'Json' && value) {
      try {
        sanitized[key] = typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        sanitized[key] = value;
      }
    } else if (field.type === 'Boolean' && typeof value === 'string') {
      sanitized[key] = value === 'true';
    } else if (field.type === 'Int' && typeof value === 'string') {
      sanitized[key] = parseInt(value, 10);
    } else if (field.type === 'Float' && typeof value === 'string') {
      sanitized[key] = parseFloat(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Log audit operation
 */
async function logAuditOperation(
  userId: string,
  workspaceId: string,
  tableName: string,
  operation: string,
  where?: any,
  data?: any
) {
  try {
    await prisma.audit_logs.create({
      data: {
        userId,
        workspaceId,
        entityType: tableName,
        entityId: where?.id || 'unknown',
        action: operation.toUpperCase(),
        oldValues: operation === 'update' ? where : null,
        newValues: data,
        timestamp: new Date(),
        success: true
      }
    });
  } catch (error) {
    console.error('Failed to log audit operation:', error);
  }
}
