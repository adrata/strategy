#!/usr/bin/env node

/**
 * 🧪 TEST MATCH GROUP PREVIEW API
 * 
 * Test CoreSignal Preview API for Match Group using company ID 2496218
 * Based on working pattern from winning-variant-preview-working.js
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();

if (!CORESIGNAL_API_KEY) {
  console.error('❌ CORESIGNAL_API_KEY not found in environment variables');
  process.exit(1);
}

const MATCH_GROUP_ID = 2496218;
const MATCH_GROUP_NAME = 'Match Group';

async function testMatchGroupPreview() {
  console.log('🧪 TESTING MATCH GROUP PREVIEW API');
  console.log('==================================');
  console.log(`Company: ${MATCH_GROUP_NAME}`);
  console.log(`Company ID: ${MATCH_GROUP_ID}`);
  console.log('');

  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  try {
    console.log('🔍 Testing basic query...');
    
    const query = {
      query: {
        bool: {
          must: [
            {
              term: {
                active_experience_company_id: MATCH_GROUP_ID
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
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });
    
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success! Found ${data.length} employees`);
      
      if (data.length > 0) {
        console.log('\n📋 Sample employees:');
        data.slice(0, 3).forEach((emp, index) => {
          console.log(`   ${index + 1}. ${emp.full_name || 'Unknown'} - ${emp.active_experience_title || 'Unknown Title'}`);
          console.log(`      Department: ${emp.active_experience_department || 'Unknown'}`);
          console.log(`      Management Level: ${emp.active_experience_management_level || 'Unknown'}`);
          console.log(`      LinkedIn: ${emp.linkedin_url || 'N/A'}`);
        });
        
        // Test pagination
        console.log('\n🔄 Testing pagination...');
        await testPagination();
        
      } else {
        console.log('⚠️ No employees found - this might indicate:');
        console.log('   - Company ID is incorrect');
        console.log('   - No employees in CoreSignal database for this company');
        console.log('   - Different field name needed');
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      console.log(`Response: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testPagination() {
  console.log('📄 Testing page 2...');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  try {
    const query = {
      query: {
        bool: {
          must: [
            {
              term: {
                active_experience_company_id: MATCH_GROUP_ID
              }
            }
          ]
        }
      },
      page: 2
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Page 2: Found ${data.length} additional employees`);
      
      if (data.length > 0) {
        console.log('📋 Sample from page 2:');
        data.slice(0, 2).forEach((emp, index) => {
          console.log(`   ${index + 1}. ${emp.full_name || 'Unknown'} - ${emp.active_experience_title || 'Unknown Title'}`);
        });
      }
    } else {
      console.log(`❌ Page 2 failed: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.log(`❌ Pagination error: ${error.message}`);
  }
}

async function testAlternativeQueries() {
  console.log('\n🔍 Testing alternative query formats...');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  // Test 1: String company ID
  console.log('   Testing with string company ID...');
  try {
    const query1 = {
      query: {
        bool: {
          must: [
            {
              term: {
                active_experience_company_id: MATCH_GROUP_ID.toString()
              }
            }
          ]
        }
      }
    };
    
    const response1 = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query1)
    });
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log(`   ✅ String ID: Found ${data1.length} employees`);
    } else {
      console.log(`   ❌ String ID failed: ${response1.status}`);
    }
  } catch (error) {
    console.log(`   ❌ String ID error: ${error.message}`);
  }
  
  // Test 2: Match query instead of term
  console.log('   Testing with match query...');
  try {
    const query2 = {
      query: {
        bool: {
          must: [
            {
              match: {
                active_experience_company_id: MATCH_GROUP_ID
              }
            }
          ]
        }
      }
    };
    
    const response2 = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query2)
    });
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log(`   ✅ Match query: Found ${data2.length} employees`);
    } else {
      console.log(`   ❌ Match query failed: ${response2.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Match query error: ${error.message}`);
  }
}

// Run the test
async function runTest() {
  await testMatchGroupPreview();
  await testAlternativeQueries();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('==============');
  console.log('If successful:');
  console.log('  - Create pagination script to get ~400 employees');
  console.log('  - Filter for buyer group (4-14 members)');
  console.log('  - Add Winning Variant messaging');
  console.log('');
  console.log('If unsuccessful:');
  console.log('  - Verify company ID is correct');
  console.log('  - Try other Match Group company IDs');
  console.log('  - Check if Match Group employees exist in database');
}

runTest().catch(console.error);
