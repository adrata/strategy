import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/lib/prisma';
import { Nango } from '@nangohq/node';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/integrations/nango/test-sync
 * Test Nango connection and email fetch without storing
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user || !user.activeWorkspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = user.activeWorkspaceId;

    // Find active Outlook connection
    const connection = await prisma.grand_central_connections.findFirst({
      where: {
        workspaceId,
        provider: 'outlook',
        status: 'active'
      }
    });

    if (!connection) {
      return NextResponse.json({
        success: false,
        error: 'No active Outlook connection found',
        workspaceId,
        userId: user.id
      });
    }

    // Initialize Nango
    const secretKey = process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV;
    if (!secretKey) {
      return NextResponse.json({
        success: false,
        error: 'NANGO_SECRET_KEY not configured'
      });
    }

    const nango = new Nango({
      secretKey,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    // Test 1: Simple endpoint test
    let test1Result;
    try {
      const test1 = await nango.proxy({
        providerConfigKey: connection.providerConfigKey,
        connectionId: connection.nangoConnectionId,
        endpoint: '/v1.0/me',
        method: 'GET'
      });
      test1Result = { success: true, data: test1.data };
    } catch (error) {
      test1Result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 2: Get messages without filter
    let test2Result;
    try {
      const test2 = await nango.proxy({
        providerConfigKey: connection.providerConfigKey,
        connectionId: connection.nangoConnectionId,
        endpoint: '/v1.0/me/mailFolders/inbox/messages?$top=5',
        method: 'GET'
      });
      test2Result = {
        success: true,
        hasValue: 'value' in (test2.data || {}),
        hasMessages: 'messages' in (test2.data || {}),
        dataKeys: Object.keys(test2.data || {}),
        emailCount: Array.isArray(test2.data?.value) ? test2.data.value.length : 0,
        sampleEmail: test2.data?.value?.[0] || null
      };
    } catch (error) {
      test2Result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    // Test 3: Get messages with filter
    let test3Result;
    try {
      const filterDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const filter = `receivedDateTime ge ${filterDate}`;
      const test3 = await nango.proxy({
        providerConfigKey: connection.providerConfigKey,
        connectionId: connection.nangoConnectionId,
        endpoint: `/v1.0/me/mailFolders/inbox/messages?$top=10&$filter=${encodeURIComponent(filter)}&$orderby=receivedDateTime desc`,
        method: 'GET'
      });
      test3Result = {
        success: true,
        hasValue: 'value' in (test3.data || {}),
        emailCount: Array.isArray(test3.data?.value) ? test3.data.value.length : 0,
        sampleEmail: test3.data?.value?.[0] || null
      };
    } catch (error) {
      test3Result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        provider: connection.provider,
        providerConfigKey: connection.providerConfigKey,
        nangoConnectionId: connection.nangoConnectionId,
        status: connection.status
      },
      tests: {
        test1_userProfile: test1Result,
        test2_messagesNoFilter: test2Result,
        test3_messagesWithFilter: test3Result
      },
      nangoConfig: {
        host: process.env.NANGO_HOST || 'https://api.nango.dev',
        hasSecretKey: !!secretKey
      }
    });
  } catch (error) {
    console.error('❌ [TEST SYNC] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

