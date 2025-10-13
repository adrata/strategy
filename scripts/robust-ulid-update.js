#!/usr/bin/env node

/**
 * 🔄 ROBUST ULID UPDATE
 * 
 * Safely updates remaining non-ULID records with proper error handling
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const newPrisma = new PrismaClient();

async function robustUlidUpdate() {
  try {
    console.log('🔄 Starting robust ULID update...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to database!\n');

    // ULID pattern: 26 characters, starts with timestamp (0-9), contains uppercase letters and numbers
    const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
    
    // 1. Get current state
    console.log('📊 CURRENT STATE:');
    const allPeople = await newPrisma.people.findMany({
      select: { id: true, fullName: true }
    });
    
    const nonUlidPeople = allPeople.filter(person => !ulidPattern.test(person.id));
    console.log(`   Total people: ${allPeople.length}`);
    console.log(`   People with non-ULID IDs: ${nonUlidPeople.length}`);
    
    if (nonUlidPeople.length === 0) {
      console.log('\n🎉 All people already have ULIDs!');
      return;
    }

    // 2. Update in smaller batches with better error handling
    console.log('\n👥 UPDATING PEOPLE IN BATCHES:');
    
    let peopleUpdated = 0;
    let peopleErrors = 0;
    const batchSize = 50;
    
    for (let i = 0; i < nonUlidPeople.length; i += batchSize) {
      const batch = nonUlidPeople.slice(i, i + batchSize);
      console.log(`\n   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(nonUlidPeople.length/batchSize)} (${batch.length} records)`);
      
      for (const person of batch) {
        try {
          // Check if person still exists
          const existingPerson = await newPrisma.people.findUnique({
            where: { id: person.id },
            select: { id: true }
          });
          
          if (!existingPerson) {
            console.log(`   ⚠️  Person ${person.fullName} no longer exists, skipping`);
            continue;
          }
          
          const newUlid = ulid();
          
          // Update the person with new ULID
          await newPrisma.people.update({
            where: { id: person.id },
            data: { id: newUlid }
          });
          
          // Update any foreign key references
          await newPrisma.person_co_sellers.updateMany({
            where: { personId: person.id },
            data: { personId: newUlid }
          });
          
          await newPrisma.actions.updateMany({
            where: { personId: person.id },
            data: { personId: newUlid }
          });
          
          peopleUpdated++;
          
        } catch (error) {
          console.log(`   ❌ Error updating person ${person.fullName}: ${error.message}`);
          peopleErrors++;
        }
      }
      
      console.log(`   ✅ Batch complete: ${peopleUpdated} updated, ${peopleErrors} errors`);
    }
    
    console.log(`\n📊 UPDATE SUMMARY:`);
    console.log(`   Total updated: ${peopleUpdated}`);
    console.log(`   Total errors: ${peopleErrors}`);

    // 3. Final verification
    console.log('\n🔍 FINAL VERIFICATION:');
    const finalPeople = await newPrisma.people.findMany({
      select: { id: true }
    });
    
    const finalNonUlidPeople = finalPeople.filter(person => !ulidPattern.test(person.id));
    
    console.log(`   Total people: ${finalPeople.length}`);
    console.log(`   People with ULIDs: ${finalPeople.length - finalNonUlidPeople.length}`);
    console.log(`   People with non-ULIDs: ${finalNonUlidPeople.length}`);
    console.log(`   ULID compliance: ${((finalPeople.length - finalNonUlidPeople.length) / finalPeople.length * 100).toFixed(2)}%`);

    if (finalNonUlidPeople.length === 0) {
      console.log('\n🎉 ALL PEOPLE RECORDS NOW HAVE ULIDS!');
    } else {
      console.log('\n⚠️  Some people records still need ULID updates');
      console.log('   This might be due to concurrent operations or data changes');
    }

  } catch (error) {
    console.error('❌ Error during ULID update:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the update
robustUlidUpdate();
