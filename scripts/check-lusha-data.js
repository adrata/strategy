#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLushaData() {
  try {
    console.log('🔍 Checking for Lusha email and phone data...\n');

    // Get people who still have temp CoreSignal emails (the ones we skipped)
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
        phone: true,
        mobilePhone: true,
        workPhone: true,
        customFields: true,
        coresignalData: true,
        enrichedData: true,
        enrichmentSources: true
      },
      take: 10
    });

    console.log(`📊 Found ${peopleWithTempEmails.length} people with temp emails (checking for Lusha data)\n`);

    peopleWithTempEmails.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Current Email: ${person.email}`);
      console.log(`   Phone: ${person.phone || 'N/A'}`);
      console.log(`   Mobile: ${person.mobilePhone || 'N/A'}`);
      console.log(`   Work Phone: ${person.workPhone || 'N/A'}`);
      console.log(`   Enrichment Sources: ${person.enrichmentSources || 'N/A'}`);
      
      // Check customFields for Lusha data
      if (person.customFields) {
        console.log('   Custom Fields:');
        Object.keys(person.customFields).forEach(key => {
          if (key.toLowerCase().includes('email') || 
              key.toLowerCase().includes('phone') || 
              key.toLowerCase().includes('lusha') ||
              key.toLowerCase().includes('contact')) {
            console.log(`     ${key}: ${person.customFields[key]}`);
          }
        });
      }
      
      // Check enrichedData for Lusha data
      if (person.enrichedData) {
        console.log('   Enriched Data Keys:', Object.keys(person.enrichedData));
        if (person.enrichedData.email) {
          console.log(`     Enriched Email: ${person.enrichedData.email}`);
        }
        if (person.enrichedData.phone) {
          console.log(`     Enriched Phone: ${person.enrichedData.phone}`);
        }
      }
      
      console.log('   ---');
    });

    // Also check for people with Lusha in their enrichment sources
    console.log('\n🔍 Checking all people with Lusha enrichment...\n');
    
    const peopleWithLusha = await prisma.people.findMany({
      where: {
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
        enrichedData: true,
        enrichmentSources: true
      },
      take: 5
    });

    console.log(`📊 Found ${peopleWithLusha.length} people enriched with Lusha data\n`);

    peopleWithLusha.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Email: ${person.email}`);
      console.log(`   Phone: ${person.phone || 'N/A'}`);
      console.log(`   Mobile: ${person.mobilePhone || 'N/A'}`);
      console.log(`   Work Phone: ${person.workPhone || 'N/A'}`);
      console.log(`   Sources: ${person.enrichmentSources}`);
      
      if (person.customFields) {
        const lushaFields = Object.keys(person.customFields).filter(key => 
          key.toLowerCase().includes('lusha') || 
          key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('phone')
        );
        if (lushaFields.length > 0) {
          console.log('   Lusha/Contact Fields:');
          lushaFields.forEach(field => {
            console.log(`     ${field}: ${person.customFields[field]}`);
          });
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

checkLushaData();
