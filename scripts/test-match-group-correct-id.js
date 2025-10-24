#!/usr/bin/env node

/**
 * 🧪 TEST CORRECT MATCH GROUP ID
 * 
 * Test Preview API for Match Group using the correct company ID 24972212
 * Expected: 3100 employees, want to see a few hundred for buyer group
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();
const MATCH_GROUP_ID = 24972212;
const MATCH_GROUP_NAME = 'Match Group';

async function testMatchGroupCorrectId() {
  console.log('🧪 TESTING CORRECT MATCH GROUP ID');
  console.log('==================================');
  console.log(`Company: ${MATCH_GROUP_NAME}`);
  console.log(`Company ID: ${MATCH_GROUP_ID}`);
  console.log(`Expected: 3100 employees`);
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
        data.slice(0, 5).forEach((emp, index) => {
          console.log(`   ${index + 1}. ${emp.full_name || 'Unknown'} - ${emp.active_experience_title || 'Unknown Title'}`);
          console.log(`      Company: ${emp.company_name || 'Unknown'}`);
          console.log(`      Department: ${emp.active_experience_department || 'Unknown'}`);
          console.log(`      Management Level: ${emp.active_experience_management_level || 'Unknown'}`);
          console.log(`      LinkedIn: ${emp.linkedin_url || 'N/A'}`);
        });
        
        // Check company names
        const companyNames = [...new Set(data.map(emp => emp.company_name).filter(Boolean))];
        console.log(`\n🏢 Company names found: ${companyNames.join(', ')}`);
        
        // Check departments
        const departments = [...new Set(data.map(emp => emp.active_experience_department).filter(Boolean))];
        console.log(`\n🏢 Departments found: ${departments.slice(0, 10).join(', ')}${departments.length > 10 ? '...' : ''}`);
        
        // Check management levels
        const managementLevels = [...new Set(data.map(emp => emp.active_experience_management_level).filter(Boolean))];
        console.log(`\n👔 Management levels found: ${managementLevels.join(', ')}`);
        
        // Test pagination to see if we can get more
        console.log('\n🔄 Testing pagination...');
        await testPagination();
        
      } else {
        console.log('⚠️ No employees found - this might indicate:');
        console.log('   - Company ID is still incorrect');
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
        data.slice(0, 3).forEach((emp, index) => {
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

async function testMultiplePages() {
  console.log('\n📄 Testing multiple pages to get more employees...');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  let allEmployees = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore && page <= 10) { // Limit to 10 pages for testing
    try {
      console.log(`   📄 Getting page ${page}...`);
      
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
        page: page
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
        console.log(`   ✅ Page ${page}: ${data.length} employees`);
        
        if (data.length > 0) {
          allEmployees = allEmployees.concat(data);
          page++;
        } else {
          hasMore = false;
        }
      } else {
        console.log(`   ❌ Page ${page} failed: ${response.status}`);
        hasMore = false;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Page ${page} error: ${error.message}`);
      hasMore = false;
    }
  }
  
  console.log(`\n📊 Total employees collected: ${allEmployees.length}`);
  
  if (allEmployees.length > 0) {
    // Analyze the data
    const departments = [...new Set(allEmployees.map(emp => emp.active_experience_department).filter(Boolean))];
    const managementLevels = [...new Set(allEmployees.map(emp => emp.active_experience_management_level).filter(Boolean))];
    
    console.log(`\n📈 Analysis:`);
    console.log(`   Total employees: ${allEmployees.length}`);
    console.log(`   Departments: ${departments.length} unique`);
    console.log(`   Management levels: ${managementLevels.join(', ')}`);
    
    // Count by management level
    const levelCounts = {};
    allEmployees.forEach(emp => {
      const level = emp.active_experience_management_level || 'Unknown';
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    
    console.log(`\n👔 Management level distribution:`);
    Object.entries(levelCounts).forEach(([level, count]) => {
      console.log(`   ${level}: ${count} employees`);
    });
  }
  
  return allEmployees;
}

// Run the test
async function runTest() {
  await testMatchGroupCorrectId();
  await testMultiplePages();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('==============');
  console.log('If we get good employee counts:');
  console.log('  - Filter for buyer group roles (Data Science, Product, Engineering, Analytics)');
  console.log('  - Select 4-14 best-fit members');
  console.log('  - Add Winning Variant messaging');
  console.log('');
  console.log('If still low counts:');
  console.log('  - Try alternative company ID formats');
  console.log('  - Search for other Match Group company IDs');
}

runTest().catch(console.error);
