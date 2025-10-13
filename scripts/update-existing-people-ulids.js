#!/usr/bin/env node

/**
 * 🔄 UPDATE EXISTING PEOPLE ULIDS
 * 
 * Updates only existing people records in the new streamlined database
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const newPrisma = new PrismaClient();

async function updateExistingPeopleUlids() {
  try {
    console.log('🔄 Updating existing people ULIDs in streamlined database...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to streamlined database!\n');

    // ULID pattern: 26 characters, starts with timestamp (0-9), contains uppercase letters and numbers
    const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
    
    // 1. Get all people from the streamlined database
    console.log('📊 GETTING ALL PEOPLE FROM STREAMLINED DATABASE:');
    const allPeople = await newPrisma.people.findMany({
      select: { id: true, fullName: true, workspaceId: true }
    });
    
    console.log(`   Total people in streamlined database: ${allPeople.length}`);
    
    // 2. Filter to only non-ULID people
    const nonUlidPeople = allPeople.filter(person => !ulidPattern.test(person.id));
    console.log(`   People with non-ULID IDs: ${nonUlidPeople.length}`);
    
    if (nonUlidPeople.length === 0) {
      console.log('\n🎉 All people already have ULIDs!');
      return;
    }

    // 3. Show sample of non-ULID people
    console.log('\n📋 SAMPLE NON-ULID PEOPLE:');
    nonUlidPeople.slice(0, 10).forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.fullName} (${person.id}) - Workspace: ${person.workspaceId}`);
    });

    // 4. Update in small batches with proper error handling
    console.log('\n👥 UPDATING PEOPLE IN SMALL BATCHES:');
    
    let peopleUpdated = 0;
    let peopleErrors = 0;
    const batchSize = 10; // Smaller batches for safety
    
    for (let i = 0; i < nonUlidPeople.length; i += batchSize) {
      const batch = nonUlidPeople.slice(i, i + batchSize);
      console.log(`\n   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(nonUlidPeople.length/batchSize)} (${batch.length} records)`);
      
      for (const person of batch) {
        try {
          // Double-check the person still exists
          const existingPerson = await newPrisma.people.findUnique({
            where: { id: person.id },
            select: { id: true, fullName: true }
          });
          
          if (!existingPerson) {
            console.log(`   ⚠️  Person ${person.fullName} (${person.id}) no longer exists, skipping`);
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
          console.log(`   ✅ Updated ${person.fullName} (${person.id} -> ${newUlid})`);
          
        } catch (error) {
          console.log(`   ❌ Error updating person ${person.fullName}: ${error.message}`);
          peopleErrors++;
        }
      }
      
      console.log(`   📊 Batch complete: ${peopleUpdated} updated, ${peopleErrors} errors`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 UPDATE SUMMARY:`);
    console.log(`   Total updated: ${peopleUpdated}`);
    console.log(`   Total errors: ${peopleErrors}`);

    // 5. Final verification
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
      console.log('   Remaining non-ULID people:');
      finalNonUlidPeople.slice(0, 5).forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during ULID update:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the update
updateExistingPeopleUlids();
