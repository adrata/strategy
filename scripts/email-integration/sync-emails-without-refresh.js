#!/usr/bin/env node

/**
 * Sync Emails Without Token Refresh
 * 
 * This script attempts to sync emails using the existing token
 * If the token is valid, it will sync recent emails
 * If not, it provides instructions for reconnecting the account
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch').default || require('node-fetch');
const prisma = new PrismaClient();

const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function syncEmailsWithoutRefresh() {
  console.log('📧 Attempting to sync emails with existing token...\n');
  
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
      console.log('❌ No Microsoft token found.');
      console.log('\n🔧 TO FIX: Dano needs to reconnect his Microsoft account');
      console.log('1. Go to the profile popup in the app');
      console.log('2. Click "Grand Central"');
      console.log('3. Connect Microsoft/Outlook account');
      return;
    }

    console.log(`🔑 Testing token for: ${currentToken.connectedProvider?.email}`);

    // Step 2: Test current token validity
    const testResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${currentToken.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!testResponse.ok) {
      console.log(`❌ Current token is expired (${testResponse.status})`);
      console.log('\n🔧 TO FIX: Dano needs to reconnect his Microsoft account');
      console.log('📍 The OAuth token has expired and needs to be refreshed');
      console.log('\n📝 INSTRUCTIONS:');
      console.log('1. Open the Adrata app at https://action.adrata.com');
      console.log('2. Click on the profile popup (bottom left)');
      console.log('3. Click "Grand Central" option');
      console.log('4. Click "Connect Microsoft Account" or "Reconnect"');
      console.log('5. Sign in with: dano@retail-products.com');
      console.log('6. Allow the requested permissions');
      console.log('7. The system will automatically sync recent emails');
      
      return;
    }

    const user = await testResponse.json();
    console.log(`✅ Token is valid for: ${user.mail || user.userPrincipalName}`);

    // Step 3: Get email account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        email: currentToken.connectedProvider?.email
      }
    });

    if (!emailAccount) {
      console.log('❌ No email account found. Setting up...');
      return;
    }

    // Step 4: Sync emails from the last 30 days
    console.log('📥 Syncing emails from last 30 days...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const today = new Date();
    
    // Get emails in batches to avoid API limits
    let allEmails = [];
    let nextLink = `https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge ${thirtyDaysAgo.toISOString()}&$orderby=receivedDateTime desc&$top=50`;
    
    while (nextLink && allEmails.length < 500) { // Limit to 500 emails max
      const emailsResponse = await fetch(nextLink, {
        headers: {
          'Authorization': `Bearer ${currentToken.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!emailsResponse.ok) {
        console.log(`❌ Failed to fetch emails: ${emailsResponse.status}`);
        break;
      }

      const emailsData = await emailsResponse.json();
      const emails = emailsData.value || [];
      
      allEmails = allEmails.concat(emails);
      nextLink = emailsData['@odata.nextLink'];
      
      console.log(`📧 Fetched ${emails.length} emails (total: ${allEmails.length})`);
      
      if (emails.length === 0) break;
    }
    
    console.log(`📧 Found ${allEmails.length} emails to sync`);

    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Step 5: Process and save emails
    for (const email of allEmails) {
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
        
        if (syncedCount % 25 === 0) {
          console.log(`📧 Synced ${syncedCount} emails...`);
        }

      } catch (error) {
        errorCount++;
        if (errorCount < 5) { // Only log first few errors
          console.error(`❌ Error syncing email ${email.id}:`, error.message);
        }
      }
    }

    // Step 6: Update email account sync status
    await prisma.emailAccount.update({
      where: { id: emailAccount.id },
      data: {
        lastSyncAt: new Date(),
        syncStatus: syncedCount > 0 ? 'healthy' : 'warning',
        updatedAt: new Date()
      }
    });

    console.log(`\n✅ Email sync complete!`);
    console.log(`📧 ${syncedCount} new emails synced`);
    console.log(`⏭️  ${skippedCount} emails skipped (already existed)`);
    console.log(`❌ ${errorCount} errors encountered`);
    console.log(`📊 Total emails in database: ${await prisma.emailMessage.count()}`);

    // Check for recent activity
    const todayEmails = await prisma.emailMessage.count({
      where: {
        receivedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const yesterdayEmails = await prisma.emailMessage.count({
      where: {
        receivedAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 1)),
          lt: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    console.log(`\n📅 Recent Activity:`);
    console.log(`📧 Today: ${todayEmails} emails`);
    console.log(`📧 Yesterday: ${yesterdayEmails} emails`);

    if (syncedCount > 0) {
      console.log('\n🎉 SUCCESS: Emails are now up to date!');
      console.log('📈 Real-time webhook may still need to be re-established for live sync');
    }

  } catch (error) {
    console.error('❌ Error during email sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  syncEmailsWithoutRefresh();
}

module.exports = { syncEmailsWithoutRefresh };
