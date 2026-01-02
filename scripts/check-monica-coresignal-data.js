#!/usr/bin/env node

/**
 * Check Monica Fundak's CoreSignal data to see the original phone number
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMonicaCoreSignalData() {
  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Find Monica Fundak
    const person = await prisma.people.findFirst({
      where: {
        OR: [
          { phone: { contains: '466498700', mode: 'insensitive' } },
          { fullName: { contains: 'Monica Fundak', mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        customFields: true
      }
    });

    if (!person) {
      throw new Error('Monica Fundak not found!');
    }

    console.log('='.repeat(80));
    console.log('MONICA FUNDAK - CORESIGNAL DATA CHECK');
    console.log('='.repeat(80));
    console.log(`Full Name: ${person.fullName}`);
    console.log(`Current Phone: ${person.phone || 'N/A'}`);
    console.log(`Current Mobile: ${person.mobilePhone || 'N/A'}`);
    console.log(`Current Work Phone: ${person.workPhone || 'N/A'}`);
    console.log('');

    // Check customFields for CoreSignal data
    if (person.customFields) {
      const customFields = person.customFields;
      
      console.log('Checking customFields for CoreSignal data...\n');
      
      // Check for various CoreSignal field names
      const coresignalFields = [
        'coresignalData',
        'coresignal',
        'coresignalData',
        'coresignal_full',
        'coresignal_complete'
      ];

      let foundCoreSignalData = false;

      for (const field of coresignalFields) {
        if (customFields[field]) {
          foundCoreSignalData = true;
          const csData = customFields[field];
          
          console.log(`✅ Found CoreSignal data in: ${field}\n`);
          
          // Extract phone-related fields
          console.log('Phone-related fields from CoreSignal:');
          console.log(`   phone: ${csData.phone || 'N/A'}`);
          console.log(`   mobile_phone: ${csData.mobile_phone || 'N/A'}`);
          console.log(`   work_phone: ${csData.work_phone || 'N/A'}`);
          console.log(`   phone_numbers: ${csData.phone_numbers ? JSON.stringify(csData.phone_numbers) : 'N/A'}`);
          console.log(`   phoneNumbers: ${csData.phoneNumbers ? JSON.stringify(csData.phoneNumbers) : 'N/A'}`);
          console.log('');
          
          // Show location data to verify if it matches
          console.log('Location data from CoreSignal:');
          console.log(`   location: ${csData.location || csData.location_full || 'N/A'}`);
          console.log(`   city: ${csData.city || csData.hq_city || 'N/A'}`);
          console.log(`   state: ${csData.state || csData.hq_state || 'N/A'}`);
          console.log(`   country: ${csData.country || csData.hq_country || 'N/A'}`);
          console.log('');
          
          // Show company data
          console.log('Company data from CoreSignal:');
          console.log(`   company: ${csData.company || csData.company_name || 'N/A'}`);
          console.log(`   active_experience_company: ${csData.active_experience_company || 'N/A'}`);
          console.log('');
          
          // If we have the full CoreSignal response, show more details
          if (csData.employee_id || csData.id) {
            console.log('CoreSignal Employee ID:');
            console.log(`   ${csData.employee_id || csData.id || 'N/A'}`);
            console.log('');
          }
          
          break;
        }
      }

      if (!foundCoreSignalData) {
        console.log('⚠️  No CoreSignal data found in customFields');
        console.log('   Available customFields keys:');
        console.log(JSON.stringify(Object.keys(customFields), null, 2));
        console.log('');
        console.log('Full customFields:');
        console.log(JSON.stringify(customFields, null, 2));
      }
    } else {
      console.log('⚠️  No customFields found');
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Current phone in database: ${person.phone || 'N/A'}`);
    console.log(`Phone is Australian (+61): ${person.phone?.includes('+61') || false}`);
    console.log('');
    console.log('Analysis:');
    console.log('   - If CoreSignal provided an Australian number for a US-based person,');
    console.log('     this could indicate:');
    console.log('     1. Wrong person matched in CoreSignal');
    console.log('     2. Person has moved/relocated');
    console.log('     3. Data quality issue in CoreSignal');
    console.log('     4. Number was incorrectly formatted/parsed');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMonicaCoreSignalData();












