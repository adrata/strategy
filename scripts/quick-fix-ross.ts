#!/usr/bin/env tsx

/**
 * Quick Fix for Ross's Speedrun
 * Simple script to fix Ross's ranking immediately
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function quickFix() {
  console.log('🚀 QUICK FIX FOR ROSS\'S SPEEDRUN');
  
  try {
    // Step 1: Get Ross's people
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

    console.log(`Found ${rossPeople.length} people for Ross:`);
    rossPeople.forEach(p => {
      console.log(`  Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
    });

    // Step 2: Re-rank them 1-12
    console.log('\nRe-ranking to 1-12...');
    for (let i = 0; i < rossPeople.length; i++) {
      const person = rossPeople[i];
      await prisma.people.update({
        where: { id: person.id },
        data: {
          globalRank: i + 1
        }
      });
      console.log(`  ${i + 1}. ${person.fullName}`);
    }

    // Step 3: Verify
    console.log('\nVerification:');
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

    console.log('Ross\'s people after fix:');
    updatedPeople.forEach(p => {
      console.log(`  Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
    });

    console.log('\n✅ ROSS\'S RANKING FIXED!');
    console.log('Refresh your browser to see ranks 1-12');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickFix();
