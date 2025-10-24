#!/usr/bin/env node

/**
 * 🔍 TEST EXACT COMPANY MATCHING
 * 
 * Test if we can find companies that work with exact name matching
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function testExactCompanyMatch() {
  console.log('🔍 TESTING EXACT COMPANY MATCHING');
  console.log('=================================');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  // Get some employees first
  console.log('\n📊 Step 1: Get some employees to see their exact company names');
  try {
    const employeeQuery = {
      query: {
        match: {
          active_experience_title: "CEO"
        }
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(employeeQuery)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Found ${data.length} CEO employees`);
      
      // Test each company name exactly as it appears
      console.log('\n🏢 Step 2: Test each company name exactly as it appears');
      for (let i = 0; i < Math.min(5, data.length); i++) {
        const employee = data[i];
        const companyName = employee.company_name;
        
        console.log(`\n   Testing: "${companyName}"`);
        try {
          const companyQuery = {
            query: {
              bool: {
                must: [
                  {
                    match: {
                      company_name: companyName
                    }
                  }
                ]
              }
            }
          };
          
          const companyResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.CORESIGNAL_API_KEY,
              'Accept': 'application/json'
            },
            body: JSON.stringify(companyQuery)
          });
          
          if (companyResponse.ok) {
            const companyData = await companyResponse.json();
            console.log(`     ✅ "${companyName}": ${companyData.length} employees`);
            if (companyData.length > 0) {
              console.log(`     📋 First: ${companyData[0].full_name} - ${companyData[0].active_experience_title}`);
            }
          } else {
            console.log(`     ❌ "${companyName}": ${companyResponse.status} ${companyResponse.statusText}`);
          }
        } catch (error) {
          console.log(`     ❌ "${companyName}": ${error.message}`);
        }
      }
    } else {
      console.log(`   ❌ Employee query failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Employee query error: ${error.message}`);
  }
  
  console.log('\n🎯 EXACT MATCH TEST COMPLETE');
}

// Run the test
testExactCompanyMatch().catch(console.error);
