#!/usr/bin/env node

/**
 * 🔍 TEST PREVIEW API SIMPLE
 * 
 * Test if CoreSignal Search Preview API works at all with a simple query
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function testPreviewSimple() {
  console.log('🔍 TESTING CORESIGNAL PREVIEW API');
  console.log('================================');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  console.log(`🔑 API Key available: ${process.env.CORESIGNAL_API_KEY ? 'YES' : 'NO'}`);
  console.log('');
  
  // Test 1: Very simple query - just search for any employees
  console.log('📊 Test 1: Simple query - any employees');
  try {
    const simpleQuery = {
      query: {
        match_all: {}
      }
    };
    
    console.log(`   Query: ${JSON.stringify(simpleQuery, null, 2)}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(simpleQuery)
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Simple query works: ${data.length || 0} employees`);
      if (data.length > 0) {
        console.log(`   📋 First employee: ${JSON.stringify(data[0], null, 2)}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Simple query failed: ${response.statusText}`);
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Simple query error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Search for specific company
  console.log('🏢 Test 2: Search for First Premier Bank');
  try {
    const companyQuery = {
      query: {
        bool: {
          must: [
            {
              match: {
                company_name: "First Premier Bank"
              }
            }
          ]
        }
      }
    };
    
    console.log(`   Query: ${JSON.stringify(companyQuery, null, 2)}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(companyQuery)
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Company query works: ${data.length || 0} employees`);
      if (data.length > 0) {
        console.log(`   📋 First employee: ${JSON.stringify(data[0], null, 2)}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Company query failed: ${response.statusText}`);
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Company query error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Search with company ID
  console.log('🆔 Test 3: Search with company ID');
  try {
    const companyIdQuery = {
      query: {
        bool: {
          must: [
            {
              term: {
                company_id: 7578901
              }
            }
          ]
        }
      }
    };
    
    console.log(`   Query: ${JSON.stringify(companyIdQuery, null, 2)}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(companyIdQuery)
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Company ID query works: ${data.length || 0} employees`);
      if (data.length > 0) {
        console.log(`   📋 First employee: ${JSON.stringify(data[0], null, 2)}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Company ID query failed: ${response.statusText}`);
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Company ID query error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 4: Search for specific title
  console.log('👔 Test 4: Search for specific title');
  try {
    const titleQuery = {
      query: {
        bool: {
          must: [
            {
              match: {
                active_experience_title: "Director"
              }
            }
          ]
        }
      }
    };
    
    console.log(`   Query: ${JSON.stringify(titleQuery, null, 2)}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(titleQuery)
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Title query works: ${data.length || 0} employees`);
      if (data.length > 0) {
        console.log(`   📋 First employee: ${JSON.stringify(data[0], null, 2)}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Title query failed: ${response.statusText}`);
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Title query error: ${error.message}`);
  }
  
  console.log('');
  console.log('🎯 PREVIEW API TEST COMPLETE');
}

// Run the test
testPreviewSimple().catch(console.error);
