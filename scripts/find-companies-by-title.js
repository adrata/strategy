#!/usr/bin/env node

/**
 * 🔍 FIND COMPANIES BY SEARCHING FOR TITLES
 * 
 * Search for specific titles to find companies that have employees
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function findCompaniesByTitle() {
  console.log('🔍 FINDING COMPANIES BY TITLE SEARCH');
  console.log('===================================');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  // Search for different titles to find companies
  const titles = [
    'CEO',
    'CTO', 
    'CFO',
    'Director',
    'Manager',
    'Engineer',
    'Analyst',
    'Data Scientist',
    'Product Manager',
    'Sales Manager'
  ];
  
  const foundCompanies = new Set();
  
  for (const title of titles) {
    console.log(`\n👔 Searching for: ${title}`);
    try {
      const query = {
        query: {
          bool: {
            must: [
              {
                match: {
                  active_experience_title: title
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
          'apikey': process.env.CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(query)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ${title}: ${data.length} employees`);
        
        // Collect company names
        data.forEach(emp => {
          if (emp.company_name) {
            foundCompanies.add(emp.company_name);
          }
        });
        
        if (data.length > 0) {
          console.log(`   📋 Sample: ${data[0].full_name} - ${data[0].active_experience_title} at ${data[0].company_name}`);
        }
      } else {
        console.log(`   ❌ ${title}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ ${title}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Found ${foundCompanies.size} unique companies:`);
  const companyArray = Array.from(foundCompanies);
  companyArray.slice(0, 20).forEach(company => {
    console.log(`   - ${company}`);
  });
  
  // Test a few of these companies
  console.log('\n🏢 Testing some companies:');
  for (const company of companyArray.slice(0, 3)) {
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
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(companyQuery)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ${company}: ${data.length} employees`);
      } else {
        console.log(`   ❌ ${company}: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${company}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 COMPANY DISCOVERY COMPLETE');
}

// Run the test
findCompaniesByTitle().catch(console.error);
