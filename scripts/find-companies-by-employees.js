#!/usr/bin/env node

/**
 * 🔍 FIND COMPANIES BY EMPLOYEE SEARCH
 * 
 * Search for employees from target companies to find their company IDs
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function findCompaniesByEmployees() {
  console.log('🔍 FINDING COMPANIES BY EMPLOYEE SEARCH');
  console.log('======================================');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  const companies = [
    'Match Group',
    'Brex', 
    'Zuora'
  ];
  
  for (const companyName of companies) {
    console.log(`\n🏢 Searching for employees from: ${companyName}`);
    
    try {
      const query = {
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
        console.log(`   ✅ Found ${data.length} employees`);
        
        if (data.length > 0) {
          const employee = data[0];
          console.log(`   📋 First employee: ${employee.full_name} - ${employee.active_experience_title}`);
          console.log(`   🏢 Company: ${employee.company_name} (ID: ${employee.active_experience_company_id})`);
          console.log(`   🌐 Website: ${employee.company_website || 'N/A'}`);
        }
      } else {
        console.log(`   ❌ Search failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 EMPLOYEE SEARCH COMPLETE');
}

// Run the search
findCompaniesByEmployees().catch(console.error);
