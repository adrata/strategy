const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testCoreSignalAlternativeEndpoints() {
  console.log('🔍 TESTING CORESIGNAL ALTERNATIVE ENDPOINTS');
  console.log('===========================================');
  
  // Test 1: Try different API versions
  console.log('🧪 Test 1: Different API versions...');
  const apiVersions = [
    'https://api.coresignal.com/cdapi/v1',
    'https://api.coresignal.com/cdapi/v2',
    'https://api.coresignal.com/cdapi/v3'
  ];

  for (const baseUrl of apiVersions) {
    try {
      const query = {
        query: {
          match_all: {}
        }
      };

      const response = await fetch(`${baseUrl}/employee_multi_source/search/es_dsl/preview`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'apikey': CORESIGNAL_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      });

      console.log(`   ${baseUrl}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`     Total: ${data.total || 0} employees`);
      }
    } catch (error) {
      console.log(`   ${baseUrl}: Error - ${error.message}`);
    }
  }

  console.log('');

  // Test 2: Try different employee endpoints
  console.log('🧪 Test 2: Different employee endpoints...');
  const employeeEndpoints = [
    '/employee_multi_source/search/es_dsl',
    '/employee_multi_source/search/es_dsl/preview',
    '/employee/search',
    '/employee/search/preview',
    '/employee_multi_source/search',
    '/employee_multi_source/search/preview',
    '/employee_multi_source/collect',
    '/employee/collect'
  ];

  for (const endpoint of employeeEndpoints) {
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

  // Test 3: Try GET requests instead of POST
  console.log('🧪 Test 3: GET requests instead of POST...');
  const getEndpoints = [
    '/employee_multi_source/search/es_dsl/preview',
    '/employee_multi_source/search/es_dsl',
    '/employee/search/preview',
    '/employee/search'
  ];

  for (const endpoint of getEndpoints) {
    try {
      const response = await fetch(`${CORESIGNAL_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apikey': CORESIGNAL_API_KEY
        }
      });

      console.log(`   GET ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`     Total: ${data.total || 0} employees`);
      }
    } catch (error) {
      console.log(`   GET ${endpoint}: Error - ${error.message}`);
    }
  }

  console.log('');

  // Test 4: Try with different query parameters
  console.log('🧪 Test 4: Different query parameters...');
  const queryParams = [
    '?items_per_page=10',
    '?size=10',
    '?limit=10',
    '?page=1&size=10',
    '?items_per_page=10&page=1'
  ];

  for (const params of queryParams) {
    try {
      const query = {
        query: {
          match_all: {}
        }
      };

      const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview${params}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'apikey': CORESIGNAL_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      });

      console.log(`   ${params}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`     Total: ${data.total || 0} employees`);
      }
    } catch (error) {
      console.log(`   ${params}: Error - ${error.message}`);
    }
  }

  console.log('');
  console.log('🎯 SUMMARY:');
  console.log('===========');
  console.log('This test will help us understand:');
  console.log('1. If different API versions work');
  console.log('2. If different employee endpoints work');
  console.log('3. If GET requests work instead of POST');
  console.log('4. If different query parameters work');
  console.log('5. If we can find ANY working endpoint for employee data');
}

testCoreSignalAlternativeEndpoints().catch(console.error);
