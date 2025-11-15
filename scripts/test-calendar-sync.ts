#!/usr/bin/env tsx

/**
 * Test calendar sync for Victoria
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
  console.log('📅 Testing Calendar Sync\n');
  console.log('='.repeat(70));
  
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
    console.log('❌ Workspace not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📁 Workspace: ${workspace.name} (${workspace.id})\n`);
  
  // Check connection
  const connection = await prisma.grand_central_connections.findFirst({
    where: {
      workspaceId: workspace.id,
      userId: victoria.id,
      provider: 'outlook',
      status: 'active'
    },
    select: {
      provider: true,
      nangoConnectionId: true,
      lastSyncAt: true
    }
  });
  
  if (!connection) {
    console.log('❌ No active Outlook connection found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📧 Connection Found:`);
  console.log(`   Provider: ${connection.provider}`);
  console.log(`   Connection ID: ${connection.nangoConnectionId}\n`);
  
  // Test calendar sync
  console.log('🚀 Starting calendar sync test...\n');
  
  try {
    const calendarSyncService = CalendarSyncService.getInstance();
    const result = await calendarSyncService.syncCalendarEvents(
      victoria.id,
      workspace.id,
      'microsoft'
    );
    
    console.log('\n📊 Sync Results:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Events Processed: ${result.eventsProcessed}`);
    console.log(`   Events Created: ${result.eventsCreated}`);
    console.log(`   Events Updated: ${result.eventsUpdated}`);
    console.log(`   Events Deleted: ${result.eventsDeleted}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
      result.errors.slice(0, 5).forEach(err => console.log(`     - ${err}`));
    }
    
    // Check how many events we have now
    const eventCount = await prisma.events.count({
      where: {
        workspaceId: workspace.id
      }
    });
    
    console.log(`\n📈 Total Events in Database: ${eventCount}`);
    
    if (result.success && result.eventsCreated > 0) {
      console.log(`\n✅ Calendar sync test successful!`);
    }
    
  } catch (error: any) {
    console.error('❌ Error during calendar sync:', error);
    console.error('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

