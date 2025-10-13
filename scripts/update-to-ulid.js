#!/usr/bin/env node

/**
 * 🔄 UPDATE TO ULID
 * 
 * Updates all non-ULID records to use proper ULIDs
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const newPrisma = new PrismaClient();

async function updateToUlid() {
  try {
    console.log('🔄 UPDATING RECORDS TO ULID\n');
    console.log('============================\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to database!\n');

    // ULID pattern: 26 characters, starts with timestamp (0-9), contains uppercase letters and numbers
    const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
    
    // Track updates
    let totalUpdated = 0;
    let totalErrors = 0;

    // 1. Update Companies
    console.log('🏢 UPDATING COMPANIES:');
    const companies = await newPrisma.companies.findMany({
      select: { id: true, name: true }
    });
    
    const nonUlidCompanies = companies.filter(company => !ulidPattern.test(company.id));
    console.log(`   Found ${nonUlidCompanies.length} companies with non-ULID IDs`);
    
    let companiesUpdated = 0;
    let companiesErrors = 0;
    
    for (const company of nonUlidCompanies) {
      try {
        const newUlid = ulid();
        
        // Update the company with new ULID
        await newPrisma.companies.update({
          where: { id: company.id },
          data: { id: newUlid }
        });
        
        // Update any foreign key references
        await newPrisma.people.updateMany({
          where: { companyId: company.id },
          data: { companyId: newUlid }
        });
        
        companiesUpdated++;
        if (companiesUpdated % 100 === 0) {
          console.log(`   Updated ${companiesUpdated} companies...`);
        }
        
      } catch (error) {
        console.log(`   Error updating company ${company.name}: ${error.message}`);
        companiesErrors++;
      }
    }
    
    console.log(`✅ Updated ${companiesUpdated} companies, ${companiesErrors} errors\n`);
    totalUpdated += companiesUpdated;
    totalErrors += companiesErrors;

    // 2. Update People
    console.log('👥 UPDATING PEOPLE:');
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
    totalUpdated += peopleUpdated;
    totalErrors += peopleErrors;

    // 3. Summary
    console.log('📊 UPDATE SUMMARY:');
    console.log('==================');
    console.log(`Total records updated: ${totalUpdated}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log(`Success rate: ${((totalUpdated) / (totalUpdated + totalErrors) * 100).toFixed(2)}%`);

    if (totalErrors === 0) {
      console.log('\n🎉 ALL RECORDS SUCCESSFULLY UPDATED TO ULID!');
    } else {
      console.log('\n⚠️  Some records could not be updated. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Error during ULID update:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the update
updateToUlid();
