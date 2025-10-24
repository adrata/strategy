const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testCoreSignalExactCurl() {
  console.log('🔍 TESTING CORESIGNAL EXACT CURL FORMAT');
  console.log('======================================');
  
  // Test 1: Use the exact curl format from CoreSignal documentation
  console.log('🧪 Test 1: Exact curl format (Python search)...');
  try {
    const query = {
      query: {
        bool: {
          should: [
            {
              query_string: {
                query: "Python",
                default_field: "summary",
                default_operator: "and"
              }
            }
          ]
        }
      }
    };

    const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'apikey': CORESIGNAL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.total || 0} employees with Python skills`);
      
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
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Error: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 2: Try Match Group with the same format
  console.log('🧪 Test 2: Match Group with curl format...');
  try {
    const query = {
      query: {
        bool: {
          should: [
            {
              query_string: {
                query: "Match Group",
                default_field: "company_name",
                default_operator: "and"
              }
            }
          ]
        }
      }
    };

    const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'apikey': CORESIGNAL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.total || 0} employees at Match Group`);
      
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
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Error: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 3: Try Match Group with company_id field
  console.log('🧪 Test 3: Match Group with company_id field...');
  try {
    const query = {
      query: {
        bool: {
          should: [
            {
              query_string: {
                query: "11523857",
                default_field: "company_id",
                default_operator: "and"
              }
            }
          ]
        }
      }
    };

    const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'apikey': CORESIGNAL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.total || 0} employees with company_id 11523857`);
      
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
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Error: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('🎯 SUMMARY:');
  console.log('===========');
  console.log('This test uses the exact curl format from CoreSignal documentation.');
  console.log('If this still returns 0 employees, it suggests:');
  console.log('1. The employee database might be empty or not accessible');
  console.log('2. There might be a permissions issue with our API key');
  console.log('3. The API might have changed or be experiencing issues');
  console.log('4. We might need to use a different approach or endpoint');
}

testCoreSignalExactCurl().catch(console.error);
