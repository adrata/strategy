import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * POST /api/database/query
 * 
 * Execute SQL queries against the database
 * Only SELECT queries are allowed by default for security
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
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

    // Check if user has permission to execute queries
    // Only workspace admins and super admins can execute queries by default
    if (workspaceUser.role !== 'WORKSPACE_ADMIN' && workspaceUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate and sanitize query
    const sanitizedQuery = sanitizeQuery(query.trim());
    if (!sanitizedQuery) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    // Execute query
    const startTime = Date.now();
    const result = await prisma.$queryRawUnsafe(sanitizedQuery);
    const executionTime = Date.now() - startTime;

    // Process results
    const rows = result as Record<string, any>[];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return NextResponse.json({
      success: true,
      data: {
        data: rows,
        columns,
        executionTime,
        rowCount: rows.length
      }
    });

  } catch (error) {
    console.error('Query execution failed:', error);
    return NextResponse.json({ 
      error: 'Query execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Sanitize and validate SQL query
 * Only allow SELECT queries for security
 */
function sanitizeQuery(query: string): string | null {
  // Remove comments and normalize whitespace
  const normalizedQuery = query
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Check if query starts with SELECT (case insensitive)
  if (!normalizedQuery.toLowerCase().startsWith('select')) {
    return null;
  }

  // Check for dangerous keywords
  const dangerousKeywords = [
    'drop', 'delete', 'update', 'insert', 'create', 'alter', 'truncate',
    'grant', 'revoke', 'exec', 'execute', 'sp_', 'xp_', '--', '/*', '*/'
  ];

  const lowerQuery = normalizedQuery.toLowerCase();
  for (const keyword of dangerousKeywords) {
    if (lowerQuery.includes(keyword)) {
      return null;
    }
  }

  // Basic SQL injection protection
  if (normalizedQuery.includes(';') && !normalizedQuery.endsWith(';')) {
    return null; // Multiple statements not allowed
  }

  return normalizedQuery;
}
