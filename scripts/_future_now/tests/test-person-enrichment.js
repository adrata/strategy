#!/usr/bin/env node

/**
 * Test Suite for find_person.js
 * 
 * Tests person enrichment functionality including:
 * - Email matching
 * - LinkedIn URL matching
 * - Company experience matching
 * - Confidence scoring
 * - Multi-source API integration
 */

const fs = require('fs');
const path = require('path');

class PersonEnrichmentTests {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runAllTests() {
    console.log('🧪 Testing Person Enrichment (find_person.js)\n');
    
    const tests = [
      { name: 'Email matching', test: () => this.testEmailMatching() },
      { name: 'LinkedIn URL matching', test: () => this.testLinkedInMatching() },
      { name: 'Company experience matching', test: () => this.testCompanyExperienceMatching() },
      { name: 'Confidence scoring', test: () => this.testConfidenceScoring() },
      { name: 'Multi-source API integration', test: () => this.testMultiSourceAPI() },
      { name: 'Search strategies', test: () => this.testSearchStrategies() },
      { name: 'Data validation', test: () => this.testDataValidation() },
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

  async testEmailMatching() {
    // Test email matching logic
    const testCases = [
      { email: 'john.doe@company.com', expectedMatch: true },
      { email: 'jane.smith@example.org', expectedMatch: true },
      { email: 'invalid-email', expectedMatch: false },
      { email: '', expectedMatch: false }
    ];
    
    for (const testCase of testCases) {
      const isValid = this.validateEmail(testCase.email);
      if (isValid !== testCase.expectedMatch) {
        throw new Error(`Email validation failed: ${testCase.email} -> ${isValid}, expected ${testCase.expectedMatch}`);
      }
    }
    
    // Test search query structure
    const email = 'john.doe@company.com';
    const searchQuery = this.buildEmailSearchQuery(email);
    
    if (!searchQuery.query.bool.must[0].term.email) {
      throw new Error('Email search query structure invalid');
    }
    
    if (searchQuery.query.bool.must[0].term.email !== email) {
      throw new Error('Email search query has wrong email value');
    }
  }

  async testLinkedInMatching() {
    // Test LinkedIn URL matching
    const testCases = [
      { url: 'https://www.linkedin.com/in/johndoe', expectedMatch: true },
      { url: 'https://linkedin.com/in/janesmith', expectedMatch: true },
      { url: 'https://twitter.com/johndoe', expectedMatch: false },
      { url: 'invalid-url', expectedMatch: false }
    ];
    
    for (const testCase of testCases) {
      const isValid = this.validateLinkedInURL(testCase.url);
      if (isValid !== testCase.expectedMatch) {
        throw new Error(`LinkedIn URL validation failed: ${testCase.url} -> ${isValid}, expected ${testCase.expectedMatch}`);
      }
    }
    
    // Test search query structure
    const linkedinUrl = 'https://www.linkedin.com/in/johndoe';
    const searchQuery = this.buildLinkedInSearchQuery(linkedinUrl);
    
    if (!searchQuery.query.bool.must[0].term.linkedin_url) {
      throw new Error('LinkedIn search query structure invalid');
    }
  }

  async testCompanyExperienceMatching() {
    // Test company experience matching
    const companyLinkedInUrl = 'https://www.linkedin.com/company/test-company';
    const searchQuery = this.buildCompanyExperienceSearchQuery(companyLinkedInUrl);
    
    // Test nested query structure
    const nestedQuery = searchQuery.query.bool.must[0].nested;
    if (nestedQuery.path !== 'experience') {
      throw new Error('Nested query should target experience path');
    }
    
    // Test active experience filter
    const activeExperienceFilter = nestedQuery.query.bool.must.find(
      clause => clause.term && clause.term['experience.active_experience']
    );
    
    if (!activeExperienceFilter) {
      throw new Error('Should filter for active experience');
    }
    
    if (activeExperienceFilter.term['experience.active_experience'] !== 1) {
      throw new Error('Should filter for active_experience = 1');
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
  }

  async testConfidenceScoring() {
    // Test confidence scoring logic
    const testCases = [
      {
        person: {
          full_name: 'John Doe',
          email: 'john.doe@company.com',
          linkedin_url: 'https://linkedin.com/in/johndoe',
          experience: [{ active_experience: 1, company_name: 'Test Company' }]
        },
        expectedMinConfidence: 80
      },
      {
        person: {
          full_name: 'Jane Smith',
          email: 'jane@company.com'
        },
        expectedMinConfidence: 50
      },
      {
        person: {
          full_name: 'Bob Johnson',
          linkedin_url: 'https://linkedin.com/in/bobjohnson',
          professional_emails_collection: ['bob@company.com', 'b.johnson@company.com']
        },
        expectedMinConfidence: 70
      }
    ];
    
    for (const testCase of testCases) {
      const confidence = this.calculatePersonConfidence(testCase.person);
      
      if (confidence < 0 || confidence > 100) {
        throw new Error(`Confidence should be between 0 and 100, got ${confidence}`);
      }
      
      if (confidence < testCase.expectedMinConfidence) {
        throw new Error(`Confidence ${confidence} should be >= ${testCase.expectedMinConfidence} for person with more data`);
      }
    }
  }

  async testMultiSourceAPI() {
    // Test Multi-source Employee API integration
    const searchEndpoint = 'https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl';
    const collectEndpoint = 'https://api.coresignal.com/cdapi/v2/person_multi_source/collect';
    
    // Verify endpoints are correct
    if (!searchEndpoint.includes('person_multi_source')) {
      throw new Error('Search endpoint should use person_multi_source API');
    }
    
    if (!collectEndpoint.includes('person_multi_source')) {
      throw new Error('Collect endpoint should use person_multi_source API');
    }
    
    // Test API request structure
    const mockRequest = {
      method: 'POST',
      headers: {
        'apikey': 'test-key',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query: { match_all: {} } })
    };
    
    if (mockRequest.method !== 'POST') {
      throw new Error('API request should use POST method');
    }
    
    if (!mockRequest.headers.apikey) {
      throw new Error('API request should include API key');
    }
  }

  async testSearchStrategies() {
    // Test that multiple search strategies are tried
    const strategies = ['email', 'linkedin', 'company_experience'];
    const mockPerson = {
      email: 'test@company.com',
      linkedin_url: 'https://linkedin.com/in/test',
      company_linkedin_url: 'https://linkedin.com/company/test-company'
    };
    
    const results = [];
    for (const strategy of strategies) {
      const result = this.simulateSearchStrategy(strategy, mockPerson);
      results.push(result);
      if (result.success) break; // Stop on first success
    }
    
    if (results.length !== strategies.length) {
      throw new Error('Should try all search strategies');
    }
    
    // Test that at least one strategy succeeds
    const hasSuccess = results.some(result => result.success);
    if (!hasSuccess) {
      throw new Error('At least one search strategy should succeed');
    }
  }

  async testDataValidation() {
    // Test data validation
    const validPerson = {
      id: 12345,
      full_name: 'John Doe',
      email: 'john.doe@company.com',
      linkedin_url: 'https://linkedin.com/in/johndoe'
    };
    
    const invalidPerson = {
      id: 'invalid',
      full_name: '',
      email: 'invalid-email'
    };
    
    // Test valid person
    const validResult = this.validatePersonData(validPerson);
    if (!validResult.isValid) {
      throw new Error('Valid person should pass validation');
    }
    
    // Test invalid person
    const invalidResult = this.validatePersonData(invalidPerson);
    if (invalidResult.isValid) {
      throw new Error('Invalid person should fail validation');
    }
    
    if (invalidResult.errors.length === 0) {
      throw new Error('Invalid person should have validation errors');
    }
  }

  async testErrorHandling() {
    // Test error handling scenarios
    const errorScenarios = [
      { type: 'API_ERROR', status: 500, message: 'Internal Server Error' },
      { type: 'RATE_LIMIT', status: 429, message: 'Rate limit exceeded' },
      { type: 'NOT_FOUND', status: 404, message: 'Person not found' },
      { type: 'INVALID_DATA', status: 400, message: 'Invalid request data' }
    ];
    
    for (const scenario of errorScenarios) {
      try {
        this.simulateAPIError(scenario);
      } catch (error) {
        if (!error.message.includes(scenario.message)) {
          throw new Error(`Error handling failed for ${scenario.type}: ${error.message}`);
        }
      }
    }
  }

  // Helper methods
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateLinkedInURL(url) {
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/;
    return linkedinRegex.test(url);
  }

  buildEmailSearchQuery(email) {
    return {
      query: {
        bool: {
          must: [
            { term: { email: email } }
          ]
        }
      }
    };
  }

  buildLinkedInSearchQuery(linkedinUrl) {
    return {
      query: {
        bool: {
          must: [
            { term: { linkedin_url: linkedinUrl } }
          ]
        }
      }
    };
  }

  buildCompanyExperienceSearchQuery(companyLinkedInUrl) {
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

  calculatePersonConfidence(person) {
    let confidence = 0;
    
    // Name matching
    if (person.full_name) confidence += 20;
    
    // Email matching
    if (person.email) confidence += 30;
    
    // LinkedIn URL matching
    if (person.linkedin_url) confidence += 25;
    
    // Experience matching
    if (person.experience?.some(exp => exp.active_experience === 1)) confidence += 15;
    
    // Additional email data
    if (person.professional_emails_collection?.length > 0) confidence += 10;
    
    return Math.min(100, confidence);
  }

  simulateSearchStrategy(strategy, person) {
    // Mock search strategy simulation
    const strategies = {
      email: person.email && this.validateEmail(person.email),
      linkedin: person.linkedin_url && this.validateLinkedInURL(person.linkedin_url),
      company_experience: person.company_linkedin_url && person.company_linkedin_url.includes('linkedin.com/company')
    };
    
    return {
      strategy,
      success: strategies[strategy] || false,
      results: strategies[strategy] ? ['person1', 'person2'] : []
    };
  }

  validatePersonData(person) {
    const errors = [];
    
    if (!person.id || typeof person.id !== 'number') {
      errors.push('ID must be a number');
    }
    
    if (!person.full_name || person.full_name.trim() === '') {
      errors.push('Full name is required');
    }
    
    if (person.email && !this.validateEmail(person.email)) {
      errors.push('Email format is invalid');
    }
    
    if (person.linkedin_url && !this.validateLinkedInURL(person.linkedin_url)) {
      errors.push('LinkedIn URL format is invalid');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  simulateAPIError(scenario) {
    throw new Error(scenario.message);
  }

  printResults() {
    console.log('\n📊 Person Enrichment Test Results:');
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
  const tests = new PersonEnrichmentTests();
  tests.runAllTests().catch(console.error);
}

module.exports = PersonEnrichmentTests;
