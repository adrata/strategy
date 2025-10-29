#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCoreSignalEmails() {
  try {
    // Get people with CoreSignal temp emails
    const people = await prisma.people.findMany({
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
        coresignalData: true,
        enrichedData: true
      },
      take: 5
    });

    console.log('🔍 Checking CoreSignal data for real emails...\n');
    
    people.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Current Email: ${person.email}`);
      
      // Check customFields for email
      if (person.customFields) {
        console.log('   Custom Fields:');
        Object.keys(person.customFields).forEach(key => {
          if (key.toLowerCase().includes('email') || key.toLowerCase().includes('mail')) {
            console.log(`     ${key}: ${person.customFields[key]}`);
          }
        });
      }
      
      // Check coresignalData for email
      if (person.coresignalData) {
        console.log('   CoreSignal Data Keys:', Object.keys(person.coresignalData));
        if (person.coresignalData.email) {
          console.log(`     CoreSignal Email: ${person.coresignalData.email}`);
        }
        if (person.coresignalData.work_email) {
          console.log(`     CoreSignal Work Email: ${person.coresignalData.work_email}`);
        }
        if (person.coresignalData.personal_email) {
          console.log(`     CoreSignal Personal Email: ${person.coresignalData.personal_email}`);
        }
      }
      
      // Check enrichedData for email
      if (person.enrichedData) {
        console.log('   Enriched Data Keys:', Object.keys(person.enrichedData));
        if (person.enrichedData.email) {
          console.log(`     Enriched Email: ${person.enrichedData.email}`);
        }
      }
      
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoreSignalEmails();
