import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * GET /api/database/tables/[tableName]
 * 
 * Returns schema information for a specific table
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
    const tableSchema = await getTableSchema(tableName);

    if (!tableSchema) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: tableSchema
    });

  } catch (error) {
    console.error('Failed to fetch table schema:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch table schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get schema information for a specific table
 */
async function getTableSchema(tableName: string) {
  const dmmf = prisma._dmmf;
  const model = dmmf.datamodel.models.find(m => m.name === tableName);
  
  if (!model) {
    return null;
  }

  // Get detailed column information
  const columns = model.fields.map(field => {
    // Get more detailed type information
    let type = field.type;
    let nullable = !field.isRequired;
    let defaultValue = field.default;
    
    // Handle special Prisma types
    if (field.kind === 'scalar') {
      // Map Prisma scalar types to database types
      switch (field.type) {
        case 'String':
          type = 'VARCHAR';
          break;
        case 'Int':
          type = 'INTEGER';
          break;
        case 'Float':
          type = 'REAL';
          break;
        case 'Decimal':
          type = 'DECIMAL';
          break;
        case 'Boolean':
          type = 'BOOLEAN';
          break;
        case 'DateTime':
          type = 'TIMESTAMP';
          break;
        case 'Json':
          type = 'JSONB';
          break;
        case 'Bytes':
          type = 'BYTEA';
          break;
        default:
          type = field.type;
      }
    } else if (field.kind === 'enum') {
      type = `ENUM(${field.type})`;
    } else if (field.kind === 'object') {
      type = 'RELATION';
    }

    return {
      name: field.name,
      type,
      nullable,
      defaultValue,
      isPrimaryKey: field.isId,
      isForeignKey: !!field.relationName,
      foreignTable: field.relationName ? field.relationName : undefined,
      foreignColumn: field.relationName ? field.relationName : undefined,
      description: field.documentation,
      kind: field.kind,
      isList: field.isList,
      isUnique: field.isUnique,
      isUpdatedAt: field.isUpdatedAt
    };
  });

  // Get relationships
  const relationships = model.fields
    .filter(field => field.relationName)
    .map(field => {
      const relation = model.relationFields?.find(rf => rf.name === field.name);
      return {
        type: field.isList ? 'one-to-many' : 'one-to-one',
        targetTable: field.type,
        targetColumn: field.name,
        sourceColumn: field.name,
        relationName: field.relationName,
        onDelete: relation?.onDelete || 'CASCADE',
        onUpdate: relation?.onUpdate || 'CASCADE',
        fields: relation?.fields || [],
        references: relation?.references || []
      };
    });

  // Get indexes (from database metadata)
  const indexes = await getTableIndexes(model.dbName || model.name);

  // Get constraints
  const constraints = await getTableConstraints(model.dbName || model.name);

  return {
    name: model.name,
    dbName: model.dbName || model.name,
    columns,
    relationships,
    indexes,
    constraints,
    documentation: model.documentation,
    primaryKey: model.fields.find(f => f.isId)?.name,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Get indexes for a table
 */
async function getTableIndexes(tableName: string) {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT 
        i.relname as index_name,
        a.attname as column_name,
        i.relkind as index_type,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = $1
      ORDER BY i.relname, a.attnum
    `, tableName);

    // Group by index name
    const indexMap = new Map();
    (result as any[]).forEach(row => {
      if (!indexMap.has(row.index_name)) {
        indexMap.set(row.index_name, {
          name: row.index_name,
          columns: [],
          unique: row.is_unique,
          primary: row.is_primary,
          type: row.index_type === 'i' ? 'btree' : 'other'
        });
      }
      indexMap.get(row.index_name).columns.push(row.column_name);
    });

    return Array.from(indexMap.values());
  } catch (error) {
    console.warn(`Could not get indexes for table ${tableName}:`, error);
    return [];
  }
}

/**
 * Get constraints for a table
 */
async function getTableConstraints(tableName: string) {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = $1
      ORDER BY tc.constraint_type, tc.constraint_name
    `, tableName);

    return (result as any[]).map(row => ({
      name: row.constraint_name,
      type: row.constraint_type,
      column: row.column_name,
      foreignTable: row.foreign_table_name,
      foreignColumn: row.foreign_column_name
    }));
  } catch (error) {
    console.warn(`Could not get constraints for table ${tableName}:`, error);
    return [];
  }
}
