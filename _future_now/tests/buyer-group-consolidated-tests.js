/**
 * CONSOLIDATED BUYER GROUP TEST SUITE
 * 
 * Comprehensive tests for the consolidated buyer group implementation
 * Tests accuracy, consistency, and performance across different company sizes
 */

const { ConsolidatedBuyerGroupEngine } = require('../buyer-group-consolidated');
const fs = require('fs');
const path = require('path');

class ConsolidatedBuyerGroupTester {
  constructor() {
    this.testCompanies = [
      {
        name: 'Nike',
        website: 'nike.com',
        employeeCount: 75000,
        size: 'Enterprise',
        industry: 'Apparel & Fashion',
        expectedBuyerGroupSize: { min: 12, max: 18 }
      },
      {
        name: 'Salesforce',
        website: 'salesforce.com',
        employeeCount: 50000,
        size: 'Enterprise',
        industry: 'Software',
        expectedBuyerGroupSize: { min: 12, max: 18 }
      },
      {
        name: 'HubSpot',
        website: 'hubspot.com',
        employeeCount: 5000,
        size: 'Mid-market',
        industry: 'SaaS',
        expectedBuyerGroupSize: { min: 6, max: 12 }
      },
      {
        name: 'First Premier Bank',
        website: 'firstpremier.com',
        employeeCount: 500,
        size: 'SMB',
        industry: 'Banking',
        expectedBuyerGroupSize: { min: 4, max: 8 }
      }
    ];

    this.sellerProfiles = [
      {
        productName: 'Buyer Group Intelligence',
        solutionCategory: 'revenue_technology',
        targetMarket: 'enterprise',
        dealSize: 'enterprise'
      },
      {
        productName: 'Platform Integration',
        solutionCategory: 'platform',
        targetMarket: 'mid_market',
        dealSize: 'large'
      },
      {
        productName: 'Operations Optimization',
        solutionCategory: 'operations',
        targetMarket: 'smb',
        dealSize: 'medium'
      }
    ];

    this.results = {
      testRunId: `consolidated-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      companies: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        accuracyImprovements: 0,
        performanceMetrics: {}
      }
    };
  }

  /**
   * Run all consolidated tests
   */
  async runAllTests() {
    console.log('🎯 CONSOLIDATED BUYER GROUP TEST SUITE');
    console.log('========================================');
    console.log(`Testing ${this.testCompanies.length} companies with ${this.sellerProfiles.length} seller profiles\n`);

    for (const company of this.testCompanies) {
      console.log(`\n🏢 Testing: ${company.name} (${company.size})`);
      console.log('─'.repeat(50));
      
      const companyResults = await this.testCompany(company);
      this.results.companies[company.name] = companyResults;
      
      // Update summary
      this.results.summary.totalTests += companyResults.tests.length;
      this.results.summary.passedTests += companyResults.tests.filter(t => t.status === 'PASS').length;
      this.results.summary.failedTests += companyResults.tests.filter(t => t.status === 'FAIL').length;
    }

    this.generateReport();
    return this.results;
  }

  /**
   * Test single company with multiple seller profiles
   */
  async testCompany(company) {
    const companyResults = {
      company: company,
      tests: [],
      accuracyMetrics: {},
      performanceMetrics: {},
      recommendations: []
    };

    // Test with each seller profile
    for (const sellerProfile of this.sellerProfiles) {
      try {
        console.log(`  🔍 Testing with ${sellerProfile.productName} (${sellerProfile.solutionCategory})...`);
        
        const startTime = Date.now();
        const engine = new ConsolidatedBuyerGroupEngine();
        const result = await engine.discoverBuyerGroup(company.name, { sellerProfile });
        const processingTime = Date.now() - startTime;
        
        const testResult = {
          sellerProfile: sellerProfile.productName,
          status: result.success ? 'PASS' : 'FAIL',
          processingTime: processingTime,
          buyerGroupSize: result.buyerGroup.length,
          accuracy: result.accuracy,
          validation: result.validation,
          details: result
        };
        
        companyResults.tests.push(testResult);
        
        // Store accuracy metrics
        if (result.accuracy) {
          companyResults.accuracyMetrics[sellerProfile.productName] = result.accuracy;
        }
        
        // Store performance metrics
        companyResults.performanceMetrics[sellerProfile.productName] = {
          processingTime: processingTime,
          creditsUsed: result.creditsUsed,
          efficiency: result.buyerGroup.length / (processingTime / 1000) // members per second
        };
        
        console.log(`    ✅ ${result.success ? 'PASS' : 'FAIL'} - ${result.buyerGroup.length} members, ${processingTime}ms, ${result.accuracy?.overallScore?.toFixed(1) || 'N/A'}% accuracy`);
        
      } catch (error) {
        console.log(`    ❌ FAIL - ${error.message}`);
        companyResults.tests.push({
          sellerProfile: sellerProfile.productName,
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Analyze results for this company
    companyResults.recommendations = this.analyzeCompanyResults(company, companyResults);

    return companyResults;
  }

  /**
   * Analyze results for a company
   */
  analyzeCompanyResults(company, results) {
    const recommendations = [];
    
    // Check buyer group size appropriateness
    const avgSize = results.tests
      .filter(t => t.status === 'PASS')
      .reduce((sum, t) => sum + t.buyerGroupSize, 0) / results.tests.filter(t => t.status === 'PASS').length;
    
    if (avgSize < company.expectedBuyerGroupSize.min || avgSize > company.expectedBuyerGroupSize.max) {
      recommendations.push({
        type: 'SIZE_OPTIMIZATION',
        priority: 'HIGH',
        description: `Buyer group size ${avgSize.toFixed(1)} is not optimal for ${company.size} company`,
        details: `Expected ${company.expectedBuyerGroupSize.min}-${company.expectedBuyerGroupSize.max}, got ${avgSize.toFixed(1)}`
      });
    }
    
    // Check accuracy consistency
    const accuracyScores = Object.values(results.accuracyMetrics)
      .map(acc => acc.overallScore)
      .filter(score => score > 0);
    
    if (accuracyScores.length > 1) {
      const variance = Math.max(...accuracyScores) - Math.min(...accuracyScores);
      if (variance > 20) {
        recommendations.push({
          type: 'CONSISTENCY_IMPROVEMENT',
          priority: 'MEDIUM',
          description: 'Accuracy varies significantly across seller profiles',
          details: `Variance: ${variance.toFixed(1)}% (${Math.min(...accuracyScores).toFixed(1)}% - ${Math.max(...accuracyScores).toFixed(1)}%)`
        });
      }
    }
    
    // Check performance
    const avgProcessingTime = Object.values(results.performanceMetrics)
      .reduce((sum, perf) => sum + perf.processingTime, 0) / Object.keys(results.performanceMetrics).length;
    
    if (avgProcessingTime > 30000) { // 30 seconds
      recommendations.push({
        type: 'PERFORMANCE_OPTIMIZATION',
        priority: 'MEDIUM',
        description: 'Processing time is slower than expected',
        details: `Average: ${(avgProcessingTime / 1000).toFixed(1)}s (target: <30s)`
      });
    }
    
    return recommendations;
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    console.log('\n📊 CONSOLIDATED TEST RESULTS SUMMARY');
    console.log('=====================================');
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passedTests}`);
    console.log(`Failed: ${this.results.summary.failedTests}`);
    console.log(`Success Rate: ${((this.results.summary.passedTests / this.results.summary.totalTests) * 100).toFixed(1)}%`);

    // Company-specific results
    Object.entries(this.results.companies).forEach(([companyName, results]) => {
      console.log(`\n🏢 ${companyName} Results:`);
      console.log(`  Tests: ${results.tests.length}`);
      console.log(`  Pass Rate: ${(results.tests.filter(t => t.status === 'PASS').length / results.tests.length * 100).toFixed(1)}%`);
      console.log(`  Recommendations: ${results.recommendations.length}`);
      
      // Show accuracy metrics
      Object.entries(results.accuracyMetrics).forEach(([profile, accuracy]) => {
        console.log(`    ${profile}: ${accuracy.overallScore?.toFixed(1) || 'N/A'}% accuracy`);
      });
    });

    // Performance summary
    console.log('\n⚡ PERFORMANCE SUMMARY');
    console.log('======================');
    
    const allPerformanceMetrics = Object.values(this.results.companies)
      .flatMap(company => Object.values(company.performanceMetrics));
    
    if (allPerformanceMetrics.length > 0) {
      const avgProcessingTime = allPerformanceMetrics.reduce((sum, perf) => sum + perf.processingTime, 0) / allPerformanceMetrics.length;
      const avgEfficiency = allPerformanceMetrics.reduce((sum, perf) => sum + perf.efficiency, 0) / allPerformanceMetrics.length;
      
      console.log(`Average Processing Time: ${(avgProcessingTime / 1000).toFixed(1)}s`);
      console.log(`Average Efficiency: ${avgEfficiency.toFixed(2)} members/second`);
    }

    // Accuracy summary
    console.log('\n🎯 ACCURACY SUMMARY');
    console.log('===================');
    
    const allAccuracyMetrics = Object.values(this.results.companies)
      .flatMap(company => Object.values(company.accuracyMetrics))
      .filter(acc => acc.overallScore > 0);
    
    if (allAccuracyMetrics.length > 0) {
      const avgAccuracy = allAccuracyMetrics.reduce((sum, acc) => sum + acc.overallScore, 0) / allAccuracyMetrics.length;
      const minAccuracy = Math.min(...allAccuracyMetrics.map(acc => acc.overallScore));
      const maxAccuracy = Math.max(...allAccuracyMetrics.map(acc => acc.overallScore));
      
      console.log(`Average Accuracy: ${avgAccuracy.toFixed(1)}%`);
      console.log(`Accuracy Range: ${minAccuracy.toFixed(1)}% - ${maxAccuracy.toFixed(1)}%`);
      
      // Check if accuracy goals are met
      const accuracyGoals = {
        coreMemberAccuracy: 0.9,
        roleAssignmentAccuracy: 0.85,
        relevanceScore: 0.8,
        dataQuality: 0.95,
        overallScore: 0.9
      };
      
      console.log('\n🎯 ACCURACY GOALS CHECK');
      console.log('========================');
      
      Object.entries(accuracyGoals).forEach(([metric, goal]) => {
        const avgMetric = allAccuracyMetrics.reduce((sum, acc) => sum + (acc[metric] || 0), 0) / allAccuracyMetrics.length;
        const status = avgMetric >= goal ? '✅' : '❌';
        console.log(`${status} ${metric}: ${(avgMetric * 100).toFixed(1)}% (goal: ${(goal * 100).toFixed(1)}%)`);
      });
    }

    // Save detailed results
    const reportPath = path.join(__dirname, `consolidated-test-results-${this.results.testRunId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  }

  /**
   * Run specific test scenarios
   */
  async runSpecificTests() {
    console.log('🎯 RUNNING SPECIFIC TEST SCENARIOS');
    console.log('===================================');

    // Test 1: Enterprise company with enterprise product
    console.log('\n📋 Test 1: Enterprise + Enterprise Product');
    const nikeTest = await this.testSpecificScenario('Nike', 'revenue_technology');
    console.log(`   Result: ${nikeTest.success ? 'PASS' : 'FAIL'}`);
    console.log(`   Buyer Group Size: ${nikeTest.buyerGroup?.length || 'N/A'}`);
    console.log(`   Accuracy: ${nikeTest.accuracy?.overallScore?.toFixed(1) || 'N/A'}%`);

    // Test 2: Mid-market company with platform product
    console.log('\n📋 Test 2: Mid-market + Platform Product');
    const hubspotTest = await this.testSpecificScenario('HubSpot', 'platform');
    console.log(`   Result: ${hubspotTest.success ? 'PASS' : 'FAIL'}`);
    console.log(`   Buyer Group Size: ${hubspotTest.buyerGroup?.length || 'N/A'}`);
    console.log(`   Accuracy: ${hubspotTest.accuracy?.overallScore?.toFixed(1) || 'N/A'}%`);

    // Test 3: SMB company with operations product
    console.log('\n📋 Test 3: SMB + Operations Product');
    const firstPremierTest = await this.testSpecificScenario('First Premier Bank', 'operations');
    console.log(`   Result: ${firstPremierTest.success ? 'PASS' : 'FAIL'}`);
    console.log(`   Buyer Group Size: ${firstPremierTest.buyerGroup?.length || 'N/A'}`);
    console.log(`   Accuracy: ${firstPremierTest.accuracy?.overallScore?.toFixed(1) || 'N/A'}%`);
  }

  /**
   * Test specific scenario
   */
  async testSpecificScenario(companyName, solutionCategory) {
    const company = this.testCompanies.find(c => c.name === companyName);
    const sellerProfile = this.sellerProfiles.find(s => s.solutionCategory === solutionCategory);
    
    if (!company || !sellerProfile) {
      throw new Error(`Company ${companyName} or solution category ${solutionCategory} not found`);
    }

    try {
      const engine = new ConsolidatedBuyerGroupEngine();
      const result = await engine.discoverBuyerGroup(company.name, { sellerProfile });
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export for use in other modules
module.exports = { ConsolidatedBuyerGroupTester };

// Run if called directly
if (require.main === module) {
  const tester = new ConsolidatedBuyerGroupTester();
  
  // Check if specific tests requested
  if (process.argv.includes('--specific')) {
    tester.runSpecificTests().catch(console.error);
  } else {
    tester.runAllTests().catch(console.error);
  }
}
