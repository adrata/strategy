#!/usr/bin/env node

/**
 * 🎯 CORRECT LUSHA API GET METHOD FOR MICHELLE LEE
 * 
 * Using the correct GET method with multiple parameters
 * Based on comprehensive API research
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function testMichelleLeeCorrectGET() {
  console.log('🎯 CORRECT LUSHA API GET METHOD FOR MICHELLE LEE');
  console.log('===============================================\n');
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ Lusha API key found');
  console.log(`   Key length: ${LUSHA_API_KEY.length} characters\n`);
  
  const testCases = [
    {
      name: 'All Parameters Combined',
      params: {
        firstName: 'Michelle',
        lastName: 'Lee',
        companyName: 'Southern California Edison Company',
        linkedinUrl: 'https://www.linkedin.com/in/michelleleexue/',
        revealEmails: 'true',
        revealPhones: 'true'
      }
    },
    {
      name: 'Name + Company + LinkedIn',
      params: {
        firstName: 'Michelle',
        lastName: 'Lee',
        companyName: 'Southern California Edison Company',
        linkedinUrl: 'https://www.linkedin.com/in/michelleleexue/'
      }
    },
    {
      name: 'Name + Company Only',
      params: {
        firstName: 'Michelle',
        lastName: 'Lee',
        companyName: 'Southern California Edison Company'
      }
    },
    {
      name: 'Name + Domain',
      params: {
        firstName: 'Michelle',
        lastName: 'Lee',
        companyDomain: 'sce.com'
      }
    },
    {
      name: 'LinkedIn URL Only',
      params: {
        linkedinUrl: 'https://www.linkedin.com/in/michelleleexue/'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`🔍 TEST: ${testCase.name}`);
    console.log('-'.repeat(50));
    
    const success = await testLushaPersonAPIGET(testCase.params, testCase.name);
    
    if (success) {
      console.log('\n   🎉 SUCCESS: Found Michelle Lee!');
      break; // Stop testing once we find her
    }
    
    console.log('\n');
    
    // Wait between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function testLushaPersonAPIGET(params, testName) {
  try {
    const queryParams = new URLSearchParams(params);
    
    console.log(`   🌐 API Call: GET https://api.lusha.com/v2/person?${queryParams}`);
    
    const response = await fetch(`https://api.lusha.com/v2/person?${queryParams}`, {
      method: 'GET',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n   📋 LUSHA API RESPONSE:');
      console.log('   =====================');
      console.log(`   Full Name: ${data.fullName || 'Not found'}`);
      console.log(`   Job Title: ${data.jobTitle || 'Not found'}`);
      console.log(`   Company: ${data.company?.name || 'Not found'}`);
      console.log(`   LinkedIn: ${data.linkedinUrl || 'Not found'}`);
      
      // Email addresses
      if (data.emailAddresses && data.emailAddresses.length > 0) {
        console.log('\n   📧 EMAIL ADDRESSES:');
        data.emailAddresses.forEach((email, index) => {
          console.log(`     ${index + 1}. ${email.email} (type: ${email.type || 'unknown'})`);
        });
      } else {
        console.log('\n   📧 EMAIL ADDRESSES: None found');
      }
      
      // Phone numbers
      if (data.phoneNumbers && data.phoneNumbers.length > 0) {
        console.log('\n   📞 PHONE NUMBERS:');
        data.phoneNumbers.forEach((phone, index) => {
          console.log(`     ${index + 1}. ${phone.number} (type: ${phone.type || 'unknown'})`);
        });
      } else {
        console.log('\n   📞 PHONE NUMBERS: None found');
      }
      
      if (data.fullName || data.emailAddresses?.length > 0 || data.phoneNumbers?.length > 0) {
        console.log(`\n   ✅ SUCCESS with ${testName}!`);
        return true;
      } else {
        console.log(`\n   ⚠️ No data found with ${testName}`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ API Error: ${response.status}`);
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  return false;
}

// Run the correct GET method test
testMichelleLeeCorrectGET().catch(console.error);
