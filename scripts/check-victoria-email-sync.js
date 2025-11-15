#!/usr/bin/env node

/**
 * Check Victoria's email sync status and configuration
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
  console.log('🔍 Checking Victoria\'s Email Sync Status\n');
  
  // Find Victoria's user record
  const victoria = await prisma.users.findFirst({
    where: {
      OR: [
        { email: { contains: 'victoria', mode: 'insensitive' } },
        { name: { contains: 'victoria', mode: 'insensitive' } },
        { firstName: { contains: 'victoria', mode: 'insensitive' } },
        { lastName: { contains: 'victoria', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true
    }
  });
  
  if (!victoria) {
    console.log('❌ Victoria not found');
    await prisma.$disconnect();
    return;
  }
  
  const victoriaName = victoria.name || `${victoria.firstName || ''} ${victoria.lastName || ''}`.trim() || victoria.email;
  console.log(`✅ Found Victoria: ${victoriaName}`);
  console.log(`   User ID: ${victoria.id}`);
  console.log(`   Email: ${victoria.email}\n`);
  
  // Find her workspace (likely TOP Engineering Plus)
  const workspaces = await prisma.workspaces.findMany({
    where: {
      OR: [
        { name: { contains: 'TOP Engineering', mode: 'insensitive' } },
        { name: { contains: 'Engineering Plus', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true
    }
  });
  
  if (workspaces.length === 0) {
    console.log('❌ No TOP Engineering Plus workspace found');
    await prisma.$disconnect();
    return;
  }
  
  const workspace = workspaces[0];
  console.log(`📁 Workspace: ${workspace.name} (${workspace.id})\n`);
  
  // Find email connections for this workspace
  const connections = await prisma.grand_central_connections.findMany({
    where: {
      workspaceId: workspace.id,
      provider: { in: ['outlook', 'gmail'] },
      status: 'active'
    },
    select: {
      id: true,
      provider: true,
      status: true,
      createdAt: true,
      lastSyncAt: true,
      userId: true,
      nangoConnectionId: true
    }
  });
  
  console.log(`📧 Email Connections: ${connections.length}\n`);
  
  for (const conn of connections) {
    console.log(`   Provider: ${conn.provider}`);
    console.log(`   Status: ${conn.status}`);
    console.log(`   Created: ${conn.createdAt}`);
    console.log(`   Last Sync: ${conn.lastSyncAt || 'Never'}`);
    console.log(`   Connection ID: ${conn.nangoConnectionId}\n`);
  }
  
  // Count emails for this workspace
  const emailCount = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id
    }
  });
  
  console.log(`📊 Total Emails in Database: ${emailCount}\n`);
  
  // Get email date range
  const oldestEmail = await prisma.email_messages.findFirst({
    where: {
      workspaceId: workspace.id
    },
    select: {
      receivedAt: true,
      createdAt: true,
      subject: true
    },
    orderBy: {
      receivedAt: 'asc'
    }
  });
  
  const newestEmail = await prisma.email_messages.findFirst({
    where: {
      workspaceId: workspace.id
    },
    select: {
      receivedAt: true,
      createdAt: true,
      subject: true
    },
    orderBy: {
      receivedAt: 'desc'
    }
  });
  
  if (oldestEmail && newestEmail) {
    console.log('📅 Email Date Range:');
    console.log(`   Oldest: ${oldestEmail.receivedAt || oldestEmail.createdAt}`);
    console.log(`   Newest: ${newestEmail.receivedAt || newestEmail.createdAt}`);
    
    if (oldestEmail.receivedAt && newestEmail.receivedAt) {
      const daysDiff = Math.floor((newestEmail.receivedAt.getTime() - oldestEmail.receivedAt.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   Span: ${daysDiff} days\n`);
    }
  }
  
  // Check sync configuration
  console.log('⚙️  Sync Configuration:');
  console.log('   - First sync: Fetches last 30 days');
  console.log('   - Subsequent syncs: Fetches emails since last sync (1-hour safety window)');
  console.log('   - Maximum lookback: 30 days (hard limit)');
  console.log('   - Real-time: Yes (webhooks + cron every 5 minutes)\n');
  
  // Check if there are emails older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const emailsOlderThan30Days = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id,
      receivedAt: {
        lt: thirtyDaysAgo
      }
    }
  });
  
  console.log(`📈 Analysis:`);
  console.log(`   - Emails older than 30 days: ${emailsOlderThan30Days}`);
  console.log(`   - Emails within last 30 days: ${emailCount - emailsOlderThan30Days}`);
  
  if (emailsOlderThan30Days > 0) {
    console.log(`\n   ⚠️  Note: ${emailsOlderThan30Days} emails are older than 30 days.`);
    console.log(`      These were likely synced during the initial 30-day sync window.`);
    console.log(`      New syncs will only fetch emails from the last 30 days.`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);

