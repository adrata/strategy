const fetch = require('node-fetch');

async function debugWebhookSubscription() {
  console.log('🔍 Debugging Microsoft Graph webhook subscription...');
  
  try {
    // Get access token from our database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const tokenRecord = await prisma.microsoftOAuthToken.findFirst({
      where: { email: 'dano@retail-products.com' }
    });
    
    if (!tokenRecord) {
      console.log('❌ No OAuth token found for Dano');
      return;
    }
    
    console.log('✅ Found OAuth token for:', tokenRecord.email);
    console.log('🔑 Token expires:', tokenRecord.expiresAt);
    console.log('📧 Account ID:', tokenRecord.accountId);
    console.log('🔔 Subscription ID:', tokenRecord.subscriptionId);
    console.log('⏰ Subscription expires:', tokenRecord.subscriptionExpiresAt);
    
    if (!tokenRecord.subscriptionId) {
      console.log('❌ No subscription ID found - webhook not set up');
      return;
    }
    
    // Check subscription status with Microsoft Graph
    console.log('\n🌐 Checking subscription status with Microsoft Graph...');
    
    const subscriptionResponse = await fetch(`https://graph.microsoft.com/v1.0/subscriptions/${tokenRecord.subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${tokenRecord.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!subscriptionResponse.ok) {
      console.log('❌ Failed to get subscription status:', subscriptionResponse.status, subscriptionResponse.statusText);
      const errorText = await subscriptionResponse.text();
      console.log('📋 Error details:', errorText);
      
      if (subscriptionResponse.status === 401) {
        console.log('🔑 Token expired - need to refresh');
      }
      return;
    }
    
    const subscription = await subscriptionResponse.json();
    console.log('✅ Subscription found:');
    console.log('   ID:', subscription.id);
    console.log('   Resource:', subscription.resource);
    console.log('   Change Type:', subscription.changeType);
    console.log('   Notification URL:', subscription.notificationUrl);
    console.log('   Expires:', subscription.expirationDateTime);
    console.log('   Client State:', subscription.clientState);
    
    // Check if notification URL is correct
    const expectedUrl = 'https://action.adrata.com/api/webhooks/microsoft-graph';
    if (subscription.notificationUrl !== expectedUrl) {
      console.log('⚠️ Notification URL mismatch!');
      console.log('   Expected:', expectedUrl);
      console.log('   Actual:', subscription.notificationUrl);
    } else {
      console.log('✅ Notification URL is correct');
    }
    
    // Check if subscription is expired
    const now = new Date();
    const expiresAt = new Date(subscription.expirationDateTime);
    if (expiresAt < now) {
      console.log('❌ Subscription is EXPIRED!');
      console.log('   Expired:', expiresAt);
      console.log('   Current:', now);
    } else {
      console.log('✅ Subscription is active until:', expiresAt);
    }
    
    // Test our webhook endpoint
    console.log('\n🧪 Testing our webhook endpoint...');
    const webhookTest = await fetch('https://action.adrata.com/api/webhooks/microsoft-graph', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: [{
          subscriptionId: subscription.id,
          changeType: 'created',
          resource: 'me/messages/test-123',
          resourceData: {
            '@odata.type': '#Microsoft.Graph.Message',
            '@odata.id': 'Users/dano@retail-products.com/Messages/test-123'
          }
        }]
      })
    });
    
    console.log('📊 Webhook test response:', webhookTest.status, webhookTest.statusText);
    const webhookResponse = await webhookTest.text();
    console.log('📋 Response body:', webhookResponse);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error debugging webhook:', error.message);
  }
}

debugWebhookSubscription();
