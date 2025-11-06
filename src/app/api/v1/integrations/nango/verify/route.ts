import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { Nango } from '@nangohq/node';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/integrations/nango/verify
 * Diagnostic endpoint to verify Nango configuration and integration availability
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId') || 'outlook';

    // Get Nango client
    const secretKey = process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY;
    const host = process.env.NANGO_HOST || 'https://api.nango.dev';

    if (!secretKey) {
      return NextResponse.json({
        error: 'NANGO_SECRET_KEY not configured',
        configured: false
      }, { status: 500 });
    }

    const nango = new Nango({
      secretKey,
      host
    });

    // Get all available integrations
    let providers: any = null;
    let providersError: string | null = null;
    
    try {
      providers = await nango.listProviders();
    } catch (error) {
      providersError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Extract integration IDs
    const availableIntegrations = providers?.providers?.map((p: any) => ({
      unique_key: p.unique_key,
      provider: p.provider,
      providerConfigKey: p.providerConfigKey,
      id: p.id,
      name: p.name,
      // Full object for debugging
      full: p
    })) || [];

    // Check if the requested integration exists
    const integrationExists = availableIntegrations.some((p: any) => 
      p.unique_key === integrationId || 
      p.provider === integrationId ||
      p.providerConfigKey === integrationId ||
      p.id === integrationId
    );

    // Try to get specific integration details
    let integrationDetails: any = null;
    try {
      // Note: Nango SDK might not have a direct "get integration" method
      // But we can try to create a test session to see if it fails
      const testSession = await nango.createConnectSession({
        end_user: {
          id: 'test-verification',
          email: 'test@example.com'
        },
        allowed_integrations: [integrationId]
      });
      integrationDetails = {
        canCreateSession: true,
        sessionToken: testSession.token ? 'received' : 'missing'
      };
    } catch (testError: any) {
      integrationDetails = {
        canCreateSession: false,
        error: testError?.message || 'Unknown error',
        status: testError?.response?.status,
        data: testError?.response?.data
      };
    }

    return NextResponse.json({
      configured: true,
      host,
      secretKeyPrefix: secretKey.substring(0, 8) + '...',
      requestedIntegrationId: integrationId,
      integrationExists,
      integrationDetails,
      availableIntegrations,
      providersError,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error verifying Nango integration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify Nango integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

