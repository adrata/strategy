import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * POST /api/v1/integrations/api-key/connect
 * Connect an integration using API key authentication
 * Supports: Fireflies.ai, Otter.ai
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, apiKey, workspaceId } = body;

    if (!provider || !apiKey || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, apiKey, workspaceId' },
        { status: 400 }
      );
    }

    // Validate provider
    const supportedProviders = ['fireflies', 'otter'];
    if (!supportedProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}. Supported: ${supportedProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Encrypt API key for secure storage
    const encryptApiKey = (key: string): string => {
      const algorithm = 'aes-256-cbc';
      const encryptionKey = process.env.API_KEY_ENCRYPTION_SECRET || 'default-secret-key-change-in-production';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32)), iv);
      let encrypted = cipher.update(key, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    };

    // Test API key validity
    let testResult: { valid: boolean; error?: string; userInfo?: any } = { valid: false };
    
    try {
      if (provider === 'fireflies') {
        // Test Fireflies API key
        const response = await fetch('https://api.fireflies.ai/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            query: '{ user { user_id email } }'
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data?.user) {
            testResult = { valid: true, userInfo: data.data.user };
          } else {
            testResult = { valid: false, error: 'Invalid API key' };
          }
        } else {
          testResult = { valid: false, error: `API test failed: ${response.statusText}` };
        }
      } else if (provider === 'otter') {
        // Test Otter API key
        const response = await fetch('https://otter.ai/forward/api/v1/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          testResult = { valid: true, userInfo: data };
        } else {
          testResult = { valid: false, error: `API test failed: ${response.statusText}` };
        }
      }
    } catch (error) {
      console.error(`Error testing ${provider} API key:`, error);
      testResult = { 
        valid: false, 
        error: error instanceof Error ? error.message : 'API test failed' 
      };
    }

    if (!testResult.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid API key',
          details: testResult.error || 'The API key could not be validated. Please check and try again.'
        },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const encryptedKey = encryptApiKey(apiKey);

    // Check if connection already exists
    const existingConnection = await prisma.grand_central_connections.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        provider,
        status: 'active'
      }
    });

    if (existingConnection) {
      // Update existing connection
      await prisma.grand_central_connections.update({
        where: { id: existingConnection.id },
        data: {
          metadata: {
            apiKey: encryptedKey,
            userInfo: testResult.userInfo,
            lastValidated: new Date().toISOString()
          },
          status: 'active',
          lastSyncAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: `${provider} connection updated successfully`,
        connectionId: existingConnection.id
      });
    } else {
      // Create new connection
      const connection = await prisma.grand_central_connections.create({
        data: {
          workspaceId,
          userId: session.user.id,
          provider,
          providerConfigKey: provider,
          nangoConnectionId: `${provider}-${workspaceId}-${Date.now()}`,
          connectionName: `${provider} API Key`,
          metadata: {
            apiKey: encryptedKey,
            userInfo: testResult.userInfo,
            lastValidated: new Date().toISOString()
          },
          status: 'active',
          lastSyncAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: `${provider} connected successfully`,
        connectionId: connection.id
      });
    }

  } catch (error) {
    console.error('Error connecting API key integration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

