import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

export const dynamic = 'force-dynamic';

/**
 * Zoho OAuth Authentication
 * 
 * Handles OAuth flow for Zoho CRM integration
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const workspaceId = searchParams.get('state'); // We use state to pass workspaceId

    if (!code || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing authorization code or workspace ID' },
        { status: 400 }
      );
    }

    console.log('🔐 [ZOHO OAUTH] Exchanging code for tokens...');

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: process['env']['ZOHO_CLIENT_ID']!,
        client_secret: process['env']['ZOHO_CLIENT_SECRET']!,
        redirect_uri: `https://action.adrata.com/api/auth/zoho`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ [ZOHO OAUTH] Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ [ZOHO OAUTH] Tokens received successfully');

    // Get organization information
    const orgResponse = await fetch('https://www.zohoapis.com/crm/v3/org', {
      headers: {
        'Authorization': `Zoho-oauthtoken ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    let organizationId = 'default';
    if (orgResponse.ok) {
      const orgData = await orgResponse.json();
      organizationId = orgData.org?.[0]?.org_id || 'default';
    }

    // Store credentials in email_accounts table
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    // Get the primary user for this workspace
    const workspaceUser = await prisma.users.findFirst({
      where: {
        activeWorkspaceId: workspaceId
      },
      select: { id: true }
    });

    if (!workspaceUser) {
      throw new Error('No user found for workspace');
    }
    
    // Check if Zoho account already exists
    const existingAccount = await prisma.email_accounts.findFirst({
      where: {
        workspaceId: workspaceId,
        platform: 'zoho'
      }
    });

    if (existingAccount) {
      // Update existing account
      await prisma.email_accounts.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: expiresAt,
          syncStatus: 'healthy',
          isActive: true,
          lastSyncAt: new Date()
        }
      });
    } else {
      // Create new account
      await prisma.email_accounts.create({
        data: {
          id: `zoho-${organizationId}-${Date.now()}`,
          workspaceId: workspaceId,
          userId: workspaceUser.id,
          platform: 'zoho',
          email: `zoho-${organizationId}@zoho.com`, // Use organization ID as email identifier
          displayName: `Zoho CRM (${organizationId})`,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: expiresAt,
          syncStatus: 'healthy',
          isActive: true,
          autoSync: true,
          syncFrequency: 15,
          updatedAt: new Date()
        }
      });
    }

    console.log('✅ [ZOHO OAUTH] Credentials saved for workspace:', workspaceId);

    // Redirect back to Grand Central with success
    const redirectUrl = `./grand-central/integrations?zoho=success&workspaceId=${workspaceId}`;
    return NextResponse.redirect(new URL(redirectUrl, 'https://action.adrata.com'));

  } catch (error) {
    console.error('❌ [ZOHO OAUTH] Error:', error);
    
    // Redirect back to Grand Central with error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const redirectUrl = `./grand-central/integrations?zoho=error&message=${encodeURIComponent(errorMessage)}`;
    return NextResponse.redirect(new URL(redirectUrl, 'https://action.adrata.com'));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, action } = await request.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'get_auth_url':
        // Generate OAuth authorization URL
        const authUrl = new URL('https://accounts.zoho.com/oauth/v2/auth');
        authUrl.searchParams.set('client_id', process['env']['ZOHO_CLIENT_ID']!);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL');
        authUrl.searchParams.set('redirect_uri', `https://action.adrata.com/api/auth/zoho`);
        authUrl.searchParams.set('state', workspaceId); // Pass workspaceId in state
        authUrl.searchParams.set('access_type', 'offline');

        return NextResponse.json({
          success: true,
          authUrl: authUrl.toString()
        });

      case 'disconnect':
        // Remove Zoho credentials from email_accounts
        await prisma.email_accounts.deleteMany({
          where: {
            workspaceId: workspaceId,
            platform: 'zoho'
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Zoho integration disconnected'
        });

      case 'get_status':
        // Get current integration status from email_accounts
        const zohoAccount = await prisma.email_accounts.findFirst({
          where: {
            workspaceId: workspaceId,
            platform: 'zoho'
          }
        });

        const zohoEnabled = !!zohoAccount && zohoAccount.isActive;
        const lastConnected = zohoAccount?.updatedAt;
        const hasCredentials = !!zohoAccount?.accessToken;

        return NextResponse.json({
          success: true,
          connected: zohoEnabled,
          lastConnected,
          hasCredentials: hasCredentials
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ [ZOHO OAUTH] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 