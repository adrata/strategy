#!/usr/bin/env tsx

/**
 * Fix Ross's Speedrun Ranking Script
 * 
 * Re-ranks Ross's people from 376-394 to 1-5 sequential ranks
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// User IDs from the codebase
const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function fixRossRanking() {
  console.log('🚀 FIXING ROSS\'S SPEEDRUN RANKING');
  
  try {
    // Get Ross's current people
    const rossPeople = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        companyId: { not: null },
        mainSellerId: ROSS_USER_ID
      },
      orderBy: { globalRank: 'asc' },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        company: { select: { name: true } }
      }
    });

    console.log(`Found ${rossPeople.length} people assigned to Ross`);
    
    if (rossPeople.length === 0) {
      console.log('No people assigned to Ross. Assigning some...');
      
      // Assign some unassigned people to Ross
      const unassignedPeople = await prisma.people.findMany({
        where: {
          workspaceId: ADRATA_WORKSPACE_ID,
          deletedAt: null,
          companyId: { not: null },
          mainSellerId: null
        },
        take: 5,
        select: { id: true, fullName: true }
      });

      if (unassignedPeople.length > 0) {
        await prisma.people.updateMany({
          where: {
            id: { in: unassignedPeople.map(p => p.id) }
          },
          data: {
            mainSellerId: ROSS_USER_ID
          }
        });
        
        console.log(`Assigned ${unassignedPeople.length} people to Ross`);
        return fixRossRanking(); // Recursive call
      }
    }

    // Show current ranks
    console.log('\nCurrent ranks:');
    rossPeople.forEach(p => {
      console.log(`  Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
    });

    // Re-rank them sequentially 1-N
    console.log('\nRe-ranking to sequential 1-N...');
    
    for (let i = 0; i < rossPeople.length; i++) {
      const person = rossPeople[i];
      await prisma.people.update({
        where: { id: person.id },
        data: {
          globalRank: i + 1,
          customFields: {
            userRank: i + 1,
            userId: ROSS_USER_ID,
            rankingMode: 'global'
          }
        }
      });
      
      console.log(`  Assigned rank ${i + 1} to ${person.fullName}`);
    }

    // Verify the results
    console.log('\nVerifying results...');
    const updatedPeople = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        companyId: { not: null },
        mainSellerId: ROSS_USER_ID
      },
      orderBy: { globalRank: 'asc' },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        company: { select: { name: true } }
      }
    });

    console.log('\nUpdated ranks:');
    updatedPeople.forEach(p => {
      console.log(`  Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
    });

    console.log('\n✅ Ross\'s ranking fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing Ross\'s ranking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRossRanking();
