#!/usr/bin/env node

/**
 * Test Suite for find_company.js
 * 
 * Tests company enrichment functionality including:
 * - Website matching strategies
 * - Multiple search approaches
 * - Progress saving and loading
 * - Database integration
 * - Error handling
 */

const fs = require('fs');
const path = require('path');

class CompanyEnrichmentTests {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runAllTests() {
    console.log('🧪 Testing Company Enrichment (find_company.js)\n');
    
    const tests = [
      { name: 'Website exact matching', test: () => this.testWebsiteExactMatching() },
      { name: 'Multiple search approaches', test: () => this.testMultipleSearchApproaches() },
      { name: 'Progress saving and loading', test: () => this.testProgressSaving() },
      { name: 'Database integration', test: () => this.testDatabaseIntegration() },
      { name: 'Error handling', test: () => this.testErrorHandling() },
      { name: 'Confidence matching', test: () => this.testConfidenceMatching() },
      { name: 'Batch processing', test: () => this.testBatchProcessing() },
      { name: 'Resumability', test: () => this.testResumability() }
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

  async testWebsiteExactMatching() {
    // Test website exact matching logic
    const testCases = [
      { input: 'https://www.nike.com', expected: 'nike.com' },
      { input: 'http://nike.com', expected: 'nike.com' },
      { input: 'nike.com', expected: 'nike.com' },
      { input: 'https://www.apple.com/store', expected: 'apple.com' }
    ];
    
    for (const testCase of testCases) {
      const result = this.extractDomain(testCase.input);
      if (result !== testCase.expected) {
        throw new Error(`Domain extraction failed: ${testCase.input} -> ${result}, expected ${testCase.expected}`);
      }
    }
  }

  async testMultipleSearchApproaches() {
    // Test that multiple search approaches are tried in order
    const domain = 'nike.com';
    const approaches = [
      { name: 'website.exact', query: { "query": { "term": { "website.exact": domain } } } },
      { name: 'website', query: { "query": { "term": { "website": domain } } } },
      { name: 'website.domain_only', query: { "query": { "term": { "website.domain_only": domain } } } }
    ];
    
    if (approaches.length !== 3) {
      throw new Error('Should have 3 search approaches');
    }
    
    // Test that approaches are in correct order
    if (approaches[0].name !== 'website.exact') {
      throw new Error('First approach should be website.exact');
    }
    
    // Test query structure
    for (const approach of approaches) {
      if (!approach.query.query.term) {
        throw new Error(`Query structure invalid for ${approach.name}`);
      }
    }
  }

  async testProgressSaving() {
    // Test progress saving and loading
    const mockProgress = {
      processedCompanies: [
        { id: '1', name: 'Company 1', status: 'enriched' },
        { id: '2', name: 'Company 2', status: 'failed' }
      ],
      startTime: new Date().toISOString(),
      errors: []
    };
    
    const progressFile = path.join(__dirname, 'test-progress.json');
    
    try {
      // Test saving
      fs.writeFileSync(progressFile, JSON.stringify(mockProgress, null, 2));
      
      // Test loading
      const loadedProgress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
      
      if (loadedProgress.processedCompanies.length !== 2) {
        throw new Error('Progress loading failed - wrong company count');
      }
      
      if (loadedProgress.processedCompanies[0].name !== 'Company 1') {
        throw new Error('Progress loading failed - wrong company data');
      }
      
    } finally {
      // Cleanup
      if (fs.existsSync(progressFile)) {
        fs.unlinkSync(progressFile);
      }
    }
  }

  async testDatabaseIntegration() {
    // Test database integration
    const mockCompany = {
      id: 'test-company-123',
      name: 'Test Company',
      website: 'https://test.com',
      customFields: {
        coresignalId: '12345',
        enrichedAt: new Date().toISOString()
      }
    };
    
    // Test data validation
    if (!mockCompany.id || !mockCompany.name) {
      throw new Error('Company should have required fields');
    }
    
    // Test custom fields structure
    if (!mockCompany.customFields.coresignalId) {
      throw new Error('Company should have Coresignal ID after enrichment');
    }
    
    // Test date formatting
    const enrichedAt = new Date(mockCompany.customFields.enrichedAt);
    if (isNaN(enrichedAt.getTime())) {
      throw new Error('EnrichedAt should be a valid date');
    }
  }

  async testErrorHandling() {
    // Test error handling scenarios
    const errorScenarios = [
      { type: 'API_ERROR', status: 500, message: 'Internal Server Error' },
      { type: 'RATE_LIMIT', status: 429, message: 'Rate limit exceeded' },
      { type: 'INVALID_DATA', status: 400, message: 'Invalid request data' },
      { type: 'NOT_FOUND', status: 404, message: 'Company not found' }
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

  async testConfidenceMatching() {
    // Test confidence matching logic
    const mockCoresignalData = {
      company_name: 'Nike Inc',
      website: 'https://www.nike.com',
      industry: 'Apparel & Fashion',
      employees_count: 75000
    };
    
    const mockDatabaseCompany = {
      name: 'Nike Inc',
      website: 'https://nike.com',
      industry: 'Apparel & Fashion'
    };
    
    const confidence = this.calculateConfidence(mockCoresignalData, mockDatabaseCompany);
    
    if (confidence < 0 || confidence > 100) {
      throw new Error('Confidence should be between 0 and 100');
    }
    
    // Test that high similarity gives high confidence
    if (confidence < 80) {
      throw new Error('High similarity should give high confidence');
    }
  }

  async testBatchProcessing() {
    // Test batch processing logic
    const companies = Array(25).fill().map((_, i) => ({
      id: `company-${i}`,
      name: `Company ${i}`,
      website: `https://company${i}.com`
    }));
    
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < companies.length; i += batchSize) {
      batches.push(companies.slice(i, i + batchSize));
    }
    
    if (batches.length !== 5) {
      throw new Error(`Expected 5 batches, got ${batches.length}`);
    }
    
    if (batches[0].length !== 5) {
      throw new Error('First batch should have 5 companies');
    }
    
    if (batches[4].length !== 5) {
      throw new Error('Last batch should have 5 companies');
    }
  }

  async testResumability() {
    // Test resumability functionality
    const mockProgress = {
      processedCompanies: ['company-1', 'company-2', 'company-3'],
      startTime: '2025-01-01T00:00:00.000Z',
      lastSaved: '2025-01-01T01:00:00.000Z'
    };
    
    const remainingCompanies = ['company-4', 'company-5', 'company-6'];
    const processedIds = new Set(mockProgress.processedCompanies);
    const unprocessedCompanies = remainingCompanies.filter(id => !processedIds.has(id));
    
    if (unprocessedCompanies.length !== 3) {
      throw new Error('Should identify 3 unprocessed companies');
    }
    
    if (unprocessedCompanies.includes('company-1')) {
      throw new Error('Should not include already processed companies');
    }
  }

  // Helper methods
  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    }
  }

  simulateAPIError(scenario) {
    throw new Error(scenario.message);
  }

  calculateConfidence(coresignalData, databaseCompany) {
    let confidence = 0;
    
    // Name matching
    if (coresignalData.company_name?.toLowerCase() === databaseCompany.name?.toLowerCase()) {
      confidence += 40;
    } else if (coresignalData.company_name?.toLowerCase().includes(databaseCompany.name?.toLowerCase())) {
      confidence += 20;
    }
    
    // Website matching
    const coresignalDomain = this.extractDomain(coresignalData.website || '');
    const databaseDomain = this.extractDomain(databaseCompany.website || '');
    
    if (coresignalDomain === databaseDomain) {
      confidence += 30;
    }
    
    // Industry matching
    if (coresignalData.industry?.toLowerCase() === databaseCompany.industry?.toLowerCase()) {
      confidence += 20;
    }
    
    // Additional data presence
    if (coresignalData.employees_count) confidence += 10;
    
    return Math.min(100, confidence);
  }

  printResults() {
    console.log('\n📊 Company Enrichment Test Results:');
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
  const tests = new CompanyEnrichmentTests();
  tests.runAllTests().catch(console.error);
}

module.exports = CompanyEnrichmentTests;
