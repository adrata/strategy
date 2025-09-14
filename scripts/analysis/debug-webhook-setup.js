#!/usr/bin/env node

/**
 * Debug Webhook Setup
 * 
 * This script attempts to set up the Microsoft Graph webhook directly
 * and shows detailed error information
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch').default || require('node-fetch');
const prisma = new PrismaClient();

const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function debugWebhookSetup() {
  console.log('🔍 Debugging Microsoft Graph webhook setup...\n');
  
  try {
    // Get current token
    const currentToken = await prisma.providerToken.findUnique({
      where: {
        workspaceId_provider: {
          workspaceId: DANO_WORKSPACE_ID,
          provider: 'microsoft'
        }
      },
      include: {
        connectedProvider: true
      }
    });

    if (!currentToken) {
      console.log('❌ No Microsoft token found');
      return;
    }

    console.log(`🔑 Using token for: ${currentToken.connectedProvider?.email}`);

    // Test token first
    console.log('🧪 Testing token validity...');
    const testResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${currentToken.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!testResponse.ok) {
      console.log(`❌ Token is invalid: ${testResponse.status}`);
      return;
    }

    const user = await testResponse.json();
    console.log(`✅ Token valid for: ${user.mail || user.userPrincipalName}`);

    // Get email account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        email: currentToken.connectedProvider?.email
      }
    });

    if (!emailAccount) {
      console.log('❌ No email account found');
      return;
    }

    console.log(`📧 Email Account ID: ${emailAccount.id}`);

    // Check existing subscriptions first
    console.log('\n🔍 Checking existing webhook subscriptions...');
    const existingSubsResponse = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      headers: {
        'Authorization': `Bearer ${currentToken.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (existingSubsResponse.ok) {
      const existingSubs = await existingSubsResponse.json();
      console.log(`📋 Found ${existingSubs.value?.length || 0} existing subscriptions:`);
      
      if (existingSubs.value && existingSubs.value.length > 0) {
        existingSubs.value.forEach((sub, index) => {
          console.log(`  ${index + 1}. ID: ${sub.id}`);
          console.log(`     Resource: ${sub.resource}`);
          console.log(`     Notification URL: ${sub.notificationUrl}`);
          console.log(`     Expires: ${sub.expirationDateTime}`);
          console.log(`     Status: ${new Date(sub.expirationDateTime) > new Date() ? 'Active' : 'Expired'}`);
          console.log('');
        });
      }
    }

    // Try to create new webhook subscription
    console.log('🔔 Attempting to create new webhook subscription...');
    
    const webhookSubscription = {
      changeType: 'created',
      notificationUrl: 'https://action.adrata.com/api/webhooks/microsoft-graph',
      resource: 'me/messages',
      expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      clientState: `${emailAccount.id}_${Date.now()}`
    };

    console.log('📋 Webhook subscription payload:');
    console.log(JSON.stringify(webhookSubscription, null, 2));

    const webhookResponse = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookSubscription)
    });

    console.log(`\n📊 Webhook Response Status: ${webhookResponse.status} ${webhookResponse.statusText}`);

    const responseText = await webhookResponse.text();
    console.log('📋 Response Body:');
    console.log(responseText);

    if (webhookResponse.ok) {
      const webhookData = JSON.parse(responseText);
      console.log('\n✅ Webhook created successfully!');
      console.log(`🆔 Subscription ID: ${webhookData.id}`);
      console.log(`⏰ Expires: ${webhookData.expirationDateTime}`);
      
      // Test the webhook endpoint
      console.log('\n🧪 Testing webhook endpoint...');
      const testWebhookResponse = await fetch('https://action.adrata.com/api/webhooks/microsoft-graph', {
        method: 'GET'
      });
      console.log(`🌐 Webhook endpoint status: ${testWebhookResponse.status}`);
      
      if (testWebhookResponse.ok) {
        const webhookTestText = await testWebhookResponse.text();
        console.log('📋 Webhook endpoint response:', webhookTestText);
      }

    } else {
      console.log('\n❌ Webhook creation failed');
      
      try {
        const errorData = JSON.parse(responseText);
        console.log('🔍 Error details:');
        console.log(`   Code: ${errorData.error?.code}`);
        console.log(`   Message: ${errorData.error?.message}`);
        console.log(`   Details: ${errorData.error?.innerError?.message || 'None'}`);
      } catch (parseError) {
        console.log('🔍 Could not parse error response as JSON');
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  debugWebhookSetup();
}

module.exports = { debugWebhookSetup };
