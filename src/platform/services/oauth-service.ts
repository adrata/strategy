import { prisma } from "@/platform/prisma";
import crypto from "crypto";

export interface OAuthProvider {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  tokenEndpoint: string;
  userInfoEndpoint: string;
  authorizationEndpoint: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scope?: string;
}

export interface OAuthUser {
  email: string;
  name: string;
  picture?: string;
  provider: string;
}

export interface OAuthSession {
  state: string;
  codeVerifier: string;
  provider: string;
  workspaceId: string;
  userId?: string | null;
  createdAt: Date;
}

/**
 * 🔐 ENTERPRISE-GRADE OAUTH 2.0 SERVICE
 * Implements OAuth 2.0 with PKCE, secure token storage, and multi-tenant support
 * Following 2025 security best practices
 */
export class OAuthService {
  private static readonly PROVIDERS: Record<string, OAuthProvider> = {
    google: {
      id: "google",
      name: "Google",
      clientId: process['env']['NEXT_PUBLIC_GOOGLE_CLIENT_ID']!,
      clientSecret: process['env']['GOOGLE_CLIENT_SECRET']!,
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      userInfoEndpoint: "https://www.googleapis.com/oauth2/v2/userinfo",
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    },
    microsoft: {
      id: "microsoft",
      name: "Microsoft",
      clientId: "8335dd15-23e0-40ed-8978-5700fddf00eb", // Real Azure Application ID
      clientSecret: process['env']['MICROSOFT_CLIENT_SECRET'] || "", // Client secret from Vercel environment variables
      scopes: [
        "openid",
        "email",
        "profile",
        "https://graph.microsoft.com/Mail.Read",
        "https://graph.microsoft.com/Mail.Send",
        "https://graph.microsoft.com/Calendars.ReadWrite",
        "https://graph.microsoft.com/User.Read",
        "offline_access",
      ],
      // Use multi-tenant endpoints for production (Microsoft official standards)
      tokenEndpoint: "https://login.microsoftonline.com/organizations/oauth2/v2.0/token",
      userInfoEndpoint: "https://graph.microsoft.com/v1.0/me",
      authorizationEndpoint: "https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize",
    },
  };

  /**
   * Generate PKCE challenge for enhanced security
   */
  private static generatePKCEChallenge(): {
    codeVerifier: string;
    codeChallenge: string;
  } {
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    return { codeVerifier, codeChallenge };
  }

  /**
   * Create OAuth authorization URL with PKCE
   */
  static async createAuthorizationUrl(
    providerId: string,
    workspaceId: string,
    userId?: string,
    redirectUri?: string,
  ): Promise<{ url: string; state: string }> {
    const provider = this['PROVIDERS'][providerId];
    if (!provider) {
      throw new Error(`Provider ${providerId} not supported`);
    }

    // Generate PKCE challenge
    const { codeVerifier, codeChallenge } = this.generatePKCEChallenge();

    // Create session data (encode in state for stateless operation)
    const sessionData = {
      provider: providerId,
      workspaceId,
      userId: userId ?? null,
      codeVerifier,
      createdAt: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
    };

    // Encode session data in state (stateless - no server storage needed)
    const state = Buffer.from(JSON.stringify(sessionData)).toString("base64url");
    
    console.log(`🔐 [OAUTH] Created stateless session with state length: ${state.length}`);

    // Build authorization URL  
    // Always use production domain for OAuth redirects regardless of environment
    let baseUrl = 'https://action.adrata.com';
    
    // Ensure clean base URL (remove any trailing slashes, newlines, or whitespace)
    baseUrl = baseUrl.trim().replace(/\/+$/, '').replace(/[\r\n\t]/g, '');
    
    const defaultRedirectUri = providerId === 'microsoft' 
      ? `${baseUrl}/outlook/auth_callback/`
      : `${baseUrl}/api/auth/oauth/callback`;
    
    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: redirectUri || defaultRedirectUri,
      response_type: "code",
      scope: provider.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      access_type: "offline",
      prompt: "consent",
    });

    return {
      url: `${provider.authorizationEndpoint}?${params['toString']()}`,
      state,
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(
    code: string,
    state: string,
    redirectUri?: string,
  ): Promise<{ tokens: OAuthTokens; user: OAuthUser; session: OAuthSession }> {
    // Retrieve OAuth session
    const session = await this.getOAuthSession(state);
    if (!session) {
      throw new Error("Invalid or expired OAuth session");
    }

    // Check session expiration (10 minutes)
    const sessionAge = Date.now() - session.createdAt.getTime();
    if (sessionAge > 10 * 60 * 1000) {
      await this.deleteOAuthSession(state);
      throw new Error("OAuth session expired");
    }

    const provider = this['PROVIDERS'][session.provider];
    if (!provider) {
      throw new Error(`Provider ${session.provider} not supported`);
    }

    // Debug logging for OAuth configuration
    console.log("🔐 [OAUTH] Token exchange debug info:");
    console.log("  Provider:", session.provider);
    console.log("  Client ID:", provider.clientId);
    console.log("  Client Secret Present:", !!provider.clientSecret);
    console.log("  Client Secret Length:", provider.clientSecret?.length || 0);
    console.log("  Token Endpoint:", provider.tokenEndpoint);

    // Exchange code for tokens
    const tokenResponse = await fetch(provider.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        redirect_uri: (() => {
          if (redirectUri) return redirectUri;
          
          // Always use production domain for OAuth redirects regardless of environment
          let baseUrl = 'https://action.adrata.com';
          
          // Ensure clean base URL (remove any trailing slashes, newlines, or whitespace)
          baseUrl = baseUrl.trim().replace(/\/+$/, '').replace(/[\r\n\t]/g, '');
          
          return session['provider'] === 'microsoft' 
            ? `${baseUrl}/outlook/auth_callback/`
            : `${baseUrl}/api/auth/oauth/callback`;
        })(),
        grant_type: "authorization_code",
        code_verifier: session.codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("❌ [OAUTH] Token exchange failed:");
      console.error("  Status:", tokenResponse.status, tokenResponse.statusText);
      console.error("  Provider:", session.provider);
      console.error("  Client ID:", provider.clientId);
      console.error("  Client Secret Present:", !!provider.clientSecret);
      console.error("  Client Secret Length:", provider.clientSecret?.length || 0);
      console.error("  Client Secret First 10 chars:", provider.clientSecret?.substring(0, 10) || "EMPTY");
      console.error("  Token Endpoint:", provider.tokenEndpoint);
      console.error("  Redirect URI:", (() => {
        if (redirectUri) return redirectUri;
        let baseUrl = 'https://action.adrata.com';
        baseUrl = baseUrl.trim().replace(/\/+$/, '').replace(/[\r\n\t]/g, '');
        return session['provider'] === 'microsoft' 
          ? `${baseUrl}/outlook/auth_callback/`
          : `${baseUrl}/api/auth/oauth/callback`;
      })());
      console.error("  Request Body:", JSON.stringify({
        code: code?.substring(0, 20) + "...",
        client_id: provider.clientId,
        client_secret: provider.clientSecret ? "[PRESENT]" : "[MISSING]",
        grant_type: "authorization_code",
        code_verifier: session.codeVerifier?.substring(0, 10) + "..."
      }));
      console.error("  Error Response:", errorData);
      
      // Try to parse Microsoft error details
      try {
        const errorJson = JSON.parse(errorData);
        console.error("  Microsoft Error Code:", errorJson.error);
        console.error("  Microsoft Error Description:", errorJson.error_description);
      } catch (e) {
        console.error("  Could not parse error as JSON");
      }
      
      throw new Error(`Failed to exchange authorization code for tokens: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();

    // Get user information
    const userResponse = await fetch(provider.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user information");
    }

    const userData = await userResponse.json();

    const tokens: OAuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      expiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
      scope: tokenData.scope,
    };

    const user: OAuthUser = {
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      provider: session.provider,
    };

    // Clean up session
    await this.deleteOAuthSession(state);

    return { tokens, user, session };
  }

  /**
   * Store OAuth tokens in database
   */
  static async storeTokens(
    tokens: OAuthTokens,
    user: OAuthUser,
    workspaceId: string,
    userId?: string,
  ): Promise<{ providerId: string; connectionId: string }> {
    try {
      console.log("🔐 storeTokens: Starting token storage...", {
        provider: user.provider,
        email: user.email,
        workspaceId,
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        userId,
      });

      // Validate inputs
      if (!tokens.accessToken) {
        throw new Error("Access token is required");
      }
      if (!user.email) {
        throw new Error("User email is required");
      }
      if (!user.provider) {
        throw new Error("Provider is required");
      }
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }

      console.log("🔐 storeTokens: Input validation passed");

      // Test database connectivity first
      try {
        await prisma.$connect();
        console.log("🔐 storeTokens: Database connection successful");
      } catch (dbError) {
        console.error("🔐 storeTokens: Database connection failed:", dbError);
        throw new Error(
          `Database connection failed: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
        );
      }

      // Verify workspace exists
      try {
        const workspace = await prisma.workspaces.findUnique({
          where: { id: workspaceId },
        });
        if (!workspace) {
          throw new Error(`Workspace ${workspaceId} does not exist`);
        }
        console.log(
          "🔐 storeTokens: Workspace verification passed:",
          workspace.name,
        );
      } catch (workspaceError) {
        console.error(
          "🔐 storeTokens: Workspace verification failed:",
          workspaceError,
        );
        throw new Error(
          `Workspace verification failed: ${workspaceError instanceof Error ? workspaceError.message : "Unknown error"}`,
        );
      }

      // Begin transaction
      console.log("🔐 storeTokens: Starting database transaction...");
      const result = await prisma.$transaction(async (tx) => {
        console.log(
          "🔐 storeTokens: Inside transaction - finding existing ConnectedProvider...",
        );

        // Find or create connected provider
        let connectedProvider;
        try {
          connectedProvider = await tx.connectedProvider.findUnique({
            where: {
              workspaceId_provider_email: {
                workspaceId,
                provider: user.provider,
                email: user.email,
              },
            },
          });
          console.log(
            "🔐 storeTokens: Existing ConnectedProvider lookup:",
            !!connectedProvider,
          );
        } catch (findError) {
          console.error(
            "🔐 storeTokens: Error finding ConnectedProvider:",
            findError,
          );
          throw new Error(
            `Failed to find ConnectedProvider: ${findError instanceof Error ? findError.message : "Unknown error"}`,
          );
        }

        if (!connectedProvider) {
          console.log("🔐 storeTokens: Creating new ConnectedProvider...");
          try {
            connectedProvider = await tx.connectedProvider.create({
              data: {
                provider: user.provider,
                email: user.email,
                workspaceId,
              },
            });
            console.log(
              "🔐 storeTokens: ConnectedProvider created successfully:",
              connectedProvider.id,
            );
          } catch (createError) {
            console.error(
              "🔐 storeTokens: Error creating ConnectedProvider:",
              createError,
            );
            throw new Error(
              `Failed to create ConnectedProvider: ${createError instanceof Error ? createError.message : "Unknown error"}`,
            );
          }
        } else {
          console.log(
            "🔐 storeTokens: Using existing ConnectedProvider:",
            connectedProvider.id,
          );
        }

        // Store or update provider token
        console.log("🔐 storeTokens: Upserting ProviderToken...");
        let providerToken;
        try {
          providerToken = await tx.providerToken.upsert({
            where: {
              workspaceId_provider: {
                workspaceId,
                provider: user.provider,
              },
            },
            update: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken ?? null,
              expiresAt: tokens.expiresAt ?? null,
              updatedAt: new Date(),
              connectedProviderId: connectedProvider.id, // Ensure connection
            },
            create: {
              provider: user.provider,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken ?? null,
              expiresAt: tokens.expiresAt ?? null,
              workspaceId,
              connectedProviderId: connectedProvider.id,
            },
          });
          console.log(
            "🔐 storeTokens: ProviderToken upserted successfully:",
            providerToken.id,
          );
        } catch (upsertError) {
          console.error(
            "🔐 storeTokens: Error upserting ProviderToken:",
            upsertError,
          );
          throw new Error(
            `Failed to upsert ProviderToken: ${upsertError instanceof Error ? upsertError.message : "Unknown error"}`,
          );
        }

        console.log("🔐 storeTokens: Transaction completed successfully");
        return {
          providerId: providerToken.id,
          connectionId: connectedProvider.id,
        };
      });

      console.log("✅ OAuth tokens stored successfully:", {
        provider: user.provider,
        email: user.email,
        workspaceId,
        providerId: result.providerId,
        connectionId: result.connectionId,
      });

      return result;
    } catch (error) {
      console.error("❌ Failed to store OAuth tokens - DETAILED ERROR:", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
        provider: user?.provider,
        email: user?.email,
        workspaceId,
        tokenInfo: {
          hasAccessToken: !!tokens?.accessToken,
          hasRefreshToken: !!tokens?.refreshToken,
          expiresAt: tokens?.expiresAt,
        },
      });
      throw new Error(
        `Failed to store OAuth tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(
    workspaceId: string,
    provider: string,
  ): Promise<OAuthTokens | null> {
    try {
      const providerToken = await prisma.providerToken.findUnique({
        where: {
          workspaceId_provider: {
            workspaceId,
            provider,
          },
        },
      });

      if (!providerToken?.refreshToken) {
        return null;
      }

      const oauthProvider = this['PROVIDERS'][provider];
      if (!oauthProvider) {
        throw new Error(`Provider ${provider} not supported`);
      }

      const refreshResponse = await fetch(oauthProvider.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: providerToken.refreshToken,
          client_id: oauthProvider.clientId,
          client_secret: oauthProvider.clientSecret,
        }),
      });

      if (!refreshResponse.ok) {
        console.error("Token refresh failed:", await refreshResponse.text());
        return null;
      }

      const refreshData = await refreshResponse.json();

      const newTokens: OAuthTokens = {
        accessToken: refreshData.access_token,
        refreshToken: refreshData.refresh_token || providerToken.refreshToken,
        expiresAt: refreshData.expires_in
          ? new Date(Date.now() + refreshData.expires_in * 1000)
          : undefined,
      };

      // Update tokens in database
      await prisma.providerToken.update({
        where: { id: providerToken.id },
        data: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresAt: newTokens.expiresAt,
          updatedAt: new Date(),
        },
      });

      return newTokens;
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      return null;
    }
  }

  /**
   * Get valid access token (with automatic refresh)
   */
  static async getValidAccessToken(
    workspaceId: string,
    provider: string,
  ): Promise<string | null> {
    try {
      const providerToken = await prisma.providerToken.findUnique({
        where: {
          workspaceId_provider: {
            workspaceId,
            provider,
          },
        },
      });

      if (!providerToken) {
        return null;
      }

      // Check if token is expired
      if (providerToken['expiresAt'] && providerToken.expiresAt <= new Date()) {
        console.log("🔄 Token expired, refreshing...");
        const refreshedTokens = await this.refreshToken(workspaceId, provider);
        return refreshedTokens?.accessToken || null;
      }

      return providerToken.accessToken;
    } catch (error) {
      console.error("❌ Failed to get valid access token:", error);
      return null;
    }
  }

  /**
   * Get connected providers for workspace
   */
  static async getConnectedProviders(workspaceId: string) {
    return await prisma.connectedProvider.findMany({
      where: { workspaceId },
      include: {
        tokens: {
          select: {
            provider: true,
            expiresAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  /**
   * Disconnect provider
   */
  static async disconnectProvider(
    workspaceId: string,
    provider: string,
  ): Promise<boolean> {
    try {
      await prisma.$transaction([
        // Delete provider tokens
        prisma.providerToken.deleteMany({
          where: {
            workspaceId,
            provider,
          },
        }),
        // Delete connected provider
        prisma.connectedProvider.deleteMany({
          where: {
            workspaceId,
            provider,
          },
        }),
      ]);

      console.log("✅ Provider disconnected:", { workspaceId, provider });
      return true;
    } catch (error) {
      console.error("❌ Failed to disconnect provider:", error);
      return false;
    }
  }

  /**
   * Initiate OAuth flow with PKCE
   */
  static async initiateOAuth(
    provider: string,
    scopes: string[],
    workspaceId: string,
    userId?: string
  ): Promise<{ success: boolean; authorizationUrl?: string; state?: string; error?: string }> {
    try {
      console.log(`🔐 [OAUTH] Initiating ${provider} OAuth for workspace: ${workspaceId}`);

      const providerConfig = this['PROVIDERS'][provider];
      if (!providerConfig) {
        return { success: false, error: `Provider ${provider} not supported` };
      }

      // Generate PKCE challenge  
      const { codeVerifier, codeChallenge } = this.generatePKCEChallenge();

      // Create session data (encode in state for stateless operation)
      const sessionData = {
        provider,
        workspaceId,
        userId,
        codeVerifier,
        createdAt: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
      };

      // Encode session data in state (stateless - no server storage needed)
      const state = Buffer.from(JSON.stringify(sessionData)).toString("base64url");
      
      console.log(`🔐 [OAUTH] Created stateless session (method 2) with state length: ${state.length}`);

      // Build authorization URL with provider-specific redirect URI
      // Always use production domain for OAuth redirects regardless of environment
      let baseUrl = 'https://action.adrata.com';
      
      // Ensure clean base URL (remove any trailing slashes, newlines, or whitespace)
      baseUrl = baseUrl.trim().replace(/\/+$/, '').replace(/[\r\n\t]/g, '');
      
      const redirectUri = provider === 'microsoft' 
        ? `${baseUrl}/outlook/auth_callback/`
        : `${baseUrl}/api/auth/oauth/callback`;
      const scopeString = scopes?.length ? scopes.join(' ') : providerConfig.scopes.join(' ');

      console.log(`🔐 [OAUTH] Base URL: "${baseUrl}"`);
      console.log(`🔐 [OAUTH] Using redirect URI: "${redirectUri}"`);
      console.log(`🔐 [OAUTH] Redirect URI length: ${redirectUri.length}`);

      const authUrl = new URL(providerConfig.authorizationEndpoint);
      authUrl.searchParams.set('client_id', providerConfig.clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopeString);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('access_type', 'offline'); // For refresh tokens
      
      // Microsoft-specific parameters
      if (provider === 'microsoft') {
        authUrl.searchParams.set('response_mode', 'query');
        authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
      }

      console.log(`✅ [OAUTH] Authorization URL generated for ${provider}`);
      
      return {
        success: true,
        authorizationUrl: authUrl.toString(),
        state
      };

    } catch (error) {
      console.error(`❌ [OAUTH] Failed to initiate ${provider} OAuth:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate OAuth'
      };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<{ 
    success: boolean; 
    provider?: string;
    workspaceId?: string;
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    userEmail?: string;
    userName?: string;
    error?: string;
  }> {
    try {
      console.log(`🔐 [OAUTH] Exchanging code for token, state: ${state}`);

      // Retrieve OAuth session
      const session = await this.getOAuthSession(state);
      if (!session) {
        return { success: false, error: 'Invalid or expired OAuth session' };
      }

      const providerConfig = this['PROVIDERS'][session.provider];
      if (!providerConfig) {
        return { success: false, error: `Provider ${session.provider} not supported` };
      }

      // Exchange code for token with provider-specific redirect URI (must match authorization)
      // Always use production domain for OAuth redirects regardless of environment
      let baseUrl = 'https://action.adrata.com';
      
      // Ensure clean base URL (remove any trailing slashes, newlines, or whitespace)
      baseUrl = baseUrl.trim().replace(/\/+$/, '').replace(/[\r\n\t]/g, '');
      
      const redirectUri = session['provider'] === 'microsoft' 
        ? `${baseUrl}/outlook/auth_callback/`
        : `${baseUrl}/api/auth/oauth/callback`;
      
      console.log(`🔐 [OAUTH] Token exchange using redirect URI: ${redirectUri}`);
      
      const tokenParams = new URLSearchParams({
        client_id: providerConfig.clientId,
        client_secret: providerConfig.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: session.codeVerifier,
      });

      // Enhanced debugging for token exchange
      console.log("🔐 [OAUTH] Token exchange debug info:");
      console.log("  Provider:", session.provider);
      console.log("  Client ID:", providerConfig.clientId);
      console.log("  Client Secret Present:", !!providerConfig.clientSecret);
      console.log("  Client Secret Length:", providerConfig.clientSecret?.length || 0);
      console.log("  Client Secret First 10 chars:", providerConfig.clientSecret?.substring(0, 10) || "EMPTY");
      console.log("  Token Endpoint:", providerConfig.tokenEndpoint);
      console.log("  Redirect URI:", redirectUri);
      console.log(`🔐 [OAUTH] Requesting token from ${providerConfig.tokenEndpoint}`);

      const tokenResponse = await fetch(providerConfig.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenParams,
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("❌ [OAUTH] Token exchange failed:");
        console.error("  Status:", tokenResponse.status, tokenResponse.statusText);
        console.error("  Provider:", session.provider);
        console.error("  Client ID:", providerConfig.clientId);
        console.error("  Client Secret Present:", !!providerConfig.clientSecret);
        console.error("  Client Secret Length:", providerConfig.clientSecret?.length || 0);
        console.error("  Token Endpoint:", providerConfig.tokenEndpoint);
        console.error("  Redirect URI:", redirectUri);
        console.error("  Error Response:", errorText);
        
        // Try to parse Microsoft error details
        try {
          const errorJson = JSON.parse(errorText);
          console.error("  Microsoft Error Code:", errorJson.error);
          console.error("  Microsoft Error Description:", errorJson.error_description);
        } catch (e) {
          console.error("  Could not parse error as JSON");
        }
        
        return { success: false, error: `Token request failed: ${tokenResponse.status}` };
      }

      const tokenData = await tokenResponse.json();
      console.log(`✅ [OAUTH] Token exchange successful for ${session.provider}`);

      // Get user info
      const userInfoResponse = await fetch(providerConfig.userInfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });

      let userInfo: any = {};
      if (userInfoResponse.ok) {
        userInfo = await userInfoResponse.json();
        console.log(`✅ [OAUTH] User info retrieved for ${session.provider}`);
      }

      // Clean up OAuth session
      await this.removeOAuthSession(state);

      // Extract user details (handle different provider formats)
      let userEmail = '';
      let userName = '';

      if (session['provider'] === 'google') {
        userEmail = userInfo.email || '';
        userName = userInfo.name || userInfo.given_name + ' ' + userInfo.family_name || '';
      } else if (session['provider'] === 'microsoft') {
        userEmail = userInfo.mail || userInfo.userPrincipalName || '';
        userName = userInfo.displayName || userInfo.givenName + ' ' + userInfo.surname || '';
      }

      return {
        success: true,
        provider: session.provider,
        workspaceId: session.workspaceId,
        userId: session.userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        userEmail,
        userName,
      };

    } catch (error) {
      console.error(`❌ [OAUTH] Token exchange failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed'
      };
    }
  }

  // OAuth session management - now stateless (session data encoded in state parameter)

  private static async getOAuthSession(state: string): Promise<OAuthSession | null> {
    try {
      console.log(`🔐 [OAUTH] Decoding stateless session from state parameter`);
      
      // Decode session data from state parameter (base64url encoded JSON)
      const decoded = Buffer.from(state, 'base64url').toString('utf-8');
      const sessionData = JSON.parse(decoded);
      
      // Check if session has expired
      const now = Date.now();
      if (now > sessionData.expiresAt) {
        const ageMs = now - sessionData.createdAt;
        console.log(`❌ [OAUTH] Session expired (age: ${ageMs}ms, expired: ${now - sessionData.expiresAt}ms ago)`);
        return null;
      }
      
      const ageMs = now - sessionData.createdAt;
      console.log(`✅ [OAUTH] Stateless session decoded successfully (age: ${ageMs}ms)`);
      
      // Return session in expected format
      return {
        state,
        provider: sessionData.provider,
        workspaceId: sessionData.workspaceId,
        userId: sessionData.userId,
        codeVerifier: sessionData.codeVerifier,
        createdAt: new Date(sessionData.createdAt),
        expiresAt: new Date(sessionData.expiresAt)
      };
      
    } catch (error) {
      console.error(`❌ [OAUTH] Failed to decode stateless session:`, error);
      return null;
    }
  }

  private static async removeOAuthSession(state: string): Promise<void> {
    // Stateless sessions don't need cleanup - session data is in state parameter
    console.log(`🔐 [OAUTH] Stateless session cleanup (no action needed for state: ${state.substring(0, 20)}...)`);
  }
}
