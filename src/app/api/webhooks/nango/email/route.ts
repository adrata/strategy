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
    if (!webhookSecret) {
      console.error('❌ NANGO_WEBHOOK_SECRET not configured');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify webhook signature
    const signature = request.headers.get('x-nango-signature');
    if (!signature) {
      console.error('❌ Missing webhook signature');
      return Response.json({ error: 'Missing signature' }, { status: 401 });
    }

    const payload = await request.text();
    const payloadObj = JSON.parse(payload);
    
    if (!verifyNangoSignature(payload, signature, webhookSecret)) {
      console.error('❌ Invalid webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('📧 Received verified Nango email webhook:', JSON.stringify(payloadObj, null, 2));
    
    // Extract webhook data
    const { 
      connectionId, 
      provider, 
      workspaceId, 
      userId,
      data 
    } = payloadObj;
    
    if (!connectionId) {
      console.error('❌ Missing connectionId in webhook payload');
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
    console.error('❌ Error processing email webhook:', error);
    
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
    message: 'Nango Email Webhook Endpoint',
    status: 'active'
  });
}
