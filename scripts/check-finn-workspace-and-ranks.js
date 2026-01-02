#!/usr/bin/env node

/**
 * Check Finn's workspace and globalRank values
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFinnWorkspace() {
  try {
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

    if (!finn || !finn.activeWorkspaceId) {
      console.log('❌ Finn or workspace not found!');
      return;
    }

    // Get workspace details
    const workspace = await prisma.workspaces.findUnique({
      where: { id: finn.activeWorkspaceId },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    console.log('Workspace Details:');
    console.log(`  ID: ${workspace?.id}`);
    console.log(`  Name: ${workspace?.name}`);
    console.log(`  Slug: ${workspace?.slug}`);
    console.log(`  Is B2C (slug check): ${workspace?.slug === 'rune' || workspace?.slug === 'runegateco'}\n`);

    // Get all Finn's people with their actual globalRank values
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: finn.activeWorkspaceId,
        deletedAt: null,
        mainSellerId: finn.id
      },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        companyId: true
      },
      orderBy: {
        globalRank: 'asc'
      }
    });

    console.log(`\nAll ${allPeople.length} people with globalRank values:\n`);
    
    const rankDistribution = {};
    allPeople.forEach(person => {
      const rank = person.globalRank;
      if (!rankDistribution[rank]) {
        rankDistribution[rank] = [];
      }
      rankDistribution[rank].push(person.fullName || 'No name');
    });

    console.log('Rank Distribution:');
    Object.keys(rankDistribution).sort((a, b) => {
      if (a === 'null') return 1;
      if (b === 'null') return -1;
      return Number(a) - Number(b);
    }).forEach(rank => {
      const count = rankDistribution[rank].length;
      console.log(`  Rank ${rank}: ${count} people`);
      if (count <= 5) {
        rankDistribution[rank].forEach(name => {
          console.log(`    - ${name}`);
        });
      }
    });

    // Check if ranks are in 1-50 range
    const ranksInRange = allPeople.filter(p => p.globalRank !== null && p.globalRank >= 1 && p.globalRank <= 50);
    const ranksOutOfRange = allPeople.filter(p => p.globalRank === null || p.globalRank < 1 || p.globalRank > 50);

    console.log(`\n✅ People with rank 1-50: ${ranksInRange.length}`);
    console.log(`❌ People with rank OUT OF RANGE: ${ranksOutOfRange.length}`);

    if (ranksOutOfRange.length > 0) {
      console.log('\nSample of people with out-of-range ranks:');
      ranksOutOfRange.slice(0, 10).forEach(p => {
        console.log(`  - ${p.fullName || 'No name'}: Rank ${p.globalRank}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFinnWorkspace();
