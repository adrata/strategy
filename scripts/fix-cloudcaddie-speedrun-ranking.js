#!/usr/bin/env node

/**
 * 🔄 FIX CLOUDCADDIE SPEEDRUN RANKING
 * 
 * Checks current speedrun ranking status and triggers re-ranking
 * to ensure top 50 slots are filled with companies and people
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CLOUDCADDIE_WORKSPACE_ID = '01K7DSWP8ZBA75K5VSWVXPEMAH';

async function checkCurrentRankings(workspaceId, userId) {
  console.log('📊 CHECKING CURRENT RANKINGS:\n');
  
  // Count people with ranks 1-50
  const peopleWithRank = await prisma.people.count({
    where: {
      workspaceId,
      deletedAt: null,
      globalRank: { not: null, gte: 1, lte: 50 },
      OR: [
        { mainSellerId: userId },
        { mainSellerId: null }
      ]
    }
  });
  
  // Count companies with ranks 1-50
  const companiesWithRank = await prisma.companies.count({
    where: {
      workspaceId,
      deletedAt: null,
      globalRank: { not: null, gte: 1, lte: 50 },
      OR: [
        { mainSellerId: userId },
        { mainSellerId: null }
      ]
    }
  });
  
  // Count total people eligible for ranking
  const totalPeople = await prisma.people.count({
    where: {
      workspaceId,
      deletedAt: null,
      companyId: { not: null },
      OR: [
        { mainSellerId: userId },
        { mainSellerId: null }
      ]
    }
  });
  
  // Count total companies eligible for ranking
  const totalCompanies = await prisma.companies.count({
    where: {
      workspaceId,
      deletedAt: null,
      OR: [
        { mainSellerId: userId },
        { mainSellerId: null }
      ]
    }
  });
  
  console.log(`   People with ranks 1-50: ${peopleWithRank}`);
  console.log(`   Companies with ranks 1-50: ${companiesWithRank}`);
  console.log(`   Total ranked (1-50): ${peopleWithRank + companiesWithRank}`);
  console.log(`   Total people eligible: ${totalPeople}`);
  console.log(`   Total companies eligible: ${totalCompanies}`);
  
  // Show top 10 ranked records
  const topPeople = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      globalRank: { not: null, gte: 1, lte: 50 },
      OR: [
        { mainSellerId: userId },
        { mainSellerId: null }
      ]
    },
    select: {
      id: true,
      fullName: true,
      globalRank: true,
      company: {
        select: {
          name: true
        }
      }
    },
    orderBy: { globalRank: 'asc' },
    take: 10
  });
  
  const topCompanies = await prisma.companies.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      globalRank: { not: null, gte: 1, lte: 50 },
      OR: [
        { mainSellerId: userId },
        { mainSellerId: null }
      ]
    },
    select: {
      id: true,
      name: true,
      globalRank: true
    },
    orderBy: { globalRank: 'asc' },
    take: 10
  });
  
  const allTop = [
    ...topPeople.map(p => ({ type: 'person', name: p.fullName, company: p.company?.name, rank: p.globalRank })),
    ...topCompanies.map(c => ({ type: 'company', name: c.name, company: null, rank: c.globalRank }))
  ].sort((a, b) => (a.rank || 999) - (b.rank || 999)).slice(0, 10);
  
  console.log('\n   Top 10 ranked records:');
  allTop.forEach((record, idx) => {
    const companyText = record.company ? ` (${record.company})` : '';
    console.log(`   ${idx + 1}. ${record.type === 'person' ? '👤' : '🏢'} Rank ${record.rank}: ${record.name}${companyText}`);
  });
  
  return {
    peopleWithRank,
    companiesWithRank,
    totalRanked: peopleWithRank + companiesWithRank,
    totalPeople,
    totalCompanies
  };
}

async function triggerReRanking(workspaceId, userId) {
  console.log('\n🔄 TRIGGERING RE-RANKING...\n');
  
  // Check if we should use API or direct database update
  const useAPI = process.env.NEXTAUTH_URL || process.env.VERCEL_URL;
  
  if (useAPI) {
    console.log('   Using API endpoint for re-ranking...');
    try {
      const apiUrl = `${useAPI}/api/v1/speedrun/re-rank`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
          'x-user-id': userId
        },
        body: JSON.stringify({
          completedCount: 0,
          trigger: 'manual-re-rank',
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(`Re-ranking failed: ${result.error || 'Unknown error'}`);
      }
      
      console.log('   ✅ Re-ranking completed via API');
      return true;
    } catch (error) {
      console.log(`   ⚠️  API re-ranking failed: ${error.message}`);
      console.log('   Falling back to direct database re-ranking...\n');
    }
  }
  
  // Fallback: Direct database re-ranking
  console.log('   Using direct database re-ranking...');
  
  // Get all people with companies, assigned to this user
  const people = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      companyId: { not: null },
      OR: [
        { mainSellerId: userId },
        { mainSellerId: null }
      ]
    },
    select: {
      id: true,
      fullName: true,
      companyId: true,
      createdAt: true,
      company: {
        select: {
          name: true,
          globalRank: true
        }
      },
      lastActionDate: true
    },
    orderBy: [
      { company: { globalRank: 'asc' } },
      { createdAt: 'asc' }
    ]
  });
  
  // Get all companies without people, assigned to this user
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      OR: [
        { mainSellerId: userId },
        { mainSellerId: null }
      ],
      people: {
        none: {
          deletedAt: null,
          OR: [
            { mainSellerId: userId },
            { mainSellerId: null }
          ]
        }
      }
    },
    select: {
      id: true,
      name: true,
      globalRank: true
    },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`   Found ${people.length} people and ${companies.length} companies to rank`);
  
  // STEP 1: Clear all existing ranks first to avoid duplicates
  console.log('   Clearing all existing ranks...');
  await prisma.people.updateMany({
    where: {
      workspaceId,
      deletedAt: null,
      globalRank: { not: null },
      OR: [
        { mainSellerId: userId },
        { mainSellerId: null }
      ]
    },
    data: {
      globalRank: null
    }
  });
  
  await prisma.companies.updateMany({
    where: {
      workspaceId,
      deletedAt: null,
      globalRank: { not: null },
      OR: [
        { mainSellerId: userId },
        { mainSellerId: null }
      ]
    },
    data: {
      globalRank: null
    }
  });
  
  // STEP 2: Sort people by priority (keep existing order from query, which uses company rank then creation date)
  // The query already orders by company rank and creation date, so we can use that order
  // But since we cleared ranks, we'll just use creation date for now
  people.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateA - dateB;
  });
  
  // STEP 3: Rank people first (1-N, limit to 50)
  let currentRank = 1;
  const peopleToUpdate = [];
  
  for (const person of people) {
    if (currentRank > 50) break; // Stop if we've reached 50
    
    peopleToUpdate.push({
      id: person.id,
      globalRank: currentRank,
      nextActionDate: calculateNextActionDate(currentRank, person.lastActionDate)
    });
    currentRank++;
  }
  
  // Rank companies (continue from where people left off, but only up to 50 total)
  const companiesToUpdate = [];
  const remainingSlots = Math.max(0, 50 - (currentRank - 1));
  const companiesToRank = companies.slice(0, remainingSlots);
  
  for (const company of companiesToRank) {
    companiesToUpdate.push({
      id: company.id,
      globalRank: currentRank
    });
    currentRank++;
  }
  
  console.log(`   Assigning ranks 1-${currentRank - 1} (${peopleToUpdate.length} people, ${companiesToUpdate.length} companies)`);
  
  // Update people (sequential updates to avoid transaction issues)
  console.log(`   Updating ${peopleToUpdate.length} people...`);
  let updated = 0;
  for (const update of peopleToUpdate) {
    await prisma.people.update({
      where: { id: update.id },
      data: {
        globalRank: update.globalRank,
        nextActionDate: update.nextActionDate
      }
    });
    updated++;
    if (updated % 10 === 0) {
      console.log(`   ... ${updated}/${peopleToUpdate.length} people updated`);
    }
  }
  
  // Update companies
  console.log(`   Updating ${companiesToUpdate.length} companies...`);
  for (const update of companiesToUpdate) {
    await prisma.companies.update({
      where: { id: update.id },
      data: {
        globalRank: update.globalRank
      }
    });
  }
  
  // Note: All ranks beyond top 50 are already cleared in STEP 1
  
  console.log('   ✅ Re-ranking completed via database');
  return true;
}

function calculateNextActionDate(globalRank, lastActionDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const lastActionToday = lastActionDate && 
    lastActionDate.getFullYear() === now.getFullYear() &&
    lastActionDate.getMonth() === now.getMonth() &&
    lastActionDate.getDate() === now.getDate();
  
  let targetDate;
  
  if (!globalRank || globalRank <= 50) {
    targetDate = lastActionToday 
      ? new Date(today.getTime() + 24 * 60 * 60 * 1000) 
      : today;
  } else if (globalRank <= 200) {
    const daysOut = lastActionToday ? 3 : 2;
    targetDate = new Date(today.getTime() + daysOut * 24 * 60 * 60 * 1000);
  } else if (globalRank <= 500) {
    targetDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    targetDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  
  // Push weekend dates to Monday
  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek === 0) {
    targetDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
  } else if (dayOfWeek === 6) {
    targetDate = new Date(targetDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  }
  
  return targetDate;
}

async function fixCloudCaddieSpeedrunRanking() {
  try {
    console.log('🔄 FIXING CLOUDCADDIE SPEEDRUN RANKING');
    console.log('=======================================\n');
    
    // Find CloudCaddie workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        id: CLOUDCADDIE_WORKSPACE_ID
      }
    });
    
    if (!workspace) {
      console.log('❌ CloudCaddie workspace not found!');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Find Justin (main user for CloudCaddie)
    const justin = await prisma.users.findFirst({
      where: {
        email: 'justin.johnson@cloudcaddie.com'
      }
    });
    
    if (!justin) {
      console.log('❌ Justin Johnson user not found!');
      return;
    }
    
    console.log(`✅ Found user: ${justin.firstName} ${justin.lastName} (${justin.email})`);
    console.log(`   User ID: ${justin.id}\n`);
    
    // Check current rankings BEFORE
    console.log('📊 BEFORE RE-RANKING:');
    const before = await checkCurrentRankings(workspace.id, justin.id);
    
    // Trigger re-ranking
    await triggerReRanking(workspace.id, justin.id);
    
    // Check current rankings AFTER
    console.log('\n📊 AFTER RE-RANKING:');
    const after = await checkCurrentRankings(workspace.id, justin.id);
    
    // Summary
    console.log('\n📈 SUMMARY:');
    console.log(`   Before: ${before.totalRanked} records ranked (1-50)`);
    console.log(`   After:  ${after.totalRanked} records ranked (1-50)`);
    console.log(`   Change: ${after.totalRanked - before.totalRanked > 0 ? '+' : ''}${after.totalRanked - before.totalRanked}`);
    
    if (after.totalRanked >= 50) {
      console.log('\n✅ SUCCESS: Speedrun now has 50 ranked records!');
      console.log('\n📝 NOTE: The UI may still show cached results (43 records).');
      console.log('   To see the updated 50 records, please:');
      console.log('   1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)');
      console.log('   2. Or wait 5 minutes for the cache to expire');
      console.log('   3. Or add ?refresh=true to the URL to bypass cache');
    } else if (after.totalRanked > before.totalRanked) {
      console.log(`\n⚠️  PARTIAL SUCCESS: Only ${after.totalRanked} records ranked (expected 50)`);
      console.log(`   This may be because there are only ${after.totalPeople + after.totalCompanies} eligible records total.`);
    } else {
      console.log('\n❌ RE-RANKING DID NOT INCREASE COUNT');
      console.log('   Check logs above for errors');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCloudCaddieSpeedrunRanking();

