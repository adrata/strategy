#!/usr/bin/env tsx

/**
 * Check meeting/calendar sync status
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('📅 Meeting/Calendar Sync Status Check\n');
  console.log('='.repeat(70));
  
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
  
  // Check for calendar table
  try {
    const calendarCount = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM calendar WHERE "workspaceId" = ${workspace.id}
    `;
    
    const calendars = Number(calendarCount[0]?.count || 0);
    console.log(`📅 Calendars: ${calendars}`);
    
    if (calendars > 0) {
      const calendarDetails = await prisma.$queryRaw<Array<{
        id: string;
        platform: string;
        lastSyncAt: Date | null;
        createdAt: Date;
      }>>`
        SELECT id, platform, "lastSyncAt", "createdAt"
        FROM calendar
        WHERE "workspaceId" = ${workspace.id}
        LIMIT 5
      `;
      
      for (const cal of calendarDetails) {
        console.log(`   - Platform: ${cal.platform}`);
        console.log(`     Last Sync: ${cal.lastSyncAt ? cal.lastSyncAt.toLocaleString() : 'Never'}`);
        console.log(`     Created: ${cal.createdAt.toLocaleString()}\n`);
      }
    }
  } catch (error: any) {
    console.log(`   ⚠️  Calendar table may not exist: ${error.message}\n`);
  }
  
  // Check for events table
  try {
    const eventsCount = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM events WHERE "workspaceId" = ${workspace.id}
    `;
    
    const events = Number(eventsCount[0]?.count || 0);
    console.log(`📅 Calendar Events/Meetings: ${events.toLocaleString()}`);
    
    if (events > 0) {
      const recentEvents = await prisma.$queryRaw<Array<{
        title: string;
        startTime: Date;
        endTime: Date;
        location: string | null;
      }>>`
        SELECT title, "startTime", "endTime", location
        FROM events
        WHERE "workspaceId" = ${workspace.id}
        ORDER BY "startTime" DESC
        LIMIT 5
      `;
      
      console.log(`   Recent meetings:`);
      for (const event of recentEvents) {
        console.log(`   - ${event.title || '(No Title)'}`);
        console.log(`     ${event.startTime.toLocaleString()} - ${event.endTime.toLocaleString()}`);
        if (event.location) {
          console.log(`     Location: ${event.location}`);
        }
        console.log('');
      }
    }
  } catch (error: any) {
    console.log(`   ⚠️  Calendar events table may not exist: ${error.message}\n`);
  }
  
  // Check for meeting_transcripts
  try {
    const transcriptsCount = await prisma.meeting_transcripts.count({
      where: {
        workspaceId: workspace.id
      }
    });
    
    console.log(`🎤 Meeting Transcripts: ${transcriptsCount.toLocaleString()}\n`);
  } catch (error: any) {
    console.log(`   ⚠️  Meeting transcripts table may not exist\n`);
  }
  
  // Check connections for calendar access
  const connections = await prisma.grand_central_connections.findMany({
    where: {
      workspaceId: workspace.id,
      OR: [
        { provider: 'outlook' },
        { provider: 'google-calendar' },
        { provider: 'gmail' }
      ],
      status: 'active'
    },
    select: {
      provider: true,
      status: true,
      lastSyncAt: true,
      createdAt: true
    }
  });
  
  console.log(`🔗 Active Connections:`);
  console.log(`   Total: ${connections.length}`);
  for (const conn of connections) {
    const hasCalendarAccess = conn.provider === 'outlook' || conn.provider === 'google-calendar';
    console.log(`   - ${conn.provider} (${conn.status})`);
    console.log(`     Calendar Access: ${hasCalendarAccess ? 'Yes ✅' : 'No (email only)'}`);
    console.log(`     Last Sync: ${conn.lastSyncAt ? conn.lastSyncAt.toLocaleString() : 'Never'}`);
    console.log('');
  }
  
  // Check for calendar sync cron job
  console.log('⚙️  Calendar Sync Configuration:');
  console.log('   Check vercel.json for calendar sync cron jobs');
  console.log('   Check CalendarSyncService for sync implementation\n');
  
  console.log('📋 Summary:');
  console.log('   Calendar sync is separate from email sync');
  console.log('   Outlook connections provide both email AND calendar access');
  console.log('   Gmail requires separate calendar connection');
  console.log('   Check if CalendarSyncService is enabled and running\n');
  
  await prisma.$disconnect();
}

main().catch(console.error);

