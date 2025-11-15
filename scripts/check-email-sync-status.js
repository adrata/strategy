#!/usr/bin/env node

/**
 * Check why email sync isn't running in real-time
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🔍 Checking Email Sync Status\n');
  
  // Find Victoria's connection
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'TOP Engineering', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true
    }
  });
  
  if (!workspace) {
    console.log('❌ Workspace not found');
    await prisma.$disconnect();
    return;
  }
  
  const connections = await prisma.grand_central_connections.findMany({
    where: {
      workspaceId: workspace.id,
      provider: { in: ['outlook', 'gmail'] },
      status: 'active'
    },
    select: {
      id: true,
      provider: true,
      nangoConnectionId: true,
      lastSyncAt: true,
      createdAt: true,
      metadata: true
    }
  });
  
  console.log(`📧 Active Connections: ${connections.length}\n`);
  
  for (const conn of connections) {
    console.log(`Provider: ${conn.provider}`);
    console.log(`Connection ID: ${conn.nangoConnectionId}`);
    console.log(`Created: ${conn.createdAt}`);
    console.log(`Last Sync: ${conn.lastSyncAt || 'Never'}`);
    
    if (conn.lastSyncAt) {
      const daysSinceSync = Math.floor((Date.now() - conn.lastSyncAt.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`Days since last sync: ${daysSinceSync}`);
      
      if (daysSinceSync > 1) {
        console.log(`⚠️  WARNING: Last sync was ${daysSinceSync} days ago!`);
        console.log(`   Expected: Should sync every 5 minutes via cron`);
        console.log(`   Possible issues:`);
        console.log(`   - Cron job not running`);
        console.log(`   - Cron job failing silently`);
        console.log(`   - Webhooks not configured`);
      }
    }
    console.log('');
  }
  
  // Check cron configuration
  console.log('⚙️  Cron Configuration:');
  console.log('   Schedule: Every 5 minutes (*/5 * * * *)');
  console.log('   Endpoint: /api/cron/email-sync');
  console.log('   Status: Should be running automatically\n');
  
  // Check for recent emails that should have been synced
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentEmails = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id,
      receivedAt: {
        gte: oneDayAgo
      }
    }
  });
  
  console.log(`📊 Recent Email Stats:`);
  console.log(`   Emails received in last 24 hours: ${recentEmails}`);
  console.log(`   (This should be syncing automatically if cron is working)\n`);
  
  await prisma.$disconnect();
}

main().catch(console.error);

