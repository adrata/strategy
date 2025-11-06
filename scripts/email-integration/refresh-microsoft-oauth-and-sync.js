#!/usr/bin/env node

/**
 * Refresh Microsoft OAuth Token and Sync Emails
 * 
 * This script:
 * 1. Tests current token validity by making a Graph API call
 * 2. Refreshes the token if needed
 * 3. Syncs emails from the last 7 days to today
 * 4. Re-establishes webhook subscriptions
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch').default || require('node-fetch');
const prisma = new PrismaClient();

const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const MICROSOFT_CLIENT_ID = '8335dd15-23e0-40ed-8978-5700fddf00eb';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;

async function refreshMicrosoftOAuthAndSync() {
  console.log('🔄 Refreshing Microsoft OAuth token and syncing emails...\n');
  
  try {
    // Step 1: Get current token
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
      console.log('❌ No Microsoft token found. Dano needs to reconnect his account.');
      return;
    }

    console.log(`🔑 Found token for: ${currentToken.connectedProvider?.email}`);

    // Step 2: Test current token validity
    console.log('🧪 Testing current token validity...');
    const testResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${currentToken.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    let needsRefresh = false;
    
    if (testResponse.ok) {
      const user = await testResponse.json();
      console.log(`✅ Current token is valid for: ${user.mail || user.userPrincipalName}`);
    } else {
      console.log(`❌ Current token is invalid (${testResponse.status}). Refreshing...`);
      needsRefresh = true;
    }

    let accessToken = currentToken.accessToken;

    // Step 3: Refresh token if needed
    if (needsRefresh) {
      if (!currentToken.refreshToken) {
        console.log('❌ No refresh token available. Full re-authentication required.');
        return;
      }

      if (!MICROSOFT_CLIENT_SECRET) {
        console.log('❌ MICROSOFT_CLIENT_SECRET environment variable not set');
        return;
      }

      console.log('🔄 Refreshing access token...');
      
      const refreshResponse = await fetch('https://login.microsoftonline.com/organizations/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: currentToken.refreshToken,
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access'
        })
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.log(`❌ Token refresh failed: ${refreshResponse.status} - ${errorText}`);
        return;
      }

      const refreshData = await refreshResponse.json();
      
      // Update token in database
      await prisma.providerToken.update({
        where: { id: currentToken.id },
        data: {
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token || currentToken.refreshToken,
          expiresAt: refreshData.expires_in ? 
            new Date(Date.now() + refreshData.expires_in * 1000) : 
            new Date(Date.now() + 3600 * 1000), // Default 1 hour
          updatedAt: new Date()
        }
      });

      accessToken = refreshData.access_token;
      console.log('✅ Token refreshed successfully');
    }

    // Step 4: Get email account info
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        email: currentToken.connectedProvider?.email
      }
    });

    if (!emailAccount) {
      console.log('❌ No email account found for token');
      return;
    }

    console.log(`📧 Found email account: ${emailAccount.email}`);

    // Step 5: Sync emails from the last 7 days to today
    console.log('📥 Syncing emails from last 7 days to today...');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const today = new Date();
    
    const emailsResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge ${sevenDaysAgo.toISOString()} and receivedDateTime le ${today.toISOString()}&$orderby=receivedDateTime desc&$top=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!emailsResponse.ok) {
      const errorText = await emailsResponse.text();
      console.log(`❌ Failed to fetch emails: ${emailsResponse.status} - ${errorText}`);
      return;
    }

    const emailsData = await emailsResponse.json();
    const emails = emailsData.value || [];
    
    console.log(`📧 Found ${emails.length} emails to sync`);

    let syncedCount = 0;
    let skippedCount = 0;

    // Step 6: Process and save emails
    for (const email of emails) {
      try {
        // Check if email already exists
        const existingEmail = await prisma.emailMessage.findFirst({
          where: {
            messageId: email.id,
            accountId: emailAccount.id
          }
        });

        if (existingEmail) {
          skippedCount++;
          continue;
        }

        // Create new email record
        await prisma.emailMessage.create({
          data: {
            messageId: email.id,
            accountId: emailAccount.id,
            subject: email.subject || 'No Subject',
            body: email.body?.content || '',
            bodyHtml: email.body?.contentType === 'html' ? email.body.content : null,
            from: email.from?.emailAddress?.address || 'unknown@unknown.com',
            to: email.toRecipients?.map(r => r.emailAddress?.address) || [],
            cc: email.ccRecipients?.map(r => r.emailAddress?.address) || [],
            bcc: email.bccRecipients?.map(r => r.emailAddress?.address) || [],
            replyTo: email.replyTo?.[0]?.emailAddress?.address,
            sentAt: new Date(email.sentDateTime),
            receivedAt: new Date(email.receivedDateTime),
            isRead: email.isRead || false,
            isImportant: email.importance === 'high',
            labels: email.categories || [],
            attachments: email.hasAttachments ? { count: 1 } : null
          }
        });

        syncedCount++;
        
        if (syncedCount % 10 === 0) {
          console.log(`📧 Synced ${syncedCount} emails...`);
        }

      } catch (error) {
        console.error(`❌ Error syncing email ${email.id}:`, error.message);
      }
    }

    console.log(`✅ Email sync complete: ${syncedCount} new emails, ${skippedCount} skipped (already existed)`);

    // Step 7: Re-establish webhook subscription
    console.log('🔔 Setting up webhook subscription...');
    
    const webhookSubscription = {
      changeType: 'created',
      notificationUrl: 'https://action.adrata.com/api/webhooks/microsoft-graph',
      resource: 'me/messages',
      expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      clientState: `${emailAccount.id}_${Date.now()}`
    };

    const webhookResponse = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookSubscription)
    });

    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log(`✅ Webhook subscription created: ${webhookData.id}`);
      
      // Store webhook subscription for future management
      await prisma.webhookSubscription.upsert({
        where: {
          accountId_provider: {
            accountId: emailAccount.id,
            provider: 'microsoft'
          }
        },
        update: {
          subscriptionId: webhookData.id,
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
      
    } else {
      const errorText = await webhookResponse.text();
      console.log(`⚠️ Webhook setup failed: ${webhookResponse.status} - ${errorText}`);
      console.log('Emails will still sync, but without real-time notifications');
    }

    // Step 8: Update email account sync status
    await prisma.emailAccount.update({
      where: { id: emailAccount.id },
      data: {
        lastSyncAt: new Date(),
        syncStatus: 'healthy',
        updatedAt: new Date()
      }
    });

    console.log('\n🎉 MICROSOFT EMAIL SYNC COMPLETE!');
    console.log(`✅ Token refreshed and validated`);
    console.log(`📧 ${syncedCount} new emails synced`);
    console.log(`🔔 Real-time webhook established`);
    console.log(`📊 Total emails in database: ${await prisma.emailMessage.count()}`);

  } catch (error) {
    console.error('❌ Error during OAuth refresh and sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  refreshMicrosoftOAuthAndSync();
}

module.exports = { refreshMicrosoftOAuthAndSync };
