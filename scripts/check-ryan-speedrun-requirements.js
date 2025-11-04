#!/usr/bin/env node

/**
 * Check Ryan's Speedrun data against requirements
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRyanSpeedrunRequirements() {
  try {
    await prisma.$connect();
    
    // Find Ryan
    const ryan = await prisma.users.findFirst({
      where: { email: 'ryan@notaryeveryday.com' },
      select: { id: true, email: true, name: true }
    });
    
    if (!ryan) {
      console.log('❌ Ryan user not found');
      return;
    }

    // Find Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: 'notary-everyday' }
        ]
      },
      select: { id: true, name: true }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log('🔍 Checking Ryan\'s Speedrun Requirements\n');
    console.log(`User: ${ryan.name} (${ryan.id})`);
    console.log(`Workspace: ${workspace.name} (${workspace.id})\n`);

    // Check people with Ryan as main seller
    const allRyanPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyId: true,
        globalRank: true,
        status: true
      }
    });

    console.log(`📊 Total People with Ryan as Main Seller: ${allRyanPeople.length}\n`);

    // Check requirements for Speedrun (based on API logic):
    // 1. Must have companyId (not null)
    // 2. Must have globalRank between 1-50 (not null, gte: 1, lte: 50)
    // 3. Must not be deleted (deletedAt = null) - already filtered
    // 4. mainSellerId must match Ryan's ID - already filtered

    const withCompany = allRyanPeople.filter(p => p.companyId !== null);
    const withRank = allRyanPeople.filter(p => p.globalRank !== null);
    const withRank1to50 = allRyanPeople.filter(p => p.globalRank !== null && p.globalRank >= 1 && p.globalRank <= 50);
    const withCompanyAndRank = allRyanPeople.filter(p => p.companyId !== null && p.globalRank !== null);
    const eligible = allRyanPeople.filter(p => 
      p.companyId !== null && 
      p.globalRank !== null && 
      p.globalRank >= 1 && 
      p.globalRank <= 50
    );

    console.log('📋 Speedrun Requirements Check:');
    console.log('================================');
    console.log(`✅ Has Company: ${withCompany.length} / ${allRyanPeople.length}`);
    console.log(`✅ Has Global Rank: ${withRank.length} / ${allRyanPeople.length}`);
    console.log(`✅ Has Rank 1-50: ${withRank1to50.length} / ${allRyanPeople.length}`);
    console.log(`✅ Has Company AND Rank: ${withCompanyAndRank.length} / ${allRyanPeople.length}`);
    console.log(`✅ ELIGIBLE FOR SPEEDRUN (Company + Rank 1-50): ${eligible.length} / ${allRyanPeople.length}\n`);

    if (eligible.length === 0) {
      console.log('❌ PROBLEM: No people meet all Speedrun requirements!\n');
      
      // Show breakdown
      const withoutCompany = allRyanPeople.filter(p => p.companyId === null);
      const withoutRank = allRyanPeople.filter(p => p.globalRank === null);
      const rankOutOfRange = allRyanPeople.filter(p => p.globalRank !== null && (p.globalRank < 1 || p.globalRank > 50));

      console.log('🔍 Breakdown of Issues:');
      console.log('======================');
      console.log(`Missing Company: ${withoutCompany.length}`);
      if (withoutCompany.length > 0 && withoutCompany.length <= 10) {
        withoutCompany.forEach(p => {
          const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'No name';
          console.log(`  - ${name} (${p.email || 'No email'})`);
        });
      }
      
      console.log(`\nMissing Global Rank: ${withoutRank.length}`);
      if (withoutRank.length > 0 && withoutRank.length <= 10) {
        withoutRank.forEach(p => {
          const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'No name';
          console.log(`  - ${name} (${p.email || 'No email'})`);
        });
      }
      
      console.log(`\nRank out of range (not 1-50): ${rankOutOfRange.length}`);
      if (rankOutOfRange.length > 0 && rankOutOfRange.length <= 10) {
        rankOutOfRange.forEach(p => {
          const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'No name';
          console.log(`  - ${name} - Rank: ${p.globalRank} (${p.email || 'No email'})`);
        });
      }
    } else {
      console.log('✅ Ryan has people eligible for Speedrun!\n');
      
      // Show top 10 eligible
      const sortedEligible = eligible.sort((a, b) => {
        if (a.globalRank === null && b.globalRank === null) return 0;
        if (a.globalRank === null) return 1;
        if (b.globalRank === null) return -1;
        return a.globalRank - b.globalRank;
      });

      console.log('🏆 Top 10 Eligible People (by rank):');
      console.log('====================================');
      sortedEligible.slice(0, 10).forEach((person, index) => {
        const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'No name';
        console.log(`${index + 1}. ${name} - Rank: ${person.globalRank} (${person.email || 'No email'})`);
      });
    }

    // Also check people with null mainSellerId (unassigned) - these should also show up for Ryan
    const unassignedPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: null,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 }
      }
    });

    console.log(`\n📊 Unassigned People (available for assignment): ${unassignedPeople}`);
    console.log(`   Ryan should see these too based on the API logic (mainSellerId = null OR mainSellerId = userId)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRyanSpeedrunRequirements();

