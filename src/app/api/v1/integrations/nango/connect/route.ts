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

    // Create a connect session using Nango (correct method per Nango docs)
    // Note: The provider should match the Integration ID in your Nango dashboard
    // Common values: "outlook", "microsoft-outlook", or the exact integration ID
    let sessionToken: string;
    try {
      console.log(`📧 [NANGO CONNECT] Creating connect session for provider: ${provider}, user: ${user.id}`);
      
      const sessionResponse = await nango.createConnectSession({
        end_user: {
          id: user.id,
          email: user.email || undefined,
          display_name: user.name || undefined,
          tags: { 
            workspaceId,
            provider 
          }
        },
        allowed_integrations: [provider],
      });
      
      sessionToken = sessionResponse.token;
      console.log(`✅ [NANGO CONNECT] Session token created successfully`);
    } catch (nangoError: any) {
      console.error('❌ [NANGO CONNECT] createConnectSession error:', {
        message: nangoError?.message,
        response: nangoError?.response?.data,
        status: nangoError?.response?.status,
        provider,
        userId: user.id
      });
      
      // Check if it's a provider configuration error
      const errorMessage = nangoError?.message || nangoError?.response?.data?.message || 'Unknown error';
      const errorStatus = nangoError?.response?.status || 500;
      
      if (errorStatus === 400 || errorMessage?.includes('provider') || errorMessage?.includes('not found') || errorMessage?.includes('integration')) {
        return NextResponse.json(
          { 
            error: `Provider "${provider}" is not configured in Nango. Please check:`,
            details: [
              `1. Verify the Integration ID in your Nango dashboard matches "${provider}"`,
              `2. Common Integration IDs: "outlook", "microsoft-outlook"`,
              `3. Check that the integration is properly configured with Client ID and Secret`,
              `4. Error from Nango: ${errorMessage}`
            ].join('\n')
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create Nango connect session',
          details: errorMessage,
          status: errorStatus
        },
        { status: errorStatus >= 400 && errorStatus < 500 ? errorStatus : 500 }
      );
    }

    // Store pending session in database (connectionId will come from webhook)
    try {
      await prisma.grand_central_connections.create({
        data: {
          workspaceId,
          userId: user.id,
          provider: provider,
          providerConfigKey: provider,
          nangoConnectionId: `session-${Date.now()}`, // Temporary, will be updated by webhook
          connectionName: `${provider === 'outlook' ? 'Outlook' : provider} Connection`,
          status: 'pending',
          metadata: {
            sessionToken,
            redirectUrl: redirectUrl || `${process.env.NEXTAUTH_URL || 'https://action.adrata.com'}/${workspaceId}/grand-central/integrations`,
            createdAt: new Date().toISOString()
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
            status: 'pending',
            metadata: {
              sessionToken,
              redirectUrl: redirectUrl || `${process.env.NEXTAUTH_URL || 'https://action.adrata.com'}/${workspaceId}/grand-central/integrations`,
              updatedAt: new Date().toISOString()
            },
            updatedAt: new Date()
          }
        });
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({ 
      sessionToken,
      provider
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
