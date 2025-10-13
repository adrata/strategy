#!/usr/bin/env node

/**
 * Nango Webhook Configuration Script
 * 
 * This script helps configure Nango webhooks for real-time email sync.
 * It provides the webhook URL and configuration details needed.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function configureNangoWebhooks() {
  console.log('🔗 Configuring Nango Webhooks for Email Sync...\n');
  
  try {
    // Get your domain from environment or prompt
    const domain = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'your-domain.com';
    const webhookUrl = `https://${domain}/api/webhooks/nango/email`;
    
    console.log('📋 Nango Webhook Configuration:');
    console.log('=====================================');
    console.log(`Webhook URL: ${webhookUrl}`);
    console.log('Events: email.received, email.sent');
    console.log('Method: POST');
    console.log('Content-Type: application/json');
    console.log('');
    
    console.log('🔧 Configuration Steps:');
    console.log('1. Log into your Nango dashboard');
    console.log('2. Go to Integrations → Webhooks');
    console.log('3. Create a new webhook with these settings:');
    console.log(`   - URL: ${webhookUrl}`);
    console.log('   - Events: email.received, email.sent');
    console.log('   - Method: POST');
    console.log('   - Headers: Content-Type: application/json');
    console.log('');
    
    console.log('📧 Supported Providers:');
    console.log('- Microsoft Outlook (outlook)');
    console.log('- Google Gmail (gmail)');
    console.log('');
    
    // Check existing connections
    console.log('🔍 Checking existing email connections...');
    const connections = await prisma.grand_central_connections.findMany({
      where: {
        provider: { in: ['outlook', 'gmail'] },
        status: 'active'
      },
      select: {
        id: true,
        provider: true,
        nangoConnectionId: true,
        workspaceId: true,
        userId: true
      }
    });
    
    if (connections.length > 0) {
      console.log(`✅ Found ${connections.length} active email connections:`);
      connections.forEach(conn => {
        console.log(`   - ${conn.provider} (${conn.nangoConnectionId})`);
        console.log(`     Workspace: ${conn.workspaceId}`);
        console.log(`     User: ${conn.userId}`);
      });
    } else {
      console.log('⚠️ No active email connections found');
      console.log('   You need to connect Outlook or Gmail accounts first');
    }
    
    console.log('');
    console.log('🧪 Testing Webhook Endpoint...');
    
    // Test the webhook endpoint
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ Webhook endpoint is accessible');
      } else {
        console.log(`⚠️ Webhook endpoint returned status: ${response.status}`);
      }
    } catch (error) {
      console.log('⚠️ Could not test webhook endpoint (this is normal if not deployed yet)');
    }
    
    console.log('');
    console.log('📝 Webhook Payload Format:');
    console.log('The webhook will receive payloads like this:');
    console.log(JSON.stringify({
      connectionId: 'nango_connection_id',
      provider: 'outlook',
      workspaceId: 'workspace_id',
      userId: 'user_id',
      data: {
        messageId: 'email_message_id',
        subject: 'Email Subject',
        from: 'sender@example.com',
        receivedAt: '2024-01-01T00:00:00Z'
      }
    }, null, 2));
    
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Configure the webhook in Nango dashboard');
    console.log('2. Test with a real email connection');
    console.log('3. Monitor webhook logs for any issues');
    console.log('4. Set up the scheduled sync cron job');
    
    return { success: true, webhookUrl };
    
  } catch (error) {
    console.error('❌ Configuration failed:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the configuration
configureNangoWebhooks().then(result => {
  if (result.success) {
    console.log('\n✅ Nango webhook configuration completed!');
    process.exit(0);
  } else {
    console.log('\n❌ Configuration failed:', result.error);
    process.exit(1);
  }
});
