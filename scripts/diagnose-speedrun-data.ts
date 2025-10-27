#!/usr/bin/env tsx

/**
 * Speedrun Data Diagnostic Script
 * 
 * Checks the current state of speedrun data in the database to identify
 * issues with nextActionDate values and ranking
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DiagnosticResult {
  workspaceId: string;
  totalPeople: number;
  rankedPeople: number;
  peopleWithNextActionDate: number;
  peopleWithStaleNextActionDate: number;
  top50People: Array<{
    id: string;
    name: string;
    globalRank: number | null;
    nextActionDate: Date | null;
    lastActionDate: Date | null;
    nextActionTiming: string;
  }>;
}

/**
 * Calculate next action timing based on date
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
 * Check if nextActionDate is stale (more than 1 day old for top 50)
 */
function isStaleNextActionDate(globalRank: number | null, nextActionDate: Date | null): boolean {
  if (!nextActionDate || !globalRank) return true;
  if (globalRank > 50) return false; // Only check top 50
  
  const now = new Date();
  const diffMs = now.getTime() - nextActionDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays > 1; // Stale if more than 1 day old
}

async function diagnoseSpeedrunData(workspaceId: string): Promise<DiagnosticResult> {
  console.log(`🔍 Diagnosing speedrun data for workspace: ${workspaceId}`);
  
  // Get all people in workspace
  const allPeople = await prisma.people.findMany({
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
      lastActionDate: true,
      mainSellerId: true
    }
  });
  
  // Get top 50 people (by globalRank or by creation date if no rank)
  const top50People = allPeople
    .filter(p => p.globalRank && p.globalRank <= 50)
    .sort((a, b) => (a.globalRank || 999) - (b.globalRank || 999))
    .slice(0, 50)
    .map(person => ({
      id: person.id,
      name: person.fullName || 'Unknown',
      globalRank: person.globalRank,
      nextActionDate: person.nextActionDate,
      lastActionDate: person.lastActionDate,
      nextActionTiming: calculateNextActionTiming(person.nextActionDate)
    }));
  
  // Calculate statistics
  const totalPeople = allPeople.length;
  const rankedPeople = allPeople.filter(p => p.globalRank && p.globalRank <= 50).length;
  const peopleWithNextActionDate = allPeople.filter(p => p.nextActionDate).length;
  const peopleWithStaleNextActionDate = top50People.filter(p => 
    isStaleNextActionDate(p.globalRank, p.nextActionDate)
  ).length;
  
  return {
    workspaceId,
    totalPeople,
    rankedPeople,
    peopleWithNextActionDate,
    peopleWithStaleNextActionDate,
    top50People
  };
}

async function main() {
  try {
    console.log('🚀 SPEEDRUN DATA DIAGNOSTIC');
    console.log('============================\n');
    
    // Get workspace IDs from command line or use default
    const workspaceIds = process.argv.slice(2);
    
    if (workspaceIds.length === 0) {
      console.log('Usage: tsx scripts/diagnose-speedrun-data.ts <workspace-id-1> [workspace-id-2] ...');
      console.log('Example: tsx scripts/diagnose-speedrun-data.ts 01K7464TNANHQXPCZT1FYX205V');
      process.exit(1);
    }
    
    for (const workspaceId of workspaceIds) {
      const result = await diagnoseSpeedrunData(workspaceId);
      
      console.log(`\n📊 WORKSPACE: ${workspaceId}`);
      console.log(`Total people: ${result.totalPeople}`);
      console.log(`Ranked people (1-50): ${result.rankedPeople}`);
      console.log(`People with nextActionDate: ${result.peopleWithNextActionDate}`);
      console.log(`Top 50 with stale nextActionDate: ${result.peopleWithStaleNextActionDate}`);
      
      console.log('\n🏆 TOP 10 PEOPLE:');
      result.top50People.slice(0, 10).forEach((person, index) => {
        const staleIndicator = isStaleNextActionDate(person.globalRank, person.nextActionDate) ? ' ⚠️  STALE' : ' ✅';
        console.log(`  ${index + 1}. Rank ${person.globalRank}: ${person.name}`);
        console.log(`     Next Action: ${person.nextActionTiming}${staleIndicator}`);
        console.log(`     Last Action: ${person.lastActionDate ? person.lastActionDate.toISOString().split('T')[0] : 'Never'}`);
        console.log('');
      });
      
      // Check for issues
      if (result.peopleWithStaleNextActionDate > 0) {
        console.log(`❌ ISSUE: ${result.peopleWithStaleNextActionDate} top 50 people have stale nextActionDate values`);
        console.log('   This explains why timing shows "in 7d" instead of "Now" or "Today"');
      }
      
      if (result.rankedPeople === 0) {
        console.log('❌ ISSUE: No people have globalRank values (1-50)');
        console.log('   This means the ranking system has not been run');
      }
      
      if (result.peopleWithNextActionDate === 0) {
        console.log('❌ ISSUE: No people have nextActionDate values');
        console.log('   This means next action dates have never been calculated');
      }
    }
    
    console.log('\n✅ DIAGNOSTIC COMPLETE');
    console.log('\nNext steps:');
    console.log('1. If you see stale nextActionDate values, run the fix script');
    console.log('2. If you see no ranked people, run the re-rank API');
    console.log('3. If you see no nextActionDate values, run the regenerate script');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
