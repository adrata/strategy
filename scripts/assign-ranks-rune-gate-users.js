#!/usr/bin/env node

/**
 * Assign Ranks to Rune Gate Users' Leads
 * 
 * Assigns globalRank (1-N) to leads for:
 * - Finn (finn@runegateco.com)
 * - Josh and Marcus (clients@runegateco.com)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignRanks() {
  try {
    console.log('========================================');
    console.log('   ASSIGN RANKS TO RUNE GATE USERS');
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

    // Find Josh/Marcus (clients@runegateco.com)
    const clients = await prisma.users.findFirst({
      where: {
        email: { equals: 'clients@runegateco.com', mode: 'insensitive' },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        activeWorkspaceId: true
      }
    });

    const users = [];
    if (finn) users.push(finn);
    if (clients) users.push(clients);

    if (users.length === 0) {
      console.log('❌ No users found!');
      return;
    }

    console.log(`Found ${users.length} user(s) to process:\n`);

    for (const user of users) {
      console.log(`\n👤 Processing: ${user.name} (${user.email})`);
      console.log(`   Workspace: ${user.activeWorkspaceId || 'NOT SET'}`);

      if (!user.activeWorkspaceId) {
        console.log('   ⚠️  Skipping - no activeWorkspaceId\n');
        continue;
      }

      // Get all people assigned to this user in their workspace
      const people = await prisma.people.findMany({
        where: {
          workspaceId: user.activeWorkspaceId,
          deletedAt: null,
          mainSellerId: user.id
        },
        orderBy: [
          { createdAt: 'asc' } // Oldest first for consistent ranking
        ],
        select: {
          id: true,
          fullName: true,
          globalRank: true,
          createdAt: true,
          companyId: true
        }
      });

      console.log(`   Found ${people.length} people assigned to this user`);

      if (people.length === 0) {
        console.log(`   ⏭️  Skipping - no people assigned\n`);
        continue;
      }

      // Update people with sequential globalRank values (1-N for this seller)
      // Only assign ranks 1-50 (speedrun requirement)
      const maxRank = Math.min(people.length, 50);
      
      console.log(`   Assigning ranks 1-${maxRank} to ${people.length} people...`);

      const batchSize = 50;
      for (let i = 0; i < maxRank; i += batchSize) {
        const batch = people.slice(i, i + batchSize);
        const updatePromises = batch.map((person, batchIndex) => {
          const newRank = i + batchIndex + 1;
          return prisma.people.update({
            where: { id: person.id },
            data: { globalRank: newRank }
          });
        });

        await Promise.all(updatePromises);
        console.log(`   ✅ Updated people ${i + 1}-${Math.min(i + batchSize, maxRank)} with globalRank`);
      }

      // If there are more than 50, set the rest to null or a high number
      if (people.length > 50) {
        const remaining = people.slice(50);
        console.log(`   ⚠️  ${remaining.length} people beyond rank 50 - setting to null`);
        for (const person of remaining) {
          await prisma.people.update({
            where: { id: person.id },
            data: { globalRank: null }
          });
        }
      }

      // Show top 10 for verification
      const top10 = await prisma.people.findMany({
        where: {
          workspaceId: user.activeWorkspaceId,
          deletedAt: null,
          mainSellerId: user.id,
          globalRank: { not: null, gte: 1, lte: 50 }
        },
        select: {
          fullName: true,
          globalRank: true,
          companyId: true
        },
        orderBy: { globalRank: 'asc' },
        take: 10
      });

      console.log(`\n   📊 Top 10 ranked people:`);
      top10.forEach(person => {
        console.log(`      Rank ${person.globalRank}: ${person.fullName || 'No name'} ${person.companyId ? '✅ Has company' : '❌ No company'}`);
      });

      // Count how many now meet speedrun criteria
      const nowInSpeedrun = await prisma.people.count({
        where: {
          workspaceId: user.activeWorkspaceId,
          deletedAt: null,
          mainSellerId: user.id,
          globalRank: { not: null, gte: 1, lte: 50 }
        }
      });

      console.log(`\n   ✅ ${nowInSpeedrun} people now meet speedrun criteria (rank 1-50)\n`);
    }

    console.log('\n========================================');
    console.log('   ✅ RANK ASSIGNMENT COMPLETE');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

assignRanks();
