#!/usr/bin/env node

/**
 * AI Panel QA Suite Runner
 * 
 * Master script that runs all AI data access and personalization tests.
 * Use this to verify the AI panel can access all data before production deployment.
 * 
 * Usage:
 *   node scripts/testing/run-ai-qa-suite.js [workspaceId]
 *   
 * Example:
 *   node scripts/testing/run-ai-qa-suite.js 01K1VBYXHD0J895XAN0HGFBKJP
 * 
 * Tests included:
 * 1. Data Access Verification - Tests all record types have accessible fields
 * 2. Personalization Tests - Verifies AI uses actual record data in responses
 * 3. Workspace-Specific QA - Victoria test scenario for TOP Engineering
 * 4. Battle Tests - General resilience and edge case handling
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Import test modules
const { AIDataAccessVerifier } = require('./verify-ai-data-access');
const { AIPersonalizationTester } = require('./ai-personalization-tests');
const { TopEngineeringQATester } = require('./qa-top-engineering');
const { AIRightPanelBattleTester } = require('./battle-test-ai-panel');

// Configuration
const WORKSPACE_ID = process.argv[2] || process.env.WORKSPACE_ID || '01K1VBYXHD0J895XAN0HGFBKJP';

// Test suite results
const suiteResults = {
  dataAccess: null,
  personalization: null,
  workspaceQA: null,
  battleTests: null
};

async function runDataAccessTests() {
  console.log('\n' + '='.repeat(80));
  console.log('   TEST SUITE 1: DATA ACCESS VERIFICATION');
  console.log('='.repeat(80));
  
  const verifier = new AIDataAccessVerifier();
  await verifier.runAllTests(WORKSPACE_ID);
  
  const passed = verifier.results.filter(r => r.passed).length;
  const total = verifier.results.length;
  
  suiteResults.dataAccess = {
    passed,
    failed: total - passed,
    total,
    passRate: total > 0 ? Math.round((passed / total) * 100) : 0
  };
  
  return suiteResults.dataAccess;
}

async function runPersonalizationTests() {
  console.log('\n' + '='.repeat(80));
  console.log('   TEST SUITE 2: PERSONALIZATION VERIFICATION');
  console.log('='.repeat(80));
  
  const tester = new AIPersonalizationTester();
  await tester.runAllTests(WORKSPACE_ID);
  
  const passed = tester.results.filter(r => r.passed).length;
  const total = tester.results.length;
  
  suiteResults.personalization = {
    passed,
    failed: total - passed,
    total,
    passRate: total > 0 ? Math.round((passed / total) * 100) : 0
  };
  
  return suiteResults.personalization;
}

async function runWorkspaceQATests() {
  console.log('\n' + '='.repeat(80));
  console.log('   TEST SUITE 3: WORKSPACE-SPECIFIC QA (Victoria Scenario)');
  console.log('='.repeat(80));
  
  const tester = new TopEngineeringQATester();
  const results = await tester.runAllTests();
  
  if (results && results.summary) {
    suiteResults.workspaceQA = {
      passed: results.summary.totalPassed,
      failed: results.summary.totalFailed,
      total: results.summary.total,
      passRate: results.summary.passRate
    };
  } else {
    suiteResults.workspaceQA = {
      passed: 0,
      failed: 0,
      total: 0,
      passRate: 0
    };
  }
  
  return suiteResults.workspaceQA;
}

async function runBattleTests() {
  console.log('\n' + '='.repeat(80));
  console.log('   TEST SUITE 4: BATTLE TESTS (Resilience & Edge Cases)');
  console.log('='.repeat(80));
  
  const tester = new AIRightPanelBattleTester(WORKSPACE_ID);
  const results = await tester.runAllTests();
  
  if (results) {
    suiteResults.battleTests = {
      passed: results.passed,
      failed: results.failed,
      total: results.totalTests,
      passRate: Math.round(results.successRate)
    };
  } else {
    suiteResults.battleTests = {
      passed: tester.passedTests,
      failed: tester.failedTests,
      total: tester.totalTests,
      passRate: tester.totalTests > 0 
        ? Math.round((tester.passedTests / tester.totalTests) * 100) 
        : 0
    };
  }
  
  return suiteResults.battleTests;
}

function printFinalSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('   AI PANEL QA SUITE - FINAL SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\nTest Suite Results:');
  console.log('-'.repeat(60));
  
  const suites = [
    { name: 'Data Access Verification', key: 'dataAccess' },
    { name: 'Personalization Tests', key: 'personalization' },
    { name: 'Workspace QA (Victoria)', key: 'workspaceQA' },
    { name: 'Battle Tests', key: 'battleTests' }
  ];
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;
  
  for (const suite of suites) {
    const result = suiteResults[suite.key];
    if (result) {
      const status = result.passRate >= 80 ? '[OK]' : result.passRate >= 60 ? '[!!]' : '[X]';
      console.log(`${status} ${suite.name}:`);
      console.log(`    Passed: ${result.passed}/${result.total} (${result.passRate}%)`);
      
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalTests += result.total;
    } else {
      console.log(`[--] ${suite.name}: Not run`);
    }
  }
  
  console.log('-'.repeat(60));
  
  const overallPassRate = totalTests > 0 
    ? Math.round((totalPassed / totalTests) * 100) 
    : 0;
  
  console.log(`\nOVERALL RESULTS:`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Passed: ${totalPassed}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`  Pass Rate: ${overallPassRate}%`);
  
  console.log('\n' + '='.repeat(80));
  
  // Final verdict
  if (overallPassRate >= 90) {
    console.log('   QA STATUS: READY FOR PRODUCTION');
    console.log('   AI data access is fully verified across all record types.');
    console.log('='.repeat(80));
    return 0;
  } else if (overallPassRate >= 80) {
    console.log('   QA STATUS: MOSTLY READY');
    console.log('   Minor issues detected - review failures before deployment.');
    console.log('='.repeat(80));
    return 0;
  } else if (overallPassRate >= 70) {
    console.log('   QA STATUS: NEEDS ATTENTION');
    console.log('   Several issues need resolution before production.');
    console.log('='.repeat(80));
    return 1;
  } else {
    console.log('   QA STATUS: NOT READY');
    console.log('   Major issues must be resolved before deployment.');
    console.log('='.repeat(80));
    return 1;
  }
}

async function main() {
  console.log('================================================');
  console.log('   AI PANEL COMPREHENSIVE QA SUITE');
  console.log('================================================');
  console.log(`\nWorkspace ID: ${WORKSPACE_ID}`);
  console.log(`Start Time: ${new Date().toISOString()}`);
  console.log('\nThis suite verifies the AI panel can access all data');
  console.log('and generates personalized responses for all record types.\n');
  
  try {
    // Run all test suites
    await runDataAccessTests();
    await runPersonalizationTests();
    await runWorkspaceQATests();
    
    // Note: Battle tests require the API to be running
    // Uncomment the following line to include battle tests:
    // await runBattleTests();
    
    // Print final summary and get exit code
    const exitCode = printFinalSummary();
    
    console.log(`\nEnd Time: ${new Date().toISOString()}`);
    
    return exitCode;
    
  } catch (error) {
    console.error('\nFATAL ERROR during QA suite execution:', error);
    return 1;
  }
}

// Run if executed directly
if (require.main === module) {
  main()
    .then((exitCode) => {
      prisma.$disconnect();
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { main, suiteResults };

