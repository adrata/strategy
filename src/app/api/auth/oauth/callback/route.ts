import { NextRequest, NextResponse } from "next/server";
import { OAuthService } from "@/platform/services/oauth-service";
import { EmailPlatformIntegrator } from "@/platform/services/email-platform-integrator";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log("🔐 [OAUTH CALLBACK] Processing OAuth callback...", { code: !!code, state, error });

    if (error) {
      console.error("❌ [OAUTH CALLBACK] OAuth error:", error);
      return NextResponse.redirect(
        new URL(`./grand-central/integrations?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      console.error("❌ [OAUTH CALLBACK] Missing code or state parameter");
      return NextResponse.redirect(
        new URL("./grand-central/integrations?error=missing_parameters", request.url)
      );
    }

    // Exchange authorization code for access token
    const tokenResult = await OAuthService.exchangeCodeForToken(code, state);

    if (!tokenResult.success) {
      console.error("❌ [OAUTH CALLBACK] Token exchange failed:", tokenResult.error);
      return NextResponse.redirect(
        new URL(`./grand-central/integrations?error=${encodeURIComponent(tokenResult.error || 'token_exchange_failed')}`, request.url)
      );
    }

    console.log(`✅ [OAUTH CALLBACK] Token exchange successful for ${tokenResult.provider}`);

    // Connect the email account to the platform
    try {
      const emailAccount = await EmailPlatformIntegrator.connectEmailAccount(
        tokenResult.workspaceId!,
        tokenResult.userId!,
        tokenResult['provider'] === 'google' ? 'gmail' : 'outlook',
        {
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken,
          email: tokenResult.userEmail,
          displayName: tokenResult.userName,
        }
      );

      console.log(`✅ [OAUTH CALLBACK] Email account connected:`, emailAccount.email);

      // Redirect to success page
      return NextResponse.redirect(
        new URL(`./grand-central/integrations?success=connected&provider=${tokenResult.provider}&email=${encodeURIComponent(emailAccount.email)}`, request.url)
      );

    } catch (connectionError) {
      console.error("❌ [OAUTH CALLBACK] Failed to connect email account:", connectionError);
      return NextResponse.redirect(
        new URL(`./grand-central/integrations?error=connection_failed`, request.url)
      );
    }

  } catch (error) {
    console.error("❌ [OAUTH CALLBACK] Unexpected error:", error);
    return NextResponse.redirect(
      new URL("./grand-central/integrations?error=callback_failed", request.url)
    );
  }
}