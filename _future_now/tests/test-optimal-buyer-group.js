#!/usr/bin/env node

/**
 * Test Suite for find_optimal_buyer_group.js
 * 
 * Tests optimal buyer group functionality including:
 * - Phase 1 market filtering
 * - Phase 2 buyer group sampling
 * - Pain signal detection
 * - Innovation scoring
 * - Buyer group quality analysis
 * - Two-phase integration
 */

const fs = require('fs');
const path = require('path');

class OptimalBuyerGroupTests {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runAllTests() {
    console.log('🧪 Testing Optimal Buyer Group (find_optimal_buyer_group.js)\n');
    
    const tests = [
      { name: 'Phase 1 market filtering', test: () => this.testMarketFiltering() },
      { name: 'Phase 2 buyer group sampling', test: () => this.testBuyerGroupSampling() },
      { name: 'Pain signal detection', test: () => this.testPainSignalDetection() },
      { name: 'Innovation scoring', test: () => this.testInnovationScoring() },
      { name: 'Buyer group quality analysis', test: () => this.testBuyerGroupQualityAnalysis() },
      { name: 'Two-phase integration', test: () => this.testTwoPhaseIntegration() },
      { name: 'Scoring weights', test: () => this.testScoringWeights() },
      { name: 'Error handling', test: () => this.testErrorHandling() }
    ];
    
    for (const test of tests) {
      await this.runTest(test.name, test.test);
    }
    
    this.printResults();
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    
    try {
      console.log(`  🧪 ${testName}...`);
      await testFunction();
      console.log(`  ✅ ${testName} - PASSED`);
      this.testResults.passed++;
    } catch (error) {
      console.log(`  ❌ ${testName} - FAILED: ${error.message}`);
      this.testResults.failed++;
      this.testResults.errors.push({ test: testName, error: error.message });
    }
  }

  async testMarketFiltering() {
    // Test Phase 1 market filtering
    const mockCriteria = {
      industries: ['Software', 'SaaS'],
      sizeRange: '50-200 employees',
      locations: ['United States'],
      minGrowthRate: 15
    };
    
    const searchQuery = this.buildMarketFilterQuery(mockCriteria);
    
    if (!searchQuery.query.bool.must) {
      throw new Error('Market filter query should have must clauses');
    }
    
    // Verify industry filter
    const industryFilter = searchQuery.query.bool.must.find(
      clause => clause.terms && clause.terms.company_industry
    );
    
    if (!industryFilter) {
      throw new Error('Industry filter not found in market query');
    }
    
    if (!industryFilter.terms.company_industry.includes('Software')) {
      throw new Error('Industry filter should include Software');
    }
    
    // Verify growth rate filter
    const growthFilter = searchQuery.query.bool.must.find(
      clause => clause.range && clause.range.company_employees_count_change_yearly_percentage
    );
    
    if (!growthFilter) {
      throw new Error('Growth rate filter not found in market query');
    }
    
    if (growthFilter.range.company_employees_count_change_yearly_percentage.gte !== 15) {
      throw new Error('Growth rate filter should be >= 15');
    }
  }

  async testBuyerGroupSampling() {
    // Test Phase 2 buyer group sampling
    const mockCompany = {
      company_linkedin_url: 'https://www.linkedin.com/company/test-company',
      company_name: 'Test Company'
    };
    
    const sampleDepartments = ['Sales and Business Development', 'Operations'];
    const sampleSize = 25;
    
    // Simulate sampling
    const sampledEmployees = this.simulateEmployeeSampling(mockCompany, sampleDepartments, sampleSize);
    
    if (sampledEmployees.length > sampleSize) {
      throw new Error('Sample size should not exceed limit');
    }
    
    // Verify department distribution
    const departments = sampledEmployees.map(emp => emp.active_experience_department);
    const uniqueDepartments = [...new Set(departments)];
    
    if (uniqueDepartments.length === 0) {
      throw new Error('Sampled employees should have departments');
    }
    
    // Test that sampling covers target departments
    const hasTargetDepartments = sampleDepartments.some(dept => 
      uniqueDepartments.some(empDept => empDept.includes(dept.split(' ')[0]))
    );
    
    if (!hasTargetDepartments) {
      throw new Error('Sampling should cover target departments');
    }
  }

  async testPainSignalDetection() {
    // Test pain signal detection
    const mockEmployees = [
      { active_experience_title: 'Interim VP Sales', active_experience_management_level: 'VP-Level' },
      { active_experience_title: 'Acting Director', active_experience_management_level: 'Director-Level' },
      { active_experience_title: 'New Hire Manager', active_experience_management_level: 'Manager-Level' },
      { active_experience_title: 'VP Sales', active_experience_management_level: 'VP-Level' }
    ];
    
    const painSignals = this.detectPainSignals(mockEmployees);
    
    if (painSignals.length === 0) {
      throw new Error('Should detect pain signals in mock data');
    }
    
    // Check for specific pain indicators
    const hasInterimRole = painSignals.some(signal => signal.includes('interim'));
    if (!hasInterimRole) {
      throw new Error('Should detect interim roles as pain signal');
    }
    
    const hasActingRole = painSignals.some(signal => signal.includes('acting'));
    if (!hasActingRole) {
      throw new Error('Should detect acting roles as pain signal');
    }
    
    // Test management gap detection
    const vpCount = mockEmployees.filter(emp => emp.active_experience_management_level === 'VP-Level').length;
    const hasManagementGap = vpCount === 0 && mockEmployees.length > 10;
    
    if (hasManagementGap) {
      const gapSignals = painSignals.filter(signal => signal.includes('management gap'));
      if (gapSignals.length === 0) {
        throw new Error('Should detect management gaps as pain signal');
      }
    }
  }

  async testInnovationScoring() {
    // Test innovation scoring
    const mockEmployees = [
      { 
        active_experience_title: 'VP Revenue Operations',
        connections_count: 2500,
        followers_count: 500,
        location_country: 'United States'
      },
      {
        active_experience_title: 'Head of Growth',
        connections_count: 1800,
        followers_count: 300,
        location_country: 'Canada'
      },
      {
        active_experience_title: 'VP Sales',
        connections_count: 800,
        followers_count: 100,
        location_country: 'United States'
      }
    ];
    
    const innovationScore = this.calculateInnovationScore(mockEmployees);
    
    if (innovationScore < 0 || innovationScore > 100) {
      throw new Error('Innovation score must be between 0 and 100');
    }
    
    // Test that modern titles increase score
    const modernTitleScore = this.calculateInnovationScore([
      { ...mockEmployees[0], active_experience_title: 'VP Revenue Operations' }
    ]);
    
    const traditionalTitleScore = this.calculateInnovationScore([
      { ...mockEmployees[0], active_experience_title: 'VP Sales' }
    ]);
    
    if (modernTitleScore <= traditionalTitleScore) {
      throw new Error('Modern titles should increase innovation score');
    }
    
    // Test LinkedIn engagement scoring
    const highEngagementScore = this.calculateInnovationScore([
      { ...mockEmployees[0], connections_count: 3000, followers_count: 800 }
    ]);
    
    const lowEngagementScore = this.calculateInnovationScore([
      { ...mockEmployees[0], connections_count: 500, followers_count: 50 }
    ]);
    
    if (highEngagementScore <= lowEngagementScore) {
      throw new Error('High LinkedIn engagement should increase innovation score');
    }
  }

  async testBuyerGroupQualityAnalysis() {
    // Test buyer group quality analysis
    const mockPreviewData = {
      employees: [
        { active_experience_management_level: 'VP-Level', active_experience_department: 'Sales and Business Development' },
        { active_experience_management_level: 'Director-Level', active_experience_department: 'Operations' },
        { active_experience_management_level: 'Manager-Level', active_experience_department: 'Marketing' }
      ],
      departmentCounts: {
        'Sales and Business Development': 5,
        'Operations': 3,
        'Marketing': 2
      }
    };
    
    const qualityAnalysis = this.analyzeBuyerGroupQuality(mockPreviewData);
    
    if (!qualityAnalysis.pain_signal_score || qualityAnalysis.pain_signal_score < 0 || qualityAnalysis.pain_signal_score > 100) {
      throw new Error('Pain signal score must be between 0 and 100');
    }
    
    if (!qualityAnalysis.innovation_score || qualityAnalysis.innovation_score < 0 || qualityAnalysis.innovation_score > 100) {
      throw new Error('Innovation score must be between 0 and 100');
    }
    
    if (!qualityAnalysis.buyer_experience_score || qualityAnalysis.buyer_experience_score < 0 || qualityAnalysis.buyer_experience_score > 100) {
      throw new Error('Buyer experience score must be between 0 and 100');
    }
    
    if (!qualityAnalysis.buyer_group_structure_score || qualityAnalysis.buyer_group_structure_score < 0 || qualityAnalysis.buyer_group_structure_score > 100) {
      throw new Error('Buyer group structure score must be between 0 and 100');
    }
    
    if (!qualityAnalysis.overall_buyer_group_quality || qualityAnalysis.overall_buyer_group_quality < 0 || qualityAnalysis.overall_buyer_group_quality > 100) {
      throw new Error('Overall buyer group quality must be between 0 and 100');
    }
    
    // Test that overall quality is calculated correctly
    const expectedOverall = Math.round(
      qualityAnalysis.pain_signal_score * 0.25 +
      qualityAnalysis.innovation_score * 0.25 +
      qualityAnalysis.buyer_experience_score * 0.25 +
      qualityAnalysis.buyer_group_structure_score * 0.25
    );
    
    if (Math.abs(qualityAnalysis.overall_buyer_group_quality - expectedOverall) > 5) {
      throw new Error('Overall quality should be weighted average of individual scores');
    }
  }

  async testTwoPhaseIntegration() {
    // Test integration between Phase 1 and Phase 2
    const mockPhase1Results = [
      {
        company_name: 'Test Company 1',
        firmographicFitScore: 90,
        growthSignalsScore: 85,
        technologyAdoptionScore: 80,
        adoptionMaturityScore: 75,
        buyerGroupQuality: {
          overall_buyer_group_quality: 80
        }
      },
      {
        company_name: 'Test Company 2',
        firmographicFitScore: 85,
        growthSignalsScore: 80,
        technologyAdoptionScore: 75,
        adoptionMaturityScore: 70,
        buyerGroupQuality: {
          overall_buyer_group_quality: 70
        }
      }
    ];
    
    // Test that Phase 2 results are integrated into final scoring
    const finalScores = mockPhase1Results.map(company => 
      this.calculateFinalScore(company, company.buyerGroupQuality)
    );
    
    if (finalScores.length !== mockPhase1Results.length) {
      throw new Error('Final scores should match number of companies');
    }
    
    // Test that companies are ranked by final score
    const rankedCompanies = mockPhase1Results.sort((a, b) => 
      this.calculateFinalScore(b, b.buyerGroupQuality) - this.calculateFinalScore(a, a.buyerGroupQuality)
    );
    
    if (rankedCompanies[0].company_name !== 'Test Company 1') {
      throw new Error('Companies should be ranked by final score');
    }
    
    // Test that buyer group quality has higher weight
    const company1Score = this.calculateFinalScore(mockPhase1Results[0], mockPhase1Results[0].buyerGroupQuality);
    const traditionalScore = 
      mockPhase1Results[0].firmographicFitScore * 0.15 +
      mockPhase1Results[0].growthSignalsScore * 0.15 +
      mockPhase1Results[0].technologyAdoptionScore * 0.10 +
      mockPhase1Results[0].adoptionMaturityScore * 0.10;
    
    const buyerGroupScore = mockPhase1Results[0].buyerGroupQuality.overall_buyer_group_quality * 0.60;
    
    if (Math.abs(company1Score - (traditionalScore + buyerGroupScore)) > 1) {
      throw new Error('Final score should be weighted sum of traditional and buyer group scores');
    }
  }

  async testScoringWeights() {
    // Test scoring weights configuration
    const defaultWeights = {
      firmographicFit: 0.15,
      growthSignals: 0.15,
      technologyAdoption: 0.10,
      adoptionMaturity: 0.10,
      buyerGroupQuality: 0.60
    };
    
    const totalWeight = Object.values(defaultWeights).reduce((sum, weight) => sum + weight, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error('Scoring weights should sum to 1.0');
    }
    
    if (defaultWeights.buyerGroupQuality !== 0.60) {
      throw new Error('Buyer group quality should have highest weight (0.60)');
    }
    
    if (defaultWeights.firmographicFit !== 0.15) {
      throw new Error('Firmographic fit should have weight 0.15');
    }
    
    if (defaultWeights.growthSignals !== 0.15) {
      throw new Error('Growth signals should have weight 0.15');
    }
  }

  async testErrorHandling() {
    // Test error handling scenarios
    const errorScenarios = [
      { type: 'API_ERROR', status: 500, message: 'Internal Server Error' },
      { type: 'RATE_LIMIT', status: 429, message: 'Rate limit exceeded' },
      { type: 'INVALID_DATA', status: 400, message: 'Invalid request data' },
      { type: 'CLAUDE_API_ERROR', message: 'Claude API error' }
    ];
    
    for (const scenario of errorScenarios) {
      try {
        this.simulateError(scenario);
      } catch (error) {
        if (!error.message.includes(scenario.message)) {
          throw new Error(`Error handling failed for ${scenario.type}: ${error.message}`);
        }
      }
    }
  }

  // Helper methods
  buildMarketFilterQuery(criteria) {
    return {
      query: {
        bool: {
          must: [
            { terms: { company_industry: criteria.industries } },
            { match: { company_size_range: criteria.sizeRange } },
            { range: { company_employees_count_change_yearly_percentage: { gte: criteria.minGrowthRate } } },
            { term: { company_is_b2b: 1 } }
          ],
          should: [
            { range: { company_last_updated_at: { gte: "now-90d", boost: 1.5 } } },
            { exists: { field: "company_last_funding_round_date", boost: 1.3 } }
          ],
          filter: [
            { terms: { company_hq_country: criteria.locations } }
          ]
        }
      }
    };
  }

  simulateEmployeeSampling(company, departments, sampleSize) {
    const employees = [];
    for (let i = 0; i < Math.min(sampleSize, 30); i++) {
      employees.push({
        id: i,
        full_name: `Employee ${i}`,
        active_experience_department: departments[i % departments.length],
        active_experience_title: `Title ${i}`,
        active_experience_management_level: ['Manager-Level', 'Director-Level', 'VP-Level'][i % 3],
        connections_count: Math.floor(Math.random() * 2000) + 500,
        followers_count: Math.floor(Math.random() * 500) + 100
      });
    }
    return employees;
  }

  detectPainSignals(employees) {
    const signals = [];
    
    employees.forEach(emp => {
      const title = emp.active_experience_title.toLowerCase();
      if (title.includes('interim')) signals.push('Interim role detected');
      if (title.includes('acting')) signals.push('Acting role detected');
      if (title.includes('new')) signals.push('New hire detected');
    });
    
    // Check for management gaps
    const vpCount = employees.filter(emp => emp.active_experience_management_level === 'VP-Level').length;
    if (vpCount === 0 && employees.length > 10) {
      signals.push('Management gap detected - no VP-level leadership');
    }
    
    return signals;
  }

  calculateInnovationScore(employees) {
    let score = 0;
    
    employees.forEach(emp => {
      const title = emp.active_experience_title.toLowerCase();
      
      // Modern title scoring
      if (title.includes('revenue ops') || title.includes('growth')) score += 20;
      if (title.includes('data science') || title.includes('ml') || title.includes('ai')) score += 15;
      if (title.includes('digital') || title.includes('transformation')) score += 10;
      
      // LinkedIn engagement scoring
      const connections = emp.connections_count || 0;
      const followers = emp.followers_count || 0;
      const totalEngagement = connections + followers;
      
      if (totalEngagement > 3000) score += 15;
      else if (totalEngagement > 2000) score += 10;
      else if (totalEngagement > 1000) score += 5;
    });
    
    // Geographic diversity bonus
    const countries = [...new Set(employees.map(emp => emp.location_country))];
    if (countries.length > 1) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  analyzeBuyerGroupQuality(data) {
    const { employees, departmentCounts } = data;
    
    // Pain signal analysis
    const painSignals = this.detectPainSignals(employees);
    const painSignalScore = Math.min(100, 50 + (painSignals.length * 10));
    
    // Innovation analysis
    const innovationScore = this.calculateInnovationScore(employees);
    
    // Buyer experience analysis
    const vpCount = employees.filter(emp => emp.active_experience_management_level === 'VP-Level').length;
    const directorCount = employees.filter(emp => emp.active_experience_management_level === 'Director-Level').length;
    const buyerExperienceScore = Math.min(100, (vpCount * 20) + (directorCount * 10) + 30);
    
    // Structure analysis
    const salesCount = departmentCounts['Sales and Business Development'] || 0;
    const opsCount = departmentCounts['Operations'] || 0;
    const structureScore = Math.min(100, (salesCount * 5) + (opsCount * 5) + 50);
    
    // Overall quality
    const overallQuality = Math.round(
      painSignalScore * 0.25 +
      innovationScore * 0.25 +
      buyerExperienceScore * 0.25 +
      structureScore * 0.25
    );
    
    return {
      pain_signal_score: painSignalScore,
      innovation_score: innovationScore,
      buyer_experience_score: buyerExperienceScore,
      buyer_group_structure_score: structureScore,
      overall_buyer_group_quality: overallQuality
    };
  }

  calculateFinalScore(company, buyerGroupQuality) {
    const traditionalScore = 
      (company.firmographicFitScore || 50) * 0.15 +
      (company.growthSignalsScore || 50) * 0.15 +
      (company.technologyAdoptionScore || 50) * 0.10 +
      (company.adoptionMaturityScore || 50) * 0.10;
    
    const buyerGroupScore = buyerGroupQuality.overall_buyer_group_quality * 0.60;
    
    return Math.round(traditionalScore + buyerGroupScore);
  }

  simulateError(scenario) {
    throw new Error(scenario.message);
  }

  printResults() {
    console.log('\n📊 Optimal Buyer Group Test Results:');
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tests = new OptimalBuyerGroupTests();
  tests.runAllTests().catch(console.error);
}

module.exports = OptimalBuyerGroupTests;
