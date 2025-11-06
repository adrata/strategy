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
 * 
 * Nango uses: SHA256(secretKey + payload)
 * NOT HMAC - just concatenation then hash
 */
function verifyNangoSignature(payload: string, signature: string, secretKey: string): boolean {
  try {
    // Nango's signature: SHA256(secretKey + payload)
    const combined = secretKey + payload;
    const expectedSignature = crypto
      .createHash('sha256')
      .update(combined)
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

    // Get secret key for webhook verification (uses same key as API)
    const secretKey = process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV;
    
    // Get payload first (needed for both signature verification and processing)
    const payload = await request.text();
    const payloadObj = JSON.parse(payload);
    
    // Verify webhook signature (if secret key is configured)
    if (secretKey) {
      const signature = request.headers.get('x-nango-signature');
      if (!signature) {
        console.error('❌ Missing webhook signature in x-nango-signature header');
        return Response.json({ error: 'Missing signature' }, { status: 401 });
      }
      
      if (!verifyNangoSignature(payload, signature, secretKey)) {
        console.error('❌ Invalid webhook signature - signature verification failed');
        console.error('   Received signature:', signature);
        console.error('   Using secret key prefix:', secretKey.substring(0, 12));
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('✅ Webhook signature verified successfully');
      console.log('📧 Received verified Nango webhook:', JSON.stringify(payloadObj, null, 2));
    } else {
      // TEMPORARY: Allow webhooks without signature verification if secret not configured
      console.warn('⚠️ NANGO_SECRET_KEY not configured - accepting webhook WITHOUT signature verification (NOT recommended for production)');
      console.log('📧 Received Nango webhook (unverified):', JSON.stringify(payloadObj, null, 2));
    }
    
    // Handle different webhook types
    const webhookType = payloadObj.type; // 'auth' for connection events, 'sync' for sync events, 'forward' for external webhooks
    const operation = payloadObj.operation; // 'creation', 'update', 'deletion', 'refresh', etc.
    
    // Handle connection creation webhook (Step 6 from Nango flow)
    if (webhookType === 'auth' && operation === 'creation' && payloadObj.success === true) {
      return await handleConnectionCreation(payloadObj);
    }
    
    // Handle connection refresh failures (token refresh errors)
    if (webhookType === 'auth' && operation === 'refresh' && payloadObj.success === false) {
      console.warn(`⚠️ Token refresh failed for connection: ${payloadObj.connectionId}`);
      // Log the error but don't fail the webhook
      return Response.json({ 
        success: true, 
        message: 'Token refresh failure logged',
        connectionId: payloadObj.connectionId
      });
    }
    
    // Handle Nango sync webhooks (when sync execution finishes)
    // These are sent when Nango syncs complete, whether successful or not
    if (webhookType === 'sync') {
      return await handleSyncWebhook(payloadObj);
    }
    
    // Handle external webhook forwarding (e.g., from Microsoft Graph change notifications)
    if (webhookType === 'forward' && payloadObj.from) {
      return await handleExternalWebhook(payloadObj);
    }
    
    // Handle generic email sync webhooks (legacy support)
    if (payloadObj.connectionId && !webhookType) {
      console.log('📧 Received legacy email sync webhook (no type specified)');
      return await handleEmailSync(payloadObj);
    }
    
    // Unknown webhook type - log but don't fail
    console.warn(`⚠️ Unknown webhook type: ${webhookType}, operation: ${operation}`);
    console.log('📧 Full webhook payload:', JSON.stringify(payloadObj, null, 2));
    return Response.json({ 
      success: true, 
      message: 'Webhook received but not processed',
      type: webhookType,
      operation: operation
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
 * Handle Nango sync webhooks (type: "sync")
 * These are sent when a Nango sync execution finishes
 */
async function handleSyncWebhook(payload: any) {
  try {
    const { connectionId, providerConfigKey, syncName, model, syncType, success, modifiedAfter, responseResults, error } = payload;
    
    if (!connectionId) {
      console.error('❌ Missing connectionId in sync webhook');
      return Response.json({ error: 'Missing connectionId' }, { status: 400 });
    }
    
    console.log(`📧 Processing Nango sync webhook:`, {
      connectionId,
      syncName,
      model,
      syncType,
      success,
      modifiedAfter,
      responseResults
    });
    
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
    
    // Only process email-related syncs
    if (syncName && !syncName.toLowerCase().includes('email')) {
      console.log(`⏭️ Sync ${syncName} is not email-related, skipping`);
      return Response.json({ success: true, message: 'Not an email sync' });
    }
    
    // If sync failed, log the error but don't trigger another sync
    if (!success) {
      console.error(`❌ Sync failed for connection ${connectionId}:`, error);
      return Response.json({ 
        success: true, 
        message: 'Sync failure logged',
        error: error
      });
    }
    
    // If sync succeeded, trigger our custom email sync to process the new data
    console.log(`✅ Sync completed successfully, triggering email sync for connection: ${connectionId}`);
    
    const result = await UnifiedEmailSyncService.syncWorkspaceEmails(
      connection.workspaceId,
      connection.userId
    );
    
    // Store the modifiedAfter timestamp as a bookmark for future syncs
    if (modifiedAfter) {
      await prisma.grand_central_connections.update({
        where: { id: connection.id },
        data: {
          lastSyncAt: new Date(modifiedAfter),
          metadata: {
            ...(connection.metadata as any || {}),
            lastSyncBookmark: modifiedAfter,
            lastSyncType: syncType,
            lastSyncResults: responseResults
          }
        }
      });
    }
    
    console.log(`✅ Email sync triggered successfully from Nango sync webhook`);
    
    return Response.json({ 
      success: true, 
      message: 'Sync webhook processed and email sync triggered',
      syncName,
      syncType,
      responseResults,
      results: result
    });
  } catch (error) {
    console.error('❌ Error handling sync webhook:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Handle external webhook forwarding (e.g., Microsoft Graph change notifications)
 * These are forwarded by Nango when external APIs send webhooks
 */
async function handleExternalWebhook(payload: any) {
  try {
    const { connectionId, providerConfigKey, from, payload: externalPayload } = payload;
    
    console.log(`📧 Processing external webhook from ${from} for connection: ${connectionId}`);
    
    // Get connection details
    const connection = await prisma.grand_central_connections.findUnique({
      where: { nangoConnectionId: connectionId }
    });
    
    if (!connection || connection.status !== 'active') {
      console.log(`⏭️ Connection ${connectionId} not found or not active`);
      return Response.json({ success: true, message: 'Connection not active' });
    }
    
    // For Microsoft Graph change notifications, trigger email sync
    if (from === 'microsoft' || from === 'outlook' || providerConfigKey === 'outlook') {
      console.log(`📧 Microsoft Graph change notification received, triggering email sync`);
      
      const result = await UnifiedEmailSyncService.syncWorkspaceEmails(
        connection.workspaceId,
        connection.userId
      );
      
      return Response.json({ 
        success: true, 
        message: 'External webhook processed and email sync triggered',
        from,
        results: result
      });
    }
    
    // For Gmail push notifications
    if (from === 'google' || from === 'gmail' || providerConfigKey === 'gmail') {
      console.log(`📧 Gmail push notification received, triggering email sync`);
      
      const result = await UnifiedEmailSyncService.syncWorkspaceEmails(
        connection.workspaceId,
        connection.userId
      );
      
      return Response.json({ 
        success: true, 
        message: 'External webhook processed and email sync triggered',
        from,
        results: result
      });
    }
    
    console.log(`⏭️ External webhook from ${from} not processed (unknown provider)`);
    return Response.json({ 
      success: true, 
      message: 'Webhook received but provider not supported',
      from
    });
  } catch (error) {
    console.error('❌ Error handling external webhook:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Handle email sync webhooks (legacy support)
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
    supports: [
      'connection_creation', 
      'connection_refresh',
      'sync_completion',
      'external_webhook_forwarding',
      'email_sync'
    ],
    webhookTypes: ['auth', 'sync', 'forward']
  });
}
