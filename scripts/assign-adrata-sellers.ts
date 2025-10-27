#!/usr/bin/env tsx

/**
 * Assign Dan as Main Seller and Ross as Co-Seller for Adrata Workspace
 * 
 * This script assigns:
 * - Dan as main seller for all companies and people in Adrata workspace
 * - Ross as co-seller for all people in Adrata workspace
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// User IDs from the codebase
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function assignAdrataSellers() {
  console.log('🚀 ASSIGNING ADRATA SELLERS');
  console.log(`Dan (main seller): ${DAN_USER_ID}`);
  console.log(`Ross (co-seller): ${ROSS_USER_ID}`);
  console.log(`Adrata workspace: ${ADRATA_WORKSPACE_ID}`);
  
  try {
    // Step 1: Update all companies to have Dan as main seller
    console.log('\n1. Updating companies...');
    const companiesResult = await prisma.companies.updateMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null
      },
      data: {
        mainSellerId: DAN_USER_ID
      }
    });
    console.log(`   Updated ${companiesResult.count} companies`);

    // Step 2: Update all people to have Dan as main seller
    console.log('\n2. Updating people...');
    const peopleResult = await prisma.people.updateMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null
      },
      data: {
        mainSellerId: DAN_USER_ID
      }
    });
    console.log(`   Updated ${peopleResult.count} people`);

    // Step 3: Add Ross as co-seller for all people
    console.log('\n3. Adding Ross as co-seller...');
    
    // First, get all people in the workspace
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null
      },
      select: { id: true, fullName: true }
    });

    console.log(`   Found ${allPeople.length} people to add Ross as co-seller`);

    // Add Ross as co-seller for each person
    let coSellerCount = 0;
    for (const person of allPeople) {
      try {
        // Check if Ross is already a co-seller
        const existingCoSeller = await prisma.person_co_sellers.findFirst({
          where: {
            personId: person.id,
            userId: ROSS_USER_ID
          }
        });

        if (!existingCoSeller) {
          await prisma.person_co_sellers.create({
            data: {
              personId: person.id,
              userId: ROSS_USER_ID
            }
          });
          coSellerCount++;
        }
      } catch (error) {
        console.log(`   Warning: Could not add Ross as co-seller for ${person.fullName}: ${error}`);
      }
    }

    console.log(`   Added Ross as co-seller for ${coSellerCount} people`);

    // Step 4: Verify the results
    console.log('\n4. Verifying results...');
    
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

    console.log(`   Companies with Dan as main seller: ${companiesWithDan}`);
    console.log(`   People with Dan as main seller: ${peopleWithDan}`);
    console.log(`   People with Ross as co-seller: ${peopleWithRossCoSeller}`);

    console.log('\n✅ Adrata seller assignments completed successfully!');
    
  } catch (error) {
    console.error('❌ Error assigning Adrata sellers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignAdrataSellers();
