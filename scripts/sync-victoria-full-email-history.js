#!/usr/bin/env tsx

/**
 * Full Historical Email Sync for Victoria
 * 
 * This script syncs ALL of Victoria's emails from the beginning of her email account,
 * bypassing the normal 30-day limit.
 * 
 * Usage: npx tsx scripts/sync-victoria-full-email-history.js [--start-date=YYYY-MM-DD]
 */

require('dotenv').config();
import { PrismaClient } from '@prisma/client';
import { UnifiedEmailSyncService } from '../src/platform/services/UnifiedEmailSyncService';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  const args = process.argv.slice(2);
  const startDateArg = args.find(arg => arg.startsWith('--start-date='));
  const startDate = startDateArg ? startDateArg.split('=')[1] : null;
  
  console.log('📧 Full Historical Email Sync for Victoria');
  console.log('='.repeat(70));
  console.log('');
  
  // Find Victoria
  const victoria = await prisma.users.findFirst({
    where: {
      OR: [
        { email: { contains: 'victoria', mode: 'insensitive' } },
        { name: { contains: 'victoria', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      email: true,
      name: true
    }
  });
  
  if (!victoria) {
    console.log('❌ Victoria not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`✅ Found Victoria: ${victoria.name || victoria.email}`);
  console.log(`   User ID: ${victoria.id}\n`);
  
  // Find TOP Engineering Plus workspace
  const workspace = await prisma.workspaces.findFirst({
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
  
  if (!workspace) {
    console.log('❌ TOP Engineering Plus workspace not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📁 Workspace: ${workspace.name} (${workspace.id})\n`);
  
  // Find Victoria's email connection
  const connection = await prisma.grand_central_connections.findFirst({
    where: {
      workspaceId: workspace.id,
      userId: victoria.id,
      provider: { in: ['outlook', 'gmail'] },
      status: 'active'
    },
    select: {
      id: true,
      provider: true,
      nangoConnectionId: true,
      lastSyncAt: true,
      createdAt: true
    }
  });
  
  if (!connection) {
    console.log('❌ No active email connection found for Victoria');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📧 Connection Found:`);
  console.log(`   Provider: ${connection.provider}`);
  console.log(`   Connection ID: ${connection.nangoConnectionId}`);
  console.log(`   Current Last Sync: ${connection.lastSyncAt || 'Never'}`);
  console.log(`   Connection Created: ${connection.createdAt}\n`);
  
  // Determine start date for historical sync
  // Default to 2 years ago, or use provided date, or connection creation date
  let historicalStartDate;
  if (startDate) {
    historicalStartDate = new Date(startDate);
  } else {
    // Use connection creation date or 2 years ago, whichever is older
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    historicalStartDate = connection.createdAt < twoYearsAgo ? connection.createdAt : twoYearsAgo;
  }
  
  console.log(`📅 Historical Sync Configuration:`);
  console.log(`   Start Date: ${historicalStartDate.toISOString()}`);
  console.log(`   This will sync ALL emails from this date forward\n`);
  
  // Count current emails
  const currentEmailCount = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id
    }
  });
  
  console.log(`📊 Current email count: ${currentEmailCount}`);
  console.log(`\n⚠️  WARNING: This will sync ALL emails from ${historicalStartDate.toISOString()} to now.`);
  console.log(`   This may take a while and could result in thousands of emails being synced.`);
  console.log(`   The sync will process emails in batches and may take several minutes.\n`);
  
  console.log('🚀 Starting full historical sync...\n');
  
  try {
    console.log('✅ Calling historical sync method...\n');
    
    const result = await UnifiedEmailSyncService.syncHistoricalEmails(
      workspace.id,
      victoria.id,
      connection.nangoConnectionId,
      historicalStartDate
    );
    
    console.log('\n📊 Sync Results:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Emails Processed: ${result.count}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    // Note: Historical sync automatically links emails and creates actions
    
    // Get updated email count
    const newEmailCount = await prisma.email_messages.count({
      where: {
        workspaceId: workspace.id
      }
    });
    
    console.log(`\n📈 Email Count:`);
    console.log(`   Before: ${currentEmailCount}`);
    console.log(`   After: ${newEmailCount}`);
    console.log(`   Added: ${newEmailCount - currentEmailCount}`);
    
  } catch (error) {
    console.error('❌ Error during historical sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

