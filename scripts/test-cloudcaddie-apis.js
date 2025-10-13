#!/usr/bin/env node

/**
 * 🧪 TEST CLOUDCADDIE APIs
 * 
 * Test Coresignal and Lusha APIs with hardcoded keys to verify they work
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables from .env file
require('dotenv').config();

// Use API keys from .env file
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function testCloudCaddieAPIs() {
  console.log('🧪 TESTING CLOUDCADDIE APIs');
  console.log('============================\n');
  
  console.log('🔑 API Keys Status:');
  console.log(`   Coresignal: ✅ Available (${CORESIGNAL_API_KEY.length} chars)`);
  console.log(`   Lusha: ${LUSHA_API_KEY ? `✅ Available (${LUSHA_API_KEY.length} chars)` : '❌ Missing'}\n`);

  // Test with a CloudCaddie person who has LinkedIn
  const testPerson = {
    fullName: "Amy Ewing",
    firstName: "Amy",
    lastName: "Ewing", 
    email: "amy.ewing@luminacorps.com",
    linkedinUrl: "https://www.linkedin.com/in/amy-ewing-1773a15/",
    company: {
      name: "Lumina Corps",
      domain: "luminacorps.com"
    }
  };

  console.log(`🎯 Testing with: ${testPerson.fullName}`);
  console.log(`   LinkedIn: ${testPerson.linkedinUrl}`);
  console.log(`   Email: ${testPerson.email}\n`);

  // Test Coresignal LinkedIn search
  await testCoresignalLinkedIn(testPerson.linkedinUrl);
  
  // Test Coresignal email search
  await testCoresignalEmail(testPerson.email);
  
  // Test Lusha if available
  if (LUSHA_API_KEY) {
    await testLushaLinkedIn(testPerson.linkedinUrl);
  } else {
    console.log('⚠️ Skipping Lusha tests - API key not available\n');
  }
}

async function testCoresignalLinkedIn(linkedinUrl) {
  console.log('🔍 Testing Coresignal LinkedIn Search...');
  
  try {
    const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl';
    const data = {
      query: {
        bool: {
          must: [
            {
              match_phrase: {
                linkedin_url: linkedinUrl
              }
            }
          ]
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY
      },
      body: JSON.stringify(data)
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Success! Found ${result.hits?.total || 0} results`);
      
      if (result.hits?.hits?.length > 0) {
        const person = result.hits.hits[0]._source;
        console.log(`   📋 Name: ${person.full_name}`);
        console.log(`   📧 Email: ${person.work_email || 'Not found'}`);
        console.log(`   📞 Phone: ${person.phone_numbers?.[0] || 'Not found'}`);
        console.log(`   🏢 Company: ${person.current_company_name || 'Not found'}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('');
}

async function testCoresignalEmail(email) {
  console.log('🔍 Testing Coresignal Email Search...');
  
  try {
    const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl';
    const data = {
      query: {
        bool: {
          must: [
            {
              match_phrase: {
                work_email: email
              }
            }
          ]
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY
      },
      body: JSON.stringify(data)
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Success! Found ${result.hits?.total || 0} results`);
      
      if (result.hits?.hits?.length > 0) {
        const person = result.hits.hits[0]._source;
        console.log(`   📋 Name: ${person.full_name}`);
        console.log(`   📧 Email: ${person.work_email || 'Not found'}`);
        console.log(`   📞 Phone: ${person.phone_numbers?.[0] || 'Not found'}`);
        console.log(`   🏢 Company: ${person.current_company_name || 'Not found'}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('');
}

async function testLushaLinkedIn(linkedinUrl) {
  console.log('🔍 Testing Lusha LinkedIn Search...');
  
  try {
    const requestBody = {
      contacts: [
        {
          contactId: "1",
          linkedinUrl: linkedinUrl
        }
      ],
      metadata: {
        revealEmails: true,
        revealPhones: true
      }
    };

    const response = await fetch('https://api.lusha.com/v2/person', {
      method: 'POST',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Success!`);
      
      if (result.contacts && result.contacts.length > 0) {
        const contact = result.contacts[0];
        console.log(`   📋 Name: ${contact.firstName} ${contact.lastName}`);
        console.log(`   📧 Email: ${contact.emails?.[0] || 'Not found'}`);
        console.log(`   📞 Phone: ${contact.phones?.[0] || 'Not found'}`);
        console.log(`   🏢 Company: ${contact.companyName || 'Not found'}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('');
}

// Run the test
if (require.main === module) {
  testCloudCaddieAPIs();
}

module.exports = { testCloudCaddieAPIs };
