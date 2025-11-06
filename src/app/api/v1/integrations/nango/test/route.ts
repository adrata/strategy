import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { Nango } from '@nangohq/node';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/integrations/nango/test
 * Diagnostic endpoint to test Nango connection and configuration
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSecretKey: !!process.env.NANGO_SECRET_KEY,
        hasSecretKeyDev: !!process.env.NANGO_SECRET_KEY_DEV,
        secretKeySource: process.env.NANGO_SECRET_KEY ? 'NANGO_SECRET_KEY' : (process.env.NANGO_SECRET_KEY_DEV ? 'NANGO_SECRET_KEY_DEV' : 'none'),
        hasOutlookIntegrationId: !!process.env.NANGO_OUTLOOK_INTEGRATION_ID,
        outlookIntegrationId: process.env.NANGO_OUTLOOK_INTEGRATION_ID || 'outlook (default)',
        host: process.env.NANGO_HOST || 'https://api.nango.dev',
      },
      tests: {}
    };

    // Test 1: Check if we can initialize Nango client
    try {
      const secretKey = process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV;
      if (!secretKey) {
        diagnostics.tests.clientInitialization = {
          success: false,
          error: 'No secret key found (NANGO_SECRET_KEY or NANGO_SECRET_KEY_DEV)'
        };
      } else {
        const nango = new Nango({
          secretKey,
          host: process.env.NANGO_HOST || 'https://api.nango.dev'
        });
        diagnostics.tests.clientInitialization = {
          success: true,
          message: 'Nango client initialized successfully'
        };

        // Test 2: Try to list providers
        try {
          const providers = await nango.listProviders();
          diagnostics.tests.listProviders = {
            success: true,
            providerCount: providers.providers?.length || 0,
            providers: providers.providers?.map((p: any) => ({
              id: p.unique_key || p.provider || p.id,
              name: p.name || p.provider
            })) || []
          };

          // Test 3: Check if Outlook integration exists
          const outlookIntegrationId = process.env.NANGO_OUTLOOK_INTEGRATION_ID || 'outlook';
          const availableIds = providers.providers?.map((p: any) => 
            p.unique_key || p.provider || p.id
          ) || [];
          
          const outlookExists = availableIds.some((id: string) => 
            id === outlookIntegrationId || 
            id?.toLowerCase() === outlookIntegrationId.toLowerCase()
          );

          diagnostics.tests.outlookIntegration = {
            success: outlookExists,
            lookingFor: outlookIntegrationId,
            found: outlookExists,
            availableIds,
            message: outlookExists 
              ? `Outlook integration "${outlookIntegrationId}" found` 
              : `Outlook integration "${outlookIntegrationId}" not found. Available: ${availableIds.join(', ')}`
          };

        } catch (listError: any) {
          diagnostics.tests.listProviders = {
            success: false,
            error: listError?.message || 'Unknown error',
            status: listError?.response?.status,
            data: listError?.response?.data
          };
        }
      }
    } catch (initError: any) {
      diagnostics.tests.clientInitialization = {
        success: false,
        error: initError?.message || 'Unknown error'
      };
    }

    // Overall status
    const allTestsPassed = Object.values(diagnostics.tests).every((test: any) => test.success);
    diagnostics.overallStatus = allTestsPassed ? 'healthy' : 'issues_found';

    return NextResponse.json(diagnostics, { 
      status: allTestsPassed ? 200 : 500 
    });
  } catch (error) {
    console.error('❌ [NANGO TEST] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run diagnostics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

