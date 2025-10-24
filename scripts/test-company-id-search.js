#!/usr/bin/env node

/**
 * 🔍 TEST COMPANY ID SEARCH
 * 
 * Test if CoreSignal employee search works with company ID instead of company name
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function testCompanyIdSearch() {
  console.log('🔍 TESTING COMPANY ID SEARCH');
  console.log('============================');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  // Test with First Premier Bank ID
  const companyId = 7578901;
  const companyName = 'First Premier Bank';
  
  console.log(`🏢 Testing with: ${companyName} (ID: ${companyId})`);
  console.log('');
  
  // Test 1: Search by company_id field
  console.log('📊 Test 1: Search by company_id field');
  try {
    const query1 = {
      query: {
        bool: {
          must: [
            {
              term: {
                company_id: companyId
              }
            }
          ]
        }
      }
    };
    
    console.log(`   Query: ${JSON.stringify(query1, null, 2)}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query1)
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Company ID search works: ${data.length} employees`);
      if (data.length > 0) {
        console.log(`   📋 First employee: ${JSON.stringify(data[0], null, 2)}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Company ID search failed: ${response.statusText}`);
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Company ID search error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Search by active_experience_company_id field
  console.log('📊 Test 2: Search by active_experience_company_id field');
  try {
    const query2 = {
      query: {
        bool: {
          must: [
            {
              term: {
                active_experience_company_id: companyId
              }
            }
          ]
        }
      }
    };
    
    console.log(`   Query: ${JSON.stringify(query2, null, 2)}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query2)
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Active experience company ID search works: ${data.length} employees`);
      if (data.length > 0) {
        console.log(`   📋 First employee: ${JSON.stringify(data[0], null, 2)}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Active experience company ID search failed: ${response.statusText}`);
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Active experience company ID search error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Search by company_id with match instead of term
  console.log('📊 Test 3: Search by company_id with match');
  try {
    const query3 = {
      query: {
        bool: {
          must: [
            {
              match: {
                company_id: companyId
              }
            }
          ]
        }
      }
    };
    
    console.log(`   Query: ${JSON.stringify(query3, null, 2)}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query3)
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Company ID match search works: ${data.length} employees`);
      if (data.length > 0) {
        console.log(`   📋 First employee: ${JSON.stringify(data[0], null, 2)}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Company ID match search failed: ${response.statusText}`);
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Company ID match search error: ${error.message}`);
  }
  
  console.log('');
  console.log('🎯 COMPANY ID SEARCH TEST COMPLETE');
}

// Run the test
testCompanyIdSearch().catch(console.error);
