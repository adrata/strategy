#!/usr/bin/env tsx

/**
 * Check Calendar Sync Coverage
 * 
 * This script checks how many calendar events are synced and their date ranges
 * to verify we have both past and future meetings.
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
  console.log('📅 Calendar Sync Coverage Check');
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

  // Get all events for Victoria
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const allEvents = await prisma.events.findMany({
    where: {
      workspaceId: workspace.id,
      userId: victoria.id
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      companyId: true,
      personId: true,
      platform: true
    },
    orderBy: {
      startTime: 'asc'
    }
  });

  console.log(`📊 Total Events Synced: ${allEvents.length}\n`);

  if (allEvents.length === 0) {
    console.log('⚠️  No events found. Calendar sync may not have run yet.');
    await prisma.$disconnect();
    return;
  }

  // Analyze date ranges
  const pastEvents = allEvents.filter(e => e.startTime < now);
  const futureEvents = allEvents.filter(e => e.startTime >= now);
  const veryOldEvents = allEvents.filter(e => e.startTime < oneYearAgo);
  const veryFutureEvents = allEvents.filter(e => e.startTime > oneYearFromNow);

  const earliestEvent = allEvents[0];
  const latestEvent = allEvents[allEvents.length - 1];

  console.log('📅 Date Range Analysis:');
  console.log(`   Earliest Event: ${earliestEvent.startTime.toISOString()}`);
  console.log(`   Latest Event: ${latestEvent.startTime.toISOString()}`);
  console.log(`   Date Range: ${Math.round((latestEvent.startTime.getTime() - earliestEvent.startTime.getTime()) / (1000 * 60 * 60 * 24))} days\n`);

  console.log('📊 Event Distribution:');
  console.log(`   Past Events (< now): ${pastEvents.length}`);
  console.log(`   Future Events (>= now): ${futureEvents.length}`);
  console.log(`   Very Old Events (< 1 year ago): ${veryOldEvents.length}`);
  console.log(`   Very Future Events (> 1 year from now): ${veryFutureEvents.length}\n`);

  // Check for gaps
  const eventsByMonth: { [key: string]: number } = {};
  allEvents.forEach(event => {
    const monthKey = `${event.startTime.getFullYear()}-${String(event.startTime.getMonth() + 1).padStart(2, '0')}`;
    eventsByMonth[monthKey] = (eventsByMonth[monthKey] || 0) + 1;
  });

  const sortedMonths = Object.keys(eventsByMonth).sort();
  console.log('📅 Events by Month:');
  sortedMonths.forEach(month => {
    console.log(`   ${month}: ${eventsByMonth[month]} events`);
  });
  console.log('');

  // Check linked events
  const linkedToCompany = allEvents.filter(e => e.companyId).length;
  const linkedToPerson = allEvents.filter(e => e.personId).length;
  const unlinked = allEvents.filter(e => !e.companyId && !e.personId).length;

  console.log('🔗 Event Linking:');
  console.log(`   Linked to Company: ${linkedToCompany}`);
  console.log(`   Linked to Person: ${linkedToPerson}`);
  console.log(`   Unlinked: ${unlinked}\n`);

  // Platform breakdown
  const platformCounts: { [key: string]: number } = {};
  allEvents.forEach(event => {
    platformCounts[event.platform] = (platformCounts[event.platform] || 0) + 1;
  });

  console.log('📱 Platform Breakdown:');
  Object.entries(platformCounts).forEach(([platform, count]) => {
    console.log(`   ${platform}: ${count} events`);
  });
  console.log('');

  // Recent events (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentEvents = allEvents.filter(e => e.startTime >= sevenDaysAgo && e.startTime <= now);
  
  // Upcoming events (next 7 days)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEvents = allEvents.filter(e => e.startTime >= now && e.startTime <= sevenDaysFromNow);

  console.log('📅 Recent & Upcoming:');
  console.log(`   Events in last 7 days: ${recentEvents.length}`);
  console.log(`   Events in next 7 days: ${upcomingEvents.length}\n`);

  // Summary
  console.log('✅ Coverage Summary:');
  const hasPastEvents = pastEvents.length > 0;
  const hasFutureEvents = futureEvents.length > 0;
  const hasOldEvents = veryOldEvents.length > 0;
  const hasVeryFutureEvents = veryFutureEvents.length > 0;

  console.log(`   ${hasPastEvents ? '✅' : '❌'} Past meetings synced: ${pastEvents.length} events`);
  console.log(`   ${hasFutureEvents ? '✅' : '❌'} Future meetings synced: ${futureEvents.length} events`);
  console.log(`   ${hasOldEvents ? '✅' : '⚠️'} Historical coverage (>1 year ago): ${veryOldEvents.length} events`);
  console.log(`   ${hasVeryFutureEvents ? '✅' : '⚠️'} Extended future coverage (>1 year ahead): ${veryFutureEvents.length} events`);

  if (hasPastEvents && hasFutureEvents) {
    console.log('\n✅ Calendar sync appears to be working correctly!');
    console.log('   Both past and future meetings are being synced.');
  } else {
    console.log('\n⚠️  Calendar sync may need attention:');
    if (!hasPastEvents) {
      console.log('   - No past events found. Consider running historical sync.');
    }
    if (!hasFutureEvents) {
      console.log('   - No future events found. Check cron job configuration.');
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
