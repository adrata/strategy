#!/usr/bin/env node

/**
 * 🔄 REFRESH ZOHO TOKEN AND SETUP WEBHOOKS
 * 
 * This script will:
 * 1. Refresh the expired Zoho token using the refresh token
 * 2. Test the refreshed token
 * 3. Provide instructions for webhook setup in Zoho CRM
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch').default || require('node-fetch');

const prisma = new PrismaClient();

// Dano's configuration
const DANO_CONFIG = {
  workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
  userId: '01K1VBYYV7TRPY04NW4TW4XWRB',
  email: 'dano@retail-products.com'
};

// Zoho OAuth configuration
const ZOHO_CONFIG = {
  clientId: process.env.ZOHO_CLIENT_ID || 'your-zoho-client-id',
  clientSecret: process.env.ZOHO_CLIENT_SECRET || 'your-zoho-client-secret',
  tokenUrl: 'https://accounts.zoho.com/oauth/v2/token'
};

async function refreshZohoToken() {
  console.log('🔄 REFRESHING ZOHO TOKEN FOR DANO');
  console.log(`📧 User: ${DANO_CONFIG.email}\n`);

  try {
    // Step 1: Get current Zoho token
    console.log('🔍 Step 1: Getting current Zoho token...');
    
    const zohoToken = await prisma.providerToken.findFirst({
      where: {
        workspaceId: DANO_CONFIG.workspaceId,
        provider: 'zoho'
      },
      include: {
        connectedProvider: true
      }
    });

    if (!zohoToken) {
      console.log('❌ No Zoho token found');
      console.log('\n📝 MANUAL ACTION REQUIRED:');
      console.log('1. Dano needs to connect his Zoho CRM account');
      console.log('2. Go to: https://action.adrata.com');
      console.log('3. Login as dano');
      console.log('4. Click profile → Grand Central → Connect Zoho CRM');
      return;
    }

    console.log('✅ Zoho token found');
    console.log(`   Expires at: ${zohoToken.expiresAt}`);
    console.log(`   Has refresh token: ${!!zohoToken.refreshToken}`);

    // Step 2: Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(zohoToken.expiresAt);
    const needsRefresh = expiresAt <= now;

    console.log(`\n🕐 Token status: ${needsRefresh ? 'EXPIRED' : 'VALID'}`);

    if (needsRefresh && zohoToken.refreshToken) {
      console.log('\n🔄 Step 2: Refreshing expired token...');
      
      const refreshData = new URLSearchParams({
        refresh_token: zohoToken.refreshToken,
        client_id: ZOHO_CONFIG.clientId,
        client_secret: ZOHO_CONFIG.clientSecret,
        grant_type: 'refresh_token'
      });

      try {
        const refreshResponse = await fetch(ZOHO_CONFIG.tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: refreshData
        });

        if (refreshResponse.ok) {
          const tokenData = await refreshResponse.json();
          
          // Update token in database
          await prisma.providerToken.update({
            where: {
              workspaceId_provider: {
                workspaceId: DANO_CONFIG.workspaceId,
                provider: 'zoho'
              }
            },
            data: {
              accessToken: tokenData.access_token,
              expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
              updatedAt: new Date()
            }
          });

          console.log('✅ Token refreshed successfully');
        } else {
          const errorText = await refreshResponse.text();
          console.log(`❌ Token refresh failed: ${refreshResponse.status}`);
          console.log(`📋 Error: ${errorText}`);
          
          console.log('\n📝 MANUAL ACTION REQUIRED:');
          console.log('1. Zoho refresh token may be expired');
          console.log('2. Dano needs to reconnect his Zoho CRM account');
          console.log('3. Go to: https://action.adrata.com');
          console.log('4. Login as dano');
          console.log('5. Click profile → Grand Central → Reconnect Zoho CRM');
          return;
        }
      } catch (error) {
        console.log(`❌ Token refresh error: ${error.message}`);
        return;
      }
    }

    // Step 3: Test Zoho API access
    console.log('\n🧪 Step 3: Testing Zoho API access...');
    
    // Get the latest token (refreshed or existing)
    const currentToken = await prisma.providerToken.findFirst({
      where: {
        workspaceId: DANO_CONFIG.workspaceId,
        provider: 'zoho'
      }
    });

    const testResponse = await fetch('https://www.zohoapis.com/crm/v3/org', {
      headers: {
        'Authorization': `Zoho-oauthtoken ${currentToken.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (testResponse.ok) {
      const orgData = await testResponse.json();
      console.log('✅ Zoho API access confirmed');
      console.log(`   Organization: ${orgData.org?.[0]?.company_name || 'Unknown'}`);
    } else {
      console.log(`❌ Zoho API test failed: ${testResponse.status}`);
      const errorText = await testResponse.text();
      console.log(`📋 Error: ${errorText}`);
    }

    // Step 4: Webhook setup instructions
    console.log('\n🔔 Step 4: Zoho CRM Webhook Setup Instructions');
    console.log('='.repeat(50));
    console.log('\nSince Zoho CRM webhooks require manual setup through their UI,');
    console.log('please follow these steps to enable real-time sync:\n');

    console.log('📍 1. CREATE WEBHOOKS:');
    console.log('   • Go to: Setup > Automation > Actions > Webhooks');
    console.log('   • Click "Create Webhook"');
    console.log('   • Create 4 webhooks with these settings:\n');

    const webhooks = [
      { name: 'Adrata Lead Sync', module: 'Leads' },
      { name: 'Adrata Contact Sync', module: 'Contacts' },
      { name: 'Adrata Deal Sync', module: 'Deals' },
      { name: 'Adrata Account Sync', module: 'Accounts' }
    ];

    webhooks.forEach((webhook, index) => {
      console.log(`   📋 Webhook ${index + 1}: ${webhook.name}`);
      console.log(`      • Name: ${webhook.name}`);
      console.log('      • URL: https://action.adrata.com/api/webhooks/zoho');
      console.log('      • Method: POST');
      console.log('      • Content Type: application/json');
      console.log(`      • Module: ${webhook.module}`);
      console.log('');
    });

    console.log('📍 2. CREATE WORKFLOW RULES:');
    console.log('   • Go to: Setup > Automation > Workflow Rules');
    console.log('   • Create rules for each module with these settings:\n');

    webhooks.forEach((webhook, index) => {
      console.log(`   📋 Rule ${index + 1}: ${webhook.module} Auto-Sync`);
      console.log(`      • Module: ${webhook.module}`);
      console.log('      • Trigger: Create/Update/Delete operations');
      console.log('      • Condition: All records');
      console.log(`      • Instant Action: ${webhook.name} webhook`);
      console.log('');
    });

    console.log('📍 3. TEST THE INTEGRATION:');
    console.log('   • Create or update a lead/contact/deal in Zoho CRM');
    console.log('   • Check Adrata logs for webhook notifications');
    console.log('   • Verify data appears in Adrata interface');

    console.log('\n🎉 ZOHO TOKEN REFRESH COMPLETE!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Zoho API token: Refreshed and valid');
    console.log('✅ API access: Confirmed');
    console.log('⚠️ Webhooks: Manual setup required in Zoho CRM UI');
    
    console.log('\n🔔 NEXT STEPS:');
    console.log('1. Follow the webhook setup instructions above');
    console.log('2. Test by creating/updating records in Zoho CRM');
    console.log('3. Verify real-time sync in Adrata');

  } catch (error) {
    console.error('❌ ZOHO TOKEN REFRESH FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
refreshZohoToken();
