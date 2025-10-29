#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLushaDetails() {
  try {
    console.log('🔍 Checking detailed Lusha data...\n');

    // Get people with Lusha data
    const peopleWithLusha = await prisma.people.findMany({
      where: {
        customFields: {
          path: ['lushaData'],
          not: null
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        customFields: true
      },
      take: 5
    });

    console.log(`📊 Found ${peopleWithLusha.length} people with Lusha data\n`);

    peopleWithLusha.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Current Email: ${person.email || 'NULL'}`);
      console.log(`   Current Phone: ${person.phone || 'NULL'}`);
      console.log(`   Current Mobile: ${person.mobilePhone || 'NULL'}`);
      console.log(`   Current Work Phone: ${person.workPhone || 'NULL'}`);
      
      if (person.customFields && person.customFields.lushaData) {
        console.log('   Lusha Data:');
        const lushaData = person.customFields.lushaData;
        console.log(`     Keys: ${Object.keys(lushaData).join(', ')}`);
        
        // Check for email in Lusha data
        if (lushaData.email) {
          console.log(`     Email: ${lushaData.email}`);
        }
        if (lushaData.work_email) {
          console.log(`     Work Email: ${lushaData.work_email}`);
        }
        if (lushaData.personal_email) {
          console.log(`     Personal Email: ${lushaData.personal_email}`);
        }
        
        // Check for phone in Lusha data
        if (lushaData.phone) {
          console.log(`     Phone: ${lushaData.phone}`);
        }
        if (lushaData.mobile_phone) {
          console.log(`     Mobile Phone: ${lushaData.mobile_phone}`);
        }
        if (lushaData.work_phone) {
          console.log(`     Work Phone: ${lushaData.work_phone}`);
        }
        if (lushaData.direct_phone) {
          console.log(`     Direct Phone: ${lushaData.direct_phone}`);
        }
        
        // Show all Lusha data for inspection
        console.log(`     Full Lusha Data:`, JSON.stringify(lushaData, null, 2));
      }
      
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLushaDetails();
