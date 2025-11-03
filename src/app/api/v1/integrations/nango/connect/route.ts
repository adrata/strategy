import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/platform/database/prisma-client';
import { Nango } from '@nangohq/node';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

const nango = new Nango({
  secretKey: process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY!,
  host: process.env.NANGO_HOST || 'https://api.nango.dev'
});

/**
 * POST /api/grand-central/nango/connect
 * Initiate OAuth flow for a provider
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, workspaceId, redirectUrl } = await request.json();

    if (!provider || !workspaceId) {
      return NextResponse.json(
        { error: 'Provider and workspaceId are required' },
        { status: 400 }
      );
    }

    // Generate unique connection ID
    const connectionId = `${workspaceId}-${provider}-${Date.now()}`;
    
    // Generate OAuth URL using Nango
    const authUrl = await nango.getAuthorizationURL(
      provider,
      connectionId,
      undefined, // scopes - will use default from Nango config
      {
        return_to: redirectUrl || `${process.env.NEXTAUTH_URL}/[workspace]/grand-central`
      }
    );

    // Store pending connection in database
    await prisma.grand_central_connections.create({
      data: {
        workspaceId,
        userId: user.id,
        provider,
        providerConfigKey: provider,
        nangoConnectionId: connectionId,
        connectionName: `${provider} Connection`,
        status: 'pending',
        metadata: {
          authUrl,
          redirectUrl
        }
      }
    });

    return NextResponse.json({ 
      authUrl,
      connectionId 
    });
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
