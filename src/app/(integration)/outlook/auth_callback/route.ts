import { NextRequest, NextResponse } from "next/server";
import { OAuthService } from "@/platform/services/oauth-service";
import { EmailPlatformIntegrator } from "@/platform/services/email-platform-integrator";

export const dynamic = "force-dynamic";

/**
 * Microsoft Outlook OAuth Callback Handler
 * 
 * This endpoint matches the redirect URL configured in Azure:
 * https://action.adrata.com/outlook/auth_callback/
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log("🔐 [OUTLOOK CALLBACK] Processing Microsoft OAuth callback...", { code: !!code, state, error });
    
    // Temporary debugging: Check environment variable
    const clientSecret = process['env']['MICROSOFT_CLIENT_SECRET'];
    console.log("🔑 [OUTLOOK CALLBACK] Client secret check:", {
      present: !!clientSecret,
      length: clientSecret?.length || 0,
      firstChars: clientSecret?.substring(0, 10) || 'MISSING'
    });

    if (error) {
      console.error("❌ [OUTLOOK CALLBACK] OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/grand-central/integrations?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      console.error("❌ [OUTLOOK CALLBACK] Missing required parameters:", { code: !!code, state: !!state });
      return NextResponse.redirect(
        new URL(`/grand-central/integrations?error=missing_parameters`, request.url)
      );
    }

    // Exchange authorization code for access token
    const tokenResult = await OAuthService.exchangeCodeForToken(code, state);

    if (!tokenResult.success) {
      console.error("❌ [OUTLOOK CALLBACK] Token exchange failed:", tokenResult.error);
      
      // Include detailed error in redirect for debugging
      const detailedError = encodeURIComponent(tokenResult.error || 'unknown_error');
      return NextResponse.redirect(
        new URL(`/grand-central/integrations?error=token_exchange_failed&details=${detailedError}`, request.url)
      );
    }

    console.log(`✅ [OUTLOOK CALLBACK] Token exchange successful for Microsoft Outlook`);

    // Connect the Outlook account to the platform
    try {
      const emailAccount = await EmailPlatformIntegrator.connectEmailAccount(
        tokenResult.workspaceId!,
        tokenResult.userId!,
        'outlook',
        {
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken,
          email: tokenResult.userEmail,
          displayName: tokenResult.userName,
        }
      );

      console.log(`✅ [OUTLOOK CALLBACK] Outlook account connected:`, emailAccount.email);

      // Also store the OAuth tokens for the connection
      try {
        const storeResult = await OAuthService.storeTokens(
          {
            accessToken: tokenResult.accessToken!,
            refreshToken: tokenResult.refreshToken!,
            expiresAt: new Date(Date.now() + 3600 * 1000) // Default for Microsoft tokens (1 hour)
            // tokenType removed - not in OAuthTokens schema
          },
          {
            provider: 'microsoft',
            email: tokenResult.userEmail!,
            name: tokenResult.userName!
            // id removed - not in OAuthUser schema
          },
          tokenResult.workspaceId!,
          tokenResult.userId
        );
        console.log(`✅ [OUTLOOK CALLBACK] OAuth tokens stored:`, storeResult);
      } catch (tokenError) {
        console.warn(`⚠️ [OUTLOOK CALLBACK] Failed to store OAuth tokens:`, tokenError);
        // Don't fail the whole flow if token storage fails
      }

      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/grand-central/integrations?success=connected&provider=microsoft&email=${encodeURIComponent(emailAccount.email)}`, request.url)
      );

    } catch (connectionError) {
      console.error("❌ [OUTLOOK CALLBACK] Failed to connect Outlook account:", connectionError);
      
      // Include detailed error in redirect for debugging
      const errorMessage = connectionError instanceof Error ? connectionError.message : 'Unknown connection error';
      const detailedError = encodeURIComponent(errorMessage);
      
      return NextResponse.redirect(
        new URL(`/grand-central/integrations?error=connection_failed&details=${detailedError}`, request.url)
      );
    }

  } catch (error) {
    console.error("❌ [OUTLOOK CALLBACK] Unexpected error:", error);
    return NextResponse.redirect(
      new URL(`/grand-central/integrations?error=unexpected_error`, request.url)
    );
  }
}