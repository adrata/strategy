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
  const secretKey = process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('NANGO_SECRET_KEY or NANGO_SECRET_KEY_DEV environment variable is not set');
  }

  return new Nango({
    secretKey,
    host: process.env.NANGO_HOST || 'https://api.nango.dev'
  });
}

/**
 * POST /api/v1/integrations/nango/connect
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

    // Check if Nango is configured
    let nango: Nango;
    try {
      nango = getNangoClient();
    } catch (nangoError) {
      console.error('Nango configuration error:', nangoError);
      return NextResponse.json(
        { 
          error: 'Nango is not configured. Please set NANGO_SECRET_KEY environment variable.',
          details: nangoError instanceof Error ? nangoError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Generate unique connection ID
    const connectionId = `${workspaceId}-${provider}-${Date.now()}`;
    
    // Generate OAuth URL using Nango
    let authUrl: string;
    try {
      authUrl = await nango.getAuthorizationURL(
        provider,
        connectionId,
        undefined, // scopes - will use default from Nango config
        {
          return_to: redirectUrl || `${process.env.NEXTAUTH_URL || 'https://action.adrata.com'}/${workspaceId}/grand-central/integrations`
        }
      );
    } catch (nangoError: any) {
      console.error('Nango getAuthorizationURL error:', nangoError);
      
      // Check if it's a provider configuration error
      if (nangoError?.message?.includes('provider') || nangoError?.message?.includes('not found')) {
        return NextResponse.json(
          { 
            error: `Provider "${provider}" is not configured in Nango. Please configure it in your Nango dashboard.`,
            details: nangoError.message
          },
          { status: 400 }
        );
      }
      
      throw nangoError;
    }

    // Store pending connection in database
    try {
      await prisma.grand_central_connections.create({
        data: {
          workspaceId,
          userId: user.id,
          provider: provider,
          providerConfigKey: provider,
          nangoConnectionId: connectionId,
          connectionName: `${provider === 'outlook' ? 'Outlook' : provider} Connection`,
          status: 'pending',
          metadata: {
            authUrl,
            redirectUrl: redirectUrl || `${process.env.NEXTAUTH_URL || 'https://action.adrata.com'}/${workspaceId}/grand-central/integrations`
          }
        }
      });
    } catch (dbError: any) {
      // If connection already exists, update it
      if (dbError?.code === 'P2002') {
        await prisma.grand_central_connections.updateMany({
          where: {
            workspaceId,
            userId: user.id,
            provider: provider,
            status: { in: ['pending', 'error'] }
          },
          data: {
            nangoConnectionId: connectionId,
            status: 'pending',
            metadata: {
              authUrl,
              redirectUrl: redirectUrl || `${process.env.NEXTAUTH_URL || 'https://action.adrata.com'}/${workspaceId}/grand-central/integrations`
            },
            updatedAt: new Date()
          }
        });
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({ 
      authUrl,
      connectionId 
    });
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to initiate OAuth flow',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
