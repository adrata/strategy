import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * Get Provider Token Status
 * Returns the status of all connected providers for a workspace
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [PROVIDER STATUS] Checking provider status for workspace: ${workspaceId}`);

    // Get all provider tokens for the workspace
    // const providerTokens = await prisma.providerToken.findMany({
    //   where: { workspaceId },
    //   include: { connectedProvider: true }
    // }); // Model not found

    const providerStatus: Record<string, any> = {};

    // for (const token of providerTokens) { // Commented out due to missing model
    //   const isExpired = token['expiresAt'] && new Date(token.expiresAt) < new Date();
      
    //   providerStatus[token.provider] = {
    //     connected: true,
    //     expired: isExpired,
    //     email: token.connectedProvider?.email,
    //     lastUpdated: token.updatedAt,
    //     expiresAt: token.expiresAt,
    //     error: null
    //   };

    //   // Test token validity for critical providers
    //   if (token['provider'] === 'microsoft' && !isExpired) {
    //     try {
    //       const testResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
    //         headers: {
    //           'Authorization': `Bearer ${token.accessToken}`,
    //           'Content-Type': 'application/json'
    //         }
    //       });
    //       
    //       if (!testResponse.ok) {
    //         providerStatus[token.provider].expired = true;
    //         providerStatus[token.provider].error = 'Token validation failed';
    //       }
    //     } catch (error) {
    //       providerStatus[token.provider].error = 'Token test failed';
    //     }
    //   }
    // }

    // Check environment-based integrations
    const envIntegrations = {
      coresignal: !!process['env']['CORESIGNAL_API_KEY'],
      twilio: !!(process['env']['TWILIO_ACCOUNT_SID'] && process['env']['TWILIO_AUTH_TOKEN']),
      resend: !!process['env']['RESEND_API_KEY'],
      pusher: !!(process['env']['PUSHER_APP_ID'] && process['env']['PUSHER_KEY'] && process['env']['PUSHER_SECRET']),
      microsoft_secret: !!process['env']['MICROSOFT_CLIENT_SECRET'],
      google: !!(process['env']['GOOGLE_CLIENT_ID'] && process['env']['GOOGLE_CLIENT_SECRET'])
    };

    return NextResponse.json({
      success: true,
      workspaceId,
      providers: providerStatus,
      environment: envIntegrations,
      summary: {
        totalProviders: 0, // providerTokens.length, // Commented out due to missing model
        connectedProviders: Object.keys(providerStatus).length,
        expiredProviders: Object.values(providerStatus).filter((p: any) => p.expired).length,
        environmentIntegrations: Object.values(envIntegrations).filter(Boolean).length
      }
    });

  } catch (error) {
    console.error('❌ [PROVIDER STATUS] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check provider status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }}
