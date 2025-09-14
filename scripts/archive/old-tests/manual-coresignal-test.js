#!/usr/bin/env node

/**
 * MANUAL CORESIGNAL INTEGRATION TEST
 * 
 * Quick manual test to verify CoreSignal AI integration is working
 * Run this to test the system without full E2E setup
 */

const https = require('https');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const TEST_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';

// Test cases
const TEST_CASES = [
  {
    name: 'Person Enrichment Test',
    endpoint: '/api/ai/coresignal',
    payload: {
      query: 'Enrich Ross Sylvester contact information',
      context: {
        userId: TEST_USER_ID,
        workspaceId: TEST_WORKSPACE_ID,
        userRole: 'ae',
        currentView: 'speedrun',
        currentRecord: {
          type: 'person',
          id: 'test-123',
          name: 'Ross Sylvester',
          company: 'Adrata',
          linkedinUrl: 'https://linkedin.com/in/ross-sylvester'
        },
        recentSearches: [],
        recentlyViewed: []
      }
    },
    expectedKeywords: ['enriched', 'contact', 'coresignal']
  },
  {
    name: 'Company Intelligence Test',
    endpoint: '/api/ai/coresignal',
    payload: {
      query: 'Tell me about Microsoft company intelligence',
      context: {
        userId: TEST_USER_ID,
        workspaceId: TEST_WORKSPACE_ID,
        userRole: 'ae',
        currentView: 'pipeline',
        currentRecord: {
          type: 'company',
          id: 'test-456',
          name: 'Microsoft',
          website: 'microsoft.com'
        },
        recentSearches: [],
        recentlyViewed: []
      }
    },
    expectedKeywords: ['microsoft', 'intelligence', 'employee']
  },
  {
    name: 'CSV Enrichment Test',
    endpoint: '/api/ai/coresignal/csv-enrich',
    payload: {
      csvData: 'Name,Company,Email\nJohn Doe,Microsoft,john@microsoft.com\nJane Smith,Google,jane@google.com',
      fileName: 'test-contacts.csv',
      workspaceId: TEST_WORKSPACE_ID,
      userId: TEST_USER_ID,
      enrichmentType: 'auto',
      addToLeads: false
    },
    expectedKeywords: ['processed', 'enriched', 'confidence']
  }
];

async function makeRequest(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData, error: 'Invalid JSON' });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTest(testCase) {
  console.log(`\n🧪 Running: ${testCase.name}`);
  console.log('='.repeat(50));
  
  try {
    const result = await makeRequest(testCase.endpoint, testCase.payload);
    
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Request successful');
      
      // Check for expected keywords
      const responseText = JSON.stringify(result.data).toLowerCase();
      const foundKeywords = testCase.expectedKeywords.filter(keyword => 
        responseText.includes(keyword.toLowerCase())
      );
      
      console.log(`Keywords found: ${foundKeywords.length}/${testCase.expectedKeywords.length}`);
      foundKeywords.forEach(keyword => console.log(`  ✅ ${keyword}`));
      
      const missingKeywords = testCase.expectedKeywords.filter(keyword => 
        !responseText.includes(keyword.toLowerCase())
      );
      missingKeywords.forEach(keyword => console.log(`  ❌ ${keyword}`));
      
      if (foundKeywords.length >= testCase.expectedKeywords.length * 0.7) {
        console.log('🎉 Test PASSED');
        return true;
      } else {
        console.log('⚠️ Test PARTIAL - some keywords missing');
        return false;
      }
      
    } else {
      console.log('❌ Request failed');
      console.log('Response:', JSON.stringify(result.data, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

async function checkServerHealth() {
  console.log('🏥 Checking server health...');
  
  try {
    const result = await makeRequest('/api/ai/coresignal', {
      query: 'health check',
      context: {
        userId: TEST_USER_ID,
        workspaceId: TEST_WORKSPACE_ID,
        userRole: 'ae',
        currentView: 'pipeline',
        recentSearches: [],
        recentlyViewed: []
      }
    });
    
    if (result.status === 200) {
      console.log('✅ Server is responding');
      return true;
    } else {
      console.log(`❌ Server returned status: ${result.status}`);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    console.log('💡 Make sure the development server is running: npm run dev');
    return false;
  }
}

async function main() {
  console.log('🚀 CoreSignal AI Integration Manual Test');
  console.log('==========================================');
  
  // Check server health first
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ Server is not responding. Please start the development server first:');
    console.log('   npm run dev');
    process.exit(1);
  }
  
  // Run all test cases
  const results = [];
  for (const testCase of TEST_CASES) {
    const passed = await runTest(testCase);
    results.push({ name: testCase.name, passed });
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  console.log(`\n🎯 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! CoreSignal integration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Run full E2E tests: npm run test:coresignal');
  console.log('   2. Test in the UI by opening the AI chat panel');
  console.log('   3. Try queries like "Enrich Ross\'s email" or "Tell me about Microsoft"');
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { main, TEST_CASES };
