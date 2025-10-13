#!/usr/bin/env node

/**
 * 🔄 COMPLETE ULID UPDATE
 * 
 * Updates all remaining non-ULID records to use proper ULIDs
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const newPrisma = new PrismaClient();

async function completeUlidUpdate() {
  try {
    console.log('🔄 Completing ULID update...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to database!\n');

    // ULID pattern: 26 characters, starts with timestamp (0-9), contains uppercase letters and numbers
    const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
    
    // 1. Update People records
    console.log('👥 UPDATING PEOPLE RECORDS:');
    const people = await newPrisma.people.findMany({
      select: { id: true, fullName: true }
    });
    
    const nonUlidPeople = people.filter(person => !ulidPattern.test(person.id));
    console.log(`   Found ${nonUlidPeople.length} people with non-ULID IDs`);
    
    let peopleUpdated = 0;
    let peopleErrors = 0;
    
    for (const person of nonUlidPeople) {
      try {
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
        if (peopleUpdated % 100 === 0) {
          console.log(`   Updated ${peopleUpdated} people...`);
        }
        
      } catch (error) {
        console.log(`   Error updating person ${person.fullName}: ${error.message}`);
        peopleErrors++;
      }
    }
    
    console.log(`✅ Updated ${peopleUpdated} people, ${peopleErrors} errors\n`);

    // 2. Final verification
    console.log('🔍 FINAL ULID VERIFICATION:');
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
    }

  } catch (error) {
    console.error('❌ Error during ULID update:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the update
completeUlidUpdate();
