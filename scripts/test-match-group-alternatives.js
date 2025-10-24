#!/usr/bin/env node

/**
 * 🧪 TEST MATCH GROUP ALTERNATIVES
 * 
 * Test different approaches to get Match Group employees
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();
const MATCH_GROUP_ID = 24972212;
const MATCH_GROUP_NAME = 'Match Group';

async function testAlternativeQueries() {
  console.log('🧪 TESTING MATCH GROUP ALTERNATIVES');
  console.log('===================================');
  console.log(`Company: ${MATCH_GROUP_NAME}`);
  console.log(`Company ID: ${MATCH_GROUP_ID}`);
  console.log('');

  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  // Test 1: String company ID
  console.log('🔍 Test 1: String company ID');
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
  console.log('\n🔍 Test 2: Match query');
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
  
  // Test 3: Company name search
  console.log('\n🔍 Test 3: Company name search');
  try {
    const query3 = {
      query: {
        bool: {
          must: [
            {
              match: {
                company_name: 'Match Group'
              }
            }
          ]
        }
      }
    };
    
    const response3 = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query3)
    });
    
    if (response3.ok) {
      const data3 = await response3.json();
      console.log(`   ✅ Company name: Found ${data3.length} employees`);
      
      if (data3.length > 0) {
        console.log('   📋 Sample employees:');
        data3.slice(0, 3).forEach((emp, index) => {
          console.log(`      ${index + 1}. ${emp.full_name || 'Unknown'} - ${emp.active_experience_title || 'Unknown Title'}`);
          console.log(`         Company: ${emp.company_name || 'Unknown'}`);
        });
      }
    } else {
      console.log(`   ❌ Company name failed: ${response3.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Company name error: ${error.message}`);
  }
  
  // Test 4: Try different field names
  console.log('\n🔍 Test 4: Different field names');
  const fieldNames = ['company_id', 'active_company_id', 'current_company_id'];
  
  for (const fieldName of fieldNames) {
    try {
      const query4 = {
        query: {
          bool: {
            must: [
              {
                term: {
                  [fieldName]: MATCH_GROUP_ID
                }
              }
            ]
          }
        }
      };
      
      const response4 = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(query4)
      });
      
      if (response4.ok) {
        const data4 = await response4.json();
        console.log(`   ✅ ${fieldName}: Found ${data4.length} employees`);
      } else {
        console.log(`   ❌ ${fieldName} failed: ${response4.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${fieldName} error: ${error.message}`);
    }
  }
  
  // Test 5: Try company collect endpoint
  console.log('\n🔍 Test 5: Company collect endpoint');
  try {
    const collectUrl = `https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${MATCH_GROUP_ID}`;
    
    const response5 = await fetch(collectUrl, {
      method: 'GET',
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (response5.ok) {
      const data5 = await response5.json();
      console.log(`   ✅ Company collect: Success`);
      console.log(`   📊 Key executives: ${data5.key_executives?.length || 0}`);
      
      if (data5.key_executives && data5.key_executives.length > 0) {
        console.log('   📋 Sample executives:');
        data5.key_executives.slice(0, 3).forEach((exec, index) => {
          console.log(`      ${index + 1}. ${exec.name || 'Unknown'} - ${exec.title || 'Unknown Title'}`);
        });
      }
    } else {
      console.log(`   ❌ Company collect failed: ${response5.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Company collect error: ${error.message}`);
  }
}

// Run the test
testAlternativeQueries().catch(console.error);
