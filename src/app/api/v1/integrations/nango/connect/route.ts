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
  // Note: Secret keys may or may not start with 'nango_sk' depending on Nango version/instance
  const keyPrefix = secretKey.length > 12 ? secretKey.substring(0, 12) : secretKey.substring(0, Math.min(secretKey.length, 8));
  console.log(`🔑 [NANGO] Using secret key: ${keyPrefix}... (from ${process.env.NANGO_SECRET_KEY ? 'NANGO_SECRET_KEY' : 'NANGO_SECRET_KEY_DEV'})`);
  console.log(`🌐 [NANGO] Using host: ${host}`);

  return new Nango({
    secretKey,
    host
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
      
      // Log comprehensive environment diagnostics
      console.log(`🔍 [NANGO CONNECT] Environment diagnostics:`, {
        hasSecretKey: !!process.env.NANGO_SECRET_KEY,
        hasSecretKeyDev: !!process.env.NANGO_SECRET_KEY_DEV,
        secretKeySource: process.env.NANGO_SECRET_KEY ? 'NANGO_SECRET_KEY' : 'NANGO_SECRET_KEY_DEV',
        secretKeyPrefix: (process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV)?.substring(0, 12),
        host: process.env.NANGO_HOST || 'https://api.nango.dev',
        outlookIntegrationId: process.env.NANGO_OUTLOOK_INTEGRATION_ID || 'outlook (default)'
      });
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

    /**
     * Map provider names to Nango Integration IDs
     * This mapping is stored server-side in environment variables for security
     * Frontend sends simple provider names like "outlook", backend maps to actual Integration ID
     */
    function getNangoIntegrationId(provider: string): string {
      const mapping: Record<string, string> = {
        // Outlook: Default to 'outlook' if env var not set (matches common Nango Integration ID)
        'outlook': process.env.NANGO_OUTLOOK_INTEGRATION_ID || 'outlook',
        'gmail': process.env.NANGO_GMAIL_INTEGRATION_ID || 'gmail',
        'google': process.env.NANGO_GOOGLE_INTEGRATION_ID || 'gmail',
      };

      const integrationId = mapping[provider.toLowerCase()];
      
      if (!integrationId) {
        throw new Error(`Unknown provider: ${provider}. Supported providers: outlook, gmail`);
      }

      return integrationId;
    }

    // Get the actual Nango Integration ID from environment variables
    let nangoIntegrationId: string;
    try {
      nangoIntegrationId = getNangoIntegrationId(provider);
      console.log(`📧 [NANGO CONNECT] Mapped provider "${provider}" to Integration ID "${nangoIntegrationId}"`);
    } catch (mappingError) {
      return NextResponse.json(
        { 
          error: 'Invalid provider',
          details: mappingError instanceof Error ? mappingError.message : 'Unknown provider'
        },
        { status: 400 }
      );
    }

    // Verify integration exists before creating session
    let integrationExists = false;
    let availableIntegrations: string[] = [];
    try {
      console.log(`🔍 [NANGO CONNECT] Verifying integration "${nangoIntegrationId}" exists...`);
      const providers = await nango.listProviders();
      
      // Extract all possible integration identifiers
      availableIntegrations = providers.providers?.map((p: any) => {
        // Check multiple possible fields
        return p.unique_key || p.provider || p.providerConfigKey || p.id || JSON.stringify(p);
      }) || [];
      
      // Check if our integration ID matches any of the available ones
      integrationExists = availableIntegrations.some((id: string) => 
        id === nangoIntegrationId || 
        id?.toLowerCase() === nangoIntegrationId.toLowerCase()
      );
      
      console.log(`🔍 [NANGO CONNECT] Available integrations:`, availableIntegrations);
      console.log(`🔍 [NANGO CONNECT] Looking for: "${nangoIntegrationId}"`);
      console.log(`🔍 [NANGO CONNECT] Integration exists: ${integrationExists}`);
      
      if (availableIntegrations.length === 0) {
        console.error(`❌ [NANGO CONNECT] No integrations found! This means:
    1. NANGO_SECRET_KEY is for wrong environment (check Nango dashboard environment)
    2. No integrations are configured in this Nango environment
    3. Secret key doesn't have permission to list integrations
    
    Action needed: Verify NANGO_SECRET_KEY in Vercel matches the environment where Outlook is configured`);
      } else if (!integrationExists && availableIntegrations.length > 0) {
        console.warn(`⚠️ [NANGO CONNECT] Integration "${nangoIntegrationId}" not found. Available: ${availableIntegrations.join(', ')}`);
      }
    } catch (verifyError: any) {
      console.warn(`⚠️ [NANGO CONNECT] Could not verify integration (non-critical):`, verifyError?.message);
      // Continue anyway - createConnectSession will fail if integration doesn't exist
    }

    // Create a connect session using Nango (correct method per Nango docs)
    let sessionToken: string;
    try {
      console.log(`📧 [NANGO CONNECT] Creating connect session for provider: ${provider} (Integration ID: ${nangoIntegrationId}), user: ${user.id}`);
      console.log(`📧 [NANGO CONNECT] Nango host: ${process.env.NANGO_HOST || 'https://api.nango.dev'}`);
      console.log(`📧 [NANGO CONNECT] Secret key prefix: ${(process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY || '').substring(0, 8)}...`);
      
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
        allowed_integrations: [nangoIntegrationId],
      });
      
      // Extract token from Nango response
      // Nango returns: { data: { token: "...", connect_link: "...", expires_at: "..." } }
      sessionToken = sessionResponse.data?.token || sessionResponse.token || sessionResponse;
      console.log(`✅ [NANGO CONNECT] Session token created:`, sessionToken ? `${String(sessionToken).substring(0, 40)}...` : 'undefined');
      console.log(`📋 [NANGO CONNECT] Full response structure:`, JSON.stringify(sessionResponse, null, 2));
    } catch (nangoError: any) {
      console.error('❌ [NANGO CONNECT] createConnectSession error:', {
        message: nangoError?.message,
        response: nangoError?.response?.data,
        status: nangoError?.response?.status,
        statusText: nangoError?.response?.statusText,
        provider,
        nangoIntegrationId,
        userId: user.id,
        host: process.env.NANGO_HOST || 'https://api.nango.dev',
        integrationExists
      });
      
      // Check if it's a provider configuration error
      const errorMessage = nangoError?.message || nangoError?.response?.data?.message || 'Unknown error';
      const errorStatus = nangoError?.response?.status || 500;
      const errorData = nangoError?.response?.data;
      
      if (errorStatus === 400 || errorMessage?.includes('provider') || errorMessage?.includes('not found') || errorMessage?.includes('integration')) {
        return NextResponse.json(
          { 
            error: `Integration "${nangoIntegrationId}" is not configured in Nango. Please check:`,
            details: [
              `1. Verify the Integration ID in your Nango dashboard matches "${nangoIntegrationId}"`,
              `2. Check that you're using the correct Nango environment (dashboard shows "prod")`,
              `3. Verify NANGO_SECRET_KEY in Vercel matches the "prod" environment secret key`,
              `4. Ensure the integration is saved in Nango dashboard (click "Save" if you see unsaved changes)`,
              `5. Check that Client ID and Client Secret are correctly entered in Nango`,
              `6. Verify scopes are configured in Nango dashboard`,
              `7. Error from Nango: ${errorMessage}`,
              errorData ? `8. Full error: ${JSON.stringify(errorData)}` : ''
            ].filter(Boolean).join('\n'),
            debug: {
              nangoIntegrationId,
              host: process.env.NANGO_HOST || 'https://api.nango.dev',
              integrationExists,
              availableIntegrations,
              errorStatus,
              errorMessage,
              errorData
            }
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
    // Use the actual Nango Integration ID for providerConfigKey
    try {
      console.log(`💾 [NANGO CONNECT] Saving connection to database...`);
      await prisma.grand_central_connections.create({
        data: {
          workspaceId,
          userId: user.id,
          provider: provider, // Keep simple provider name for filtering
          providerConfigKey: nangoIntegrationId, // Use actual Integration ID from Nango
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
      console.log(`✅ [NANGO CONNECT] Connection saved to database successfully`);
    } catch (dbError: any) {
      console.error(`❌ [NANGO CONNECT] Database error:`, {
        code: dbError?.code,
        message: dbError?.message,
        meta: dbError?.meta
      });
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
            providerConfigKey: nangoIntegrationId, // Update with actual Integration ID
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

    console.log(`📤 [NANGO CONNECT] Sending response with session token`);
    const response = NextResponse.json({ 
      sessionToken,
      provider
    });
    console.log(`✅ [NANGO CONNECT] Response sent successfully`);
    return response;
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
