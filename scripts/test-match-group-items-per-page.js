const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testMatchGroupItemsPerPage() {
  console.log('🔍 TESTING MATCH GROUP WITH ITEMS_PER_PAGE');
  console.log('==========================================');
  
  const companyId = '11523857';
  const companyName = 'Match Group';
  
  console.log(`Company: ${companyName}`);
  console.log(`Company ID: ${companyId}`);
  console.log('Expected: 3,166 employees (from company collect)');
  console.log('');

  // Test 1: Use items_per_page parameter
  console.log('🧪 Test 1: Using items_per_page parameter...');
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

    const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl?items_per_page=50`, {
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

  // Test 2: Try with different field names
  console.log('🧪 Test 2: Trying different field names...');
  const fieldNames = [
    'company_id',
    'active_experience_company_id',
    'current_company_id',
    'active_company_id'
  ];

  for (const fieldName of fieldNames) {
    try {
      const query = {
        query: {
          bool: {
            must: [
              { term: { [fieldName]: companyId } }
            ]
          }
        }
      };

      const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl?items_per_page=20`, {
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
        console.log(`   ${fieldName}: ${data.total || 0} employees`);
        
        if (data.hits && data.hits.length > 0) {
          const employee = data.hits[0]._source;
          const name = employee?.full_name || 'Unknown';
          const title = employee?.active_experience_title || 'Unknown';
          console.log(`     Sample: ${name} - ${title}`);
        }
      } else {
        console.log(`   ${fieldName}: Error - ${response.status}`);
      }
    } catch (error) {
      console.log(`   ${fieldName}: Error - ${error.message}`);
    }
  }

  console.log('');

  // Test 3: Try with string ID instead of number
  console.log('🧪 Test 3: Trying string ID...');
  try {
    const query = {
      query: {
        bool: {
          must: [
            { term: { "company_id": companyId.toString() } }
          ]
        }
      }
    };

    const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl?items_per_page=20`, {
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
  console.log('🎯 SUMMARY:');
  console.log('===========');
  console.log('This test will help us understand:');
  console.log('1. If the items_per_page parameter makes a difference');
  console.log('2. If different field names work');
  console.log('3. If the ID format matters (string vs number)');
  console.log('4. If we can find any employees for Match Group');
}

testMatchGroupItemsPerPage().catch(console.error);
