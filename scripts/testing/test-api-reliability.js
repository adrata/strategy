/**
 * API Reliability Testing - Comprehensive API Endpoint Testing
 * Tests all critical APIs under various conditions and loads
 * Purpose: Ensure all APIs work flawlessly for Monday launch
 */

const fetch = globalThis.fetch || require('node-fetch');

const API_BASE = 'http://localhost:3000';
const TEST_USER_ID = 'tony-luthor-test';
const TEST_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';

// Critical API endpoints to test
const API_ENDPOINTS = [
  // Authentication APIs
  {
    name: 'Sign In',
    method: 'POST',
    endpoint: '/api/auth/sign-in',
    body: {
      email: 'tony@adrata.com',
      password: 'tonypass'
    },
    critical: true,
    expectedStatus: 200
  },

  // Role Finder APIs
  {
    name: 'Role Finder - Single Company',
    method: 'POST',
    endpoint: '/api/role-finder',
    body: {
      inputType: 'single',
      company: 'Microsoft Corporation',
      roles: ['CEO', 'CFO'],
      userId: TEST_USER_ID,
      workspaceId: TEST_WORKSPACE_ID
    },
    critical: true,
    expectedStatus: 200
  },

  {
    name: 'Role Finder - List Input',
    method: 'POST',
    endpoint: '/api/role-finder',
    body: {
      inputType: 'list',
      companies: ['Apple Inc', 'Google LLC', 'Amazon.com Inc'],
      roles: ['CEO'],
      userId: TEST_USER_ID,
      workspaceId: TEST_WORKSPACE_ID
    },
    critical: true,
    expectedStatus: 200
  },

  // Enrichment APIs
  {
    name: 'Waterfall Enrichment',
    method: 'POST',
    endpoint: '/api/enrichment/waterfall',
    body: {
      type: 'email_verification',
      data: {
        email: 'test@microsoft.com',
        company: 'Microsoft Corporation'
      },
      userId: TEST_USER_ID,
      workspaceId: TEST_WORKSPACE_ID
    },
    critical: true,
    expectedStatus: 200
  },

  // AI Chat APIs
  {
    name: 'AI Chat',
    method: 'POST',
    endpoint: '/api/ai/chat',
    body: {
      message: 'Find me the CEO of Apple Inc',
      userId: TEST_USER_ID,
      workspaceId: TEST_WORKSPACE_ID
    },
    critical: true,
    expectedStatus: 200
  },

  // Signal APIs
  {
    name: 'Signal Rules - Get',
    method: 'GET',
    endpoint: `/api/signals/rules?userId=${TEST_USER_ID}&workspaceId=${TEST_WORKSPACE_ID}`,
    critical: false,
    expectedStatus: 200
  },

  {
    name: 'Signal Rules - Create',
    method: 'POST',
    endpoint: '/api/signals/rules',
    body: {
      name: 'Test Signal',
      description: 'Test signal for API testing',
      conditions: {
        keywords: ['acquisition', 'merger'],
        companies: ['Microsoft']
      },
      userId: TEST_USER_ID,
      workspaceId: TEST_WORKSPACE_ID
    },
    critical: false,
    expectedStatus: 200
  },

  // Data APIs
  {
    name: 'Unified Data',
    method: 'GET',
    endpoint: `/api/data/unified?userId=${TEST_USER_ID}&workspaceId=${TEST_WORKSPACE_ID}`,
    critical: true,
    expectedStatus: 200
  },

  // Export APIs
  {
    name: 'Export Generate',
    method: 'POST',
    endpoint: '/api/export/generate',
    body: {
      format: 'csv',
      data: [
        { company: 'Apple Inc', ceo: 'Tim Cook' },
        { company: 'Microsoft', ceo: 'Satya Nadella' }
      ],
      userId: TEST_USER_ID,
      workspaceId: TEST_WORKSPACE_ID
    },
    critical: false,
    expectedStatus: 200
  },

  // Universal B2B Audit
  {
    name: 'Universal B2B Audit',
    method: 'POST',
    endpoint: '/api/audit/universal-b2b',
    body: {
      testScenarios: ['tech_to_finance', 'startup_to_enterprise'],
      userId: TEST_USER_ID,
      workspaceId: TEST_WORKSPACE_ID
    },
    critical: false,
    expectedStatus: 200
  }
];

// Load testing scenarios
const LOAD_TEST_SCENARIOS = [
  {
    name: 'Concurrent Role Finder Requests',
    endpoint: '/api/role-finder',
    concurrency: 5,
    requests: 10
  },
  {
    name: 'Concurrent AI Chat Requests',
    endpoint: '/api/ai/chat',
    concurrency: 3,
    requests: 6
  }
];

class APIReliabilityTester {
  constructor() {
    this.results = [];
    this.loadTestResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.criticalFailures = 0;
  }

  async runAllTests() {
    console.log('🚀 Starting API Reliability Testing...');
    console.log('🎯 Testing all critical endpoints for Monday launch\n');

    // Run individual API tests
    await this.runIndividualTests();
    
    // Run load tests
    await this.runLoadTests();
    
    // Run error handling tests
    await this.runErrorHandlingTests();

    this.printSummary();
  }

  async runIndividualTests() {
    console.log('📋 Testing Individual API Endpoints');
    console.log('─'.repeat(60));

    for (const api of API_ENDPOINTS) {
      await this.testSingleAPI(api);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async testSingleAPI(api) {
    this.totalTests++;
    console.log(`\n🧪 Testing: ${api.name}`);
    console.log(`📡 ${api.method} ${api.endpoint}`);

    const startTime = Date.now();
    
    try {
      const options = {
        method: api.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (api.body) {
        options.body = JSON.stringify(api.body);
      }

      const response = await fetch(`${API_BASE}${api.endpoint}`, options);
      const responseTime = Date.now() - startTime;
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }

      const success = response.status === api.expectedStatus;
      
      if (success) {
        console.log(`✅ PASS (${responseTime}ms)`);
        this.passedTests++;
      } else {
        console.log(`❌ FAIL - Status: ${response.status}, Expected: ${api.expectedStatus}`);
        this.failedTests++;
        if (api.critical) {
          this.criticalFailures++;
        }
      }

      this.results.push({
        name: api.name,
        endpoint: api.endpoint,
        method: api.method,
        critical: api.critical,
        expectedStatus: api.expectedStatus,
        actualStatus: response.status,
        responseTime,
        success,
        response: typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data).substring(0, 200),
        error: success ? null : `Status ${response.status}`
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`❌ FAIL - Error: ${error.message}`);
      this.failedTests++;
      if (api.critical) {
        this.criticalFailures++;
      }

      this.results.push({
        name: api.name,
        endpoint: api.endpoint,
        method: api.method,
        critical: api.critical,
        expectedStatus: api.expectedStatus,
        actualStatus: 0,
        responseTime,
        success: false,
        error: error.message
      });
    }
  }

  async runLoadTests() {
    console.log('\n\n📈 Running Load Tests');
    console.log('─'.repeat(60));

    for (const loadTest of LOAD_TEST_SCENARIOS) {
      await this.runSingleLoadTest(loadTest);
    }
  }

  async runSingleLoadTest(loadTest) {
    console.log(`\n🏋️ Load Test: ${loadTest.name}`);
    console.log(`📊 ${loadTest.concurrency} concurrent requests, ${loadTest.requests} total`);

    const startTime = Date.now();
    const promises = [];

    // Create concurrent requests
    for (let i = 0; i < loadTest.requests; i++) {
      const promise = this.makeLoadTestRequest(loadTest.endpoint, i);
      promises.push(promise);

      // Stagger requests based on concurrency
      if ((i + 1) % loadTest.concurrency === 0) {
        await Promise.all(promises.splice(0, loadTest.concurrency));
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }
    }

    // Wait for remaining requests
    if (promises.length > 0) {
      await Promise.all(promises);
    }

    const totalTime = Date.now() - startTime;
    const avgResponseTime = totalTime / loadTest.requests;

    console.log(`⏱️ Total Time: ${totalTime}ms`);
    console.log(`📊 Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);

    this.loadTestResults.push({
      name: loadTest.name,
      requests: loadTest.requests,
      concurrency: loadTest.concurrency,
      totalTime,
      avgResponseTime
    });
  }

  async makeLoadTestRequest(endpoint, requestId) {
    try {
      let body;
      if (endpoint === '/api/role-finder') {
        body = {
          inputType: 'single',
          company: `Test Company ${requestId}`,
          roles: ['CEO'],
          userId: TEST_USER_ID,
          workspaceId: TEST_WORKSPACE_ID
        };
      } else if (endpoint === '/api/ai/chat') {
        body = {
          message: `Test query ${requestId}`,
          userId: TEST_USER_ID,
          workspaceId: TEST_WORKSPACE_ID
        };
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      return {
        requestId,
        status: response.status,
        success: response.ok
      };
    } catch (error) {
      return {
        requestId,
        status: 0,
        success: false,
        error: error.message
      };
    }
  }

  async runErrorHandlingTests() {
    console.log('\n\n🚨 Testing Error Handling');
    console.log('─'.repeat(60));

    const errorTests = [
      {
        name: 'Invalid JSON Body',
        endpoint: '/api/role-finder',
        body: 'invalid json',
        expectedStatus: 400
      },
      {
        name: 'Missing Required Fields',
        endpoint: '/api/role-finder',
        body: { inputType: 'single' }, // Missing company and roles
        expectedStatus: 400
      },
      {
        name: 'Invalid User ID',
        endpoint: '/api/ai/chat',
        body: {
          message: 'test',
          userId: 'invalid-user-id',
          workspaceId: TEST_WORKSPACE_ID
        },
        expectedStatus: 401
      }
    ];

    for (const test of errorTests) {
      await this.testErrorHandling(test);
    }
  }

  async testErrorHandling(test) {
    console.log(`\n🧪 Error Test: ${test.name}`);
    
    try {
      const response = await fetch(`${API_BASE}${test.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: typeof test.body === 'string' ? test.body : JSON.stringify(test.body)
      });

      const success = response.status === test.expectedStatus;
      
      if (success) {
        console.log(`✅ PASS - Correctly returned ${response.status}`);
      } else {
        console.log(`❌ FAIL - Expected ${test.expectedStatus}, got ${response.status}`);
      }

    } catch (error) {
      console.log(`❌ FAIL - Unexpected error: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 API RELIABILITY TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`📊 Total API Tests: ${this.totalTests}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`🚨 Critical Failures: ${this.criticalFailures}`);
    console.log(`📈 Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);

    // Critical API status
    console.log('\n🚨 CRITICAL API STATUS:');
    const criticalAPIs = this.results.filter(r => r.critical);
    const criticalPassed = criticalAPIs.filter(r => r.success).length;
    const criticalTotal = criticalAPIs.length;
    
    console.log(`📊 Critical APIs: ${criticalPassed}/${criticalTotal} passing`);
    
    if (this.criticalFailures === 0) {
      console.log('🟢 All critical APIs are working!');
    } else {
      console.log('🔴 CRITICAL APIS FAILING - MUST FIX BEFORE LAUNCH!');
      criticalAPIs
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`❌ ${r.name}: ${r.error}`);
        });
    }

    // Load test results
    if (this.loadTestResults.length > 0) {
      console.log('\n📈 LOAD TEST RESULTS:');
      this.loadTestResults.forEach(result => {
        console.log(`🏋️ ${result.name}: ${result.avgResponseTime.toFixed(2)}ms avg`);
      });
    }

    // Production readiness assessment
    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT:');
    if (this.criticalFailures === 0 && this.passedTests / this.totalTests >= 0.9) {
      console.log('🟢 EXCELLENT - All critical APIs working, system ready for launch!');
    } else if (this.criticalFailures === 0 && this.passedTests / this.totalTests >= 0.8) {
      console.log('🟡 GOOD - Critical APIs working, minor issues with non-critical endpoints');
    } else if (this.criticalFailures > 0) {
      console.log('🔴 CRITICAL ISSUES - Must fix critical API failures before launch!');
    } else {
      console.log('🟠 NEEDS WORK - Too many API failures for production launch');
    }

    // Detailed results table
    console.log('\n📋 Detailed API Results:');
    console.table(this.results.map(r => ({
      API: r.name,
      Method: r.method,
      Critical: r.critical ? '🚨' : '📝',
      Status: r.success ? '✅' : '❌',
      ResponseTime: `${r.responseTime}ms`,
      Error: r.error || 'None'
    })));
  }
}

// Run the API reliability tests
if (require.main === module) {
  const tester = new APIReliabilityTester();
  tester.runAllTests()
    .then(() => {
      console.log('\n🏁 API reliability testing complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 API reliability testing failed:', error);
      process.exit(1);
    });
}

module.exports = { APIReliabilityTester };
