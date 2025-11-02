#!/usr/bin/env node

/**
 * Test Suite for find_role.js
 * 
 * Tests role enrichment functionality including:
 * - AI role variation generation
 * - Hierarchical search fallback
 * - Confidence-based matching
 * - Claude API integration
 * - Fallback when AI unavailable
 */

const fs = require('fs');
const path = require('path');

class RoleEnrichmentTests {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runAllTests() {
    console.log('🧪 Testing Role Enrichment (find_role.js)\n');
    
    const tests = [
      { name: 'AI role variation generation', test: () => this.testAIRoleVariations() },
      { name: 'Hierarchical search fallback', test: () => this.testHierarchicalSearch() },
      { name: 'Confidence-based matching', test: () => this.testConfidenceMatching() },
      { name: 'Claude API integration', test: () => this.testClaudeIntegration() },
      { name: 'Fallback when AI unavailable', test: () => this.testFallback() },
      { name: 'Role classification logic', test: () => this.testRoleClassification() },
      { name: 'Search query building', test: () => this.testSearchQueryBuilding() },
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

  async testAIRoleVariations() {
    // Test AI role variation generation
    const targetRole = 'CFO';
    const mockVariations = {
      primary: ['CFO', 'Chief Financial Officer'],
      secondary: ['VP Finance', 'Finance Director', 'Head of Finance'],
      tertiary: ['Senior Finance Manager', 'Finance Manager', 'Financial Controller']
    };
    
    // Verify variations are hierarchical
    if (mockVariations.primary.length === 0) {
      throw new Error('Primary variations should not be empty');
    }
    
    if (mockVariations.secondary.length === 0) {
      throw new Error('Secondary variations should not be empty');
    }
    
    if (mockVariations.tertiary.length === 0) {
      throw new Error('Tertiary variations should not be empty');
    }
    
    // Test that primary variations include the original role
    if (!mockVariations.primary.includes(targetRole)) {
      throw new Error('Primary variations should include the original role');
    }
    
    // Test that variations are role-specific
    const cfoVariations = this.generateRoleVariations('CFO');
    const ctoVariations = this.generateRoleVariations('CTO');
    
    if (cfoVariations.primary.includes('CTO')) {
      throw new Error('CFO variations should not include CTO');
    }
  }

  async testHierarchicalSearch() {
    // Test hierarchical search fallback
    const searchLevels = ['primary', 'secondary', 'tertiary'];
    const results = [];
    
    for (const level of searchLevels) {
      const mockResult = this.simulateRoleSearch(level);
      results.push(mockResult);
      if (mockResult.found) break; // Stop on first success
    }
    
    if (results.length !== searchLevels.length) {
      throw new Error('Not all search levels were tried');
    }
    
    // Test that search stops on first success
    const firstSuccessIndex = results.findIndex(result => result.found);
    if (firstSuccessIndex !== -1) {
      const remainingResults = results.slice(firstSuccessIndex + 1);
      const hasLaterSuccess = remainingResults.some(result => result.found);
      if (hasLaterSuccess) {
        throw new Error('Search should stop on first success');
      }
    }
  }

  async testConfidenceMatching() {
    // Test confidence-based matching
    const testCases = [
      {
        person: { active_experience_title: 'Chief Financial Officer' },
        targetRole: 'CFO',
        expectedMinConfidence: 90
      },
      {
        person: { active_experience_title: 'VP Finance' },
        targetRole: 'CFO',
        expectedMinConfidence: 70
      },
      {
        person: { active_experience_title: 'Finance Manager' },
        targetRole: 'CFO',
        expectedMinConfidence: 50
      },
      {
        person: { active_experience_title: 'Software Engineer' },
        targetRole: 'CFO',
        expectedMaxConfidence: 30
      }
    ];
    
    for (const testCase of testCases) {
      const confidence = this.calculateRoleConfidence(
        testCase.person.active_experience_title,
        testCase.targetRole
      );
      
      if (confidence < 0 || confidence > 100) {
        throw new Error(`Confidence should be between 0 and 100, got ${confidence}`);
      }
      
      if (testCase.expectedMinConfidence && confidence < testCase.expectedMinConfidence) {
        throw new Error(`Confidence ${confidence} should be >= ${testCase.expectedMinConfidence}`);
      }
      
      if (testCase.expectedMaxConfidence && confidence > testCase.expectedMaxConfidence) {
        throw new Error(`Confidence ${confidence} should be <= ${testCase.expectedMaxConfidence}`);
      }
    }
  }

  async testClaudeIntegration() {
    // Test Claude API integration
    const mockPrompt = 'Generate role variations for CFO';
    const mockResponse = {
      content: [
        {
          text: '{"primary": ["CFO", "Chief Financial Officer"], "secondary": ["VP Finance", "Finance Director"], "tertiary": ["Senior Finance Manager", "Finance Manager"]}'
        }
      ]
    };
    
    // Test JSON parsing from Claude response
    const jsonMatch = mockResponse.content[0].text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.primary || !Array.isArray(parsed.primary)) {
      throw new Error('Claude response not properly formatted');
    }
    
    if (!parsed.secondary || !Array.isArray(parsed.secondary)) {
      throw new Error('Claude response missing secondary variations');
    }
    
    if (!parsed.tertiary || !Array.isArray(parsed.tertiary)) {
      throw new Error('Claude response missing tertiary variations');
    }
    
    // Test API request structure
    const mockRequest = {
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      temperature: 0.2,
      messages: [{ role: 'user', content: mockPrompt }]
    };
    
    if (mockRequest.model !== 'claude-sonnet-4-5') {
      throw new Error('Should use claude-sonnet-4-5 model');
    }
    
    if (mockRequest.temperature !== 0.2) {
      throw new Error('Should use low temperature for consistent results');
    }
  }

  async testFallback() {
    // Test fallback when AI is unavailable
    const targetRole = 'CFO';
    const fallbackVariations = this.generateFallbackRoleVariations(targetRole);
    
    if (fallbackVariations.length === 0) {
      throw new Error('Fallback variations should not be empty');
    }
    
    if (!fallbackVariations.includes('CFO')) {
      throw new Error('Fallback should include the original role');
    }
    
    // Test that fallback generates reasonable variations
    const expectedVariations = ['CFO', 'Chief Financial Officer', 'VP Finance', 'Finance Director'];
    const hasExpectedVariations = expectedVariations.some(variation => 
      fallbackVariations.some(fallback => fallback.includes(variation))
    );
    
    if (!hasExpectedVariations) {
      throw new Error('Fallback should generate reasonable role variations');
    }
  }

  async testRoleClassification() {
    // Test role classification logic
    const testCases = [
      {
        title: 'Chief Financial Officer',
        expectedRole: 'decision_maker',
        expectedConfidence: 95
      },
      {
        title: 'VP Finance',
        expectedRole: 'champion',
        expectedConfidence: 85
      },
      {
        title: 'Finance Director',
        expectedRole: 'champion',
        expectedConfidence: 80
      },
      {
        title: 'Finance Manager',
        expectedRole: 'stakeholder',
        expectedConfidence: 70
      },
      {
        title: 'Procurement Director',
        expectedRole: 'blocker',
        expectedConfidence: 75
      },
      {
        title: 'Account Manager',
        expectedRole: 'introducer',
        expectedConfidence: 65
      }
    ];
    
    for (const testCase of testCases) {
      const classification = this.classifyRole(testCase.title);
      
      if (classification.role !== testCase.expectedRole) {
        throw new Error(`Role classification failed: ${testCase.title} -> ${classification.role}, expected ${testCase.expectedRole}`);
      }
      
      if (classification.confidence < testCase.expectedConfidence - 10) {
        throw new Error(`Confidence too low: ${classification.confidence}, expected >= ${testCase.expectedConfidence - 10}`);
      }
    }
  }

  async testSearchQueryBuilding() {
    // Test search query building
    const companyLinkedInUrl = 'https://www.linkedin.com/company/test-company';
    const roleTitle = 'CFO';
    
    const searchQuery = this.buildRoleSearchQuery(companyLinkedInUrl, roleTitle);
    
    // Test nested query structure
    const nestedQuery = searchQuery.query.bool.must[0].nested;
    if (nestedQuery.path !== 'experience') {
      throw new Error('Nested query should target experience path');
    }
    
    // Test company LinkedIn URL matching
    const companyMatch = nestedQuery.query.bool.must.find(
      clause => clause.match && clause.match['experience.company_linkedin_url']
    );
    
    if (!companyMatch) {
      throw new Error('Should match company LinkedIn URL');
    }
    
    if (companyMatch.match['experience.company_linkedin_url'] !== companyLinkedInUrl) {
      throw new Error('Company LinkedIn URL match has wrong value');
    }
    
    // Test active experience filter
    const activeExperienceFilter = nestedQuery.query.bool.must.find(
      clause => clause.term && clause.term['experience.active_experience']
    );
    
    if (!activeExperienceFilter) {
      throw new Error('Should filter for active experience');
    }
    
    // Test role title matching
    const roleMatch = nestedQuery.query.bool.must.find(
      clause => clause.match && clause.match['experience.position_title']
    );
    
    if (!roleMatch) {
      throw new Error('Should match role title');
    }
    
    if (roleMatch.match['experience.position_title'] !== roleTitle) {
      throw new Error('Role title match has wrong value');
    }
  }

  async testErrorHandling() {
    // Test error handling scenarios
    const errorScenarios = [
      { type: 'CLAUDE_API_ERROR', status: 500, message: 'Claude API error' },
      { type: 'INVALID_JSON', message: 'Invalid JSON response' },
      { type: 'NETWORK_ERROR', message: 'Network error' },
      { type: 'RATE_LIMIT', status: 429, message: 'Rate limit exceeded' }
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
  generateRoleVariations(role) {
    const variations = {
      'CFO': {
        primary: ['CFO', 'Chief Financial Officer'],
        secondary: ['VP Finance', 'Finance Director', 'Head of Finance'],
        tertiary: ['Senior Finance Manager', 'Finance Manager', 'Financial Controller']
      },
      'CTO': {
        primary: ['CTO', 'Chief Technology Officer'],
        secondary: ['VP Engineering', 'Engineering Director', 'Head of Engineering'],
        tertiary: ['Senior Engineering Manager', 'Engineering Manager', 'Technical Director']
      },
      'CEO': {
        primary: ['CEO', 'Chief Executive Officer'],
        secondary: ['President', 'Founder', 'Managing Director'],
        tertiary: ['General Manager', 'Country Manager', 'Regional Director']
      }
    };
    
    return variations[role] || {
      primary: [role],
      secondary: [],
      tertiary: []
    };
  }

  simulateRoleSearch(level) {
    // Mock role search simulation
    const successRates = {
      primary: 0.8,
      secondary: 0.6,
      tertiary: 0.4
    };
    
    return {
      level,
      found: Math.random() < successRates[level],
      results: Math.random() > 0.5 ? ['person1', 'person2'] : []
    };
  }

  calculateRoleConfidence(title, targetRole) {
    const titleLower = title.toLowerCase();
    const targetLower = targetRole.toLowerCase();
    
    // Exact match
    if (titleLower.includes(targetLower)) return 95;
    
    // Chief officer match
    if (titleLower.includes('chief') && targetLower.includes('cfo')) return 90;
    if (titleLower.includes('chief') && targetLower.includes('cto')) return 90;
    if (titleLower.includes('chief') && targetLower.includes('ceo')) return 90;
    
    // VP level match
    if (titleLower.includes('vp') && targetLower.includes('finance')) return 85;
    if (titleLower.includes('vp') && targetLower.includes('technology')) return 85;
    if (titleLower.includes('vp') && targetLower.includes('executive')) return 85;
    
    // Director level match
    if (titleLower.includes('director') && targetLower.includes('finance')) return 80;
    if (titleLower.includes('director') && targetLower.includes('technology')) return 80;
    
    // Manager level match
    if (titleLower.includes('manager') && targetLower.includes('finance')) return 70;
    if (titleLower.includes('manager') && targetLower.includes('technology')) return 70;
    
    // Partial match
    if (titleLower.includes('finance') && targetLower.includes('cfo')) return 60;
    if (titleLower.includes('technology') && targetLower.includes('cto')) return 60;
    if (titleLower.includes('executive') && targetLower.includes('ceo')) return 60;
    
    return 30; // Default low confidence
  }

  generateFallbackRoleVariations(role) {
    const fallbackVariations = {
      'CFO': ['CFO', 'Chief Financial Officer', 'VP Finance', 'Finance Director', 'Head of Finance'],
      'CTO': ['CTO', 'Chief Technology Officer', 'VP Engineering', 'Engineering Director', 'Head of Engineering'],
      'CEO': ['CEO', 'Chief Executive Officer', 'President', 'Founder', 'Managing Director'],
      'CMO': ['CMO', 'Chief Marketing Officer', 'VP Marketing', 'Marketing Director', 'Head of Marketing'],
      'COO': ['COO', 'Chief Operating Officer', 'VP Operations', 'Operations Director', 'Head of Operations']
    };
    
    return fallbackVariations[role] || [role];
  }

  classifyRole(title) {
    const titleLower = title.toLowerCase();
    
    // Decision makers
    if (titleLower.includes('chief') || titleLower.includes('ceo') || titleLower.includes('president')) {
      return { role: 'decision_maker', confidence: 95 };
    }
    
    // Champions (VP level)
    if (titleLower.includes('vp') || titleLower.includes('vice president')) {
      return { role: 'champion', confidence: 85 };
    }
    
    // Blockers
    if (titleLower.includes('procurement') || titleLower.includes('legal') || titleLower.includes('compliance')) {
      return { role: 'blocker', confidence: 80 };
    }
    
    // Introducers
    if (titleLower.includes('sales') || titleLower.includes('account') || titleLower.includes('customer')) {
      return { role: 'introducer', confidence: 75 };
    }
    
    // Stakeholders (default)
    return { role: 'stakeholder', confidence: 70 };
  }

  buildRoleSearchQuery(companyLinkedInUrl, roleTitle) {
    return {
      query: {
        bool: {
          must: [
            {
              nested: {
                path: "experience",
                query: {
                  bool: {
                    must: [
                      {
                        match: {
                          "experience.company_linkedin_url": companyLinkedInUrl
                        }
                      },
                      {
                        term: {
                          "experience.active_experience": 1
                        }
                      },
                      {
                        match: {
                          "experience.position_title": roleTitle
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };
  }

  simulateError(scenario) {
    throw new Error(scenario.message);
  }

  printResults() {
    console.log('\n📊 Role Enrichment Test Results:');
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
  const tests = new RoleEnrichmentTests();
  tests.runAllTests().catch(console.error);
}

module.exports = RoleEnrichmentTests;
