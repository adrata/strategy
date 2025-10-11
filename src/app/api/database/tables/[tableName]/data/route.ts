import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * GET /api/database/tables/[tableName]/data
 * 
 * Returns paginated data for a specific table
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

    const { tableName } = params;
    
    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 rows
    const search = searchParams.get('search') || '';
    const orderBy = searchParams.get('orderBy') || '';
    const orderDirection = searchParams.get('orderDirection') || 'asc';
    const filters = searchParams.get('filters') ? JSON.parse(searchParams.get('filters')!) : {};

    const tableData = await getTableData(tableName, {
      page,
      limit,
      search,
      orderBy,
      orderDirection,
      filters,
      workspaceId
    });

    return NextResponse.json({
      success: true,
      data: tableData
    });

  } catch (error) {
    console.error('Failed to fetch table data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch table data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get paginated data for a table
 */
async function getTableData(
  tableName: string, 
  options: {
    page: number;
    limit: number;
    search: string;
    orderBy: string;
    orderDirection: string;
    filters: Record<string, any>;
    workspaceId: string;
  }
) {
  const { page, limit, search, orderBy, orderDirection, filters, workspaceId } = options;
  const offset = (page - 1) * limit;

  // Find the Prisma model
  const dmmf = prisma._dmmf;
  const model = dmmf.datamodel.models.find(m => m.name === tableName);
  
  if (!model) {
    throw new Error(`Table ${tableName} not found`);
  }

  // Build WHERE clause for workspace isolation
  let whereClause = '';
  const hasWorkspaceField = model.fields.some(f => f.name === 'workspaceId');
  
  if (hasWorkspaceField) {
    whereClause = `WHERE "workspaceId" = '${workspaceId}'`;
  }

  // Add search conditions
  if (search) {
    const searchableFields = model.fields
      .filter(f => f.kind === 'scalar' && ['String', 'Int', 'Float'].includes(f.type))
      .map(f => f.name);
    
    if (searchableFields.length > 0) {
      const searchConditions = searchableFields
        .map(field => `"${field}"::text ILIKE '%${search}%'`)
        .join(' OR ');
      
      whereClause += whereClause ? ` AND (${searchConditions})` : `WHERE (${searchConditions})`;
    }
  }

  // Add filters
  if (Object.keys(filters).length > 0) {
    const filterConditions = Object.entries(filters)
      .map(([key, value]) => {
        if (value === null) {
          return `"${key}" IS NULL`;
        } else if (typeof value === 'string') {
          return `"${key}" = '${value}'`;
        } else {
          return `"${key}" = ${value}`;
        }
      })
      .join(' AND ');
    
    whereClause += whereClause ? ` AND (${filterConditions})` : `WHERE (${filterConditions})`;
  }

  // Build ORDER BY clause
  let orderClause = '';
  if (orderBy) {
    const direction = orderDirection === 'desc' ? 'DESC' : 'ASC';
    orderClause = `ORDER BY "${orderBy}" ${direction}`;
  } else {
    // Default ordering by ID or first field
    const idField = model.fields.find(f => f.isId)?.name || model.fields[0]?.name;
    if (idField) {
      orderClause = `ORDER BY "${idField}" ASC`;
    }
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM "${model.dbName || model.name}" ${whereClause}`;
  const countResult = await prisma.$queryRawUnsafe(countQuery);
  const totalCount = Number((countResult as any)[0]?.count || 0);

  // Get paginated data
  const dataQuery = `
    SELECT * FROM "${model.dbName || model.name}" 
    ${whereClause} 
    ${orderClause} 
    LIMIT ${limit} OFFSET ${offset}
  `;
  
  const dataResult = await prisma.$queryRawUnsafe(dataQuery);
  const rows = dataResult as Record<string, any>[];

  // Convert data to proper types
  const processedRows = rows.map(row => {
    const processedRow: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(row)) {
      // Handle special types
      if (value instanceof Date) {
        processedRow[key] = value.toISOString();
      } else if (typeof value === 'object' && value !== null) {
        processedRow[key] = JSON.stringify(value);
      } else {
        processedRow[key] = value;
      }
    }
    
    return processedRow;
  });

  return {
    rows: processedRows,
    totalCount,
    page,
    pageSize: limit,
    hasNextPage: offset + limit < totalCount,
    hasPreviousPage: page > 1,
    totalPages: Math.ceil(totalCount / limit)
  };
}
