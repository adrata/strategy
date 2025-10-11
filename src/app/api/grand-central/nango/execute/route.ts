import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/platform/database/prisma-client';
import { Nango } from '@nangohq/node';

const nango = new Nango({
  secretKey: process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY!,
  host: process.env.NANGO_HOST || 'https://api.nango.dev'
});

/**
 * POST /api/grand-central/nango/execute
 * Execute an API operation via Nango proxy
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId, operation, data, endpoint, method = 'GET' } = await request.json();

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Find the connection in database
    const connection = await prisma.grand_central_connections.findFirst({
      where: {
        id: connectionId,
        userId: user.id,
        status: 'active'
      }
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Active connection not found' },
        { status: 404 }
      );
    }

    // Execute API call via Nango proxy
    const response = await nango.proxy({
      providerConfigKey: connection.providerConfigKey,
      connectionId: connection.nangoConnectionId,
      endpoint: endpoint || '/',
      method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      data
    });

    // Update last sync time
    await prisma.grand_central_connections.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      data: response.data,
      status: response.status
    });
  } catch (error) {
    console.error('Error executing operation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
