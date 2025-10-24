const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testMatchGroupCorrectId() {
  console.log('🧪 TESTING CORRECT MATCH GROUP ID');
  console.log('==================================');
  
  const companyId = '11523857';
  const companyName = 'Match Group';
  
  console.log(`Company: ${companyName}`);
  console.log(`Company ID: ${companyId}`);
  console.log('Expected: 3100+ employees');
  console.log('');

  // Test 1: Basic query with active_experience_company_id
  console.log('🔍 Testing basic query...');
  try {
    const query = {
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
    };

    const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview`, {
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
      console.log(`✅ Success! Found ${data.total || 0} employees`);
      
      if (data.hits && data.hits.length > 0) {
        console.log('📋 Sample employees:');
        data.hits.slice(0, 3).forEach((hit, index) => {
          const employee = hit._source;
          const name = employee?.full_name || 'Unknown';
          const title = employee?.active_experience_title || 'Unknown';
          const company = employee?.company_name || 'Unknown';
          console.log(`   ${index + 1}. ${name} - ${title} at ${company}`);
        });
      }
    } else {
      console.log(`❌ Error: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 2: Try pagination to get more employees
  console.log('📄 Testing pagination to get more employees...');
  try {
    let allEmployees = [];
    let page = 1;
    const maxPages = 5; // Limit to avoid too many API calls
    
    while (page <= maxPages) {
      console.log(`   📄 Getting page ${page}...`);
      
      const query = {
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
        },
        from: (page - 1) * 20,
        size: 20
      };

      const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        console.log(`   ❌ Page ${page} failed: ${response.status}`);
        break;
      }

      const data = await response.json();
      
      if (data.hits && data.hits.length > 0) {
        allEmployees.push(...data.hits);
        console.log(`   ✅ Page ${page}: ${data.hits.length} employees`);
        page++;
      } else {
        console.log(`   ✅ Page ${page}: No more employees`);
        break;
      }
    }

    console.log(`📊 Total employees collected: ${allEmployees.length}`);
    
    if (allEmployees.length > 0) {
      console.log('🎯 Sample of collected employees:');
      allEmployees.slice(0, 5).forEach((hit, index) => {
        const employee = hit._source;
        const name = employee?.full_name || 'Unknown';
        const title = employee?.active_experience_title || 'Unknown';
        console.log(`   ${index + 1}. ${name} - ${title}`);
      });
    }

  } catch (error) {
    console.log(`❌ Pagination error: ${error.message}`);
  }

  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('==============');
  console.log('If we get good employee counts:');
  console.log('- Filter for buyer group roles (Data Science, Product, Engineering, Analytics)');
  console.log('- Select 4-14 best-fit members');
  console.log('- Add Winning Variant messaging');
  console.log('- Generate buyer group data for demo');
}

testMatchGroupCorrectId().catch(console.error);
