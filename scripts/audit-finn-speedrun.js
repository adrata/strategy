#!/usr/bin/env node

/**
 * Audit Finn's Speedrun Data
 * 
 * Checks why Finn's 21 leads aren't showing up in speedrun
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditFinnSpeedrun() {
  try {
    console.log('========================================');
    console.log('   AUDIT: FINN SPEEDRUN DATA');
    console.log('========================================\n');

    // Find Finn
    const finn = await prisma.users.findFirst({
      where: {
        email: { equals: 'finn@runegateco.com', mode: 'insensitive' },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        activeWorkspaceId: true
      }
    });

    if (!finn) {
      console.log('❌ Finn not found!');
      return;
    }

    console.log('✅ Found Finn:');
    console.log(`   ID: ${finn.id}`);
    console.log(`   Name: ${finn.name}`);
    console.log(`   Email: ${finn.email}`);
    console.log(`   Workspace ID: ${finn.activeWorkspaceId || 'NOT SET'}\n`);

    if (!finn.activeWorkspaceId) {
      console.log('❌ PROBLEM: Finn has no activeWorkspaceId set!\n');
    }

    const workspaceId = finn.activeWorkspaceId;

    // Count all Finn's people
    const allFinnsPeople = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id
      }
    });

    console.log(`📊 Total people assigned to Finn: ${allFinnsPeople}\n`);

    // Check people with mainSellerId = Finn
    const peopleWithMainSeller = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        companyId: true,
        globalRank: true,
        lastActionDate: true,
        status: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 25
    });

    console.log(`\n📋 Sample of Finn's people (showing first 25):`);
    peopleWithMainSeller.forEach((person, i) => {
      console.log(`\n${i + 1}. ${person.fullName || 'No name'}`);
      console.log(`   Email: ${person.email || 'No email'}`);
      console.log(`   Company ID: ${person.companyId || '❌ NO COMPANY'}`);
      console.log(`   Company Name: ${person.company?.name || 'N/A'}`);
      console.log(`   Global Rank: ${person.globalRank || '❌ NO RANK'}`);
      console.log(`   Last Action Date: ${person.lastActionDate || 'Never'}`);
      console.log(`   Status: ${person.status || 'N/A'}`);
    });

    // Check speedrun requirements
    console.log('\n\n========================================');
    console.log('   SPEEDRUN REQUIREMENTS CHECK');
    console.log('========================================\n');

    // Calculate date thresholds (exclude contacts from today/yesterday)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Check 1: People with company
    const withCompany = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id,
        companyId: { not: null }
      }
    });

    console.log(`✅ People with company: ${withCompany}`);

    // Check 2: People with globalRank
    const withRank = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id,
        globalRank: { not: null }
      }
    });

    console.log(`✅ People with globalRank: ${withRank}`);

    // Check 3: People with globalRank 1-50
    const withRank1to50 = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id,
        globalRank: { not: null, gte: 1, lte: 50 }
      }
    });

    console.log(`✅ People with globalRank 1-50: ${withRank1to50}`);

    // Check 4: People with company AND rank 1-50
    const withCompanyAndRank = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 }
      }
    });

    console.log(`✅ People with company AND rank 1-50: ${withCompanyAndRank}`);

    // Check 5: People not contacted today/yesterday
    const notContactedRecently = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 },
        OR: [
          { lastActionDate: null },
          { lastActionDate: { lt: yesterday } }
        ]
      }
    });

    console.log(`✅ People meeting ALL speedrun criteria: ${notContactedRecently}\n`);

    // Show people missing requirements
    console.log('\n========================================');
    console.log('   MISSING REQUIREMENTS BREAKDOWN');
    console.log('========================================\n');

    const missingCompany = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id,
        companyId: null
      },
      select: {
        fullName: true,
        email: true,
        globalRank: true
      },
      take: 10
    });

    if (missingCompany.length > 0) {
      console.log(`❌ People WITHOUT company (${missingCompany.length}):`);
      missingCompany.forEach(p => {
        console.log(`   - ${p.fullName || 'No name'} (Rank: ${p.globalRank || 'No rank'})`);
      });
      console.log('');
    }

    const missingRank = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id,
        companyId: { not: null },
        globalRank: null
      },
      select: {
        fullName: true,
        email: true,
        company: {
          select: { name: true }
        }
      },
      take: 10
    });

    if (missingRank.length > 0) {
      console.log(`❌ People WITHOUT globalRank (${missingRank.length}):`);
      missingRank.forEach(p => {
        console.log(`   - ${p.fullName || 'No name'} (Company: ${p.company?.name || 'N/A'})`);
      });
      console.log('');
    }

    const rankOutOfRange = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id,
        companyId: { not: null },
        OR: [
          { globalRank: null },
          { globalRank: { lt: 1 } },
          { globalRank: { gt: 50 } }
        ]
      },
      select: {
        fullName: true,
        email: true,
        globalRank: true,
        company: {
          select: { name: true }
        }
      },
      take: 10
    });

    if (rankOutOfRange.length > 0) {
      console.log(`❌ People with rank OUT OF RANGE (not 1-50) (${rankOutOfRange.length}):`);
      rankOutOfRange.forEach(p => {
        console.log(`   - ${p.fullName || 'No name'} (Rank: ${p.globalRank || 'null'}, Company: ${p.company?.name || 'N/A'})`);
      });
      console.log('');
    }

    // Check people contacted today/yesterday
    const contactedRecently = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 },
        lastActionDate: {
          gte: yesterday
        }
      },
      select: {
        fullName: true,
        email: true,
        globalRank: true,
        lastActionDate: true,
        company: {
          select: { name: true }
        }
      },
      take: 10
    });

    if (contactedRecently.length > 0) {
      console.log(`⚠️  People CONTACTED TODAY/YESTERDAY (excluded from speedrun) (${contactedRecently.length}):`);
      contactedRecently.forEach(p => {
        console.log(`   - ${p.fullName || 'No name'} (Rank: ${p.globalRank}, Last Action: ${p.lastActionDate}, Company: ${p.company?.name || 'N/A'})`);
      });
      console.log('');
    }

    // Show people that SHOULD be in speedrun
    const shouldBeInSpeedrun = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: finn.id,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 },
        OR: [
          { lastActionDate: null },
          { lastActionDate: { lt: yesterday } }
        ]
      },
      select: {
        fullName: true,
        email: true,
        globalRank: true,
        lastActionDate: true,
        company: {
          select: { name: true }
        }
      },
      orderBy: {
        globalRank: 'asc'
      },
      take: 25
    });

    console.log('\n========================================');
    console.log('   PEOPLE THAT SHOULD BE IN SPEEDRUN');
    console.log('========================================\n');

    if (shouldBeInSpeedrun.length > 0) {
      console.log(`✅ Found ${shouldBeInSpeedrun.length} people that meet ALL speedrun criteria:\n`);
      shouldBeInSpeedrun.forEach((person, i) => {
        console.log(`${i + 1}. Rank ${person.globalRank}: ${person.fullName || 'No name'}`);
        console.log(`   Company: ${person.company?.name || 'N/A'}`);
        console.log(`   Email: ${person.email || 'No email'}`);
        console.log(`   Last Action: ${person.lastActionDate || 'Never'}\n`);
      });
    } else {
      console.log('❌ NO PEOPLE MEET ALL SPEEDRUN CRITERIA!\n');
      console.log('Issues to fix:');
      console.log('   1. Ensure all people have companyId set');
      console.log('   2. Ensure all people have globalRank between 1-50');
      console.log('   3. Check if people were contacted today/yesterday (they\'re excluded)');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditFinnSpeedrun();
