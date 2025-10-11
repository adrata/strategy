import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/platform/database/prisma-client';
import { Nango } from '@nangohq/node';

const nango = new Nango({
  secretKey: process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY!,
  host: process.env.NANGO_HOST || 'https://api.nango.dev'
});

/**
 * GET /api/grand-central/nango/connections
 * Get all connections for a workspace
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || user.workspaceId;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID required' },
        { status: 400 }
      );
    }

    // Get connections from database
    const connections = await prisma.grand_central_connections.findMany({
      where: {
        workspaceId,
        status: {
          in: ['active', 'pending', 'error']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Verify connection status with Nango for active connections
    const verifiedConnections = await Promise.all(
      connections.map(async (connection) => {
        if (connection.status === 'active') {
          try {
            // Test connection with Nango
            const testResult = await nango.proxy({
              providerConfigKey: connection.providerConfigKey,
              connectionId: connection.nangoConnectionId,
              endpoint: '/', // Simple test endpoint
              method: 'GET'
            });
            
            return {
              ...connection,
              status: 'active',
              lastSyncAt: new Date()
            };
          } catch (error) {
            console.error(`Connection test failed for ${connection.provider}:`, error);
            return {
              ...connection,
              status: 'error',
              metadata: {
                ...connection.metadata,
                error: 'Connection test failed'
              }
            };
          }
        }
        return connection;
      })
    );

    // Update connection statuses in database
    await Promise.all(
      verifiedConnections.map(connection => 
        prisma.grand_central_connections.update({
          where: { id: connection.id },
          data: {
            status: connection.status,
            lastSyncAt: connection.lastSyncAt,
            metadata: connection.metadata
          }
        })
      )
    );

    return NextResponse.json({ connections: verifiedConnections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}
