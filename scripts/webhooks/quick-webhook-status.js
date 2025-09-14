#!/usr/bin/env node

/**
 * 🔍 QUICK WEBHOOK STATUS CHECK
 * 
 * Shows current status and provides direct action links
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickWebhookStatus() {
  console.log('🔍 QUICK WEBHOOK STATUS FOR DANO');
  console.log('================================\n');

  try {
    // Check tokens
    const microsoftToken = await prisma.providerToken.findFirst({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', provider: 'microsoft' }
    });

    const zohoToken = await prisma.providerToken.findFirst({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', provider: 'zoho' }
    });

    // Check webhook subscriptions
    const webhookSubs = await prisma.webhookSubscription.findMany({
      where: {
        account: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
      }
    });

    console.log('📊 CURRENT STATUS:');
    console.log('================');
    
    // Microsoft status
    const msExpired = microsoftToken ? new Date(microsoftToken.expiresAt) <= new Date() : true;
    console.log(`📧 Microsoft Graph: ${msExpired ? '❌ EXPIRED' : '✅ ACTIVE'}`);
    if (microsoftToken) {
      console.log(`   Expired: ${microsoftToken.expiresAt}`);
    }
    
    // Zoho status
    const zohoExpired = zohoToken ? new Date(zohoToken.expiresAt) <= new Date() : true;
    console.log(`🔔 Zoho CRM: ${zohoExpired ? '❌ EXPIRED' : '✅ ACTIVE'}`);
    if (zohoToken) {
      console.log(`   Expired: ${zohoToken.expiresAt}`);
    }
    
    // Webhook subscriptions
    console.log(`🔔 Active Webhooks: ${webhookSubs.length}`);
    
    console.log('\n🎯 REQUIRED ACTIONS:');
    console.log('==================');
    
    if (msExpired) {
      console.log('1. 📧 RECONNECT MICROSOFT ACCOUNT:');
      console.log('   → Go to: https://action.adrata.com');
      console.log('   → Login as: dano');
      console.log('   → Profile → Grand Central → "Reconnect Microsoft Account"');
      console.log('');
    }
    
    if (zohoExpired) {
      console.log('2. 🔔 RECONNECT ZOHO CRM:');
      console.log('   → Same login process');
      console.log('   → Profile → Grand Central → "Reconnect Zoho CRM"');
      console.log('');
    }
    
    console.log('3. 🔧 VERIFY WEBHOOK ENDPOINTS:');
    console.log('   → Microsoft: https://action.adrata.com/api/webhooks/outlook');
    console.log('   → Zoho: https://action.adrata.com/api/webhooks/zoho');
    console.log('');
    
    console.log('⏱️ ESTIMATED TIME: 5-10 minutes total');
    console.log('🎯 PRIORITY: HIGH - Real-time sync is currently broken');
    
    console.log('\n✅ WHAT WILL BE FIXED:');
    console.log('=====================');
    console.log('• Real-time email notifications');
    console.log('• Automatic lead "Last Contact" updates');
    console.log('• Zoho CRM bidirectional sync');
    console.log('• Buying signal detection');
    console.log('• Speedrun prioritization');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickWebhookStatus();
