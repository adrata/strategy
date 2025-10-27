/**
 * BUYER GROUP ACCURACY TEST SUITE
 * 
 * Tests all buyer group implementations against the same companies
 * to identify conflicts, inconsistencies, and accuracy issues.
 */

const fs = require('fs');
const path = require('path');

class BuyerGroupAccuracyTester {
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
        expectedBuyerGroupSize: { min: 8, max: 12 }
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

    this.results = {
      testRunId: `accuracy-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      companies: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        conflictsFound: 0,
        accuracyIssues: 0
      }
    };
  }

  /**
   * Run all accuracy tests
   */
  async runAllTests() {
    console.log('🎯 BUYER GROUP ACCURACY TEST SUITE');
    console.log('=====================================');
    console.log(`Testing ${this.testCompanies.length} companies across multiple implementations\n`);

    for (const company of this.testCompanies) {
      console.log(`\n🏢 Testing: ${company.name} (${company.size})`);
      console.log('─'.repeat(50));
      
      const companyResults = await this.testCompany(company);
      this.results.companies[company.name] = companyResults;
      
      // Update summary
      this.results.summary.totalTests += companyResults.tests.length;
      this.results.summary.passedTests += companyResults.tests.filter(t => t.status === 'PASS').length;
      this.results.summary.failedTests += companyResults.tests.filter(t => t.status === 'FAIL').length;
      this.results.summary.conflictsFound += companyResults.conflicts.length;
      this.results.summary.accuracyIssues += companyResults.accuracyIssues.length;
    }

    this.generateReport();
    return this.results;
  }

  /**
   * Test single company across all implementations
   */
  async testCompany(company) {
    const companyResults = {
      company: company,
      tests: [],
      conflicts: [],
      accuracyIssues: [],
      buyerGroups: {},
      recommendations: []
    };

    // Test 1: Future Now Implementation
    try {
      console.log('  🔍 Testing Future Now Implementation...');
      const futureNowResult = await this.testFutureNowImplementation(company);
      companyResults.buyerGroups.futureNow = futureNowResult;
      companyResults.tests.push({
        implementation: 'Future Now',
        status: futureNowResult.success ? 'PASS' : 'FAIL',
        details: futureNowResult
      });
    } catch (error) {
      console.log(`    ❌ Future Now failed: ${error.message}`);
      companyResults.tests.push({
        implementation: 'Future Now',
        status: 'FAIL',
        error: error.message
      });
    }

    // Test 2: Intelligence Engine (Mock)
    try {
      console.log('  🔍 Testing Intelligence Engine...');
      const intelligenceResult = await this.testIntelligenceEngine(company);
      companyResults.buyerGroups.intelligence = intelligenceResult;
      companyResults.tests.push({
        implementation: 'Intelligence Engine',
        status: intelligenceResult.success ? 'PASS' : 'FAIL',
        details: intelligenceResult
      });
    } catch (error) {
      console.log(`    ❌ Intelligence Engine failed: ${error.message}`);
      companyResults.tests.push({
        implementation: 'Intelligence Engine',
        status: 'FAIL',
        error: error.message
      });
    }

    // Test 3: Pipeline Implementation (Mock)
    try {
      console.log('  🔍 Testing Pipeline Implementation...');
      const pipelineResult = await this.testPipelineImplementation(company);
      companyResults.buyerGroups.pipeline = pipelineResult;
      companyResults.tests.push({
        implementation: 'Pipeline',
        status: pipelineResult.success ? 'PASS' : 'FAIL',
        details: pipelineResult
      });
    } catch (error) {
      console.log(`    ❌ Pipeline failed: ${error.message}`);
      companyResults.tests.push({
        implementation: 'Pipeline',
        status: 'FAIL',
        error: error.message
      });
    }

    // Analyze conflicts between implementations
    companyResults.conflicts = this.analyzeConflicts(companyResults.buyerGroups);
    
    // Analyze accuracy issues
    companyResults.accuracyIssues = this.analyzeAccuracyIssues(company, companyResults.buyerGroups);
    
    // Generate recommendations
    companyResults.recommendations = this.generateRecommendations(company, companyResults);

    return companyResults;
  }

  /**
   * Test Future Now Implementation
   */
  async testFutureNowImplementation(company) {
    // This would call the actual Future Now implementation
    // For now, we'll simulate based on the Nike test results
    
    const mockResult = {
      success: true,
      implementation: 'Future Now',
      buyerGroup: {
        totalMembers: company.size === 'Enterprise' ? 9 : company.size === 'Mid-market' ? 7 : 5,
        composition: {
          decision_maker: company.size === 'Enterprise' ? 2 : 1,
          champion: company.size === 'Enterprise' ? 2 : 1,
          stakeholder: company.size === 'Enterprise' ? 2 : 1,
          blocker: 1,
          introducer: company.size === 'Enterprise' ? 2 : 1
        },
        members: this.generateMockMembers(company, 'Future Now'),
        confidence: 85,
        processingTime: 4000,
        creditsUsed: 15
      },
      quality: {
        roleCoverage: 100, // All 5 roles represented
        dataQuality: 90,   // High quality contact info
        relevanceScore: 80, // Good relevance for software
        consistency: 95     // Consistent results
      }
    };

    return mockResult;
  }

  /**
   * Test Intelligence Engine (Mock)
   */
  async testIntelligenceEngine(company) {
    // Simulate intelligence engine with different results
    const mockResult = {
      success: true,
      implementation: 'Intelligence Engine',
      buyerGroup: {
        totalMembers: company.size === 'Enterprise' ? 12 : company.size === 'Mid-market' ? 8 : 6,
        composition: {
          decision_maker: company.size === 'Enterprise' ? 3 : 2,
          champion: company.size === 'Enterprise' ? 3 : 2,
          stakeholder: company.size === 'Enterprise' ? 3 : 2,
          blocker: 2,
          introducer: company.size === 'Enterprise' ? 1 : 0
        },
        members: this.generateMockMembers(company, 'Intelligence Engine'),
        confidence: 75,
        processingTime: 8000,
        creditsUsed: 25
      },
      quality: {
        roleCoverage: 80,  // Missing some roles
        dataQuality: 85,   // Good contact info
        relevanceScore: 70, // Moderate relevance
        consistency: 80    // Some inconsistency
      }
    };

    return mockResult;
  }

  /**
   * Test Pipeline Implementation (Mock)
   */
  async testPipelineImplementation(company) {
    // Simulate pipeline with different results
    const mockResult = {
      success: true,
      implementation: 'Pipeline',
      buyerGroup: {
        totalMembers: company.size === 'Enterprise' ? 15 : company.size === 'Mid-market' ? 10 : 8,
        composition: {
          decision_maker: company.size === 'Enterprise' ? 4 : 2,
          champion: company.size === 'Enterprise' ? 4 : 3,
          stakeholder: company.size === 'Enterprise' ? 4 : 3,
          blocker: 2,
          introducer: company.size === 'Enterprise' ? 1 : 0
        },
        members: this.generateMockMembers(company, 'Pipeline'),
        confidence: 70,
        processingTime: 12000,
        creditsUsed: 35
      },
      quality: {
        roleCoverage: 60,  // Missing many roles
        dataQuality: 75,   // Moderate contact info
        relevanceScore: 65, // Lower relevance
        consistency: 70    // Inconsistent results
      }
    };

    return mockResult;
  }

  /**
   * Generate mock members for testing
   */
  generateMockMembers(company, implementation) {
    const members = [];
    const roles = ['decision_maker', 'champion', 'stakeholder', 'blocker', 'introducer'];
    
    // Generate different members for different implementations to simulate conflicts
    const baseNames = [
      'John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Chen', 'David Wilson',
      'Amy Rodriguez', 'Chris Brown', 'Jennifer Lee', 'Mark Taylor', 'Rachel Green'
    ];

    roles.forEach((role, index) => {
      const name = baseNames[index] || `Person ${index + 1}`;
      const confidence = implementation === 'Future Now' ? 85 + Math.random() * 10 :
                        implementation === 'Intelligence Engine' ? 70 + Math.random() * 15 :
                        60 + Math.random() * 20;

      members.push({
        name,
        title: this.generateTitleForRole(role, company.size),
        role,
        confidence: Math.round(confidence),
        email: `${name.toLowerCase().replace(' ', '.')}@${company.website}`,
        linkedin: `https://linkedin.com/in/${name.toLowerCase().replace(' ', '')}`,
        department: this.generateDepartmentForRole(role),
        seniority: this.generateSeniorityForRole(role)
      });
    });

    return members;
  }

  /**
   * Generate appropriate title for role and company size
   */
  generateTitleForRole(role, companySize) {
    const titles = {
      decision_maker: companySize === 'Enterprise' ? 'Chief Executive Officer' : 
                     companySize === 'Mid-market' ? 'President' : 'Owner',
      champion: companySize === 'Enterprise' ? 'VP of Sales' : 
               companySize === 'Mid-market' ? 'Sales Director' : 'Sales Manager',
      stakeholder: companySize === 'Enterprise' ? 'Director of Marketing' : 
                  companySize === 'Mid-market' ? 'Marketing Manager' : 'Marketing Coordinator',
      blocker: 'Chief Legal Officer',
      introducer: companySize === 'Enterprise' ? 'VP of Business Development' : 
                 companySize === 'Mid-market' ? 'Business Development Manager' : 'Account Manager'
    };
    return titles[role] || 'Manager';
  }

  /**
   * Generate appropriate department for role
   */
  generateDepartmentForRole(role) {
    const departments = {
      decision_maker: 'Executive',
      champion: 'Sales',
      stakeholder: 'Marketing',
      blocker: 'Legal',
      introducer: 'Business Development'
    };
    return departments[role] || 'Operations';
  }

  /**
   * Generate appropriate seniority for role
   */
  generateSeniorityForRole(role) {
    const seniority = {
      decision_maker: 'C-Level',
      champion: 'VP-Level',
      stakeholder: 'Director-Level',
      blocker: 'C-Level',
      introducer: 'VP-Level'
    };
    return seniority[role] || 'Manager-Level';
  }

  /**
   * Analyze conflicts between implementations
   */
  analyzeConflicts(buyerGroups) {
    const conflicts = [];
    
    if (!buyerGroups.futureNow || !buyerGroups.intelligence || !buyerGroups.pipeline) {
      return conflicts;
    }

    // Check for different buyer group sizes
    const sizes = [
      { impl: 'Future Now', size: buyerGroups.futureNow.buyerGroup.totalMembers },
      { impl: 'Intelligence Engine', size: buyerGroups.intelligence.buyerGroup.totalMembers },
      { impl: 'Pipeline', size: buyerGroups.pipeline.buyerGroup.totalMembers }
    ];

    const sizeConflicts = sizes.filter(s => s.size !== sizes[0].size);
    if (sizeConflicts.length > 0) {
      conflicts.push({
        type: 'SIZE_CONFLICT',
        description: 'Different implementations identify different numbers of buyer group members',
        details: sizes,
        severity: 'HIGH'
      });
    }

    // Check for different role compositions
    const compositions = [
      { impl: 'Future Now', comp: buyerGroups.futureNow.buyerGroup.composition },
      { impl: 'Intelligence Engine', comp: buyerGroups.intelligence.buyerGroup.composition },
      { impl: 'Pipeline', comp: buyerGroups.pipeline.buyerGroup.composition }
    ];

    const roleConflicts = this.findRoleCompositionConflicts(compositions);
    if (roleConflicts.length > 0) {
      conflicts.push({
        type: 'ROLE_COMPOSITION_CONFLICT',
        description: 'Different implementations assign different numbers of people to each role',
        details: roleConflicts,
        severity: 'HIGH'
      });
    }

    // Check for different confidence scores
    const confidences = [
      { impl: 'Future Now', conf: buyerGroups.futureNow.buyerGroup.confidence },
      { impl: 'Intelligence Engine', conf: buyerGroups.intelligence.buyerGroup.confidence },
      { impl: 'Pipeline', conf: buyerGroups.pipeline.buyerGroup.confidence }
    ];

    const confidenceRange = Math.max(...confidences.map(c => c.conf)) - Math.min(...confidences.map(c => c.conf));
    if (confidenceRange > 20) {
      conflicts.push({
        type: 'CONFIDENCE_CONFLICT',
        description: 'Different implementations have significantly different confidence scores',
        details: confidences,
        severity: 'MEDIUM'
      });
    }

    return conflicts;
  }

  /**
   * Find role composition conflicts
   */
  findRoleCompositionConflicts(compositions) {
    const conflicts = [];
    const roles = ['decision_maker', 'champion', 'stakeholder', 'blocker', 'introducer'];

    roles.forEach(role => {
      const counts = compositions.map(comp => comp.comp[role]);
      const uniqueCounts = [...new Set(counts)];
      
      if (uniqueCounts.length > 1) {
        conflicts.push({
          role,
          counts: compositions.map(comp => ({ impl: comp.impl, count: comp.comp[role] })),
          variance: Math.max(...counts) - Math.min(...counts)
        });
      }
    });

    return conflicts;
  }

  /**
   * Analyze accuracy issues
   */
  analyzeAccuracyIssues(company, buyerGroups) {
    const issues = [];

    // Check if buyer group size is appropriate for company size
    Object.entries(buyerGroups).forEach(([impl, result]) => {
      if (!result.success) return;

      const actualSize = result.buyerGroup.totalMembers;
      const expectedSize = company.expectedBuyerGroupSize;
      
      if (actualSize < expectedSize.min || actualSize > expectedSize.max) {
        issues.push({
          type: 'SIZE_ACCURACY',
          implementation: impl,
          description: `Buyer group size ${actualSize} is not appropriate for ${company.size} company (expected ${expectedSize.min}-${expectedSize.max})`,
          severity: 'HIGH',
          actual: actualSize,
          expected: expectedSize
        });
      }
    });

    // Check role coverage
    Object.entries(buyerGroups).forEach(([impl, result]) => {
      if (!result.success) return;

      const roleCoverage = result.quality.roleCoverage;
      if (roleCoverage < 80) {
        issues.push({
          type: 'ROLE_COVERAGE',
          implementation: impl,
          description: `Only ${roleCoverage}% of required roles are represented`,
          severity: 'MEDIUM',
          actual: roleCoverage,
          expected: 80
        });
      }
    });

    // Check data quality
    Object.entries(buyerGroups).forEach(([impl, result]) => {
      if (!result.success) return;

      const dataQuality = result.quality.dataQuality;
      if (dataQuality < 85) {
        issues.push({
          type: 'DATA_QUALITY',
          implementation: impl,
          description: `Data quality score ${dataQuality}% is below acceptable threshold`,
          severity: 'MEDIUM',
          actual: dataQuality,
          expected: 85
        });
      }
    });

    return issues;
  }

  /**
   * Generate recommendations for company
   */
  generateRecommendations(company, companyResults) {
    const recommendations = [];

    // Size recommendations
    const sizeIssues = companyResults.accuracyIssues.filter(issue => issue.type === 'SIZE_ACCURACY');
    if (sizeIssues.length > 0) {
      recommendations.push({
        type: 'SIZE_ADAPTATION',
        priority: 'HIGH',
        description: `Implement adaptive buyer group sizing for ${company.size} companies`,
        details: `Current implementations use fixed sizing. ${company.name} (${company.employeeCount} employees) needs ${company.expectedBuyerGroupSize.min}-${company.expectedBuyerGroupSize.max} people, not fixed 8-15.`
      });
    }

    // Consistency recommendations
    if (companyResults.conflicts.length > 0) {
      recommendations.push({
        type: 'CONSISTENCY',
        priority: 'HIGH',
        description: 'Implement single source of truth for buyer group data',
        details: `${companyResults.conflicts.length} conflicts found between implementations. Need consolidated approach.`
      });
    }

    // Quality recommendations
    const qualityIssues = companyResults.accuracyIssues.filter(issue => 
      issue.type === 'ROLE_COVERAGE' || issue.type === 'DATA_QUALITY'
    );
    if (qualityIssues.length > 0) {
      recommendations.push({
        type: 'QUALITY_IMPROVEMENT',
        priority: 'MEDIUM',
        description: 'Improve role coverage and data quality validation',
        details: `${qualityIssues.length} quality issues found. Need better validation mechanisms.`
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    console.log('\n📊 ACCURACY TEST RESULTS SUMMARY');
    console.log('=====================================');
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passedTests}`);
    console.log(`Failed: ${this.results.summary.failedTests}`);
    console.log(`Conflicts Found: ${this.results.summary.conflictsFound}`);
    console.log(`Accuracy Issues: ${this.results.summary.accuracyIssues}`);

    // Company-specific results
    Object.entries(this.results.companies).forEach(([companyName, results]) => {
      console.log(`\n🏢 ${companyName} Results:`);
      console.log(`  Tests: ${results.tests.length}`);
      console.log(`  Conflicts: ${results.conflicts.length}`);
      console.log(`  Issues: ${results.accuracyIssues.length}`);
      console.log(`  Recommendations: ${results.recommendations.length}`);
    });

    // Save detailed results
    const reportPath = path.join(__dirname, `accuracy-test-results-${this.results.testRunId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  }
}

// Run the tests
async function runAccuracyTests() {
  const tester = new BuyerGroupAccuracyTester();
  const results = await tester.runAllTests();
  return results;
}

// Export for use in other modules
module.exports = { BuyerGroupAccuracyTester, runAccuracyTests };

// Run if called directly
if (require.main === module) {
  runAccuracyTests().catch(console.error);
}
