import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { Nango } from '@nangohq/node';
import { getBaseUrl } from '@/lib/env-urls';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

// Lazy initialization of Nango client to avoid build-time errors
function getNangoClient() {
  const secretKey = process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('Nango secret key is not configured. Please set NANGO_SECRET_KEY_DEV or NANGO_SECRET_KEY environment variable.');
  }
  
  return new Nango({
    secretKey,
    host: process.env.NANGO_HOST || 'https://api.nango.dev'
  });
}

/**
 * GET /api/grand-central/nango/callback
 * Handle OAuth callback from providers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connection_id');
    const providerConfigKey = searchParams.get('provider_config_key');
    const error = searchParams.get('error');

    const baseUrl = getBaseUrl();
    
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${baseUrl}/[workspace]/grand-central?error=${encodeURIComponent(error)}`
      );
    }

    if (!connectionId || !providerConfigKey) {
      return NextResponse.redirect(
        `${baseUrl}/[workspace]/grand-central?error=missing_parameters`
      );
    }

    // Find the pending connection in database
    const connection = await prisma.grand_central_connections.findFirst({
      where: {
        nangoConnectionId: connectionId,
        providerConfigKey,
        status: 'pending'
      }
    });

    if (!connection) {
      return NextResponse.redirect(
        `${baseUrl}/[workspace]/grand-central?error=connection_not_found`
      );
    }

    // Test the connection to verify it's working
    try {
      const nango = getNangoClient();
      await nango.proxy({
        providerConfigKey,
        connectionId,
        endpoint: '/', // Simple test endpoint
        method: 'GET'
      });

      // Update connection status to active
      await prisma.grand_central_connections.update({
        where: { id: connection.id },
        data: {
          status: 'active',
          lastSyncAt: new Date(),
          metadata: {
            ...connection.metadata,
            connectedAt: new Date().toISOString()
          }
        }
      });

      return NextResponse.redirect(
        `${baseUrl}/[workspace]/grand-central?success=connected&provider=${providerConfigKey}`
      );
    } catch (error) {
      console.error('Connection test failed:', error);
      
      // Update connection status to error
      await prisma.grand_central_connections.update({
        where: { id: connection.id },
        data: {
          status: 'error',
          metadata: {
            ...connection.metadata,
            error: 'Connection test failed after OAuth'
          }
        }
      });

      return NextResponse.redirect(
        `${baseUrl}/[workspace]/grand-central?error=connection_test_failed`
      );
    }
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    const baseUrl = getBaseUrl();
    return NextResponse.redirect(
      `${baseUrl}/[workspace]/grand-central?error=callback_error`
    );
  }
}
