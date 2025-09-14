#!/usr/bin/env node

/**
 * 🔧 FIXED API KEYS TEST
 * 
 * Tests API calls with properly cleaned API keys
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();
const PROSPEO_API_KEY = process.env.PROSPEO_API_KEY?.replace(/\\n/g, '').trim();

const TEST_EXECUTIVE = {
  name: "John Smith",
  title: "Chief Financial Officer",
  company: "First American Title", 
  website: "firstam.com"
};

async function testFixedAPIKeys() {
  console.log('🔧 FIXED API KEYS TEST');
  console.log('=' .repeat(60));
  console.log('Testing with cleaned API keys');
  console.log('');
  
  console.log('🔑 Cleaned API Keys Status:');
  console.log(`   Lusha: ${LUSHA_API_KEY ? `✅ Available (${LUSHA_API_KEY.length} chars)` : '❌ Missing'}`);
  console.log(`   CoreSignal: ${CORESIGNAL_API_KEY ? `✅ Available (${CORESIGNAL_API_KEY.length} chars)` : '❌ Missing'}`);
  console.log(`   Prospeo: ${PROSPEO_API_KEY ? `✅ Available (${PROSPEO_API_KEY.length} chars)` : '❌ Missing'}`);
  console.log('');

  // Test Lusha with cleaned API key
  console.log('📞 TEST: Lusha API (Fixed)');
  console.log('─'.repeat(40));
  await testLushaFixed();
  
  console.log('');
  
  // Test CoreSignal with cleaned API key
  console.log('🏢 TEST: CoreSignal API (Fixed)');
  console.log('─'.repeat(40));
  await testCoreSignalFixed();
}

async function testLushaFixed() {
  if (!LUSHA_API_KEY) {
    console.log('❌ Lusha API key not available');
    return;
  }
  
  try {
    const firstName = TEST_EXECUTIVE.name.split(' ')[0];
    const lastName = TEST_EXECUTIVE.name.split(' ')[1];
    const domain = TEST_EXECUTIVE.website.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Use EXACT working pattern from old pipeline
    const params = new URLSearchParams({
      firstName: firstName,
      lastName: lastName,
      companyName: TEST_EXECUTIVE.company,
      companyDomain: domain,
      refreshJobInfo: 'true',
      revealEmails: 'true',
      revealPhones: 'true'
    });

    console.log(`   🔍 API Call: https://api.lusha.com/v2/person?${params}`);
    console.log(`   🔑 Using API Key: ${LUSHA_API_KEY.substring(0, 8)}...${LUSHA_API_KEY.slice(-4)}`);
    
    const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
      method: 'GET',
      headers: {
        'api_key': LUSHA_API_KEY,  // Use exact header from working implementation
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCCESS! Lusha API working`);
      console.log(`   📋 Response:`, {
        fullName: data.fullName,
        hasEmails: !!data.emailAddresses?.length,
        hasPhones: !!data.phoneNumbers?.length,
        hasLinkedIn: !!data.linkedinUrl,
        jobTitle: data.jobTitle
      });
      
      // Test contact extraction
      const emails = data.emailAddresses || [];
      const phones = data.phoneNumbers || [];
      
      if (emails.length > 0) {
        console.log(`   📧 Email: ${emails[0].email}`);
      }
      
      if (phones.length > 0) {
        console.log(`   📞 Phone: ${phones[0].number}`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
}

async function testCoreSignalFixed() {
  if (!CORESIGNAL_API_KEY) {
    console.log('❌ CoreSignal API key not available');
    return;
  }
  
  try {
    console.log(`   🔑 Using API Key: ${CORESIGNAL_API_KEY.substring(0, 8)}...${CORESIGNAL_API_KEY.slice(-4)}`);
    
    const response = await fetch('https://api.coresignal.com/cdapi/v1/employee/search/filter', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: TEST_EXECUTIVE.name,
        company_name: TEST_EXECUTIVE.company,
        limit: 5
      }),
      timeout: 15000
    });

    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCCESS! CoreSignal API working`);
      console.log(`   📋 Found: ${data.employees?.length || 0} employees`);
      
      if (data.employees && data.employees.length > 0) {
        const employee = data.employees[0];
        console.log(`   👤 Employee:`, {
          name: employee.full_name,
          hasEmail: !!employee.primary_professional_email,
          emailStatus: employee.primary_professional_email_status,
          title: employee.active_experience_title
        });
        
        if (employee.primary_professional_email) {
          console.log(`   📧 Email: ${employee.primary_professional_email}`);
        }
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
}

// Run the test
if (require.main === module) {
  testFixedAPIKeys().catch(console.error);
}

module.exports = { testFixedAPIKeys };
