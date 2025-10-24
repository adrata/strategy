const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testCoreSignalCurlFormat() {
  console.log('🔍 TESTING CORESIGNAL WITH CURL FORMAT');
  console.log('=====================================');
  
  // Test 1: Use the exact curl format you provided
  console.log('🧪 Test 1: Using exact curl format (Python search)...');
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
  console.log('🧪 Test 2: Using curl format for Match Group...');
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

  // Test 3: Try Match Group with company_id in query_string
  console.log('🧪 Test 3: Using curl format with company_id...');
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
  console.log('This test will help us understand:');
  console.log('1. If the API is working at all with the curl format');
  console.log('2. If we can find any employees with Python skills');
  console.log('3. If we can find Match Group employees using company_name');
  console.log('4. If we can find Match Group employees using company_id');
}

testCoreSignalCurlFormat().catch(console.error);
