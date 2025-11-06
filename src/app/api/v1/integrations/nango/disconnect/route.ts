import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/platform/database/prisma-client';
import { Nango } from '@nangohq/node';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * Initialize Nango client with error handling
 */
function getNangoClient(): Nango {
  // Priority: Use NANGO_SECRET_KEY for production, NANGO_SECRET_KEY_DEV for development
  // IMPORTANT: Make sure the secret key matches the environment where your integration exists
  const secretKey = process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV;
  
  if (!secretKey) {
    throw new Error('NANGO_SECRET_KEY or NANGO_SECRET_KEY_DEV environment variable is not set');
  }

  const host = process.env.NANGO_HOST || 'https://api.nango.dev';
  
  // Log which key is being used (first 12 chars only for security)
  const keyPrefix = secretKey.length > 12 ? secretKey.substring(0, 12) : secretKey.substring(0, Math.min(secretKey.length, 8));
  console.log(`🔑 [NANGO DISCONNECT] Using secret key: ${keyPrefix}... (from ${process.env.NANGO_SECRET_KEY ? 'NANGO_SECRET_KEY' : 'NANGO_SECRET_KEY_DEV'})`);
  console.log(`🌐 [NANGO DISCONNECT] Using host: ${host}`);

  return new Nango({
    secretKey,
    host
  });
}

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

    // Delete connection from Nango (if it exists)
    if (connection.nangoConnectionId && connection.providerConfigKey) {
      try {
        const nango = getNangoClient();
        console.log(`🗑️ [NANGO DISCONNECT] Attempting to delete connection:`, {
          providerConfigKey: connection.providerConfigKey,
          nangoConnectionId: connection.nangoConnectionId
        });
        
        await nango.deleteConnection(
          connection.providerConfigKey,
          connection.nangoConnectionId
        );
        
        console.log(`✅ [NANGO DISCONNECT] Successfully deleted connection from Nango`);
      } catch (error: any) {
        // Log detailed error information
        const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error';
        const errorStatus = error?.response?.status || error?.status || 'Unknown';
        
        console.error('❌ [NANGO DISCONNECT] Error deleting from Nango:', {
          message: errorMessage,
          status: errorStatus,
          providerConfigKey: connection.providerConfigKey,
          nangoConnectionId: connection.nangoConnectionId,
          fullError: error?.response?.data || error
        });
        
        // If connection doesn't exist in Nango (404), that's okay - continue with DB deletion
        // If it's a 400, log it but still continue (connection might be in invalid state)
        if (errorStatus === 404) {
          console.log(`ℹ️ [NANGO DISCONNECT] Connection not found in Nango (may have been deleted already), continuing with DB cleanup`);
        } else {
          console.warn(`⚠️ [NANGO DISCONNECT] Nango deletion failed but continuing with database cleanup`);
        }
        // Continue with database deletion even if Nango deletion fails
      }
    } else {
      console.log(`ℹ️ [NANGO DISCONNECT] Skipping Nango deletion - missing nangoConnectionId or providerConfigKey`, {
        hasNangoConnectionId: !!connection.nangoConnectionId,
        hasProviderConfigKey: !!connection.providerConfigKey
      });
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
