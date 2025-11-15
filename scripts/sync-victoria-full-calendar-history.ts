#!/usr/bin/env tsx

/**
 * Full Historical Calendar Sync for Victoria
 * 
 * This script syncs ALL of Victoria's calendar events from a start date,
 * including both past and future meetings.
 * 
 * Usage: npx tsx scripts/sync-victoria-full-calendar-history.ts [--start-date=YYYY-MM-DD]
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CalendarSyncService } from '../src/platform/services/calendar-sync-service';

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
  
  console.log('📅 Full Historical Calendar Sync for Victoria');
  console.log('='.repeat(70));
  console.log('');
  
  // Find Victoria
  const victoria = await prisma.users.findFirst({
    where: {
      OR: [
        { email: { contains: 'victoria', mode: 'insensitive' } },
        { firstName: { contains: 'victoria', mode: 'insensitive' } },
        { lastName: { contains: 'leland', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true
    }
  });
  
  if (!victoria) {
    console.log('❌ Victoria not found');
    await prisma.$disconnect();
    return;
  }
  
  const victoriaName = `${victoria.firstName || ''} ${victoria.lastName || ''}`.trim() || victoria.email;
  console.log(`✅ Found Victoria: ${victoriaName}`);
  console.log(`   User ID: ${victoria.id}`);
  console.log(`   Email: ${victoria.email}\n`);
  
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
  
  // Find Victoria's calendar connection
  const connection = await prisma.grand_central_connections.findFirst({
    where: {
      workspaceId: workspace.id,
      userId: victoria.id,
      provider: { in: ['outlook', 'google-calendar'] },
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
    console.log('❌ No active calendar connection found for Victoria');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📅 Connection Found:`);
  console.log(`   Provider: ${connection.provider}`);
  console.log(`   Connection ID: ${connection.nangoConnectionId}`);
  console.log(`   Current Last Sync: ${connection.lastSyncAt || 'Never'}`);
  console.log(`   Connection Created: ${connection.createdAt}\n`);
  
  // Determine start date for historical sync
  // Default to 2 years ago, or use provided date, or connection creation date
  let historicalStartDate: Date;
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
  console.log(`   End Date: Now (will include future meetings up to 1 year ahead)`);
  console.log(`   This will sync ALL calendar events from this date forward\n`);
  
  // Count current events
  const currentEventCount = await prisma.events.count({
    where: {
      workspaceId: workspace.id,
      userId: victoria.id
    }
  });
  
  console.log(`📊 Current event count: ${currentEventCount}`);
  console.log(`\n⚠️  WARNING: This will sync ALL calendar events from ${historicalStartDate.toISOString()} to 1 year from now.`);
  console.log(`   This may take a while and could result in thousands of events being synced.`);
  console.log(`   The sync will process events in batches and may take several minutes.\n`);
  
  console.log('🚀 Starting full historical calendar sync...\n');
  
  try {
    console.log('✅ Calling historical sync method...\n');
    
    const calendarSyncService = CalendarSyncService.getInstance();
    const platform = connection.provider === 'outlook' ? 'microsoft' : 'google';
    
    const result = await calendarSyncService.syncHistoricalCalendarEvents(
      victoria.id,
      workspace.id,
      historicalStartDate,
      platform
    );
    
    console.log('\n📊 Sync Results:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Events Processed: ${result.eventsProcessed}`);
    console.log(`   Events Created: ${result.eventsCreated}`);
    console.log(`   Events Updated: ${result.eventsUpdated}`);
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
      result.errors.slice(0, 5).forEach((error, i) => {
        console.log(`     ${i + 1}. ${error}`);
      });
      if (result.errors.length > 5) {
        console.log(`     ... and ${result.errors.length - 5} more errors`);
      }
    }
    
    // Get updated event count
    const newEventCount = await prisma.events.count({
      where: {
        workspaceId: workspace.id,
        userId: victoria.id
      }
    });
    
    console.log(`\n📈 Event Count:`);
    console.log(`   Before: ${currentEventCount}`);
    console.log(`   After: ${newEventCount}`);
    console.log(`   Added: ${newEventCount - currentEventCount}`);
    
    if (result.success) {
      console.log(`\n✅ Historical calendar sync completed successfully!`);
    }
    
  } catch (error: any) {
    console.error('❌ Error during historical sync:', error);
    console.error('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

