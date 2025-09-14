#!/usr/bin/env node

/**
 * 🎯 WORKING API PATTERNS TEST
 * 
 * Uses the EXACT working API patterns from the original pipeline
 * Tests with real executive names that should exist in the APIs
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();
const PROSPEO_API_KEY = process.env.PROSPEO_API_KEY?.replace(/\\n/g, '').trim();

// Test with more realistic executives that are likely to be found
const TEST_EXECUTIVES = [
  {
    name: "Brian Fox",
    title: "Chief Executive Officer",
    company: "First American Title",
    website: "firstam.com"
  },
  {
    name: "Dennis Gilmore", 
    title: "Chief Executive Officer",
    company: "First American Financial Corporation",
    website: "firstam.com"
  },
  {
    name: "Michael Gravelle",
    title: "Executive Vice President",
    company: "First American Title",
    website: "firstam.com"
  }
];

async function testWorkingAPIPatterns() {
  console.log('🎯 WORKING API PATTERNS TEST');
  console.log('=' .repeat(60));
  console.log('Testing with EXACT working patterns from original pipeline');
  console.log('');
  
  console.log('🔑 API Keys Status:');
  console.log(`   Lusha: ${LUSHA_API_KEY ? `✅ Available (${LUSHA_API_KEY.length} chars)` : '❌ Missing'}`);
  console.log(`   CoreSignal: ${CORESIGNAL_API_KEY ? `✅ Available (${CORESIGNAL_API_KEY.length} chars)` : '❌ Missing'}`);
  console.log(`   Prospeo: ${PROSPEO_API_KEY ? `✅ Available (${PROSPEO_API_KEY.length} chars)` : '❌ Missing'}`);
  console.log('');

  for (const executive of TEST_EXECUTIVES) {
    console.log(`👤 Testing: ${executive.name} (${executive.title})`);
    console.log('─'.repeat(50));
    
    // Test Lusha
    console.log('📞 Lusha API Test:');
    await testLushaWorking(executive);
    
    console.log('');
    
    // Test CoreSignal with working v2 endpoint
    console.log('🏢 CoreSignal API Test:');
    await testCoreSignalWorking(executive);
    
    console.log('');
    console.log('⏳ Waiting 3 seconds before next executive...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
  }
}

async function testLushaWorking(executive) {
  if (!LUSHA_API_KEY) {
    console.log('   ❌ API key not available');
    return;
  }
  
  try {
    const firstName = executive.name.split(' ')[0];
    const lastName = executive.name.split(' ').slice(1).join(' ');
    const domain = executive.website.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Use EXACT working pattern
    const params = new URLSearchParams({
      firstName: firstName,
      lastName: lastName,
      companyName: executive.company,
      companyDomain: domain,
      refreshJobInfo: 'true',
      revealEmails: 'true',
      revealPhones: 'true'
    });
    
    const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
      method: 'GET',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      // Check if person was found
      if (data.fullName || data.emailAddresses?.length > 0 || data.phoneNumbers?.length > 0) {
        console.log(`   ✅ PERSON FOUND!`);
        console.log(`   👤 Name: ${data.fullName || 'Not provided'}`);
        console.log(`   💼 Title: ${data.jobTitle || 'Not provided'}`);
        console.log(`   📧 Emails: ${data.emailAddresses?.length || 0}`);
        console.log(`   📞 Phones: ${data.phoneNumbers?.length || 0}`);
        console.log(`   💼 LinkedIn: ${data.linkedinUrl ? '✅ Found' : '❌ Not found'}`);
        
        // Show actual contact info
        if (data.emailAddresses?.length > 0) {
          console.log(`   📧 Primary Email: ${data.emailAddresses[0].email}`);
        }
        
        if (data.phoneNumbers?.length > 0) {
          console.log(`   📞 Primary Phone: ${data.phoneNumbers[0].number}`);
        }
        
      } else {
        console.log(`   ⚠️ API working but person not found in database`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
}

async function testCoreSignalWorking(executive) {
  if (!CORESIGNAL_API_KEY) {
    console.log('   ❌ API key not available');
    return;
  }
  
  try {
    // Use the EXACT working v2 endpoint with es_dsl
    const searchQuery = {
      query: {
        bool: {
          must: [
            {
              match: {
                "member_full_name": executive.name
              }
            },
            {
              match: {
                "current_company_name": executive.company
              }
            }
          ]
        }
      },
      size: 5
    };
    
    console.log(`   🔍 Searching for: ${executive.name} at ${executive.company}`);
    
    const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchQuery),
      timeout: 15000
    });

    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   📋 Found: ${data.hits?.length || 0} results`);
      
      if (data.hits && data.hits.length > 0) {
        const person = data.hits[0]._source;
        console.log(`   ✅ PERSON FOUND!`);
        console.log(`   👤 Name: ${person.member_full_name || 'Not provided'}`);
        console.log(`   💼 Title: ${person.member_position_title || 'Not provided'}`);
        console.log(`   🏢 Company: ${person.current_company_name || 'Not provided'}`);
        console.log(`   📧 Email: ${person.member_professional_email || 'Not found'}`);
        console.log(`   💼 LinkedIn: ${person.member_linkedin_url ? '✅ Found' : '❌ Not found'}`);
        
        // Show email status if available
        if (person.member_professional_email_status) {
          console.log(`   📊 Email Status: ${person.member_professional_email_status}`);
        }
        
      } else {
        console.log(`   ⚠️ API working but person not found in database`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
}

// Run the test
if (require.main === module) {
  testWorkingAPIPatterns().catch(console.error);
}

module.exports = { testWorkingAPIPatterns };
