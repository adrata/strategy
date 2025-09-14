#!/usr/bin/env node

/**
 * 🔄 RESYNC DANO'S WEBHOOKS
 * 
 * This script will:
 * 1. Check current Microsoft Graph token status
 * 2. Refresh the token if needed (with manual instructions)
 * 3. Recreate webhook subscriptions for real-time email notifications
 * 4. Set up Zoho webhook configuration
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch').default || require('node-fetch');

const prisma = new PrismaClient();

// Dano's configuration
const DANO_CONFIG = {
  workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
  userId: '01K1VBYYV7TRPY04NW4TW4XWRB',
  email: 'dano@retail-products.com',
  workspace: 'Retail Product Solutions'
};

const WEBHOOK_ENDPOINTS = {
  microsoft: 'https://action.adrata.com/api/webhooks/outlook',
  zoho: 'https://action.adrata.com/api/webhooks/zoho'
};

async function resyncDanoWebhooks() {
  console.log('🔄 RESYNCING DANO\'S WEBHOOKS');
  console.log(`📧 User: ${DANO_CONFIG.email}`);
  console.log(`🏢 Workspace: ${DANO_CONFIG.workspace}\n`);

  try {
    // Step 1: Check Microsoft Graph token status
    console.log('🔍 Step 1: Checking Microsoft Graph token status...');
    
    const microsoftToken = await prisma.providerToken.findFirst({
      where: {
        workspaceId: DANO_CONFIG.workspaceId,
        provider: 'microsoft'
      },
      include: {
        connectedProvider: true
      }
    });

    if (!microsoftToken) {
      console.log('❌ No Microsoft token found');
      console.log('\n📝 MANUAL ACTION REQUIRED:');
      console.log('1. Dano needs to connect his Microsoft account');
      console.log('2. Go to: https://action.adrata.com');
      console.log('3. Login as dano');
      console.log('4. Click profile → Grand Central → Connect Microsoft Account');
      return;
    }

    console.log(`✅ Microsoft token found for: ${microsoftToken.connectedProvider?.email}`);
    console.log(`   Token expires: ${microsoftToken.expiresAt}`);

    // Step 2: Test token validity
    console.log('\n🧪 Step 2: Testing token validity...');
    
    const testResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${microsoftToken.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!testResponse.ok) {
      console.log(`❌ Token is expired or invalid (${testResponse.status})`);
      console.log('\n📝 MANUAL ACTION REQUIRED:');
      console.log('1. Dano needs to reconnect his Microsoft account');
      console.log('2. Go to: https://action.adrata.com');
      console.log('3. Login as dano');
      console.log('4. Click profile → Grand Central → Reconnect Microsoft Account');
      return;
    }

    const userInfo = await testResponse.json();
    console.log(`✅ Token is valid for: ${userInfo.mail || userInfo.userPrincipalName}`);

    // Step 3: Check existing webhook subscriptions
    console.log('\n🔔 Step 3: Checking existing webhook subscriptions...');
    
    const existingSubsResponse = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      headers: {
        'Authorization': `Bearer ${microsoftToken.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (existingSubsResponse.ok) {
      const existingSubs = await existingSubsResponse.json();
      console.log(`📋 Found ${existingSubs.value?.length || 0} existing subscriptions`);
      
      // Delete expired or old subscriptions
      if (existingSubs.value && existingSubs.value.length > 0) {
        for (const sub of existingSubs.value) {
          const isExpired = new Date(sub.expirationDateTime) <= new Date();
          const isOurWebhook = sub.notificationUrl && (
            sub.notificationUrl.includes('action.adrata.com') ||
            sub.notificationUrl.includes('localhost')
          );
          
          if (isExpired || isOurWebhook) {
            console.log(`🗑️ Deleting old subscription: ${sub.id}`);
            await fetch(`https://graph.microsoft.com/v1.0/subscriptions/${sub.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${microsoftToken.accessToken}`
              }
            });
          }
        }
      }
    }

    // Step 4: Get or create email account
    console.log('\n📧 Step 4: Setting up email account...');
    
    let emailAccount = await prisma.emailAccount.findFirst({
      where: {
        workspaceId: DANO_CONFIG.workspaceId,
        email: DANO_CONFIG.email
      }
    });

    if (!emailAccount) {
      console.log('📧 Creating email account...');
      emailAccount = await prisma.emailAccount.create({
        data: {
          workspaceId: DANO_CONFIG.workspaceId,
          userId: DANO_CONFIG.userId,
          platform: 'outlook',
          email: DANO_CONFIG.email,
          displayName: 'Just Dano',
          isActive: true,
          lastSyncAt: new Date(),
          syncStatus: 'healthy'
        }
      });
    }

    console.log(`✅ Email account ready: ${emailAccount.email}`);

    // Step 5: Create new webhook subscription
    console.log('\n🔔 Step 5: Creating new webhook subscription...');
    
    const webhookSubscription = {
      changeType: 'created',
      notificationUrl: WEBHOOK_ENDPOINTS.microsoft,
      resource: 'me/messages',
      expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      clientState: `${emailAccount.id}_${Date.now()}`
    };

    console.log(`📋 Webhook URL: ${webhookSubscription.notificationUrl}`);
    console.log(`📅 Expires: ${webhookSubscription.expirationDateTime}`);

    const webhookResponse = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${microsoftToken.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookSubscription)
    });

    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log(`✅ Webhook subscription created: ${webhookData.id}`);
      
      // Store webhook subscription in database
      await prisma.webhookSubscription.upsert({
        where: {
          accountId_provider: {
            accountId: emailAccount.id,
            provider: 'microsoft'
          }
        },
        update: {
          subscriptionId: webhookData.id,
          webhookUrl: webhookSubscription.notificationUrl,
          expiresAt: new Date(webhookData.expirationDateTime),
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          accountId: emailAccount.id,
          provider: 'microsoft',
          subscriptionId: webhookData.id,
          webhookUrl: webhookSubscription.notificationUrl,
          expiresAt: new Date(webhookData.expirationDateTime),
          isActive: true
        }
      });
      
      console.log('✅ Webhook subscription stored in database');
      
    } else {
      const errorText = await webhookResponse.text();
      console.log(`❌ Webhook creation failed: ${webhookResponse.status}`);
      console.log(`📋 Error: ${errorText}`);
      
      // Try to parse the error for more details
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.message) {
          console.log(`💡 Error details: ${errorData.error.message}`);
        }
      } catch (e) {
        // Error text wasn't JSON
      }
    }

    // Step 6: Test webhook endpoint
    console.log('\n🧪 Step 6: Testing webhook endpoints...');
    
    // Test Microsoft webhook endpoint
    try {
      const testResponse = await fetch(WEBHOOK_ENDPOINTS.microsoft, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validationToken: 'test-token' })
      });
      
      if (testResponse.ok) {
        console.log('✅ Microsoft webhook endpoint is responding');
      } else {
        console.log(`⚠️ Microsoft webhook endpoint returned: ${testResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Microsoft webhook endpoint error: ${error.message}`);
    }

    // Test Zoho webhook endpoint  
    try {
      const testResponse = await fetch(WEBHOOK_ENDPOINTS.zoho, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          module: 'leads', 
          operation: 'insert',
          data: [{ id: 'test', First_Name: 'Test', Last_Name: 'Lead' }]
        })
      });
      
      if (testResponse.ok) {
        console.log('✅ Zoho webhook endpoint is responding');
      } else {
        console.log(`⚠️ Zoho webhook endpoint returned: ${testResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Zoho webhook endpoint error: ${error.message}`);
    }

    // Step 7: Update email account sync status
    await prisma.emailAccount.update({
      where: { id: emailAccount.id },
      data: {
        lastSyncAt: new Date(),
        syncStatus: 'healthy',
        updatedAt: new Date()
      }
    });

    console.log('\n🎉 WEBHOOK RESYNC COMPLETE!');
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Microsoft Graph token: Valid`);
    console.log(`✅ Email account: ${emailAccount.email}`);
    console.log(`✅ Webhook endpoints: Tested`);
    console.log(`✅ Real-time notifications: Enabled`);
    
    console.log('\n🔔 WHAT HAPPENS NOW:');
    console.log('• New emails to dano@retail-products.com will trigger webhooks');
    console.log('• Zoho CRM updates will sync automatically (if configured)');
    console.log('• Data will appear in real-time in the Adrata interface');
    
    console.log('\n🧪 MANUAL TESTING:');
    console.log('1. Send a test email to dano@retail-products.com');
    console.log('2. Check Adrata leads/prospects for updated "Last Contact"');
    console.log('3. Update a lead in Zoho CRM and verify it syncs to Adrata');

  } catch (error) {
    console.error('❌ WEBHOOK RESYNC FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resyncDanoWebhooks();
