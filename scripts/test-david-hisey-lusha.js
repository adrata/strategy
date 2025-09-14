#!/usr/bin/env node

/**
 * 🧪 DAVID HISEY LUSHA TEST
 * 
 * Direct test of David Hisey in Lusha database to see if he exists
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function testDavidHiseyLusha() {
  console.log('🧪 DAVID HISEY LUSHA TEST');
  console.log('=' .repeat(50));
  console.log('Testing if David Hisey, CFO of Stewart Title is in Lusha database');
  console.log('');

  if (!LUSHA_API_KEY) {
    console.log('❌ Lusha API key not available');
    return;
  }

  try {
    // Test exact parameters from our system
    const params = new URLSearchParams({
      firstName: 'David',
      lastName: 'Hisey',
      companyName: 'Stewart Title',
      companyDomain: 'stewart.com',
      refreshJobInfo: 'true',
      revealEmails: 'true',
      revealPhones: 'true'
    });

    console.log('🔍 Lusha API Call:');
    console.log(`   URL: https://api.lusha.com/v2/person?${params}`);
    console.log(`   API Key: ${LUSHA_API_KEY.substring(0, 8)}...${LUSHA_API_KEY.slice(-4)}`);
    
    const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
      method: 'GET',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ LUSHA API SUCCESS!');
      console.log('📋 Response Structure:');
      console.log(`   Full Name: ${data.fullName || 'Not provided'}`);
      console.log(`   Job Title: ${data.jobTitle || 'Not provided'}`);
      console.log(`   Email Addresses: ${data.emailAddresses?.length || 0}`);
      console.log(`   Phone Numbers: ${data.phoneNumbers?.length || 0}`);
      console.log(`   LinkedIn URL: ${data.linkedinUrl || 'Not provided'}`);
      console.log(`   Company: ${data.company?.name || 'Not provided'}`);
      
      if (data.emailAddresses && data.emailAddresses.length > 0) {
        console.log('');
        console.log('📧 EMAIL DETAILS:');
        data.emailAddresses.forEach((email, index) => {
          console.log(`   ${index + 1}. ${email.email} (Type: ${email.type || 'unknown'})`);
        });
      }
      
      if (data.phoneNumbers && data.phoneNumbers.length > 0) {
        console.log('');
        console.log('📞 PHONE DETAILS:');
        data.phoneNumbers.forEach((phone, index) => {
          console.log(`   ${index + 1}. ${phone.number} (Type: ${phone.type || 'unknown'})`);
        });
      }
      
      // Test if this person exists but with different search terms
      if (!data.fullName && !data.emailAddresses?.length) {
        console.log('');
        console.log('⚠️ PERSON NOT FOUND - Testing alternative search...');
        await testAlternativeSearch();
      }
      
    } else if (response.status === 404) {
      console.log('⚠️ PERSON NOT FOUND in Lusha database');
      console.log('   This is normal - not all executives are in Lusha');
      console.log('   Testing pattern generation fallback...');
      
      const generated = generateContactPatterns('David Hisey', 'Stewart Title', 'stewart.com');
      console.log('');
      console.log('🔧 GENERATED CONTACT PATTERNS:');
      console.log(`   📧 Email: ${generated.email}`);
      console.log(`   💼 LinkedIn: ${generated.linkedinUrl}`);
      
    } else {
      const errorText = await response.text();
      console.log(`❌ Lusha API Error: ${response.status}`);
      console.log(`   Details: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testAlternativeSearch() {
  console.log('🔍 Testing with just "Stewart" as company name...');
  
  const altParams = new URLSearchParams({
    firstName: 'David',
    lastName: 'Hisey',
    companyName: 'Stewart',
    refreshJobInfo: 'true',
    revealEmails: 'true',
    revealPhones: 'true'
  });

  try {
    const response = await fetch(`https://api.lusha.com/v2/person?${altParams}`, {
      method: 'GET',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   📊 Alternative search status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.fullName || data.emailAddresses?.length) {
        console.log('   ✅ Found with alternative search!');
        console.log(`   👤 Name: ${data.fullName}`);
        console.log(`   📧 Emails: ${data.emailAddresses?.length || 0}`);
      } else {
        console.log('   ⚠️ Still not found with alternative search');
      }
    }
  } catch (error) {
    console.log(`   ❌ Alternative search failed: ${error.message}`);
  }
}

function generateContactPatterns(name, company, domain) {
  const firstName = name.split(' ')[0].toLowerCase();
  const lastName = name.split(' ').slice(-1)[0].toLowerCase();
  
  return {
    email: `${firstName}.${lastName}@${domain}`,
    linkedinUrl: `https://www.linkedin.com/in/${firstName}-${lastName}`
  };
}

// Run the test
if (require.main === module) {
  testDavidHiseyLusha().catch(console.error);
}

module.exports = { testDavidHiseyLusha };
