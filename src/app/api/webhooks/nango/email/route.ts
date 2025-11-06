import { NextRequest } from 'next/server';
import { UnifiedEmailSyncService } from '@/platform/services/UnifiedEmailSyncService';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Simple in-memory rate limiting (in production, use Redis)
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

const webhookAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 10; // Max 10 webhooks per minute per IP

/**
 * Verify Nango webhook signature
 */
function verifyNangoSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Check rate limit for webhook requests
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = webhookAttempts.get(ip);
  
  if (!attempt || now > attempt.resetTime) {
    // Reset or create new attempt
    webhookAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (attempt.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }
  
  attempt.count++;
  return true;
}

/**
 * Nango Email Webhook Handler
 * 
 * Receives webhooks from Nango when new emails arrive for connected accounts.
 * Triggers real-time email sync to keep the system up to date.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`);
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.NANGO_WEBHOOK_SECRET;
    
    // Get payload first (needed for both signature verification and processing)
    const payload = await request.text();
    const payloadObj = JSON.parse(payload);
    
    // Verify webhook signature (if secret is configured)
    if (webhookSecret) {
      const signature = request.headers.get('x-nango-signature');
      if (!signature) {
        console.error('❌ Missing webhook signature (but NANGO_WEBHOOK_SECRET is set)');
        return Response.json({ error: 'Missing signature' }, { status: 401 });
      }
      
      if (!verifyNangoSignature(payload, signature, webhookSecret)) {
        console.error('❌ Invalid webhook signature');
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('📧 Received verified Nango webhook:', JSON.stringify(payloadObj, null, 2));
    } else {
      // TEMPORARY: Allow webhooks without signature verification if secret not configured
      console.warn('⚠️ NANGO_WEBHOOK_SECRET not configured - accepting webhook WITHOUT signature verification (NOT recommended for production)');
      console.log('📧 Received Nango webhook (unverified):', JSON.stringify(payloadObj, null, 2));
    }
    
    // Handle different webhook types
    const webhookType = payloadObj.type; // 'auth' for connection events, 'sync' for sync events, etc.
    const operation = payloadObj.operation; // 'creation', 'update', 'deletion', etc.
    
    // Step 6: Handle connection creation webhook (from diagram)
    if (webhookType === 'auth' && operation === 'creation' && payloadObj.success === true) {
      return await handleConnectionCreation(payloadObj);
    }
    
    // Handle email sync webhooks (existing functionality)
    if (webhookType === 'sync' || payloadObj.connectionId) {
      return await handleEmailSync(payloadObj);
    }
    
    // Unknown webhook type
    console.warn(`⚠️ Unknown webhook type: ${webhookType}`);
    return Response.json({ 
      success: true, 
      message: 'Webhook received but not processed',
      type: webhookType
    });
    
  } catch (error) {
    console.error('❌ Error processing email webhook:', error);
    
    return Response.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Handle connection creation webhook (Step 6 from diagram)
 * Updates pending connection with actual connectionId and sets status to active
 */
async function handleConnectionCreation(payload: any) {
  try {
    const { connectionId, providerConfigKey, endUser } = payload;
    
    if (!connectionId || !providerConfigKey) {
      console.error('❌ Missing connectionId or providerConfigKey in connection creation webhook');
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Extract user ID and workspace ID from endUser tags
    const workspaceId = endUser?.tags?.workspaceId;
    const userId = endUser?.endUserId;
    
    if (!userId) {
      console.error('❌ Missing endUserId in connection creation webhook');
      return Response.json({ error: 'Missing endUserId' }, { status: 400 });
    }
    
    console.log(`🔗 Processing connection creation webhook: ${connectionId} for user ${userId}`);
    
    // Find pending connection by matching user, workspace, and provider
    // We use providerConfigKey to find the right connection
    const pendingConnection = await prisma.grand_central_connections.findFirst({
      where: {
        userId,
        ...(workspaceId && { workspaceId }),
        providerConfigKey,
        status: 'pending'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (pendingConnection) {
      // Update with actual connectionId and set to active
      await prisma.grand_central_connections.update({
        where: { id: pendingConnection.id },
        data: {
          nangoConnectionId: connectionId,
          status: 'active',
          lastSyncAt: new Date(),
          metadata: {
            ...(pendingConnection.metadata as any || {}),
            connectedAt: new Date().toISOString(),
            connectionId,
            providerConfigKey
          }
        }
      });
      
      console.log(`✅ Connection created and activated: ${connectionId}`);
      
      // Trigger initial email sync for this connection
      try {
        await UnifiedEmailSyncService.syncWorkspaceEmails(
          pendingConnection.workspaceId,
          pendingConnection.userId
        );
        console.log(`✅ Initial email sync triggered for connection: ${connectionId}`);
      } catch (syncError) {
        console.warn(`⚠️ Failed to trigger initial email sync:`, syncError);
        // Don't fail the webhook if sync fails
      }
      
      return Response.json({ 
        success: true, 
        message: 'Connection created and activated',
        connectionId
      });
    } else {
      // Connection not found in pending state - might already be active or doesn't exist
      console.warn(`⚠️ No pending connection found for connectionId: ${connectionId}`);
      
      // Try to find by connectionId in case it was already updated
      const existingConnection = await prisma.grand_central_connections.findUnique({
        where: { nangoConnectionId: connectionId }
      });
      
      if (existingConnection) {
        console.log(`ℹ️ Connection ${connectionId} already exists and is ${existingConnection.status}`);
        return Response.json({ 
          success: true, 
          message: 'Connection already exists',
          connectionId,
          status: existingConnection.status
        });
      }
      
      // Create new connection record if not found (fallback)
      if (workspaceId) {
        await prisma.grand_central_connections.create({
          data: {
            workspaceId,
            userId,
            provider: providerConfigKey === 'outlook' ? 'outlook' : providerConfigKey,
            providerConfigKey,
            nangoConnectionId: connectionId,
            connectionName: `${providerConfigKey} Connection`,
            status: 'active',
            lastSyncAt: new Date(),
            metadata: {
              connectedAt: new Date().toISOString(),
              connectionId,
              createdViaWebhook: true
            }
          }
        });
        
        console.log(`✅ Created new connection record from webhook: ${connectionId}`);
        return Response.json({ 
          success: true, 
          message: 'Connection created from webhook',
          connectionId
        });
      }
      
      return Response.json({ 
        success: false, 
        message: 'Connection not found and cannot create without workspaceId',
        connectionId
      }, { status: 404 });
    }
  } catch (error) {
    console.error('❌ Error handling connection creation webhook:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Handle email sync webhooks (existing functionality)
 */
async function handleEmailSync(payload: any) {
  try {
    const { connectionId } = payload;
    
    if (!connectionId) {
      console.error('❌ Missing connectionId in email sync webhook');
      return Response.json({ error: 'Missing connectionId' }, { status: 400 });
    }
    
    // Get connection details from database
    const connection = await prisma.grand_central_connections.findUnique({
      where: { nangoConnectionId: connectionId }
    });
    
    if (!connection) {
      console.error(`❌ Connection not found: ${connectionId}`);
      return Response.json({ error: 'Connection not found' }, { status: 404 });
    }
    
    if (connection.status !== 'active') {
      console.log(`⏭️ Connection ${connectionId} is not active, skipping sync`);
      return Response.json({ success: true, message: 'Connection not active' });
    }
    
    // Validate provider
    if (!['outlook', 'gmail'].includes(connection.provider)) {
      console.log(`⏭️ Provider ${connection.provider} not supported for email sync`);
      return Response.json({ success: true, message: 'Provider not supported' });
    }
    
    console.log(`📧 Processing email webhook for ${connection.provider} connection: ${connectionId}`);
    
    // Trigger email sync for this specific connection
    const result = await UnifiedEmailSyncService.syncWorkspaceEmails(
      connection.workspaceId,
      connection.userId
    );
    
    console.log(`✅ Email webhook processed successfully:`, result);
    
    return Response.json({ 
      success: true, 
      message: 'Email webhook processed',
      results: result
    });
  } catch (error) {
    console.error('❌ Error handling email sync webhook:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Handle GET requests for webhook verification
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    // Nango webhook verification
    return Response.json({ challenge });
  }
  
  return Response.json({ 
    message: 'Nango Webhook Endpoint',
    status: 'active',
    supports: ['connection_creation', 'email_sync']
  });
}
