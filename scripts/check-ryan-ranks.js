#!/usr/bin/env node

/**
 * Check Ryan's people ranks distribution
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRyanRanks() {
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

    console.log('🔍 Checking Rank Distribution for Ryan\n');
    console.log(`User: ${ryan.name} (${ryan.id})`);
    console.log(`Workspace: ${workspace.name} (${workspace.id})\n`);

    // Check people assigned to Ryan with ranks 1-50
    const ryanPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        globalRank: true,
        company: {
          select: { id: true, name: true }
        }
      },
      orderBy: { globalRank: 'asc' },
      take: 100
    });

    // Check unassigned people with ranks 1-50
    const unassignedPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: null,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        globalRank: true,
        company: {
          select: { id: true, name: true }
        }
      },
      orderBy: { globalRank: 'asc' },
      take: 100
    });

    console.log('📊 Rank Distribution Analysis:');
    console.log('================================\n');

    console.log(`Ryan's Assigned People (ranks 1-50): ${ryanPeople.length}`);
    if (ryanPeople.length > 0) {
      const rankCounts = {};
      ryanPeople.forEach(p => {
        rankCounts[p.globalRank] = (rankCounts[p.globalRank] || 0) + 1;
      });
      
      console.log('\nRank Distribution:');
      Object.keys(rankCounts).sort((a, b) => a - b).forEach(rank => {
        console.log(`  Rank ${rank}: ${rankCounts[rank]} people`);
      });
      
      console.log('\nFirst 20 People:');
      ryanPeople.slice(0, 20).forEach((p, i) => {
        const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'No name';
        const company = p.company?.name || 'No company';
        console.log(`${i + 1}. Rank ${p.globalRank}: ${name} at ${company}`);
      });
    }

    console.log(`\nUnassigned People (ranks 1-50): ${unassignedPeople.length}`);
    if (unassignedPeople.length > 0) {
      const rankCounts = {};
      unassignedPeople.forEach(p => {
        rankCounts[p.globalRank] = (rankCounts[p.globalRank] || 0) + 1;
      });
      
      console.log('\nRank Distribution:');
      Object.keys(rankCounts).sort((a, b) => a - b).forEach(rank => {
        console.log(`  Rank ${rank}: ${rankCounts[rank]} people`);
      });
      
      console.log('\nFirst 20 People:');
      unassignedPeople.slice(0, 20).forEach((p, i) => {
        const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'No name';
        const company = p.company?.name || 'No company';
        console.log(`${i + 1}. Rank ${p.globalRank}: ${name} at ${company}`);
      });
    }

    // Check if there are duplicate ranks
    const allRanks = [...ryanPeople, ...unassignedPeople].map(p => p.globalRank);
    const rankSet = new Set(allRanks);
    
    console.log(`\n🔍 Duplicate Rank Analysis:`);
    console.log(`Total people: ${allRanks.length}`);
    console.log(`Unique ranks: ${rankSet.size}`);
    console.log(`Duplicate ranks: ${allRanks.length - rankSet.size}`);
    
    if (allRanks.length > rankSet.size) {
      const rankFrequency = {};
      allRanks.forEach(rank => {
        rankFrequency[rank] = (rankFrequency[rank] || 0) + 1;
      });
      
      console.log('\nRanks with duplicates:');
      Object.entries(rankFrequency)
        .filter(([rank, count]) => count > 1)
        .sort(([a], [b]) => a - b)
        .forEach(([rank, count]) => {
          console.log(`  Rank ${rank}: ${count} people`);
        });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRyanRanks();

