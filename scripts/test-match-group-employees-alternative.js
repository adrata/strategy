const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testMatchGroupEmployeesAlternative() {
  console.log('🔍 TESTING MATCH GROUP EMPLOYEES - ALTERNATIVE APPROACHES');
  console.log('=========================================================');
  
  const companyId = '11523857';
  const companyName = 'Match Group';
  
  console.log(`Company: ${companyName}`);
  console.log(`Company ID: ${companyId}`);
  console.log('Expected: 3,166 employees (from company collect)');
  console.log('');

  // Test 1: Try different query formats for employee search
  console.log('🧪 Test 1: Different query formats...');
  
  const queryFormats = [
    {
      name: 'Simple term query',
      query: {
        query: {
          term: {
            active_experience_company_id: companyId
          }
        }
      }
    },
    {
      name: 'Bool must with term',
      query: {
        query: {
          bool: {
            must: [
              {
                term: {
                  active_experience_company_id: companyId
                }
              }
            ]
          }
        }
      }
    },
    {
      name: 'Match query with company_id',
      query: {
        query: {
          match: {
            company_id: companyId
          }
        }
      }
    },
    {
      name: 'Match query with active_experience_company_id',
      query: {
        query: {
          match: {
            active_experience_company_id: companyId
          }
        }
      }
    },
    {
      name: 'Wildcard query',
      query: {
        query: {
          wildcard: {
            active_experience_company_id: `*${companyId}*`
          }
        }
      }
    }
  ];

  for (const format of queryFormats) {
    try {
      console.log(`   Testing ${format.name}...`);
      
      const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(format.query)
      });

      console.log(`     Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`     ✅ Found ${data.total || 0} employees`);
        
        if (data.hits && data.hits.length > 0) {
          console.log(`     Sample: ${data.hits[0]._source?.full_name || 'Unknown'} - ${data.hits[0]._source?.active_experience_title || 'Unknown'}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`     ❌ Error: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`     ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  // Test 2: Try different API endpoints
  console.log('🧪 Test 2: Different API endpoints...');
  
  const endpoints = [
    '/employee_multi_source/search/es_dsl',
    '/employee_multi_source/search/es_dsl/preview',
    '/employee/search',
    '/employee/search/preview',
    '/employee_multi_source/search',
    '/employee_multi_source/search/preview'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   Testing ${endpoint}...`);
      
      const query = {
        query: {
          term: {
            active_experience_company_id: companyId
          }
        }
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

      console.log(`     Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`     ✅ Found ${data.total || 0} employees`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`     ❌ Error: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`     ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  // Test 3: Try GET request instead of POST
  console.log('🧪 Test 3: GET request approach...');
  try {
    const url = `${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview?company_id=${companyId}`;
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Found ${data.total || 0} employees`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`   ❌ Error: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('==============');
  console.log('If we find a working approach:');
  console.log('- Use that method to get all Match Group employees');
  console.log('- Filter for buyer group roles (Data Science, Product, Engineering, Analytics)');
  console.log('- Select 4-14 best-fit members');
  console.log('- Add Winning Variant messaging');
  console.log('- Generate buyer group data for demo');
}

testMatchGroupEmployeesAlternative().catch(console.error);
