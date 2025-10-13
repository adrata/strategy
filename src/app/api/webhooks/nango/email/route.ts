import { NextRequest } from 'next/server';
import { UnifiedEmailSyncService } from '@/platform/services/UnifiedEmailSyncService';
import { prisma } from '@/lib/prisma';

/**
 * Nango Email Webhook Handler
 * 
 * Receives webhooks from Nango when new emails arrive for connected accounts.
 * Triggers real-time email sync to keep the system up to date.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('📧 Received Nango email webhook:', JSON.stringify(payload, null, 2));
    
    // Extract webhook data
    const { 
      connectionId, 
      provider, 
      workspaceId, 
      userId,
      data 
    } = payload;
    
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
