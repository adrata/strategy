#!/usr/bin/env tsx

/**
 * Fix Speedrun Next Actions Script
 * 
 * Regenerates nextActionDate values for all people based on their current globalRank
 * This fixes the issue where production shows "in 7d" instead of "Now" or "Today"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate next action date based on global rank
 * This matches the logic from /api/v1/next-action/regenerate/route.ts
 */
function calculateRankBasedDate(globalRank: number | null, lastActionDate: Date | null): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Check if last action was today
  const lastActionToday = lastActionDate && 
    lastActionDate.getFullYear() === now.getFullYear() &&
    lastActionDate.getMonth() === now.getMonth() &&
    lastActionDate.getDate() === now.getDate();
  
  let targetDate: Date;
  
  // Rank-based date calculation (Speedrun integration)
  if (!globalRank || globalRank <= 50) {
    // Top 50 (Speedrun tier): TODAY (or tomorrow if action already today)
    targetDate = lastActionToday ? new Date(today.getTime() + 24 * 60 * 60 * 1000) : today;
  } else if (globalRank <= 200) {
    // High priority (51-200): THIS WEEK (2-3 days)
    const daysOut = lastActionToday ? 3 : 2;
    targetDate = new Date(today.getTime() + daysOut * 24 * 60 * 60 * 1000);
  } else if (globalRank <= 500) {
    // Medium priority (201-500): NEXT WEEK (7 days)
    targetDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    // Lower priority (500+): THIS MONTH (14 days)
    targetDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  
  // Push weekend dates to Monday
  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek === 0) { // Sunday
    targetDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
  } else if (dayOfWeek === 6) { // Saturday
    targetDate = new Date(targetDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  }
  
  return targetDate;
}

/**
 * Generate next action text based on last action
 */
function generateNextActionText(lastAction: string | null): string {
  if (!lastAction || lastAction === 'No action taken') {
    return 'Send initial outreach email';
  }
  
  const lastActionLower = lastAction.toLowerCase();
  
  if (lastActionLower.includes('email')) {
    return 'Schedule a call to discuss next steps';
  } else if (lastActionLower.includes('call')) {
    return 'Send follow-up email with meeting notes';
  } else if (lastActionLower.includes('linkedin')) {
    return 'Send personalized connection message';
  } else if (lastActionLower.includes('created') || lastActionLower.includes('added')) {
    return 'Send initial outreach email';
  } else {
    return 'Follow up on previous contact';
  }
}

async function fixSpeedrunNextActions(workspaceId: string, dryRun: boolean = false) {
  console.log(`🔧 ${dryRun ? 'DRY RUN: ' : ''}Fixing speedrun next actions for workspace: ${workspaceId}`);
  
  // Get all people in workspace with their current data
  const people = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      companyId: { not: null }
    },
    select: {
      id: true,
      fullName: true,
      globalRank: true,
      nextActionDate: true,
      nextAction: true,
      lastActionDate: true,
      lastAction: true,
      mainSellerId: true
    },
    orderBy: [
      { globalRank: 'asc' },
      { createdAt: 'desc' }
    ]
  });
  
  console.log(`Found ${people.length} people to process`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  // Process people in batches
  const batchSize = 100;
  for (let i = 0; i < people.length; i += batchSize) {
    const batch = people.slice(i, i + batchSize);
    
    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(people.length / batchSize)}`);
    
    for (const person of batch) {
      const newNextActionDate = calculateRankBasedDate(person.globalRank, person.lastActionDate);
      const newNextAction = generateNextActionText(person.lastAction);
      
      // Check if update is needed
      const needsUpdate = 
        !person.nextActionDate || 
        person.nextActionDate.getTime() !== newNextActionDate.getTime() ||
        !person.nextAction ||
        person.nextAction !== newNextAction;
      
      if (!needsUpdate) {
        skippedCount++;
        continue;
      }
      
      if (dryRun) {
        console.log(`  Would update ${person.fullName} (rank ${person.globalRank}):`);
        console.log(`    Next Action Date: ${person.nextActionDate?.toISOString() || 'NULL'} -> ${newNextActionDate.toISOString()}`);
        console.log(`    Next Action: ${person.nextAction || 'NULL'} -> ${newNextAction}`);
      } else {
        await prisma.people.update({
          where: { id: person.id },
          data: {
            nextActionDate: newNextActionDate,
            nextAction: newNextAction,
            updatedAt: new Date()
          }
        });
      }
      
      updatedCount++;
      
      // Log progress for top 50
      if (person.globalRank && person.globalRank <= 50) {
        const timing = newNextActionDate <= new Date() ? 'TODAY' : 
                      newNextActionDate.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 ? 'TOMORROW' :
                      'FUTURE';
        console.log(`  ✅ Rank ${person.globalRank}: ${person.fullName} -> ${timing}`);
      }
    }
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`  Updated: ${updatedCount} people`);
  console.log(`  Skipped: ${skippedCount} people (no changes needed)`);
  
  if (dryRun) {
    console.log(`\n⚠️  This was a DRY RUN - no changes were made`);
    console.log(`   Run without --dry-run to apply changes`);
  } else {
    console.log(`\n✅ Next action dates have been updated!`);
    console.log(`   Top 50 people should now show "Now" or "Today" timing`);
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const workspaceIds = args.filter(arg => !arg.startsWith('--'));
    
    if (workspaceIds.length === 0) {
      console.log('Usage: tsx scripts/fix-speedrun-next-actions.ts [--dry-run] <workspace-id-1> [workspace-id-2] ...');
      console.log('Example: tsx scripts/fix-speedrun-next-actions.ts --dry-run 01K7464TNANHQXPCZT1FYX205V');
      console.log('         tsx scripts/fix-speedrun-next-actions.ts 01K7464TNANHQXPCZT1FYX205V');
      process.exit(1);
    }
    
    console.log('🚀 SPEEDRUN NEXT ACTIONS FIX');
    console.log('=============================\n');
    
    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    }
    
    for (const workspaceId of workspaceIds) {
      await fixSpeedrunNextActions(workspaceId, dryRun);
    }
    
    console.log('\n🎉 ALL WORKSPACES PROCESSED');
    console.log('\nNext steps:');
    console.log('1. Check the speedrun table - timing should now show "Now" or "Today" for top records');
    console.log('2. If you still see issues, run the re-rank API to update globalRank values');
    console.log('3. Clear browser cache to see changes immediately');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
