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
    console.log(`🗑️ [NANGO DISCONNECT] POST request received`);
    
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      console.error(`❌ [NANGO DISCONNECT] Unauthorized - no user`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error(`❌ [NANGO DISCONNECT] Failed to parse request body:`, parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { connectionId, workspaceId } = body;
    
    console.log(`🗑️ [NANGO DISCONNECT] Request data:`, {
      connectionId,
      workspaceId,
      userId: user.id
    });

    if (!connectionId || !workspaceId) {
      return NextResponse.json(
        { error: 'Connection ID and workspace ID are required' },
        { status: 400 }
      );
    }

    // Find the connection in database
    // Try by database ID first, then by nangoConnectionId
    let connection = await prisma.grand_central_connections.findFirst({
      where: {
        id: connectionId,
        workspaceId,
        userId: user.id
      }
    });

    // If not found by ID, try by nangoConnectionId
    if (!connection) {
      connection = await prisma.grand_central_connections.findFirst({
        where: {
          nangoConnectionId: connectionId,
          workspaceId,
          userId: user.id
        }
      });
    }

    if (!connection) {
      console.error(`❌ [NANGO DISCONNECT] Connection not found:`, {
        connectionId,
        workspaceId,
        userId: user.id
      });
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Delete connection from Nango (if it exists and is a real connection ID)
    // Skip if it's a temporary session ID (starts with "session-")
    const isTemporarySessionId = connection.nangoConnectionId?.startsWith('session-');
    
    if (connection.nangoConnectionId && connection.providerConfigKey && !isTemporarySessionId) {
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
        const errorCode = error?.response?.data?.error?.code || error?.code;
        
        console.error('❌ [NANGO DISCONNECT] Error deleting from Nango:', {
          message: errorMessage,
          code: errorCode,
          status: errorStatus,
          providerConfigKey: connection.providerConfigKey,
          nangoConnectionId: connection.nangoConnectionId,
          fullError: error?.response?.data || error
        });
        
        // If connection doesn't exist in Nango (404 or unknown_connection), that's okay - continue with DB deletion
        // This can happen if:
        // 1. Connection was already deleted in Nango
        // 2. Connection never existed (webhook didn't fire)
        // 3. Connection ID is invalid
        if (errorStatus === 404 || errorCode === 'unknown_connection') {
          console.log(`ℹ️ [NANGO DISCONNECT] Connection not found in Nango (${errorCode || '404'}), continuing with DB cleanup`);
        } else {
          console.warn(`⚠️ [NANGO DISCONNECT] Nango deletion failed (${errorStatus}) but continuing with database cleanup`);
        }
        // Continue with database deletion even if Nango deletion fails
      }
    } else if (isTemporarySessionId) {
      console.log(`ℹ️ [NANGO DISCONNECT] Skipping Nango deletion - connection has temporary session ID (webhook may not have fired yet)`);
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
      { 
        error: 'Failed to disconnect provider',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/integrations/nango/disconnect
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Disconnect endpoint is active',
    method: 'POST',
    description: 'Use POST method to disconnect a connection'
  });
}
