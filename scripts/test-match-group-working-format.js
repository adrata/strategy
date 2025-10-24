const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testMatchGroupWorkingFormat() {
  console.log('🔍 TESTING MATCH GROUP WITH WORKING FORMAT');
  console.log('==========================================');
  
  const companyId = '11523857';
  const companyName = 'Match Group';
  
  console.log(`Company: ${companyName}`);
  console.log(`Company ID: ${companyId}`);
  console.log('Expected: 3,166 employees (from company collect)');
  console.log('');

  // Test 1: Use the exact format from working codebase
  console.log('🧪 Test 1: Using working codebase format...');
  try {
    const query = {
      query: {
        bool: {
          must: [
            { term: { "company_id": companyId } }
          ]
        }
      }
    };

    const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl`, {
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
      console.log(`✅ Found ${data.total || 0} employees`);
      
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

  // Test 2: Try with preview endpoint
  console.log('🧪 Test 2: Using preview endpoint...');
  try {
    const query = {
      query: {
        bool: {
          must: [
            { term: { "company_id": companyId } }
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

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.total || 0} employees`);
      
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

  // Test 3: Try with company name matching (from working codebase)
  console.log('🧪 Test 3: Using company name matching...');
  try {
    const query = {
      query: {
        bool: {
          must: [
            {
              bool: {
                should: [
                  { match_phrase: { "company_name": companyName } },
                  { match_phrase: { "company_name": `${companyName}, Inc.` } },
                  { match_phrase: { "company_name": `${companyName}, LLC` } },
                  { match_phrase: { "company_name": `${companyName}, Corp.` } }
                ]
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

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.total || 0} employees`);
      
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
  console.log('🎯 NEXT STEPS:');
  console.log('==============');
  console.log('If we find employees:');
  console.log('- Filter for buyer group roles (Data Science, Product, Engineering, Analytics)');
  console.log('- Select 4-14 best-fit members');
  console.log('- Add Winning Variant messaging');
  console.log('- Generate buyer group data for demo');
}

testMatchGroupWorkingFormat().catch(console.error);
