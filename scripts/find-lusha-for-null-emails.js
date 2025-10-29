#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findLushaForNullEmails() {
  try {
    console.log('🔍 Finding people with NULL emails who might have Lusha data...\n');

    // Get people with NULL emails who have Lusha in their enrichment sources
    const peopleWithNullEmails = await prisma.people.findMany({
      where: {
        email: null,
        enrichmentSources: {
          has: 'lusha'
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        customFields: true,
        enrichmentSources: true
      }
    });

    console.log(`📊 Found ${peopleWithNullEmails.length} people with NULL emails and Lusha enrichment\n`);

    let foundLushaData = 0;

    peopleWithNullEmails.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Email: ${person.email || 'NULL'}`);
      console.log(`   Phone: ${person.phone || 'NULL'}`);
      console.log(`   Mobile: ${person.mobilePhone || 'NULL'}`);
      console.log(`   Work Phone: ${person.workPhone || 'NULL'}`);
      console.log(`   Sources: ${person.enrichmentSources}`);
      
      if (person.customFields && person.customFields.lushaData) {
        const lushaData = person.customFields.lushaData;
        console.log('   ✅ Lusha Data Found:');
        
        if (lushaData.email) {
          console.log(`     Email: ${lushaData.email}`);
        }
        if (lushaData.phone) {
          console.log(`     Phone: ${lushaData.phone}`);
        }
        if (lushaData.mobile) {
          console.log(`     Mobile: ${lushaData.mobile}`);
        }
        
        foundLushaData++;
      } else {
        console.log('   ❌ No Lusha data in customFields');
      }
      
      console.log('   ---');
    });

    console.log(`\n📊 Summary:`);
    console.log(`   People with NULL emails + Lusha: ${peopleWithNullEmails.length}`);
    console.log(`   People with Lusha data available: ${foundLushaData}`);

    // Also check for people with temp emails who might have Lusha data
    console.log(`\n🔍 Checking for people with temp emails who might have Lusha data...\n`);
    
    const peopleWithTempEmails = await prisma.people.findMany({
      where: {
        email: {
          contains: '@coresignal.temp'
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        customFields: true,
        enrichmentSources: true
      },
      take: 5
    });

    console.log(`📊 Found ${peopleWithTempEmails.length} people still with temp emails\n`);

    peopleWithTempEmails.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Email: ${person.email}`);
      console.log(`   Sources: ${person.enrichmentSources}`);
      
      if (person.customFields && person.customFields.lushaData) {
        const lushaData = person.customFields.lushaData;
        console.log('   ✅ Lusha Data Found:');
        if (lushaData.email) {
          console.log(`     Email: ${lushaData.email}`);
        }
        if (lushaData.phone) {
          console.log(`     Phone: ${lushaData.phone}`);
        }
      } else {
        console.log('   ❌ No Lusha data');
      }
      
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findLushaForNullEmails();
