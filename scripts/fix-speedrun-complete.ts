#!/usr/bin/env tsx

/**
 * Complete Speedrun Fix Script
 * 
 * This script performs a complete fix of the speedrun system by:
 * 1. Diagnosing current state
 * 2. Re-ranking all people (if needed)
 * 3. Regenerating next action dates
 * 4. Verifying the fix worked
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FixResult {
  workspaceId: string;
  totalPeople: number;
  rankedPeople: number;
  peopleWithNextActionDate: number;
  peopleWithStaleNextActionDate: number;
  needsReRanking: boolean;
  needsNextActionUpdate: boolean;
  top10Before: Array<{
    name: string;
    globalRank: number | null;
    nextActionTiming: string;
  }>;
  top10After: Array<{
    name: string;
    globalRank: number | null;
    nextActionTiming: string;
  }>;
}

/**
 * Calculate next action date based on global rank
 */
function calculateRankBasedDate(globalRank: number | null, lastActionDate: Date | null): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const lastActionToday = lastActionDate && 
    lastActionDate.getFullYear() === now.getFullYear() &&
    lastActionDate.getMonth() === now.getMonth() &&
    lastActionDate.getDate() === now.getDate();
  
  let targetDate: Date;
  
  if (!globalRank || globalRank <= 50) {
    // For top 50, if last action was more than 1 day ago, set to today
    // If last action was today, set to tomorrow
    if (lastActionToday) {
      targetDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    } else {
      targetDate = today;
    }
  } else if (globalRank <= 200) {
    const daysOut = lastActionToday ? 3 : 2;
    targetDate = new Date(today.getTime() + daysOut * 24 * 60 * 60 * 1000);
  } else if (globalRank <= 500) {
    targetDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    targetDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  
  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek === 0) {
    targetDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
  } else if (dayOfWeek === 6) {
    targetDate = new Date(targetDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  }
  
  return targetDate;
}

/**
 * Calculate next action timing for display
 */
function calculateNextActionTiming(nextActionDate: Date | null): string {
  if (!nextActionDate) return 'No date set';
  
  const now = new Date();
  const actionDate = new Date(nextActionDate);
  const diffMs = actionDate.getTime() - now.getTime();
  
  if (diffMs < 0) return 'Overdue';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 2) return 'Now';
  else if (diffHours < 24) return `in ${diffHours}h`;
  else if (diffDays === 1) return 'Tomorrow';
  else if (diffDays <= 7) return `in ${diffDays}d`;
  else return `in ${Math.ceil(diffDays / 7)}w`;
}

/**
 * Get top 10 people for comparison
 */
async function getTop10People(workspaceId: string) {
  const people = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      companyId: { not: null }
    },
    select: {
      fullName: true,
      globalRank: true,
      nextActionDate: true
    },
    orderBy: [
      { globalRank: 'asc' },
      { createdAt: 'desc' }
    ],
    take: 10
  });
  
  return people.map(person => ({
    name: person.fullName || 'Unknown',
    globalRank: person.globalRank,
    nextActionTiming: calculateNextActionTiming(person.nextActionDate)
  }));
}

/**
 * Check if nextActionDate is stale for top 50
 */
function isStaleNextActionDate(globalRank: number | null, nextActionDate: Date | null): boolean {
  if (!nextActionDate || !globalRank) return true;
  if (globalRank > 50) return false;
  
  const now = new Date();
  const diffMs = now.getTime() - nextActionDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays > 1;
}

/**
 * Diagnose current state
 */
async function diagnoseState(workspaceId: string): Promise<FixResult> {
  console.log(`🔍 Diagnosing workspace: ${workspaceId}`);
  
  const allPeople = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      companyId: { not: null }
    },
    select: {
      globalRank: true,
      nextActionDate: true
    }
  });
  
  const rankedPeople = allPeople.filter(p => p.globalRank && p.globalRank <= 50).length;
  const peopleWithNextActionDate = allPeople.filter(p => p.nextActionDate).length;
  
  // Check top 50 for stale dates
  const top50People = allPeople
    .filter(p => p.globalRank && p.globalRank <= 50)
    .sort((a, b) => (a.globalRank || 999) - (b.globalRank || 999))
    .slice(0, 50);
  
  const peopleWithStaleNextActionDate = top50People.filter(p => 
    isStaleNextActionDate(p.globalRank, p.nextActionDate)
  ).length;
  
  const needsReRanking = rankedPeople === 0;
  const needsNextActionUpdate = peopleWithStaleNextActionDate > 0;
  
  const top10Before = await getTop10People(workspaceId);
  
  return {
    workspaceId,
    totalPeople: allPeople.length,
    rankedPeople,
    peopleWithNextActionDate,
    peopleWithStaleNextActionDate,
    needsReRanking,
    needsNextActionUpdate,
    top10Before,
    top10After: [] // Will be filled after fix
  };
}

/**
 * Re-rank people using simple sequential ranking
 */
async function reRankPeople(workspaceId: string, userId: string) {
  console.log(`🔄 Re-ranking people for user: ${userId}`);
  
  const people = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      companyId: { not: null },
      mainSellerId: userId
    },
    select: {
      id: true,
      lastActionDate: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Found ${people.length} people to rank`);
  
  // Simple sequential ranking
  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    const newRank = i + 1;
    const newNextActionDate = calculateRankBasedDate(newRank, person.lastActionDate);
    
    await prisma.people.update({
      where: { id: person.id },
      data: {
        globalRank: newRank,
        nextActionDate: newNextActionDate,
        customFields: {
          userRank: newRank,
          userId: userId,
          rankingMode: 'global'
        },
        updatedAt: new Date()
      }
    });
    
    if (i < 10) {
      console.log(`  Rank ${newRank}: ${person.id}`);
    }
  }
  
  console.log(`✅ Re-ranked ${people.length} people`);
}

/**
 * Update next action dates for all people
 */
async function updateNextActionDates(workspaceId: string) {
  console.log(`📅 Updating next action dates`);
  
  const people = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      companyId: { not: null }
    },
    select: {
      id: true,
      globalRank: true,
      lastActionDate: true
    }
  });
  
  let updatedCount = 0;
  
  for (const person of people) {
    const newNextActionDate = calculateRankBasedDate(person.globalRank, person.lastActionDate);
    
    await prisma.people.update({
      where: { id: person.id },
      data: {
        nextActionDate: newNextActionDate,
        updatedAt: new Date()
      }
    });
    
    updatedCount++;
    
    if (person.globalRank && person.globalRank <= 10) {
      const timing = newNextActionDate <= new Date() ? 'TODAY' : 
                    newNextActionDate.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 ? 'TOMORROW' :
                    'FUTURE';
      console.log(`  Rank ${person.globalRank}: ${timing}`);
    }
  }
  
  console.log(`✅ Updated next action dates for ${updatedCount} people`);
}

/**
 * Main fix function
 */
async function fixSpeedrunComplete(workspaceId: string, userId: string, dryRun: boolean = false) {
  console.log(`🚀 ${dryRun ? 'DRY RUN: ' : ''}COMPLETE SPEEDRUN FIX`);
  console.log(`Workspace: ${workspaceId}`);
  console.log(`User: ${userId}`);
  console.log('=============================\n');
  
  // Step 1: Diagnose current state
  const diagnosis = await diagnoseState(workspaceId);
  
  console.log('📊 CURRENT STATE:');
  console.log(`  Total people: ${diagnosis.totalPeople}`);
  console.log(`  Ranked people (1-50): ${diagnosis.rankedPeople}`);
  console.log(`  People with nextActionDate: ${diagnosis.peopleWithNextActionDate}`);
  console.log(`  Top 50 with stale nextActionDate: ${diagnosis.peopleWithStaleNextActionDate}`);
  console.log(`  Needs re-ranking: ${diagnosis.needsReRanking ? 'YES' : 'NO'}`);
  console.log(`  Needs next action update: ${diagnosis.needsNextActionUpdate ? 'YES' : 'NO'}`);
  
  console.log('\n🏆 TOP 10 BEFORE FIX:');
  diagnosis.top10Before.forEach((person, index) => {
    console.log(`  ${index + 1}. Rank ${person.globalRank}: ${person.name} (${person.nextActionTiming})`);
  });
  
  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No changes will be made');
    return;
  }
  
  // Step 2: Re-rank if needed
  if (diagnosis.needsReRanking) {
    console.log('\n🔄 RE-RANKING PEOPLE...');
    await reRankPeople(workspaceId, userId);
  } else {
    console.log('\n✅ People already ranked, skipping re-ranking');
  }
  
  // Step 3: Update next action dates
  if (diagnosis.needsNextActionUpdate) {
    console.log('\n📅 UPDATING NEXT ACTION DATES...');
    await updateNextActionDates(workspaceId);
  } else {
    console.log('\n✅ Next action dates are current, skipping update');
  }
  
  // Step 4: Verify fix
  console.log('\n🔍 VERIFYING FIX...');
  const top10After = await getTop10People(workspaceId);
  
  console.log('\n🏆 TOP 10 AFTER FIX:');
  top10After.forEach((person, index) => {
    console.log(`  ${index + 1}. Rank ${person.globalRank}: ${person.name} (${person.nextActionTiming})`);
  });
  
  // Check if fix worked
  const nowCount = top10After.filter(p => p.nextActionTiming === 'Now').length;
  const todayCount = top10After.filter(p => p.nextActionTiming === 'Tomorrow').length;
  
  console.log('\n📈 RESULTS:');
  console.log(`  Records showing "Now": ${nowCount}`);
  console.log(`  Records showing "Tomorrow": ${todayCount}`);
  
  if (nowCount > 0 || todayCount > 0) {
    console.log('✅ SUCCESS: Top records now show proper timing!');
  } else {
    console.log('⚠️  WARNING: Top records still not showing "Now" or "Tomorrow"');
    console.log('   This might indicate the ranking algorithm needs adjustment');
  }
  
  console.log('\n🎉 FIX COMPLETE!');
  console.log('\nNext steps:');
  console.log('1. Refresh your browser to see the changes');
  console.log('2. Check the speedrun table - timing should show "Now" or "Today"');
  console.log('3. Complete an action to test the re-ranking system');
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const workspaceId = args.find(arg => !arg.startsWith('--'));
    const userId = args[args.indexOf(workspaceId || '') + 1];
    
    if (!workspaceId || !userId) {
      console.log('Usage: tsx scripts/fix-speedrun-complete.ts [--dry-run] <workspace-id> <user-id>');
      console.log('Example: tsx scripts/fix-speedrun-complete.ts --dry-run 01K7464TNANHQXPCZT1FYX205V 01K7469230N74BVGK2PABPNNZ9');
      console.log('         tsx scripts/fix-speedrun-complete.ts 01K7464TNANHQXPCZT1FYX205V 01K7469230N74BVGK2PABPNNZ9');
      process.exit(1);
    }
    
    await fixSpeedrunComplete(workspaceId, userId, dryRun);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
