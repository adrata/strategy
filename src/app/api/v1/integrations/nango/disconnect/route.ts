import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/platform/database/prisma-client';
import { Nango } from '@nangohq/node';

const nango = new Nango({
  secretKey: process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY!,
  host: process.env.NANGO_HOST || 'https://api.nango.dev'
});

/**
 * POST /api/grand-central/nango/disconnect
 * Disconnect a provider
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId, workspaceId } = await request.json();

    if (!connectionId || !workspaceId) {
      return NextResponse.json(
        { error: 'Connection ID and workspace ID are required' },
        { status: 400 }
      );
    }

    // Find the connection in database
    const connection = await prisma.grand_central_connections.findFirst({
      where: {
        id: connectionId,
        workspaceId,
        userId: user.id
      }
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Delete connection from Nango
    try {
      await nango.deleteConnection(
        connection.providerConfigKey,
        connection.nangoConnectionId
      );
    } catch (error) {
      console.error('Error deleting from Nango:', error);
      // Continue with database deletion even if Nango deletion fails
    }

    // Delete connection from database
    await prisma.grand_central_connections.delete({
      where: { id: connection.id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Connection disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting provider:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect provider' },
      { status: 500 }
    );
  }
}
