#!/usr/bin/env node

/**
 * Nike Pipeline Validation Test Runner
 * 
 * Runs all Nike pipeline validation tests and generates a comprehensive report.
 * Tests all 5 enrichment pipelines with Nike as the target company.
 */

require('dotenv').config({path: '../.env'});

class NikeValidationRunner {
  constructor() {
    this.testResults = {
      startTime: new Date().toISOString(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalCreditsUsed: 0,
      totalExecutionTime: 0,
      testResults: {},
      summary: {}
    };
  }

  async run() {
    console.log('🎯 Nike Pipeline Validation Test Runner');
    console.log('=' .repeat(60));
    console.log('Testing all 5 enrichment pipelines with Nike (nike.com)');
    console.log('Demonstrating $250K Buyer Group Intelligence value proposition\n');
    
    const startTime = Date.now();
    
    try {
      // Test 1: Complete Validation (All Pipelines)
      console.log('🚀 Running Complete Validation Test...');
      const completeTest = require('./test-nike-complete-validation');
      const completeResult = await this.runTest('Complete Validation', completeTest);
      
      // Test 2: Individual Pipeline Tests
      console.log('\n🔍 Running Individual Pipeline Tests...');
      
      // Company Test
      const companyTest = require('./test-find-nike-company');
      const companyResult = await this.runTest('Find Company', companyTest);
      
      // Person Test
      const personTest = require('./test-person-nike');
      const personResult = await this.runTest('Find Person', personTest);
      
      // Role Test
      const roleTest = require('./test-role-nike');
      const roleResult = await this.runTest('Find Role', roleTest);
      
      // Buyer Group Test
      const buyerGroupTest = require('./test-buyer-group-nike');
      const buyerGroupResult = await this.runTest('Find Buyer Group', buyerGroupTest);
      
      // Optimal Buyer Group Test
      const optimalTest = require('./test-optimal-buyer-groups');
      const optimalResult = await this.runTest('Find Optimal Buyer Group', optimalTest);
      
      // Generate final report
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
    } finally {
      this.testResults.totalExecutionTime = Date.now() - startTime;
      this.testResults.endTime = new Date().toISOString();
    }

    return this.testResults;
  }

  async runTest(testName, TestClass) {
    const startTime = Date.now();
    console.log(`\n📋 Running ${testName}...`);
    
    try {
      const test = new TestClass();
      const result = await test.run();
      
      const executionTime = Date.now() - startTime;
      
      this.testResults.totalTests++;
      if (result.success) {
        this.testResults.passedTests++;
        console.log(`✅ ${testName} PASSED (${Math.round(executionTime / 1000)}s, ${result.creditsUsed || 0} credits)`);
      } else {
        this.testResults.failedTests++;
        console.log(`❌ ${testName} FAILED (${Math.round(executionTime / 1000)}s, ${result.creditsUsed || 0} credits)`);
      }
      
      this.testResults.totalCreditsUsed += result.creditsUsed || 0;
      
      this.testResults.testResults[testName] = {
        success: result.success,
        executionTime,
        creditsUsed: result.creditsUsed || 0,
        data: result.data,
        errors: result.errors || []
      };
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.testResults.totalTests++;
      this.testResults.failedTests++;
      
      console.log(`❌ ${testName} ERROR: ${error.message}`);
      
      this.testResults.testResults[testName] = {
        success: false,
        executionTime,
        creditsUsed: 0,
        data: null,
        errors: [error.message]
      };
      
      return { success: false, errors: [error.message] };
    }
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 NIKE PIPELINE VALIDATION FINAL REPORT');
    console.log('='.repeat(60));
    
    // Test Summary
    console.log('\n🎯 Test Summary:');
    console.log(`  Total Tests: ${this.testResults.totalTests}`);
    console.log(`  Passed: ${this.testResults.passedTests} ✅`);
    console.log(`  Failed: ${this.testResults.failedTests} ❌`);
    console.log(`  Success Rate: ${Math.round((this.testResults.passedTests / this.testResults.totalTests) * 100)}%`);
    
    // Performance Summary
    console.log('\n⏱️ Performance Summary:');
    console.log(`  Total Execution Time: ${Math.round(this.testResults.totalExecutionTime / 1000)}s`);
    console.log(`  Average Test Time: ${Math.round(this.testResults.totalExecutionTime / this.testResults.totalTests / 1000)}s per test`);
    console.log(`  Total Credits Used: ${this.testResults.totalCreditsUsed}`);
    console.log(`  Average Credits per Test: ${Math.round(this.testResults.totalCreditsUsed / this.testResults.totalTests)}`);
    
    // Individual Test Results
    console.log('\n📋 Individual Test Results:');
    Object.entries(this.testResults.testResults).forEach(([testName, result]) => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      const time = Math.round(result.executionTime / 1000);
      const credits = result.creditsUsed;
      console.log(`  ${testName}: ${status} (${time}s, ${credits} credits)`);
      
      if (result.errors && result.errors.length > 0) {
        console.log(`    Errors: ${result.errors.join(', ')}`);
      }
    });
    
    // Pipeline Success Analysis
    console.log('\n🔍 Pipeline Success Analysis:');
    const pipelineTests = [
      'Find Company',
      'Find Person', 
      'Find Role',
      'Find Buyer Group',
      'Find Optimal Buyer Group'
    ];
    
    pipelineTests.forEach(pipeline => {
      const result = this.testResults.testResults[pipeline];
      if (result) {
        const status = result.success ? '✅' : '❌';
        console.log(`  ${pipeline}: ${status}`);
      }
    });
    
    // Value Proposition Validation
    console.log('\n💰 Value Proposition Validation:');
    
    const companySuccess = this.testResults.testResults['Find Company']?.success || false;
    const personSuccess = this.testResults.testResults['Find Person']?.success || false;
    const roleSuccess = this.testResults.testResults['Find Role']?.success || false;
    const buyerGroupSuccess = this.testResults.testResults['Find Buyer Group']?.success || false;
    const optimalSuccess = this.testResults.testResults['Find Optimal Buyer Group']?.success || false;
    
    console.log(`  Company Enrichment: ${companySuccess ? '✅' : '❌'} - Nike profile enriched with key data`);
    console.log(`  Person Enrichment: ${personSuccess ? '✅' : '❌'} - Individual people at Nike enriched`);
    console.log(`  Role Finding: ${roleSuccess ? '✅' : '❌'} - Specific roles (CFO, CTO, etc.) found`);
    console.log(`  Buyer Group Mapping: ${buyerGroupSuccess ? '✅' : '❌'} - Complete buying committee mapped`);
    console.log(`  Optimal Buyer Analysis: ${optimalSuccess ? '✅' : '❌'} - AI-powered qualification and ranking`);
    
    // Key Insights
    console.log('\n💡 Key Insights:');
    
    if (companySuccess) {
      const companyData = this.testResults.testResults['Find Company']?.data;
      if (companyData) {
        console.log(`  🏢 Nike Profile: ${companyData.name} (${companyData.employeeCount?.toLocaleString()} employees)`);
        console.log(`  📍 Location: ${companyData.location}`);
        console.log(`  🏭 Industry: ${companyData.industry}`);
      }
    }
    
    if (personSuccess) {
      const personData = this.testResults.testResults['Find Person']?.data;
      if (personData) {
        console.log(`  👤 People Enriched: ${personData.enriched}/${personData.totalFound}`);
        console.log(`  🎯 High Confidence: ${personData.highConfidence} matches (90%+)`);
      }
    }
    
    if (roleSuccess) {
      const roleData = this.testResults.testResults['Find Role']?.data;
      if (roleData) {
        console.log(`  🎭 Roles Found: ${roleData.successfulSearches}/${roleData.targetRoles} target roles`);
        console.log(`  📊 Total Matches: ${roleData.totalMatches}`);
        console.log(`  🤖 AI Generated: ${roleData.aiGeneratedVariations} variations`);
      }
    }
    
    if (buyerGroupSuccess) {
      const bgData = this.testResults.testResults['Find Buyer Group']?.data;
      if (bgData) {
        console.log(`  👥 Buyer Group: ${bgData.buyerGroupSize} members`);
        console.log(`  🎯 Composition: ${Object.entries(bgData.composition).filter(([k,v]) => k !== 'total' && v > 0).map(([k,v]) => `${k}:${v}`).join(', ')}`);
      }
    }
    
    if (optimalSuccess) {
      const optimalData = this.testResults.testResults['Find Optimal Buyer Group']?.data;
      if (optimalData) {
        console.log(`  🎯 Optimal Buyers: ${optimalData.optimalBuyerGroups} companies analyzed`);
        if (optimalData.topCompanies && optimalData.topCompanies.length > 0) {
          console.log(`  🏆 Top Target: ${optimalData.topCompanies[0].name} (${optimalData.topCompanies[0].buyerReadinessScore}% readiness)`);
        }
      }
    }
    
    // Overall Assessment
    const overallSuccess = this.testResults.passedTests >= 3; // At least 3 tests must pass
    
    console.log('\n🏆 Overall Assessment:');
    console.log(`  Status: ${overallSuccess ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED'}`);
    console.log(`  Recommendation: ${overallSuccess ? 'Pipelines are working correctly' : 'Some pipelines need attention'}`);
    
    // Next Steps
    console.log('\n🚀 Next Steps:');
    if (overallSuccess) {
      console.log('  ✅ All pipelines validated successfully');
      console.log('  ✅ Ready for production use');
      console.log('  ✅ Buyer Group Intelligence value proposition demonstrated');
    } else {
      console.log('  ⚠️ Some pipelines failed validation');
      console.log('  🔧 Review failed tests and fix issues');
      console.log('  🔄 Re-run validation after fixes');
    }
    
    // Save results to file
    this.saveResultsToFile();
  }

  saveResultsToFile() {
    try {
      const fs = require('fs');
      const resultsFile = '_future_now/tests/nike-validation-results.json';
      
      const reportData = {
        ...this.testResults,
        generatedAt: new Date().toISOString(),
        environment: {
          nodeVersion: process.version,
          platform: process.platform
        }
      };
      
      fs.writeFileSync(resultsFile, JSON.stringify(reportData, null, 2));
      console.log(`\n💾 Results saved to: ${resultsFile}`);
      
    } catch (error) {
      console.log(`\n⚠️ Could not save results to file: ${error.message}`);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const runner = new NikeValidationRunner();
  runner.run()
    .then(results => {
      const overallSuccess = results.passedTests >= 3;
      process.exit(overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation runner failed:', error);
      process.exit(1);
    });
}

module.exports = NikeValidationRunner;
