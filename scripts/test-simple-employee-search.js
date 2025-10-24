const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testSimpleEmployeeSearch() {
  console.log('🔍 TESTING SIMPLE EMPLOYEE SEARCH');
  console.log('================================');
  
  // Test 1: Very simple query - just get any employees
  console.log('🧪 Test 1: Very simple query (match_all)...');
  try {
    const query = {
      query: {
        match_all: {}
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
      console.log(`✅ Found ${data.total || 0} total employees in database`);
      
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

  // Test 2: Try different API endpoints
  console.log('🧪 Test 2: Different API endpoints...');
  const endpoints = [
    '/employee_multi_source/search/es_dsl',
    '/employee_multi_source/search/es_dsl/preview',
    '/employee/search',
    '/employee/search/preview'
  ];

  for (const endpoint of endpoints) {
    try {
      const query = {
        query: {
          match_all: {}
        }
      };

      const response = await fetch(`${CORESIGNAL_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'apikey': CORESIGNAL_API_KEY,
          'Content-Type': 'application/json'
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

  // Test 3: Try with different query structures
  console.log('🧪 Test 3: Different query structures...');
  const queryStructures = [
    {
      name: 'Empty query',
      query: {}
    },
    {
      name: 'Simple match_all',
      query: {
        query: {
          match_all: {}
        }
      }
    },
    {
      name: 'Bool query',
      query: {
        query: {
          bool: {
            must: []
          }
        }
      }
    }
  ];

  for (const structure of queryStructures) {
    try {
      const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'apikey': CORESIGNAL_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(structure.query)
      });

      console.log(`   ${structure.name}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`     Total: ${data.total || 0} employees`);
      }
    } catch (error) {
      console.log(`   ${structure.name}: Error - ${error.message}`);
    }
  }

  console.log('');
  console.log('🎯 SUMMARY:');
  console.log('===========');
  console.log('This test will help us understand:');
  console.log('1. If there are ANY employees in the database at all');
  console.log('2. If different API endpoints work');
  console.log('3. If different query structures work');
  console.log('4. If the issue is with our specific queries or the entire database');
}

testSimpleEmployeeSearch().catch(console.error);
