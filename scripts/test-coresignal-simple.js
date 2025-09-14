#!/usr/bin/env node

/**
 * 🧪 SIMPLE CORESIGNAL TEST
 * 
 * Tests different search approaches to find what works
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();

async function testCoreSignalSimple() {
  console.log('🧪 SIMPLE CORESIGNAL TEST');
  console.log('=' .repeat(50));
  
  if (!CORESIGNAL_API_KEY) {
    console.log('❌ CoreSignal API key not available');
    return;
  }

  // Test 1: Try employee search instead of company search
  console.log('👤 TEST 1: Employee Search (Direct)');
  console.log('─'.repeat(30));
  
  try {
    const employeeQuery = {
      query: {
        bool: {
          must: [
            { match: { full_name: "David Hisey" } },
            { 
              bool: {
                should: [
                  { match: { current_company_name: "Stewart Information Services" } },
                  { match: { current_company_name: "Stewart Title" } },
                  { match: { current_company_name: "Stewart" } }
                ]
              }
            }
          ]
        }
      }
    };
    
    const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
      method: 'POST',
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(employeeQuery)
    });

    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   📋 Found: ${data.hits?.length || 0} employee matches`);
      
      if (data.hits && data.hits.length > 0) {
        const employee = data.hits[0]._source;
        console.log(`   👤 Employee: ${employee.full_name || 'Unknown'}`);
        console.log(`   🏢 Company: ${employee.current_company_name || 'Unknown'}`);
        console.log(`   💼 Title: ${employee.member_position_title || employee.current_position_title || 'Unknown'}`);
        console.log(`   📧 Email: ${employee.member_professional_email || employee.primary_professional_email || 'Not found'}`);
        console.log(`   💼 LinkedIn: ${employee.member_linkedin_url || employee.linkedin_url || 'Not found'}`);
        
        if (employee.member_professional_email || employee.primary_professional_email) {
          console.log('   ✅ SUCCESS: Found verified email in CoreSignal!');
        }
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }

  console.log('');
  
  // Test 2: Try broader search
  console.log('🔍 TEST 2: Broader Executive Search');
  console.log('─'.repeat(30));
  
  try {
    const broadQuery = {
      query: {
        bool: {
          must: [
            { 
              bool: {
                should: [
                  { match: { current_company_name: "Stewart" } },
                  { match: { "experience.company_name": "Stewart" } }
                ]
              }
            },
            {
              bool: {
                should: [
                  { match: { member_position_title: "Chief Financial Officer" } },
                  { match: { member_position_title: "CFO" } },
                  { match: { current_position_title: "Chief Financial Officer" } },
                  { match: { current_position_title: "CFO" } }
                ]
              }
            }
          ]
        }
      }
    };
    
    const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
      method: 'POST',
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(broadQuery)
    });

    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   📋 Found: ${data.hits?.length || 0} matches`);
      
      if (data.hits && data.hits.length > 0) {
        console.log('   🎯 CFO MATCHES:');
        data.hits.slice(0, 3).forEach((hit, index) => {
          const emp = hit._source;
          console.log(`   ${index + 1}. ${emp.full_name || 'Unknown'}`);
          console.log(`      Company: ${emp.current_company_name || 'Unknown'}`);
          console.log(`      Title: ${emp.member_position_title || emp.current_position_title || 'Unknown'}`);
          console.log(`      Email: ${emp.member_professional_email || emp.primary_professional_email || 'Not found'}`);
        });
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
  testCoreSignalSimple().catch(console.error);
}

module.exports = { testCoreSignalSimple };
