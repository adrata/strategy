#!/usr/bin/env node

/**
 * Check Microsoft OAuth Tokens Status
 * Identifies expired tokens and provides refresh capability
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function checkMicrosoftOAuthTokens() {
  console.log('🔍 Checking Microsoft OAuth tokens status...\n');
  
  try {
    // Check for Microsoft provider tokens
    const microsoftTokens = await prisma.providerToken.findMany({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        provider: 'microsoft'
      },
      include: {
        connectedProvider: true
      }
    });

    console.log(`📊 Found ${microsoftTokens.length} Microsoft tokens:\n`);

    if (microsoftTokens.length === 0) {
      console.log('❌ No Microsoft OAuth tokens found');
      console.log('💡 Dano needs to reconnect his Microsoft account');
      return;
    }

    for (const token of microsoftTokens) {
      console.log(`🔑 Token ID: ${token.id}`);
      console.log(`📧 Email: ${token.connectedProvider?.email || 'Unknown'}`);
      console.log(`⏰ Created: ${token.createdAt.toISOString()}`);
      console.log(`🔄 Updated: ${token.updatedAt.toISOString()}`);
      
      // Check expiration
      const now = new Date();
      const isExpired = token.expiresAt && token.expiresAt < now;
      const hoursUntilExpiry = token.expiresAt ? 
        Math.round((token.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)) : 
        'Unknown';

      if (isExpired) {
        console.log(`❌ Status: EXPIRED (${Math.abs(hoursUntilExpiry)} hours ago)`);
      } else if (token.expiresAt) {
        console.log(`✅ Status: Valid (expires in ${hoursUntilExpiry} hours)`);
      } else {
        console.log(`⚠️ Status: No expiration date set`);
      }

      console.log(`🔓 Has Access Token: ${token.accessToken ? 'Yes' : 'No'}`);
      console.log(`🔄 Has Refresh Token: ${token.refreshToken ? 'Yes' : 'No'}`);
      
      if (token.accessToken) {
        console.log(`🔑 Access Token (first 20 chars): ${token.accessToken.substring(0, 20)}...`);
      }
      
      if (token.refreshToken) {
        console.log(`🔄 Refresh Token (first 20 chars): ${token.refreshToken.substring(0, 20)}...`);
      }
      
      console.log(''); // Empty line
    }

    // Check for recent email sync activity
    const recentEmails = await prisma.emailMessage.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        subject: true,
        from: true,
        createdAt: true
      }
    });

    console.log(`📧 Recent email activity (last 7 days): ${recentEmails.length} emails`);
    if (recentEmails.length > 0) {
      console.log('Most recent emails:');
      recentEmails.forEach(email => {
        console.log(`  📧 ${email.createdAt.toISOString()}: "${email.subject}" from ${email.from}`);
      });
    }

    // Check total email count
    const totalEmails = await prisma.emailMessage.count({});

    console.log(`\n📊 Total emails in database: ${totalEmails}`);

    // Provide recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    
    const expiredTokens = microsoftTokens.filter(token => 
      token.expiresAt && token.expiresAt < new Date()
    );

    if (expiredTokens.length > 0) {
      console.log('❌ EXPIRED TOKENS FOUND - Email sync is NOT working');
      console.log('🔄 Need to refresh OAuth tokens to restore email sync');
      console.log('📧 Webhooks are likely failing due to expired authentication');
    } else {
      console.log('✅ Tokens appear valid - checking webhook subscriptions next');
    }

  } catch (error) {
    console.error('❌ Error checking OAuth tokens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  checkMicrosoftOAuthTokens();
}

module.exports = { checkMicrosoftOAuthTokens };
