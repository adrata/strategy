#!/usr/bin/env node

/**
 * Assign Ranks to Existing Epics
 * 
 * Assigns ranks to all existing epics that don't have ranks yet
 * Ranks are 1-based, with lower numbers = more important
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignEpicRanks() {
  console.log('🔢 Assigning Ranks to Existing Epics');
  console.log('═'.repeat(60));
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get all epics grouped by project, ordered by createdAt
    const projects = await prisma.stacksProject.findMany({
      select: {
        id: true,
        name: true,
        workspaceId: true,
      },
    });

    let totalUpdated = 0;

    for (const project of projects) {
      console.log(`📊 Processing project: ${project.name} (${project.id})`);

      // Get epics for this project
      const epics = await prisma.stacksEpic.findMany({
        where: {
          projectId: project.id,
        },
        orderBy: [
          { rank: 'asc' }, // Epics with ranks first
          { createdAt: 'asc' }, // Then by creation date
        ],
        select: {
          id: true,
          title: true,
          rank: true,
          createdAt: true,
        },
      });

      if (epics.length === 0) {
        console.log('   No epics found\n');
        continue;
      }

      console.log(`   Found ${epics.length} epics`);

      // Find the highest existing rank
      const epicsWithRanks = epics.filter((e) => e.rank !== null && e.rank !== undefined);
      const maxRank = epicsWithRanks.length > 0 
        ? Math.max(...epicsWithRanks.map((e) => e.rank || 0))
        : 0;

      // Assign ranks to epics without ranks
      let nextRank = maxRank + 1;
      let updated = 0;

      for (const epic of epics) {
        if (epic.rank === null || epic.rank === undefined) {
          await prisma.stacksEpic.update({
            where: { id: epic.id },
            data: { rank: nextRank },
          });
          console.log(`   ✅ Assigned rank ${nextRank} to: ${epic.title}`);
          nextRank++;
          updated++;
        }
      }

      if (updated === 0) {
        console.log('   ✅ All epics already have ranks');
      } else {
        console.log(`   ✅ Updated ${updated} epics with ranks`);
      }

      totalUpdated += updated;
      console.log('');
    }

    console.log('═'.repeat(60));
    console.log(`✅ Total epics updated: ${totalUpdated}`);
    console.log('');

    // Verify results
    const totalEpics = await prisma.stacksEpic.count();
    const epicsWithRanks = await prisma.stacksEpic.count({
      where: { rank: { not: null } },
    });

    console.log('📊 FINAL STATUS:');
    console.log(`   Total epics: ${totalEpics}`);
    console.log(`   Epics with ranks: ${epicsWithRanks}`);
    console.log(`   Epics without ranks: ${totalEpics - epicsWithRanks}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

assignEpicRanks();

