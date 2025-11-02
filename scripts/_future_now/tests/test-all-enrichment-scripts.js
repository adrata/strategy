#!/usr/bin/env node

/**
 * Master Test Runner: All Enrichment Scripts
 * 
 * Runs all 5 enrichment script tests sequentially and provides a comprehensive summary report.
 */

const TestFindNikeCompany = require('./test-find-nike-company');
const TestFindCFONike = require('./test-find-cfo-nike');
const TestFindNicoleGraham = require('./test-find-nicole-graham');
const TestBuyerGroupNike = require('./test-buyer-group-nike');
const TestOptimalBuyerGroups = require('./test-optimal-buyer-groups');

class MasterTestRunner {
  constructor() {
    this.tests = [
      {
        name: 'Find Nike Company',
        description: 'Search and collect Nike company profile',
        test: new TestFindNikeCompany(),
        expectedCredits: 2
      },
      {
        name: 'Find CFO at Nike',
        description: 'Find CFO-level person at Nike',
        test: new TestFindCFONike(),
        expectedCredits: 5
      },
      {
        name: 'Find Nicole Graham',
        description: 'Find Nicole Graham by LinkedIn URL',
        test: new TestFindNicoleGraham(),
        expectedCredits: 2
      },
      {
        name: 'Find Buyer Group at Nike',
        description: 'Map buying committee at Nike for $250k software sale',
        test: new TestBuyerGroupNike(),
        expectedCredits: 40
      },
      {
        name: 'Find Optimal Buyer Groups',
        description: 'Find 10 optimal SaaS companies with buyer group analysis',
        test: new TestOptimalBuyerGroups(),
        expectedCredits: 100
      }
    ];
    
    this.results = {
      totalTests: this.tests.length,
      passedTests: 0,
      failedTests: 0,
      totalCreditsUsed: 0,
      totalExecutionTime: 0,
      testResults: [],
      startTime: new Date().toISOString()
    };
  }

  async run() {
    console.log('🚀 Master Test Runner: All Enrichment Scripts');
    console.log('=' .repeat(60));
    console.log(`📅 Started: ${new Date().toLocaleString()}`);
    console.log(`📊 Total Tests: ${this.tests.length}`);
    console.log(`💳 Estimated Credits: ${this.tests.reduce((sum, test) => sum + test.expectedCredits, 0)}`);
    console.log('');

    const overallStartTime = Date.now();

    for (let i = 0; i < this.tests.length; i++) {
      const testInfo = this.tests[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 Test ${i + 1}/${this.tests.length}: ${testInfo.name}`);
      console.log(`📝 Description: ${testInfo.description}`);
      console.log(`💳 Expected Credits: ${testInfo.expectedCredits}`);
      console.log('');

      try {
        const testStartTime = Date.now();
        const result = await testInfo.test.run();
        const testExecutionTime = Date.now() - testStartTime;

        const testResult = {
          name: testInfo.name,
          success: result.success,
          creditsUsed: result.creditsUsed,
          executionTime: testExecutionTime,
          expectedCredits: testInfo.expectedCredits,
          data: result.data,
          errors: result.errors
        };

        this.results.testResults.push(testResult);
        this.results.totalCreditsUsed += result.creditsUsed;
        this.results.totalExecutionTime += testExecutionTime;

        if (result.success) {
          this.results.passedTests++;
          console.log(`\n✅ Test ${i + 1} PASSED`);
        } else {
          this.results.failedTests++;
          console.log(`\n❌ Test ${i + 1} FAILED`);
        }

        console.log(`📊 Credits Used: ${result.creditsUsed} (expected: ${testInfo.expectedCredits})`);
        console.log(`⏱️ Execution Time: ${testExecutionTime}ms`);

        // Small delay between tests
        if (i < this.tests.length - 1) {
          console.log('\n⏳ Waiting 3 seconds before next test...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`\n💥 Test ${i + 1} CRASHED:`, error.message);
        
        const testResult = {
          name: testInfo.name,
          success: false,
          creditsUsed: 0,
          executionTime: 0,
          expectedCredits: testInfo.expectedCredits,
          data: null,
          errors: [error.message]
        };

        this.results.testResults.push(testResult);
        this.results.failedTests++;
      }
    }

    this.results.endTime = new Date().toISOString();
    this.results.totalExecutionTime = Date.now() - overallStartTime;

    // Display comprehensive summary
    this.displaySummary();
  }

  displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Overall Results:`);
    console.log(`  Total Tests: ${this.results.totalTests}`);
    console.log(`  Passed: ${this.results.passedTests} ✅`);
    console.log(`  Failed: ${this.results.failedTests} ❌`);
    console.log(`  Success Rate: ${Math.round((this.results.passedTests / this.results.totalTests) * 100)}%`);
    
    console.log(`\n💳 Credit Usage:`);
    console.log(`  Total Credits Used: ${this.results.totalCreditsUsed}`);
    console.log(`  Expected Credits: ${this.tests.reduce((sum, test) => sum + test.expectedCredits, 0)}`);
    console.log(`  Credit Efficiency: ${Math.round((this.tests.reduce((sum, test) => sum + test.expectedCredits, 0) / this.results.totalCreditsUsed) * 100)}%`);
    
    console.log(`\n⏱️ Performance:`);
    console.log(`  Total Execution Time: ${Math.round(this.results.totalExecutionTime / 1000)}s`);
    console.log(`  Average per Test: ${Math.round(this.results.totalExecutionTime / this.results.totalTests)}ms`);
    
    console.log(`\n📋 Individual Test Results:`);
    this.results.testResults.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const creditEfficiency = result.expectedCredits > 0 ? 
        Math.round((result.expectedCredits / result.creditsUsed) * 100) : 0;
      
      console.log(`  ${index + 1}. ${result.name}: ${status}`);
      console.log(`     Credits: ${result.creditsUsed}/${result.expectedCredits} (${creditEfficiency}% efficiency)`);
      console.log(`     Time: ${result.executionTime}ms`);
      
      if (result.errors.length > 0) {
        console.log(`     Errors: ${result.errors.join(', ')}`);
      }
    });

    // Key findings summary
    console.log(`\n🔍 Key Findings:`);
    
    const nikeCompany = this.results.testResults.find(r => r.name === 'Find Nike Company');
    if (nikeCompany?.success) {
      console.log(`  ✅ Nike company profile successfully retrieved`);
      console.log(`     - Name: ${nikeCompany.data?.name}`);
      console.log(`     - Industry: ${nikeCompany.data?.industry}`);
      console.log(`     - Employees: ${nikeCompany.data?.employeeCount?.toLocaleString()}`);
    }

    const cfoNike = this.results.testResults.find(r => r.name === 'Find CFO at Nike');
    if (cfoNike?.success) {
      console.log(`  ✅ CFO at Nike successfully found`);
      console.log(`     - Name: ${cfoNike.data?.name}`);
      console.log(`     - Title: ${cfoNike.data?.title}`);
      console.log(`     - Department: ${cfoNike.data?.department}`);
    }

    const nicoleGraham = this.results.testResults.find(r => r.name === 'Find Nicole Graham');
    if (nicoleGraham?.success) {
      console.log(`  ✅ Nicole Graham successfully found`);
      console.log(`     - Name: ${nicoleGraham.data?.name}`);
      console.log(`     - LinkedIn: ${nicoleGraham.data?.linkedinUrl}`);
      console.log(`     - Current Company: ${nicoleGraham.data?.currentCompany}`);
    }

    const buyerGroupNike = this.results.testResults.find(r => r.name === 'Find Buyer Group at Nike');
    if (buyerGroupNike?.success) {
      console.log(`  ✅ Nike buyer group successfully mapped`);
      console.log(`     - Total Employees Found: ${buyerGroupNike.data?.totalEmployeesFound}`);
      console.log(`     - Buyer Group Size: ${buyerGroupNike.data?.buyerGroupSize}`);
      console.log(`     - Decision Makers: ${buyerGroupNike.data?.composition?.decision_maker || 0}`);
      console.log(`     - Champions: ${buyerGroupNike.data?.composition?.champion || 0}`);
    }

    const optimalBuyers = this.results.testResults.find(r => r.name === 'Find Optimal Buyer Groups');
    if (optimalBuyers?.success) {
      console.log(`  ✅ Optimal buyer groups successfully identified`);
      console.log(`     - Companies Analyzed: ${optimalBuyers.data?.totalCandidates}`);
      console.log(`     - Optimal Buyers Found: ${optimalBuyers.data?.optimalBuyerGroups}`);
      console.log(`     - Top Company: ${optimalBuyers.data?.topCompanies?.[0]?.name} (${optimalBuyers.data?.topCompanies?.[0]?.buyerReadinessScore}% readiness)`);
    }

    console.log(`\n🎯 Overall Assessment:`);
    if (this.results.passedTests === this.results.totalTests) {
      console.log(`  🎉 ALL TESTS PASSED! All enrichment scripts are working correctly.`);
      console.log(`  🚀 The system is ready for production use.`);
    } else if (this.results.passedTests >= this.results.totalTests * 0.8) {
      console.log(`  ⚠️  MOSTLY SUCCESSFUL: ${this.results.passedTests}/${this.results.totalTests} tests passed.`);
      console.log(`  🔧 Review failed tests and address issues before production.`);
    } else {
      console.log(`  ❌ SIGNIFICANT ISSUES: Only ${this.results.passedTests}/${this.results.totalTests} tests passed.`);
      console.log(`  🛠️  Major fixes needed before the system can be used.`);
    }

    console.log(`\n📅 Completed: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
  }
}

// Run master test if called directly
if (require.main === module) {
  const runner = new MasterTestRunner();
  runner.run()
    .then(() => {
      const success = runner.results.passedTests === runner.results.totalTests;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Master test runner failed:', error);
      process.exit(1);
    });
}

module.exports = MasterTestRunner;
