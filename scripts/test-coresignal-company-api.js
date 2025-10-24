const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testCoreSignalCompanyAPI() {
  console.log('🔍 TESTING CORESIGNAL COMPANY API');
  console.log('=================================');
  
  // Test 1: Company search to verify API access
  console.log('🧪 Test 1: Company search API...');
  try {
    const query = {
      query: {
        bool: {
          must: [
            {
              match: {
                company_name: "Match Group"
              }
            }
          ]
        }
      }
    };

    const response = await fetch(`${CORESIGNAL_BASE_URL}/company_multi_source/search/es_dsl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });

    const data = await response.json();
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log(`✅ Company search: ${data.total || 0} companies found`);
      
      if (data.hits && data.hits.length > 0) {
        console.log('📋 Sample companies:');
        data.hits.slice(0, 3).forEach((hit, index) => {
          const company = hit._source;
          const name = company?.company_name || 'Unknown';
          const id = company?.id || 'Unknown';
          const employees = company?.employees_count || 'Unknown';
          console.log(`   ${index + 1}. ${name} (ID: ${id}, Employees: ${employees})`);
        });
      }
    } else {
      console.log(`❌ Company search error: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Company search error: ${error.message}`);
  }

  console.log('');

  // Test 2: Company collect endpoint for Match Group
  console.log('🧪 Test 2: Company collect endpoint...');
  try {
    const companyId = '11523857'; // Match Group ID
    const response = await fetch(`${CORESIGNAL_BASE_URL}/company_multi_source/collect/${companyId}`, {
      method: 'GET',
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Company collect successful`);
      console.log(`   Company: ${data.company_name || 'Unknown'}`);
      console.log(`   Employees: ${data.employees_count || 'Unknown'}`);
      console.log(`   Industry: ${data.industry || 'Unknown'}`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Company collect error: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Company collect error: ${error.message}`);
  }

  console.log('');

  // Test 3: Try different employee API endpoints
  console.log('🧪 Test 3: Different employee API endpoints...');
  
  const employeeEndpoints = [
    '/employee_multi_source/search/es_dsl',
    '/employee_multi_source/search/es_dsl/preview',
    '/employee/search',
    '/employee/search/preview'
  ];

  for (const endpoint of employeeEndpoints) {
    try {
      const query = {
        query: {
          match_all: {}
        },
        size: 1
      };

      const response = await fetch(`${CORESIGNAL_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(query)
      });

      console.log(`   ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`     Total: ${data.total || 0} employees`);
      }
    } catch (error) {
      console.log(`   ${endpoint}: Error - ${error.message}`);
    }
  }

  console.log('');
  console.log('🎯 SUMMARY:');
  console.log('===========');
  console.log('This test will help us understand:');
  console.log('1. If our API access is working for company data');
  console.log('2. If the company collect endpoint works');
  console.log('3. If there are alternative employee API endpoints');
  console.log('4. If the issue is specific to the employee preview endpoint');
}

testCoreSignalCompanyAPI().catch(console.error);
