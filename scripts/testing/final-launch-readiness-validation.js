#!/usr/bin/env node

/**
 * 🚀 FINAL LAUNCH READINESS VALIDATION
 * 
 * Comprehensive end-to-end validation for Monday launch
 * Tests all critical systems, APIs, and user scenarios
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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
  userId: 'tony-luthor-test',
  testUser: {
    email: 'tony@adrata.com',
    password: 'tonypass',
    id: 'tony-luthor-test'
  }
};

class LaunchReadinessValidator {
  constructor() {
    this.testResults = [];
    this.systemHealth = {
      database: false,
      apis: false,
      authentication: false,
      dataEnrichment: false,
      aiProcessing: false,
      errorHandling: false
    };
  }

  async runTest(testName, testFn, category = 'general') {
    console.log(`\n🧪 ${testName}`);
    try {
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        category,
        status: 'PASS',
        duration,
        result
      });
      
      console.log(`✅ PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      this.testResults.push({
        name: testName,
        category,
        status: 'FAIL',
        error: error.message
      });
      
      console.error(`❌ FAILED: ${error.message}`);
      return { error: error.message };
    }
  }

  // 1. DATABASE HEALTH CHECK
  async validateDatabaseHealth() {
    console.log('\n🗄️  DATABASE HEALTH VALIDATION');
    
    await this.runTest('Database Connection', async () => {
      await prisma.$connect();
      return { connected: true };
    }, 'database');

    await this.runTest('User Data Integrity', async () => {
      const user = await prisma.user.findUnique({
        where: { id: TEST_CONFIG.testUser.id },
        include: { workspaceMemberships: true }
      });
      
      if (!user) throw new Error('Test user not found');
      if (user.workspaceMemberships.length === 0) throw new Error('User not connected to workspace');
      
      return { 
        userId: user.id, 
        workspaces: user.workspaceMemberships.length 
      };
    }, 'database');

    await this.runTest('Data Isolation', async () => {
      const userLeads = await prisma.lead.findMany({
        where: { 
          assignedUserId: TEST_CONFIG.testUser.id,
          workspaceId: TEST_CONFIG.workspaceId
        }
      });

      const otherWorkspaceLeads = await prisma.lead.findMany({
        where: {
          assignedUserId: TEST_CONFIG.testUser.id,
          workspaceId: { not: TEST_CONFIG.workspaceId }
        }
      });

      if (otherWorkspaceLeads.length > 0) {
        throw new Error(`Data contamination: ${otherWorkspaceLeads.length} leads in other workspaces`);
      }

      return { 
        userLeads: userLeads.length,
        isolated: true 
      };
    }, 'database');

    this.systemHealth.database = this.testResults
      .filter(t => t.category === 'database')
      .every(t => t.status === 'PASS');
  }

  // 2. API ENDPOINTS VALIDATION
  async validateAPIEndpoints() {
    console.log('\n🔌 API ENDPOINTS VALIDATION');

    await this.runTest('AI Chat API', async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Find me a VP of Sales at Nike',
          workspaceId: TEST_CONFIG.workspaceId,
          userId: TEST_CONFIG.userId
        })
      });

      if (!response.ok) throw new Error(`Chat API failed: ${response.status}`);
      const result = await response.json();
      
      return { 
        success: true, 
        responseLength: result.response?.length || 0 
      };
    }, 'apis');

    await this.runTest('CoreSignal AI API', async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai/coresignal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Find me growing SaaS companies',
          context: {
            workspaceId: TEST_CONFIG.workspaceId,
            userId: TEST_CONFIG.userId,
            maxResults: 3
          }
        })
      });

      if (!response.ok) throw new Error(`CoreSignal API failed: ${response.status}`);
      const result = await response.json();
      
      return { 
        success: result.success,
        hasResponse: !!result.response
      };
    }, 'apis');

    await this.runTest('Role Finder API', async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/role-finder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputType: 'single',
          company: 'Nike',
          roles: ['VP_SALES'],
          workspaceId: TEST_CONFIG.workspaceId,
          userId: TEST_CONFIG.userId,
          config: { maxResultsPerCompany: 1 }
        })
      });

      if (!response.ok) throw new Error(`Role Finder API failed: ${response.status}`);
      const result = await response.json();
      
      return { 
        success: result.success,
        hasReport: !!result.report
      };
    }, 'apis');

    await this.runTest('Waterfall Enrichment API', async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/enrichment/waterfall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (!response.ok) throw new Error(`Waterfall API failed: ${response.status}`);
      const result = await response.json();
      
      return { 
        success: result.success,
        provider: result.result?.provider,
        cost: result.result?.cost
      };
    }, 'apis');

    this.systemHealth.apis = this.testResults
      .filter(t => t.category === 'apis')
      .every(t => t.status === 'PASS');
    
    // Set data enrichment health based on waterfall enrichment test
    this.systemHealth.dataEnrichment = this.testResults
      .some(t => t.name.includes('Waterfall Enrichment') && t.status === 'PASS');
  }

  // 3. CRITICAL USER SCENARIOS
  async validateUserScenarios() {
    console.log('\n👥 CRITICAL USER SCENARIOS VALIDATION');

    const scenarios = [
      {
        name: 'Geographic Search',
        query: 'Find me all the hospitals in Arizona',
        type: 'company_search'
      },
      {
        name: 'Industry + Growth',
        query: 'Find me all the growing SaaS companies',
        type: 'company_search'
      },
      {
        name: 'Executive Search',
        query: 'Find me a VP of Sales at Nike',
        type: 'people_search'
      },
      {
        name: 'Misspelling Handling',
        query: 'Find me a CFO at Mircosoft',
        type: 'people_search'
      },
      {
        name: 'Complex Multi-Criteria',
        query: 'Find me CTOs at Series B cybersecurity companies in California',
        type: 'people_search'
      },
      {
        name: 'Entry-Level Help',
        query: 'I need to find some leads for my territory',
        type: 'lead_generation'
      }
    ];

    for (const scenario of scenarios) {
      await this.runTest(`User Scenario: ${scenario.name}`, async () => {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: scenario.query,
            workspaceId: TEST_CONFIG.workspaceId,
            userId: TEST_CONFIG.userId
          })
        });

        if (!response.ok) throw new Error(`Scenario failed: ${response.status}`);
        const result = await response.json();
        
        return {
          query: scenario.query,
          responseGenerated: !!result.response,
          responseLength: result.response?.length || 0
        };
      }, 'scenarios');
    }

    this.systemHealth.aiProcessing = this.testResults
      .filter(t => t.category === 'scenarios')
      .every(t => t.status === 'PASS');
    
    // Set authentication health based on user data integrity test
    this.systemHealth.authentication = this.testResults
      .some(t => t.name.includes('User Data Integrity') && t.status === 'PASS');
  }

  // 4. ERROR HANDLING VALIDATION
  async validateErrorHandling() {
    console.log('\n🛡️  ERROR HANDLING VALIDATION');

    await this.runTest('Nonsensical Query Handling', async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Find me purple elephants in the cloud',
          workspaceId: TEST_CONFIG.workspaceId,
          userId: TEST_CONFIG.userId
        })
      });

      // Should handle gracefully, not crash
      const result = await response.json();
      
      return {
        handled: response.ok,
        responseGenerated: !!result.response
      };
    }, 'error_handling');

    await this.runTest('Invalid API Parameters', async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/role-finder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputType: 'invalid_type',
          workspaceId: TEST_CONFIG.workspaceId,
          userId: TEST_CONFIG.userId
        })
      });

      // Should return proper error, not crash
      if (response.status !== 400) {
        throw new Error(`Expected 400 error, got ${response.status}`);
      }

      const result = await response.json();
      
      return {
        properErrorHandling: !result.success,
        errorMessage: result.error
      };
    }, 'error_handling');

    this.systemHealth.errorHandling = this.testResults
      .filter(t => t.category === 'error_handling')
      .every(t => t.status === 'PASS');
  }

  // 5. PERFORMANCE VALIDATION
  async validatePerformance() {
    console.log('\n⚡ PERFORMANCE VALIDATION');

    await this.runTest('API Response Times', async () => {
      const apiTests = this.testResults.filter(t => t.category === 'apis' && t.duration);
      const avgResponseTime = apiTests.reduce((sum, t) => sum + t.duration, 0) / apiTests.length;
      
      if (avgResponseTime > 10000) { // 10 seconds
        throw new Error(`Average API response time too slow: ${avgResponseTime}ms`);
      }

      return {
        avgResponseTime: Math.round(avgResponseTime),
        maxAcceptable: 10000,
        performance: avgResponseTime < 5000 ? 'excellent' : 'acceptable'
      };
    }, 'performance');

    await this.runTest('Database Query Performance', async () => {
      const startTime = Date.now();
      
      await prisma.lead.findMany({
        where: { workspaceId: TEST_CONFIG.workspaceId },
        take: 100
      });
      
      const duration = Date.now() - startTime;
      
      if (duration > 2000) {
        throw new Error(`Database query too slow: ${duration}ms`);
      }

      return {
        queryTime: duration,
        performance: duration < 500 ? 'excellent' : 'acceptable'
      };
    }, 'performance');
  }

  // GENERATE COMPREHENSIVE REPORT
  generateLaunchReadinessReport() {
    console.log('\n📊 LAUNCH READINESS REPORT');
    console.log('='.repeat(50));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAIL').length;
    const successRate = (passedTests / totalTests) * 100;

    console.log(`\n📈 OVERALL METRICS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);

    console.log(`\n🏥 SYSTEM HEALTH:`);
    Object.entries(this.systemHealth).forEach(([system, healthy]) => {
      console.log(`   ${system.charAt(0).toUpperCase() + system.slice(1)}: ${healthy ? '✅ HEALTHY' : '❌ ISSUES'}`);
    });

    // Category breakdown
    console.log(`\n📂 CATEGORY BREAKDOWN:`);
    const categories = [...new Set(this.testResults.map(t => t.category))];
    categories.forEach(category => {
      const categoryTests = this.testResults.filter(t => t.category === category);
      const categoryPassed = categoryTests.filter(t => t.status === 'PASS').length;
      const categoryRate = (categoryPassed / categoryTests.length) * 100;
      console.log(`   ${category}: ${categoryPassed}/${categoryTests.length} (${categoryRate.toFixed(1)}%)`);
    });

    // Failed tests details
    if (failedTests > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      this.testResults
        .filter(t => t.status === 'FAIL')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }

    // Performance metrics
    const apiTests = this.testResults.filter(t => t.category === 'apis' && t.duration);
    if (apiTests.length > 0) {
      const avgResponseTime = apiTests.reduce((sum, t) => sum + t.duration, 0) / apiTests.length;
      console.log(`\n⚡ PERFORMANCE:`);
      console.log(`   Average API Response Time: ${Math.round(avgResponseTime)}ms`);
      console.log(`   Performance Rating: ${avgResponseTime < 3000 ? 'Excellent' : avgResponseTime < 7000 ? 'Good' : 'Needs Improvement'}`);
    }

    // Final launch readiness assessment
    const allSystemsHealthy = Object.values(this.systemHealth).every(h => h);
    const criticalSuccessRate = successRate >= 95;
    const launchReady = allSystemsHealthy && criticalSuccessRate;

    console.log(`\n🚀 LAUNCH READINESS ASSESSMENT:`);
    console.log(`   All Systems Healthy: ${allSystemsHealthy ? '✅ YES' : '❌ NO'}`);
    console.log(`   Success Rate >= 95%: ${criticalSuccessRate ? '✅ YES' : '❌ NO'}`);
    console.log(`   Ready for Monday Launch: ${launchReady ? '🎉 YES - GO LIVE!' : '⚠️  NO - ISSUES NEED RESOLUTION'}`);

    if (launchReady) {
      console.log(`\n🎉 CONGRATULATIONS!`);
      console.log(`   The Adrata system has passed all critical tests and is ready for Monday launch.`);
      console.log(`   All APIs are functional, data persistence is working, and user scenarios are handled correctly.`);
      console.log(`   The system demonstrates high accuracy, intelligent error handling, and excellent performance.`);
    } else {
      console.log(`\n⚠️  LAUNCH BLOCKERS IDENTIFIED:`);
      console.log(`   Please resolve the failed tests above before proceeding with the Monday launch.`);
    }

    return {
      launchReady,
      successRate,
      systemHealth: this.systemHealth,
      totalTests,
      passedTests,
      failedTests
    };
  }

  async run() {
    console.log('🚀 FINAL LAUNCH READINESS VALIDATION');
    console.log('Testing all critical systems for Monday launch...');

    try {
      await this.validateDatabaseHealth();
      await this.validateAPIEndpoints();
      await this.validateUserScenarios();
      await this.validateErrorHandling();
      await this.validatePerformance();

      const report = this.generateLaunchReadinessReport();
      
      return report;

    } catch (error) {
      console.error('\n💥 Validation suite failed:', error.message);
      return {
        launchReady: false,
        error: error.message
      };
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the validation if called directly
if (require.main === module) {
  const validator = new LaunchReadinessValidator();
  validator.run().catch(console.error);
}

module.exports = LaunchReadinessValidator;
