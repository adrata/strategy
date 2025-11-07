#!/usr/bin/env node
/**
 * Fix Speedrun Ranking System
 * 
 * Issues fixed:
 * 1. Ensures ranks are sequential and unique (1, 2, 3... 50), not duplicates
 * 2. When adding a person to a company in speedrun:
 *    - Remove company's globalRank
 *    - Assign the person the company's rank
 *    - Re-rank everything to maintain 1-50 sequence
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSpeedrunRanking(workspaceId, userId) {
  console.log(`\n🔄 Fixing speedrun ranking for workspace: ${workspaceId}`);
  
  try {
    // Step 1: Get all people and companies with ranks in this workspace
    const [people, companies] = await Promise.all([
      prisma.people.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          globalRank: { not: null }
        },
        include: {
          company: true
        },
        orderBy: { globalRank: 'asc' }
      }),
      prisma.companies.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          globalRank: { not: null }
        },
        include: {
          _count: {
            select: { people: true }
          }
        },
        orderBy: { globalRank: 'asc' }
      })
    ]);
    
    console.log(`\n📊 Current state:`);
    console.log(`  - People with ranks: ${people.length}`);
    console.log(`  - Companies with ranks: ${companies.length}`);
    
    // Step 2: Combine and sort by current rank
    const combined = [
      ...people.map(p => ({ 
        type: 'person', 
        id: p.id, 
        name: p.fullName, 
        rank: p.globalRank,
        mainSellerId: p.mainSellerId,
        companyId: p.companyId
      })),
      ...companies.map(c => ({ 
        type: 'company', 
        id: c.id, 
        name: c.name, 
        rank: c.globalRank,
        mainSellerId: c.mainSellerId,
        peopleCount: c._count.people
      }))
    ].sort((a, b) => (a.rank || 999) - (b.rank || 999));
    
    console.log(`\n📋 Top 10 current ranks:`);
    combined.slice(0, 10).forEach((item, i) => {
      console.log(`  ${i+1}. [${item.type}] Rank ${item.rank} - ${item.name}`);
    });
    
    // Step 3: Check for duplicate ranks
    const rankCounts = {};
    combined.forEach(item => {
      const rank = item.rank;
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });
    
    const duplicates = Object.entries(rankCounts).filter(([rank, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate ranks:`);
      duplicates.slice(0, 5).forEach(([rank, count]) => {
        console.log(`  - Rank ${rank}: ${count} items`);
      });
    }
    
    // Step 4: Filter companies that should NOT have ranks (they have people)
    const companiesWithPeople = companies.filter(c => c._count.people > 0);
    if (companiesWithPeople.length > 0) {
      console.log(`\n🏢 Found ${companiesWithPeople.length} companies with people that need rank removal:`);
      for (const company of companiesWithPeople.slice(0, 5)) {
        console.log(`  - ${company.name} (${company._count.people} people, rank ${company.globalRank})`);
      }
      
      // Remove ranks from companies that have people
      await prisma.companies.updateMany({
        where: {
          id: { in: companiesWithPeople.map(c => c.id) }
        },
        data: { globalRank: null }
      });
      console.log(`  ✅ Removed ranks from ${companiesWithPeople.length} companies with people`);
    }
    
    // Step 5: Re-rank everything with sequential unique ranks (1-50)
    console.log(`\n🔄 Re-ranking all records with sequential unique ranks...`);
    
    // Get fresh data after removing company ranks
    const [freshPeople, freshCompanies] = await Promise.all([
      prisma.people.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: userId },
            { mainSellerId: null }
          ]
        },
        include: { company: true },
        orderBy: [
          { globalRank: 'asc' },
          { createdAt: 'asc' }
        ]
      }),
      prisma.companies.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: userId },
            { mainSellerId: null }
          ],
          // Only companies WITHOUT people
          people: {
            none: {
              deletedAt: null
            }
          }
        },
        orderBy: [
          { globalRank: 'asc' },
          { createdAt: 'asc' }
        ]
      })
    ]);
    
    // Prioritize people over companies
    let rank = 1;
    const updates = [];
    
    // Rank people first (up to 50)
    for (const person of freshPeople) {
      if (rank > 50) break;
      updates.push({
        type: 'person',
        id: person.id,
        name: person.fullName,
        oldRank: person.globalRank,
        newRank: rank
      });
      rank++;
    }
    
    // Then rank companies (if slots remain)
    for (const company of freshCompanies) {
      if (rank > 50) break;
      updates.push({
        type: 'company',
        id: company.id,
        name: company.name,
        oldRank: company.globalRank,
        newRank: rank
      });
      rank++;
    }
    
    console.log(`\n📝 Will update ${updates.length} records:`);
    console.log(`  - People: ${updates.filter(u => u.type === 'person').length}`);
    console.log(`  - Companies: ${updates.filter(u => u.type === 'company').length}`);
    
    // Apply updates
    for (const update of updates) {
      if (update.type === 'person') {
        await prisma.people.update({
          where: { id: update.id },
          data: { globalRank: update.newRank }
        });
      } else {
        await prisma.companies.update({
          where: { id: update.id },
          data: { globalRank: update.newRank }
        });
      }
    }
    
    console.log(`\n✅ Re-ranking complete!`);
    console.log(`\n📋 New top 10 ranks:`);
    updates.slice(0, 10).forEach((item, i) => {
      console.log(`  ${i+1}. [${item.type}] Rank ${item.newRank} - ${item.name} (was: ${item.oldRank || 'unranked'})`);
    });
    
    return { success: true, updated: updates.length };
    
  } catch (error) {
    console.error('❌ Error fixing speedrun ranking:', error);
    throw error;
  }
}

async function main() {
  try {
    // Get Ross's workspace
    const ross = await prisma.users.findFirst({
      where: { email: { contains: 'ross', mode: 'insensitive' } },
      select: { id: true, email: true, activeWorkspaceId: true }
    });
    
    if (!ross) {
      console.error('❌ Ross user not found');
      process.exit(1);
    }
    
    console.log(`👤 Running for: ${ross.email}`);
    console.log(`🏢 Workspace: ${ross.activeWorkspaceId}`);
    
    const result = await fixSpeedrunRanking(ross.activeWorkspaceId, ross.id);
    
    console.log(`\n✨ Done! Updated ${result.updated} records.`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

