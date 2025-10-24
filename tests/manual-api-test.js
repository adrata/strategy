#!/usr/bin/env node

/**
 * Manual API Test for Company Intelligence Fixes
 * 
 * This script tests the actual API endpoints to ensure they work
 * without Prisma relation errors.
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';
const TEST_COMPANY_ID = 'test-company-123';

// Test configurations
const tests = [
  {
    name: 'Company Strategy API (GET)',
    url: `${API_BASE}/api/v1/strategy/company/${TEST_COMPANY_ID}`,
    method: 'GET',
    expectedStatus: [401, 404], // 401 = auth required, 404 = company not found
    description: 'Tests that the strategy API doesn\'t throw Prisma relation errors'
  },
  {
    name: 'Company Strategy API (POST)',
    url: `${API_BASE}/api/v1/strategy/company/${TEST_COMPANY_ID}`,
    method: 'POST',
    expectedStatus: [401, 404], // 401 = auth required, 404 = company not found
    description: 'Tests that the strategy API POST doesn\'t throw Prisma relation errors'
  },
  {
    name: 'SBI Intelligence API',
    url: `${API_BASE}/api/sbi/companies/${TEST_COMPANY_ID}/intelligence`,
    method: 'GET',
    expectedStatus: [404], // 404 = company not found (expected)
    description: 'Tests that the SBI intelligence API doesn\'t throw Prisma relation errors'
  }
];

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (method === 'POST') {
      req.write(JSON.stringify({ forceRegenerate: false }));
    }

    req.end();
  });
}

// Run individual test
async function runTest(test) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`   URL: ${test.url}`);
  console.log(`   Method: ${test.method}`);
  console.log(`   Expected Status: ${test.expectedStatus.join(' or ')}`);
  console.log(`   Description: ${test.description}`);

  try {
    const response = await makeRequest(test.url, test.method);
    
    console.log(`   ✅ Response Status: ${response.statusCode}`);
    
    if (test.expectedStatus.includes(response.statusCode)) {
      console.log(`   ✅ Status code is expected (${response.statusCode})`);
      
      // Check if response indicates Prisma errors
      if (response.body.includes('Unknown field') || 
          response.body.includes('opportunities') ||
          response.body.includes('buyerGroups')) {
        console.log(`   ❌ Response contains Prisma relation errors!`);
        console.log(`   Response body: ${response.body.substring(0, 200)}...`);
        return false;
      } else {
        console.log(`   ✅ No Prisma relation errors detected`);
        return true;
      }
    } else {
      console.log(`   ❌ Unexpected status code: ${response.statusCode}`);
      console.log(`   Response body: ${response.body.substring(0, 200)}...`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Manual API Tests for Company Intelligence Fixes');
  console.log('=' .repeat(70));
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    const passed = await runTest(test);
    if (passed) {
      passedTests++;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 Test Results Summary:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Company Intelligence API fixes are working correctly.');
    console.log('✅ No Prisma relation errors detected in any API endpoint.');
  } else {
    console.log('\n❌ Some tests failed. Please check the output above for details.');
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await makeRequest(`${API_BASE}/api/health`, 'GET');
    console.log('✅ Server is running and responding');
    return true;
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('   Please start the development server with: npm run dev');
    return false;
  }
}

// Run the tests
async function main() {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await runAllTests();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
main().catch((error) => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
});
