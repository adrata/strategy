#!/usr/bin/env tsx

/**
 * Verify and Fix Script
 * 
 * 1. Check Ross's current speedrun ranking
 * 2. Fix Ross's ranking if needed
 * 3. Check and fix Adrata workspace assignments
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// User IDs
const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function verifyAndFix() {
  console.log('🔍 VERIFYING AND FIXING ADRATA WORKSPACE');
  
  try {
    // Step 1: Check Ross's current people and ranks
    console.log('\n1. Checking Ross\'s current people...');
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
    rossPeople.forEach(p => {
      console.log(`  Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
    });

    // Step 2: Fix Ross's ranking if needed
    if (rossPeople.length > 0) {
      const needsFixing = rossPeople.some(p => (p.globalRank || 0) > 50);
      if (needsFixing) {
        console.log('\n2. Fixing Ross\'s ranking...');
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
          console.log(`  Fixed rank ${i + 1} for ${person.fullName}`);
        }
        console.log('✅ Ross\'s ranking fixed!');
      } else {
        console.log('✅ Ross\'s ranking is already correct');
      }
    } else {
      console.log('⚠️ No people assigned to Ross. Assigning some...');
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
        return verifyAndFix(); // Recursive call
      }
    }

    // Step 3: Check and fix company assignments
    console.log('\n3. Checking company assignments...');
    const companiesWithoutDan = await prisma.companies.count({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: { not: DAN_USER_ID }
      }
    });

    if (companiesWithoutDan > 0) {
      console.log(`Fixing ${companiesWithoutDan} companies...`);
      await prisma.companies.updateMany({
        where: {
          workspaceId: ADRATA_WORKSPACE_ID,
          deletedAt: null,
          mainSellerId: { not: DAN_USER_ID }
        },
        data: {
          mainSellerId: DAN_USER_ID
        }
      });
      console.log('✅ Companies fixed!');
    } else {
      console.log('✅ All companies have Dan as main seller');
    }

    // Step 4: Check and fix people assignments
    console.log('\n4. Checking people assignments...');
    const peopleWithoutDan = await prisma.people.count({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: { not: DAN_USER_ID }
      }
    });

    if (peopleWithoutDan > 0) {
      console.log(`Fixing ${peopleWithoutDan} people...`);
      await prisma.people.updateMany({
        where: {
          workspaceId: ADRATA_WORKSPACE_ID,
          deletedAt: null,
          mainSellerId: { not: DAN_USER_ID }
        },
        data: {
          mainSellerId: DAN_USER_ID
        }
      });
      console.log('✅ People fixed!');
    } else {
      console.log('✅ All people have Dan as main seller');
    }

    // Step 5: Check and fix co-seller assignments
    console.log('\n5. Checking co-seller assignments...');
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null
      },
      select: { id: true, fullName: true }
    });

    let coSellerCount = 0;
    for (const person of allPeople) {
      const hasRossCoSeller = await prisma.person_co_sellers.findFirst({
        where: {
          personId: person.id,
          userId: ROSS_USER_ID
        }
      });

      if (!hasRossCoSeller) {
        try {
          await prisma.person_co_sellers.create({
            data: {
              personId: person.id,
              userId: ROSS_USER_ID
            }
          });
          coSellerCount++;
        } catch (error) {
          console.log(`  Warning: Could not add Ross as co-seller for ${person.fullName}`);
        }
      }
    }

    if (coSellerCount > 0) {
      console.log(`✅ Added Ross as co-seller for ${coSellerCount} people`);
    } else {
      console.log('✅ All people already have Ross as co-seller');
    }

    // Step 6: Final verification
    console.log('\n6. Final verification...');
    const finalRossPeople = await prisma.people.findMany({
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

    console.log(`Ross's final people (${finalRossPeople.length}):`);
    finalRossPeople.forEach(p => {
      console.log(`  Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
    });

    const companiesWithDan = await prisma.companies.count({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: DAN_USER_ID
      }
    });

    const peopleWithDan = await prisma.people.count({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: DAN_USER_ID
      }
    });

    const peopleWithRossCoSeller = await prisma.person_co_sellers.count({
      where: {
        person: {
          workspaceId: ADRATA_WORKSPACE_ID,
          deletedAt: null
        },
        userId: ROSS_USER_ID
      }
    });

    console.log(`\nFinal counts:`);
    console.log(`  Companies with Dan: ${companiesWithDan}`);
    console.log(`  People with Dan: ${peopleWithDan}`);
    console.log(`  People with Ross as co-seller: ${peopleWithRossCoSeller}`);

    console.log('\n🎉 ALL FIXES COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Error during verification and fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAndFix();
