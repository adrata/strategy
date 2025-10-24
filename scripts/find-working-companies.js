#!/usr/bin/env node

/**
 * 🔍 FIND COMPANIES WITH EMPLOYEES IN DATABASE
 * 
 * Search for companies that actually have employees in the CoreSignal database
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function findWorkingCompanies() {
  console.log('🔍 FINDING COMPANIES WITH EMPLOYEES');
  console.log('==================================');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  // Test 1: Get some random employees to see what companies they work for
  console.log('\n📊 Test 1: Get random employees to see companies');
  try {
    const randomQuery = {
      query: {
        match_all: {}
      },
      size: 50  // Get more employees
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(randomQuery)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Found ${data.length} employees`);
      
      // Extract unique companies
      const companies = [...new Set(data.map(emp => emp.company_name))];
      console.log(`   📋 Companies found: ${companies.slice(0, 10).join(', ')}`);
      
      // Test a few of these companies
      console.log('\n🏢 Test 2: Test some of these companies');
      for (const company of companies.slice(0, 5)) {
        try {
          const companyQuery = {
            query: {
              bool: {
                must: [
                  {
                    match: {
                      company_name: company
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
            console.log(`   ✅ ${company}: ${companyData.length} employees`);
          } else {
            console.log(`   ❌ ${company}: ${companyResponse.status}`);
          }
        } catch (error) {
          console.log(`   ❌ ${company}: ${error.message}`);
        }
      }
    } else {
      console.log(`   ❌ Random query failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Random query error: ${error.message}`);
  }
  
  console.log('\n🎯 COMPANY DISCOVERY COMPLETE');
}

// Run the test
findWorkingCompanies().catch(console.error);
