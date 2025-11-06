import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/platform/services/oauth-service';
import { getUnifiedAuthUser } from '@/platform/auth/unified-auth-utils';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/oauth/connect
 * 
 * Initiates OAuth flow for connecting external services (Outlook, Gmail, etc.)
 * Creates a pending connection record and returns authorization URL
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      console.error('❌ [OAUTH CONNECT] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { provider, scopes, workspaceId } = await request.json();

    // Validate required fields
    if (!provider || !workspaceId) {
      console.error('❌ [OAUTH CONNECT] Missing required fields:', { provider, workspaceId });
      return NextResponse.json(
        { error: 'Provider and workspaceId are required' },
        { status: 400 }
      );
    }

    // Validate user has access to workspace
    const workspaceAccess = await prisma.workspace_users.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        isActive: true
      }
    });

    if (!workspaceAccess) {
      console.error('❌ [OAUTH CONNECT] User does not have access to workspace:', { userId: user.id, workspaceId });
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      );
    }

    console.log(`🔐 [OAUTH CONNECT] Initiating OAuth for provider: ${provider}, workspace: ${workspaceId}`);

    // Initiate OAuth flow via OAuthService
    const result = await OAuthService.initiateOAuth(
      provider,
      scopes || [],
      workspaceId,
      user.id
    );

    if (!result.success) {
      console.error('❌ [OAUTH CONNECT] OAuth initiation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to initiate OAuth' },
        { status: 500 }
      );
    }

    // Create pending connection record in Grand Central
    try {
      await prisma.grand_central_connections.create({
        data: {
          workspaceId,
          userId: user.id,
          provider: provider === 'microsoft' ? 'outlook' : provider === 'google' ? 'gmail' : provider,
          providerConfigKey: provider,
          nangoConnectionId: result.state || `${workspaceId}-${provider}-${Date.now()}`,
          connectionName: `${provider} Connection`,
          status: 'pending',
          metadata: {
            authUrl: result.authorizationUrl,
            scopes,
            createdAt: new Date().toISOString(),
            initiatedBy: user.id
          }
        }
      });

      console.log(`✅ [OAUTH CONNECT] Created pending connection for ${provider}`);
    } catch (dbError) {
      // If connection already exists, update it
      console.warn('⚠️ [OAUTH CONNECT] Connection record may already exist, attempting update:', dbError);
      
      try {
        await prisma.grand_central_connections.updateMany({
          where: {
            workspaceId,
            userId: user.id,
            provider: provider === 'microsoft' ? 'outlook' : provider === 'google' ? 'gmail' : provider,
            status: { in: ['pending', 'error'] }
          },
          data: {
            status: 'pending',
            metadata: {
              authUrl: result.authorizationUrl,
              scopes,
              createdAt: new Date().toISOString(),
              initiatedBy: user.id
            },
            updatedAt: new Date()
          }
        });
      } catch (updateError) {
        console.error('❌ [OAUTH CONNECT] Failed to update connection:', updateError);
        // Continue anyway - OAuth flow can still succeed
      }
    }

    console.log(`✅ [OAUTH CONNECT] OAuth flow initiated successfully for ${provider}`);
    console.log(`🔐 [OAUTH CONNECT] Authorization URL: ${result.authorizationUrl}`);

    // Return success with authorization URL
    return NextResponse.json({
      success: true,
      authorizationUrl: result.authorizationUrl,
      state: result.state,
      provider
    });

  } catch (error) {
    console.error('❌ [OAUTH CONNECT] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initiate OAuth flow',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/oauth/connect
 * 
 * Returns information about available OAuth providers
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const availableProviders = [
      {
        id: 'microsoft',
        name: 'Microsoft Outlook',
        description: 'Connect your Outlook email and calendar',
        scopes: [
          'openid',
          'email',
          'profile',
          'https://graph.microsoft.com/Mail.Read',
          'https://graph.microsoft.com/Mail.Send',
          'https://graph.microsoft.com/Calendars.ReadWrite',
          'https://graph.microsoft.com/User.Read',
          'offline_access'
        ]
      },
      {
        id: 'google',
        name: 'Google Workspace',
        description: 'Connect your Gmail and Google Calendar',
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      providers: availableProviders
    });

  } catch (error) {
    console.error('❌ [OAUTH CONNECT] Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

