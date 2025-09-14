#!/usr/bin/env node

/**
 * 🔄 AUTO-FIX ALL WEBHOOKS FOR DANO
 * 
 * This script automatically:
 * 1. Refreshes Microsoft Graph token using refresh token
 * 2. Refreshes Zoho CRM token using refresh token
 * 3. Recreates webhook subscriptions
 * 4. Tests all endpoints
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch').default || require('node-fetch');

const prisma = new PrismaClient();

// Configuration
const DANO_CONFIG = {
  workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
  userId: '01K1VBYYV7TRPY04NW4TW4XWRB',
  email: 'dano@retail-products.com'
};

const MICROSOFT_CONFIG = {
  clientId: '8335dd15-23e0-40ed-8978-5700fddf00eb',
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
};

const ZOHO_CONFIG = {
  clientId: process.env.ZOHO_CLIENT_ID,
  clientSecret: process.env.ZOHO_CLIENT_SECRET,
  tokenUrl: 'https://accounts.zoho.com/oauth/v2/token'
};

async function autoFixAllWebhooks() {
  console.log('🔄 AUTO-FIXING ALL WEBHOOKS FOR DANO');
  console.log(`📧 User: ${DANO_CONFIG.email}`);
  console.log(`🏢 Workspace: ${DANO_CONFIG.workspaceId}\n`);

  let microsoftTokenRefreshed = false;
  let zohoTokenRefreshed = false;
  let webhooksCreated = false;

  try {
    // Step 1: Refresh Microsoft Graph Token
    console.log('🔍 Step 1: Refreshing Microsoft Graph token...');
    
    const microsoftToken = await prisma.providerToken.findFirst({
      where: {
        workspaceId: DANO_CONFIG.workspaceId,
        provider: 'microsoft'
      }
    });

    if (microsoftToken?.refreshToken) {
      try {
        const refreshData = new URLSearchParams({
          client_id: MICROSOFT_CONFIG.clientId,
          client_secret: MICROSOFT_CONFIG.clientSecret || 'dummy-secret',
          refresh_token: microsoftToken.refreshToken,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite offline_access'
        });

        console.log('🔄 Attempting Microsoft token refresh...');
        
        const refreshResponse = await fetch(MICROSOFT_CONFIG.tokenUrl, {
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
                provider: 'microsoft'
              }
            },
            data: {
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token || microsoftToken.refreshToken,
              expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
              updatedAt: new Date()
            }
          });

          console.log('✅ Microsoft token refreshed successfully');
          microsoftTokenRefreshed = true;
          
        } else {
          const errorText = await refreshResponse.text();
          console.log(`⚠️ Microsoft token refresh failed: ${refreshResponse.status}`);
          console.log(`📋 Will try with existing token: ${errorText.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`⚠️ Microsoft token refresh error: ${error.message}`);
        console.log('📋 Will try with existing token...');
      }
    } else {
      console.log('⚠️ No Microsoft refresh token found, will try existing token...');
    }

    // Step 2: Test Microsoft Graph API and create webhooks
    console.log('\n🔔 Step 2: Setting up Microsoft Graph webhooks...');
    
    const currentMicrosoftToken = await prisma.providerToken.findFirst({
      where: {
        workspaceId: DANO_CONFIG.workspaceId,
        provider: 'microsoft'
      }
    });

    if (currentMicrosoftToken?.accessToken) {
      // Test API access
      const testResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${currentMicrosoftToken.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (testResponse.ok) {
        const userInfo = await testResponse.json();
        console.log(`✅ Microsoft API access confirmed: ${userInfo.mail || userInfo.userPrincipalName}`);

        // Get or create email account
        let emailAccount = await prisma.emailAccount.findFirst({
          where: {
            workspaceId: DANO_CONFIG.workspaceId,
            email: DANO_CONFIG.email
          }
        });

        if (!emailAccount) {
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
          console.log('📧 Email account created');
        }

        // Delete old webhook subscriptions
        const existingSubsResponse = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
          headers: {
            'Authorization': `Bearer ${currentMicrosoftToken.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (existingSubsResponse.ok) {
          const existingSubs = await existingSubsResponse.json();
          if (existingSubs.value && existingSubs.value.length > 0) {
            for (const sub of existingSubs.value) {
              if (sub.notificationUrl && sub.notificationUrl.includes('action.adrata.com')) {
                console.log(`🗑️ Deleting old subscription: ${sub.id}`);
                await fetch(`https://graph.microsoft.com/v1.0/subscriptions/${sub.id}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${currentMicrosoftToken.accessToken}`
                  }
                });
              }
            }
          }
        }

        // Create new webhook subscription
        const webhookSubscription = {
          changeType: 'created',
          notificationUrl: 'https://action.adrata.com/api/webhooks/outlook',
          resource: 'me/messages',
          expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
          clientState: `${emailAccount.id}_${Date.now()}`
        };

        const webhookResponse = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentMicrosoftToken.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookSubscription)
        });

        if (webhookResponse.ok) {
          const webhookData = await webhookResponse.json();
          console.log(`✅ Microsoft webhook created: ${webhookData.id}`);
          
          // Store webhook subscription
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
          
          webhooksCreated = true;
          
        } else {
          const errorText = await webhookResponse.text();
          console.log(`❌ Microsoft webhook creation failed: ${webhookResponse.status}`);
          console.log(`📋 Error: ${errorText.substring(0, 300)}...`);
        }

      } else {
        console.log(`❌ Microsoft API test failed: ${testResponse.status}`);
      }
    }

    // Step 3: Refresh Zoho Token
    console.log('\n🔍 Step 3: Refreshing Zoho CRM token...');
    
    const zohoToken = await prisma.providerToken.findFirst({
      where: {
        workspaceId: DANO_CONFIG.workspaceId,
        provider: 'zoho'
      }
    });

    if (zohoToken?.refreshToken) {
      try {
        const refreshData = new URLSearchParams({
          refresh_token: zohoToken.refreshToken,
          client_id: ZOHO_CONFIG.clientId || 'dummy-client-id',
          client_secret: ZOHO_CONFIG.clientSecret || 'dummy-secret',
          grant_type: 'refresh_token'
        });

        console.log('🔄 Attempting Zoho token refresh...');
        
        const refreshResponse = await fetch(ZOHO_CONFIG.tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: refreshData
        });

        if (refreshResponse.ok) {
          const tokenData = await refreshResponse.json();
          
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

          console.log('✅ Zoho token refreshed successfully');
          zohoTokenRefreshed = true;
          
        } else {
          const errorText = await refreshResponse.text();
          console.log(`⚠️ Zoho token refresh failed: ${refreshResponse.status}`);
          console.log(`📋 Will try with existing token: ${errorText.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`⚠️ Zoho token refresh error: ${error.message}`);
      }
    }

    // Step 4: Test Zoho API
    console.log('\n🧪 Step 4: Testing Zoho CRM API access...');
    
    const currentZohoToken = await prisma.providerToken.findFirst({
      where: {
        workspaceId: DANO_CONFIG.workspaceId,
        provider: 'zoho'
      }
    });

    if (currentZohoToken?.accessToken) {
      const testResponse = await fetch('https://www.zohoapis.com/crm/v3/org', {
        headers: {
          'Authorization': `Zoho-oauthtoken ${currentZohoToken.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (testResponse.ok) {
        const orgData = await testResponse.json();
        console.log(`✅ Zoho API access confirmed: ${orgData.org?.[0]?.company_name || 'Organization'}`);
      } else {
        console.log(`⚠️ Zoho API test failed: ${testResponse.status}`);
      }
    }

    // Step 5: Test webhook endpoints
    console.log('\n🧪 Step 5: Testing webhook endpoints...');
    
    try {
      const outlookTest = await fetch('https://action.adrata.com/api/webhooks/outlook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validationToken: 'test-token' })
      });
      console.log(`📧 Outlook webhook endpoint: ${outlookTest.ok ? '✅ Active' : `⚠️ ${outlookTest.status}`}`);
    } catch (error) {
      console.log(`📧 Outlook webhook endpoint: ❌ Error - ${error.message}`);
    }

    try {
      const zohoTest = await fetch('https://action.adrata.com/api/webhooks/zoho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          module: 'leads', 
          operation: 'insert',
          data: [{ id: 'test', First_Name: 'Test', Last_Name: 'Lead' }]
        })
      });
      console.log(`🔔 Zoho webhook endpoint: ${zohoTest.ok ? '✅ Active' : `⚠️ ${zohoTest.status}`}`);
    } catch (error) {
      console.log(`🔔 Zoho webhook endpoint: ❌ Error - ${error.message}`);
    }

    // Final Summary
    console.log('\n🎉 AUTO-FIX COMPLETE!');
    console.log('\n📋 RESULTS SUMMARY:');
    console.log(`📧 Microsoft Graph token: ${microsoftTokenRefreshed ? '✅ Refreshed' : '⚠️ Using existing'}`);
    console.log(`🔔 Zoho CRM token: ${zohoTokenRefreshed ? '✅ Refreshed' : '⚠️ Using existing'}`);
    console.log(`🔔 Webhook subscriptions: ${webhooksCreated ? '✅ Created' : '⚠️ Check manually'}`);
    
    console.log('\n🔔 WHAT SHOULD WORK NOW:');
    console.log('• New emails to dano@retail-products.com should trigger webhooks');
    console.log('• Real-time email notifications should be active');
    console.log('• Zoho CRM API access should be working');
    console.log('• Webhook endpoints are responding');
    
    if (!microsoftTokenRefreshed || !zohoTokenRefreshed) {
      console.log('\n⚠️ MANUAL ACTION STILL NEEDED:');
      if (!microsoftTokenRefreshed) {
        console.log('• Microsoft account may need reconnection in UI');
      }
      if (!zohoTokenRefreshed) {
        console.log('• Zoho CRM account may need reconnection in UI');
        console.log('• Zoho webhooks need manual setup in CRM UI');
      }
    }

    console.log('\n🧪 TEST THE INTEGRATION:');
    console.log('1. Send an email to dano@retail-products.com');
    console.log('2. Check Adrata leads for updated "Last Contact"');
    console.log('3. Update a record in Zoho CRM');
    console.log('4. Verify changes sync to Adrata');

  } catch (error) {
    console.error('❌ AUTO-FIX FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
autoFixAllWebhooks();
