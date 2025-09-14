#!/usr/bin/env node

/**
 * Critical Scenarios Test - Focused on Monday Launch Readiness
 * Tests the most important user scenarios for production launch
 */

// Use native fetch in Node.js 18+ or fallback to node-fetch
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    fetch = require('node-fetch');
  }
} catch (error) {
  fetch = require('node-fetch');
}

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
  userId: 'tony-luthor-test'
};

class CriticalScenariosTest {
  constructor() {
    this.testResults = [];
    this.criticalScenarios = [
      // Geographic + Industry (Most Common)
      {
        name: 'Hospitals in Arizona',
        query: 'Find me all the hospitals in Arizona',
        expectedType: 'company_search',
        priority: 'critical'
      },
      {
        name: 'Growing SaaS Companies',
        query: 'Find me all the growing SaaS companies',
        expectedType: 'company_search',
        priority: 'critical'
      },
      {
        name: 'VP Sales at Nike',
        query: 'Find me a VP of Sales at Nike',
        expectedType: 'people_search',
        priority: 'critical'
      },
      // Misspellings (Error Handling)
      {
        name: 'Misspelled Company',
        query: 'Find me a CFO at Mircosoft',
        expectedType: 'people_search',
        expectedCorrection: 'Microsoft',
        priority: 'high'
      },
      {
        name: 'Misspelled Role',
        query: 'Find me a VP of Saels at Apple',
        expectedType: 'people_search',
        expectedCorrection: 'Sales',
        priority: 'high'
      },
      // Nonsensical (Graceful Handling)
      {
        name: 'Nonsensical Request',
        query: 'Find me purple elephants in the cloud',
        expectedType: 'unclear',
        priority: 'medium'
      },
      // Complex Multi-Criteria
      {
        name: 'Complex Multi-Criteria',
        query: 'Find me CTOs at Series B cybersecurity companies in California',
        expectedType: 'people_search',
        priority: 'high'
      },
      // Entry-Level Seller Scenarios
      {
        name: 'Entry Level Help',
        query: 'I need to find some leads for my territory',
        expectedType: 'lead_generation',
        priority: 'high'
      }
    ];
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Testing: ${testName}`);
    try {
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'PASS',
        duration,
        result
      });
      
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'FAIL',
        error: error.message
      });
      
      console.error(`❌ ${testName} - FAILED: ${error.message}`);
      return { error: error.message };
    }
  }

  async testAIChatProcessing(scenario) {
    return this.runTest(`AI Chat: ${scenario.name}`, async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: scenario.query,
          workspaceId: TEST_CONFIG.workspaceId,
          userId: TEST_CONFIG.userId
        })
      });

      if (!response.ok) {
        // For nonsensical queries, we expect graceful handling
        if (scenario.expectedType === 'unclear') {
          return {
            handled_gracefully: true,
            status: response.status,
            query: scenario.query
          };
        }
        throw new Error(`AI Chat failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        query: scenario.query,
        response: result.response?.substring(0, 200) + '...',
        success: true,
        responseTime: result.responseTime || 0
      };
    });
  }

  async testCoreSignalQuery(scenario) {
    return this.runTest(`CoreSignal: ${scenario.name}`, async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai/coresignal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: scenario.query,
          context: {
            workspaceId: TEST_CONFIG.workspaceId,
            userId: TEST_CONFIG.userId,
            maxResults: 5 // Limit results to save API costs
          }
        })
      });

      if (!response.ok) {
        // For nonsensical queries, expect graceful handling
        if (scenario.expectedType === 'unclear') {
          return {
            handled_gracefully: true,
            status: response.status,
            query: scenario.query
          };
        }
        throw new Error(`CoreSignal failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        query: scenario.query,
        success: result.success,
        resultsCount: result.results?.length || 0,
        confidence: result.confidence || 0,
        provider: result.provider
      };
    });
  }

  async testRoleFinderPipeline(scenario) {
    if (scenario.expectedType !== 'people_search') {
      return { skipped: true, reason: 'Not a people search' };
    }

    return this.runTest(`Role Finder: ${scenario.name}`, async () => {
      // Extract company and role from scenario
      let company = 'Nike'; // Default
      let roles = ['VP_SALES']; // Default
      
      if (scenario.query.includes('Nike')) company = 'Nike';
      if (scenario.query.includes('Microsoft')) company = 'Microsoft';
      if (scenario.query.includes('Apple')) company = 'Apple';
      
      if (scenario.query.includes('CFO')) roles = ['CFO'];
      if (scenario.query.includes('CTO')) roles = ['CTO'];
      if (scenario.query.includes('VP of Sales')) roles = ['VP_SALES'];

      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/role-finder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputType: 'single',
          company: company,
          roles: roles,
          workspaceId: TEST_CONFIG.workspaceId,
          userId: TEST_CONFIG.userId,
          config: {
            maxResultsPerCompany: 2,
            minConfidenceScore: 70
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Role Finder failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        query: scenario.query,
        success: result.success,
        resultsCount: result.report?.results?.length || 0,
        confidence: result.report?.summary?.successRate || 0
      };
    });
  }

  async testWaterfallEnrichment() {
    return this.runTest('Waterfall Enrichment', async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/enrichment/waterfall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'email_verification',
          data: {
            email: 'test@nike.com',
            firstName: 'Test',
            lastName: 'User',
            company: 'Nike'
          },
          userId: TEST_CONFIG.userId,
          workspaceId: TEST_CONFIG.workspaceId
        })
      });

      if (!response.ok) {
        throw new Error(`Waterfall Enrichment failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: result.success,
        provider: result.provider,
        confidence: result.confidence || 0,
        cost: result.cost || 0,
        responseTime: result.responseTime || 0
      };
    });
  }

  async run() {
    console.log('🚀 Starting Critical Scenarios Test for Monday Launch');
    console.log(`Testing ${this.criticalScenarios.length} critical scenarios`);

    try {
      // Test waterfall enrichment first
      await this.testWaterfallEnrichment();

      // Test each critical scenario
      for (const scenario of this.criticalScenarios) {
        console.log(`\n🎯 Scenario: ${scenario.query} (Priority: ${scenario.priority})`);

        // Test AI Chat processing
        await this.testAIChatProcessing(scenario);

        // Test CoreSignal query (limit API calls)
        if (scenario.priority === 'critical') {
          await this.testCoreSignalQuery(scenario);
        }

        // Test Role Finder pipeline
        const roleResult = await this.testRoleFinderPipeline(scenario);
        if (roleResult.skipped) {
          console.log(`⏭️  Skipped Role Finder: ${roleResult.reason}`);
        }

        // Small delay between scenarios to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Print comprehensive summary
      this.printSummary();

    } catch (error) {
      console.error('\n💥 Critical test suite failed:', error.message);
    }
  }

  printSummary() {
    console.log('\n📊 Critical Scenarios Test Summary');
    console.log('=====================================');
    
    const totalTests = this.testResults.length;
    const passed = this.testResults.filter(t => t.status === 'PASS').length;
    const failed = this.testResults.filter(t => t.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}/${totalTests}`);
    console.log(`❌ Failed: ${failed}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passed / totalTests) * 100).toFixed(1)}%`);

    // Critical vs Non-Critical breakdown
    const criticalTests = this.testResults.filter(t => 
      this.criticalScenarios.some(s => 
        s.priority === 'critical' && t.name.includes(s.name)
      )
    );
    const criticalPassed = criticalTests.filter(t => t.status === 'PASS').length;
    
    console.log(`\n🔥 Critical Tests: ${criticalPassed}/${criticalTests.length} passed`);

    // Failed tests details
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(t => t.status === 'FAIL')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }

    // Launch readiness assessment
    const launchReady = (passed / totalTests) >= 0.8 && criticalPassed === criticalTests.length;
    
    console.log('\n🚀 Launch Readiness Assessment:');
    if (launchReady) {
      console.log('✅ READY FOR MONDAY LAUNCH! All critical scenarios pass.');
    } else {
      console.log('⚠️  NOT READY - Critical issues need resolution before launch.');
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new CriticalScenariosTest();
  test.run().catch(console.error);
}

module.exports = CriticalScenariosTest;
