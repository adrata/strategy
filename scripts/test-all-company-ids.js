#!/usr/bin/env node

/**
 * 🧪 TEST ALL COMPANY IDs
 * 
 * Test Preview API for all 4 companies to see how many employees we get
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => import('node-fetch').then(({default: fetch}) => fetch(...args)));

// Load environment variables
require('dotenv').config({ path: '.env' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();

const COMPANIES = [
  { name: 'Match Group, Inc.', id: 2496218, website: 'https://mtch.com' },
  { name: 'Brex, Inc.', id: 21428731, website: 'https://brex.com' },
  { name: 'First PREMIER Bank', id: 7578901, website: 'https://firstpremier.com' },
  { name: 'Zuora, Inc.', id: 10782378, website: 'https://zuora.com' }
];

async function testCompanyEmployees(company) {
  console.log(`\n🏢 Testing ${company.name} (ID: ${company.id})`);
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  try {
    const query = {
      query: {
        bool: {
          must: [
            {
              term: {
                active_experience_company_id: company.id
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
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Found ${data.length} employees`);
      
      if (data.length > 0) {
        console.log('   📋 Sample employees:');
        data.slice(0, 3).forEach((emp, index) => {
          console.log(`      ${index + 1}. ${emp.full_name || 'Unknown'} - ${emp.active_experience_title || 'Unknown Title'}`);
          console.log(`         Company: ${emp.company_name || 'Unknown'}`);
          console.log(`         Department: ${emp.active_experience_department || 'Unknown'}`);
          console.log(`         Management Level: ${emp.active_experience_management_level || 'Unknown'}`);
        });
        
        // Check if this is the right company
        const companyNames = [...new Set(data.map(emp => emp.company_name).filter(Boolean))];
        console.log(`   🏢 Company names found: ${companyNames.join(', ')}`);
        
        return {
          success: true,
          count: data.length,
          companyNames: companyNames,
          employees: data
        };
      } else {
        console.log('   ⚠️ No employees found');
        return { success: true, count: 0, companyNames: [], employees: [] };
      }
      
    } else {
      console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      return { success: false, count: 0, companyNames: [], employees: [] };
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, count: 0, companyNames: [], employees: [] };
  }
}

async function testAllCompanies() {
  console.log('🧪 TESTING ALL COMPANY IDs');
  console.log('==========================');
  console.log('Testing Preview API for all 4 companies to see employee counts');
  console.log('');
  
  const results = {};
  
  for (const company of COMPANIES) {
    const result = await testCompanyEmployees(company);
    results[company.name] = {
      ...company,
      ...result
    };
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('===========');
  Object.entries(results).forEach(([companyName, result]) => {
    if (result.success) {
      console.log(`✅ ${companyName}: ${result.count} employees`);
      if (result.companyNames.length > 0) {
        console.log(`   Companies found: ${result.companyNames.join(', ')}`);
      }
    } else {
      console.log(`❌ ${companyName}: Failed to get employees`);
    }
  });
  
  // Recommendations
  console.log('\n🎯 RECOMMENDATIONS');
  console.log('==================');
  
  const workingCompanies = Object.entries(results).filter(([name, result]) => result.success && result.count > 0);
  const lowCountCompanies = workingCompanies.filter(([name, result]) => result.count < 10);
  const goodCountCompanies = workingCompanies.filter(([name, result]) => result.count >= 10);
  
  if (goodCountCompanies.length > 0) {
    console.log('✅ Companies with good employee counts:');
    goodCountCompanies.forEach(([name, result]) => {
      console.log(`   - ${name}: ${result.count} employees`);
    });
  }
  
  if (lowCountCompanies.length > 0) {
    console.log('⚠️ Companies with low employee counts:');
    lowCountCompanies.forEach(([name, result]) => {
      console.log(`   - ${name}: ${result.count} employees (may need different company ID)`);
    });
  }
  
  const failedCompanies = Object.entries(results).filter(([name, result]) => !result.success);
  if (failedCompanies.length > 0) {
    console.log('❌ Companies that failed:');
    failedCompanies.forEach(([name, result]) => {
      console.log(`   - ${name}: API call failed`);
    });
  }
  
  return results;
}

// Run the test
testAllCompanies().catch(console.error);
