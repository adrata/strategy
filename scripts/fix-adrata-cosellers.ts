#!/usr/bin/env tsx

/**
 * Fix Adrata Co-Seller Assignments Script
 * 
 * This script fixes the co-seller assignments in the Adrata workspace:
 * - 50% of people: Dan as main seller, Ross as co-seller
 * - 50% of people: Ross as main seller, Dan as co-seller
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Key constants
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9';

async function findUserById(userId: string) {
  return await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, name: true }
  });
}

async function fixAdrataCoSellers() {
  console.log('🚀 FIXING ADRATA CO-SELLER ASSIGNMENTS');
  console.log('=====================================');
  console.log('');
  
  try {
    // Verify users exist
    console.log('👤 Verifying users...');
    const dan = await findUserById(DAN_USER_ID);
    const ross = await findUserById(ROSS_USER_ID);
    
    if (!dan) {
      console.log('❌ Dan Mirolli not found in database');
      return;
    }
    
    if (!ross) {
      console.log('❌ Ross Sylvester not found in database');
      return;
    }
    
    console.log(`✅ Found Dan: ${dan.name || dan.email} (ID: ${dan.id})`);
    console.log(`✅ Found Ross: ${ross.name || ross.email} (ID: ${ross.id})`);
    console.log('');
    
    // Get all people in Adrata workspace
    console.log('📊 Getting all people in Adrata workspace...');
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null
      },
      select: { 
        id: true, 
        fullName: true, 
        email: true,
        mainSellerId: true
      },
      orderBy: { id: 'asc' } // Consistent ordering for splitting
    });
    
    console.log(`📈 Found ${allPeople.length} people in Adrata workspace`);
    
    if (allPeople.length === 0) {
      console.log('⚠️ No people found in Adrata workspace. Nothing to update.');
      return;
    }
    
    // Split people into two equal groups
    const midpoint = Math.ceil(allPeople.length / 2);
    const firstHalf = allPeople.slice(0, midpoint);
    const secondHalf = allPeople.slice(midpoint);
    
    console.log(`📊 Splitting people:`);
    console.log(`   - First half (${firstHalf.length} people): Dan as main seller, Ross as co-seller`);
    console.log(`   - Second half (${secondHalf.length} people): Ross as main seller, Dan as co-seller`);
    console.log('');
    
    // Clear existing co-seller relationships for these users
    console.log('🧹 Clearing existing co-seller relationships...');
    await prisma.person_co_sellers.deleteMany({
      where: {
        OR: [
          { userId: DAN_USER_ID },
          { userId: ROSS_USER_ID }
        ]
      }
    });
    console.log('✅ Cleared existing co-seller relationships');
    console.log('');
    
    // Process first half: Dan as main seller, Ross as co-seller
    console.log('👑 Processing first half: Dan as main seller, Ross as co-seller...');
    for (const person of firstHalf) {
      await prisma.$transaction(async (tx) => {
        // Set Dan as main seller
        await tx.people.update({
          where: { id: person.id },
          data: { mainSellerId: DAN_USER_ID }
        });
        
        // Add Ross as co-seller
        await tx.person_co_sellers.create({
          data: {
            personId: person.id,
            userId: ROSS_USER_ID
          }
        });
      });
    }
    console.log(`✅ Updated ${firstHalf.length} people with Dan as main seller and Ross as co-seller`);
    
    // Process second half: Ross as main seller, Dan as co-seller
    console.log('👑 Processing second half: Ross as main seller, Dan as co-seller...');
    for (const person of secondHalf) {
      await prisma.$transaction(async (tx) => {
        // Set Ross as main seller
        await tx.people.update({
          where: { id: person.id },
          data: { mainSellerId: ROSS_USER_ID }
        });
        
        // Add Dan as co-seller
        await tx.person_co_sellers.create({
          data: {
            personId: person.id,
            userId: DAN_USER_ID
          }
        });
      });
    }
    console.log(`✅ Updated ${secondHalf.length} people with Ross as main seller and Dan as co-seller`);
    console.log('');
    
    // Verify the results
    console.log('🔍 Verifying results...');
    
    const peopleWithDanAsMainSeller = await prisma.people.count({
      where: { 
        workspaceId: ADRATA_WORKSPACE_ID,
        mainSellerId: DAN_USER_ID,
        deletedAt: null
      }
    });
    
    const peopleWithRossAsMainSeller = await prisma.people.count({
      where: { 
        workspaceId: ADRATA_WORKSPACE_ID,
        mainSellerId: ROSS_USER_ID,
        deletedAt: null
      }
    });
    
    const peopleWithDanAsCoSeller = await prisma.person_co_sellers.count({
      where: { userId: DAN_USER_ID }
    });
    
    const peopleWithRossAsCoSeller = await prisma.person_co_sellers.count({
      where: { userId: ROSS_USER_ID }
    });
    
    console.log(`📈 Final Results:`);
    console.log(`   - People with Dan as main seller: ${peopleWithDanAsMainSeller}`);
    console.log(`   - People with Ross as main seller: ${peopleWithRossAsMainSeller}`);
    console.log(`   - People with Dan as co-seller: ${peopleWithDanAsCoSeller}`);
    console.log(`   - People with Ross as co-seller: ${peopleWithRossAsCoSeller}`);
    console.log('');
    
    // Show a sample of the results
    const samplePeople = await prisma.people.findMany({
      where: { 
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        email: true,
        mainSeller: {
          select: { name: true, email: true }
        },
        coSellers: {
          select: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });
    
    console.log('📋 Sample Results:');
    samplePeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.email})`);
      console.log(`   Main Seller: ${person.mainSeller?.name || person.mainSeller?.email || 'None'}`);
      console.log(`   Co-sellers: ${person.coSellers.map(cs => cs.user.name || cs.user.email).join(', ') || 'None'}`);
    });
    
    console.log('');
    console.log('🎉 Co-seller assignment completed successfully!');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Refresh the Speedrun view in your browser');
    console.log('   2. Verify that the CO-SELLERS column now shows names instead of blanks');
    console.log('   3. Check that MAIN-SELLER shows either "Me" or the other person\'s name');
    
  } catch (error) {
    console.error('❌ Error during co-seller assignment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixAdrataCoSellers()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { fixAdrataCoSellers };
