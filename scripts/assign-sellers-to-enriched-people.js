#!/usr/bin/env node

/**
 * 👨‍💼 ASSIGN SELLERS TO ALREADY ENRICHED PEOPLE
 * 
 * Assigns sellers to people who were enriched but don't have seller assignments
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';
const MAIN_SELLER_EMAIL = 'dano@retail-products.com';
const SECONDARY_SELLER_EMAIL = 'ryan@notaryeveryday.com';

async function assignSellersToEnrichedPeople() {
  console.log('👨‍💼 ASSIGNING SELLERS TO ALREADY ENRICHED PEOPLE');
  console.log('=' .repeat(60));
  
  try {
    // Find seller user IDs
    const mainSeller = await prisma.users.findFirst({
      where: { email: MAIN_SELLER_EMAIL }
    });
    
    const secondarySeller = await prisma.users.findFirst({
      where: { email: SECONDARY_SELLER_EMAIL }
    });
    
    if (!mainSeller) {
      throw new Error(`Main seller "${MAIN_SELLER_EMAIL}" not found in users table`);
    }
    
    if (!secondarySeller) {
      throw new Error(`Secondary seller "${SECONDARY_SELLER_EMAIL}" not found in users table`);
    }
    
    console.log(`✅ Found main seller: ${mainSeller.username || mainSeller.email} (ID: ${mainSeller.id})`);
    console.log(`✅ Found secondary seller: ${secondarySeller.username || secondarySeller.email} (ID: ${secondarySeller.id})\n`);
    
    // Get people who are enriched but don't have main seller assigned
    const enrichedPeopleWithoutSeller = await prisma.people.findMany({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null,
        enrichedData: { not: null },
        mainSellerId: null
      },
      select: {
        id: true,
        fullName: true
      }
    });
    
    console.log(`📋 Found ${enrichedPeopleWithoutSeller.length} enriched people without seller assignments\n`);
    
    let stats = {
      total: enrichedPeopleWithoutSeller.length,
      mainSellerAssigned: 0,
      coSellerAssigned: 0,
      errors: []
    };
    
    for (let i = 0; i < enrichedPeopleWithoutSeller.length; i++) {
      const person = enrichedPeopleWithoutSeller[i];
      
      // Show progress every 50 records
      if (i % 50 === 0 || i === enrichedPeopleWithoutSeller.length - 1) {
        console.log(`[${i + 1}/${enrichedPeopleWithoutSeller.length}] Processing: ${person.fullName}`);
      }
      
      try {
        // Assign main seller
        await prisma.people.update({
          where: { id: person.id },
          data: {
            mainSellerId: mainSeller.id,
            updatedAt: new Date(),
            customFields: {
              sellerAssignedAt: new Date().toISOString()
            }
          }
        });
        
        // Add secondary seller to co-sellers table
        await prisma.person_co_sellers.upsert({
          where: {
            personId_userId: {
              personId: person.id,
              userId: secondarySeller.id
            }
          },
          update: {
            createdAt: new Date()
          },
          create: {
            personId: person.id,
            userId: secondarySeller.id,
            createdAt: new Date()
          }
        });
        
        stats.mainSellerAssigned++;
        stats.coSellerAssigned++;
        
      } catch (error) {
        console.error(`   ❌ Error processing ${person.fullName}:`, error.message);
        stats.errors.push({
          person: person.fullName,
          error: error.message
        });
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 SELLER ASSIGNMENT SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total people processed: ${stats.total}`);
    console.log(`Main seller assignments: ${stats.mainSellerAssigned}`);
    console.log(`Co-seller assignments: ${stats.coSellerAssigned}`);
    console.log(`Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      stats.errors.forEach(error => {
        console.log(`   - ${error.person}: ${error.error}`);
      });
    }
    
    // Verify final state
    console.log('\n' + '=' .repeat(60));
    console.log('✅ FINAL VERIFICATION');
    console.log('=' .repeat(60));
    
    const totalEnriched = await prisma.people.count({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null,
        enrichedData: { not: null }
      }
    });
    
    const withMainSeller = await prisma.people.count({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null,
        enrichedData: { not: null },
        mainSellerId: mainSeller.id
      }
    });
    
    const withCoSeller = await prisma.person_co_sellers.count({
      where: {
        userId: secondarySeller.id,
        person: {
          workspaceId: WORKSPACE_ID,
          deletedAt: null,
          enrichedData: { not: null }
        }
      }
    });
    
    console.log(`Total enriched people: ${totalEnriched}`);
    console.log(`With main seller (${mainSeller.username || mainSeller.email}): ${withMainSeller}`);
    console.log(`With co-seller (${secondarySeller.username || secondarySeller.email}): ${withCoSeller}`);
    console.log(`Main seller coverage: ${totalEnriched > 0 ? ((withMainSeller / totalEnriched) * 100).toFixed(1) : 0}%`);
    console.log(`Co-seller coverage: ${totalEnriched > 0 ? ((withCoSeller / totalEnriched) * 100).toFixed(1) : 0}%`);
    
    return stats;
    
  } catch (error) {
    console.error('\n❌ Seller assignment failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seller assignment
assignSellersToEnrichedPeople()
  .then(stats => {
    console.log('\n✅ Seller assignment completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Seller assignment failed:', error);
    process.exit(1);
  });
