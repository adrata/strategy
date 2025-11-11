#!/usr/bin/env node

/**
 * Calculate estimated completion time for buyer group processing
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function estimateCompletion() {
  const prisma = new PrismaClient();
  
  try {
    // Get total companies
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { website: { not: null } },
          { linkedinUrl: { not: null } }
        ]
      }
    });
    
    // Get buyer groups created today (all of today)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const buyerGroupsToday = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        createdAt: { gte: startOfDay }
      },
      select: {
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    if (buyerGroupsToday.length === 0) {
      console.log('No buyer groups created today yet.');
      return;
    }
    
    const now = new Date();
    
    // Use the first buyer group created today as start time
    const firstCreated = new Date(buyerGroupsToday[0].createdAt);
    const processed = buyerGroupsToday.length;
    
    const elapsedMs = now.getTime() - firstCreated.getTime();
    const elapsedMinutes = Math.max(elapsedMs / 1000 / 60, 1); // At least 1 minute to avoid division by zero
    
    // Calculate rate
    const ratePerMinute = processed / elapsedMinutes;
    const ratePerHour = ratePerMinute * 60;
    
    // Show start time
    const startTimeStr = firstCreated.toLocaleTimeString();
    
    // Estimate remaining
    const remaining = totalCompanies - processed;
    const minutesRemaining = remaining / ratePerMinute;
    const hoursRemaining = minutesRemaining / 60;
    
    // Estimated completion time
    const completionTime = new Date(now.getTime() + minutesRemaining * 60 * 1000);
    
    console.log('\n⏱️  Processing Time Estimate\n');
    console.log('='.repeat(60));
    console.log(`📊 Statistics:`);
    console.log(`   - Total companies: ${totalCompanies}`);
    console.log(`   - Processed today: ${processed}`);
    console.log(`   - Remaining: ${remaining}`);
    console.log(`   - Started at: ${startTimeStr}`);
    console.log(`   - Elapsed time: ${elapsedMinutes.toFixed(1)} minutes (${(elapsedMinutes/60).toFixed(1)} hours)`);
    console.log(`\n⚡ Processing Rate:`);
    console.log(`   - ${ratePerMinute.toFixed(2)} companies/minute`);
    console.log(`   - ${ratePerHour.toFixed(1)} companies/hour`);
    console.log(`\n⏰ Estimated Completion:`);
    console.log(`   - Time remaining: ${hoursRemaining.toFixed(1)} hours (${minutesRemaining.toFixed(0)} minutes)`);
    console.log(`   - Estimated finish: ${completionTime.toLocaleTimeString()} (${completionTime.toLocaleDateString()})`);
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

estimateCompletion();

