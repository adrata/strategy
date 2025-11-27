/**
 * Battle Test AI Right Panel - Comprehensive User Scenario Testing
 * Tests various user types, misspellings, nonsensical requests, and edge cases
 * Purpose: Ensure system is bulletproof for Monday launch
 * 
 * ENHANCED: Now includes record context verification and personalization tests
 */

const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Forbidden phrases that indicate AI lacks context - should NEVER appear when viewing a record
const FORBIDDEN_PHRASES = [
  "I don't have enough context",
  "I need more information",
  "I don't have visibility into",
  "I don't have access to",
  "I can't see",
  "I'm not able to see",
  "without knowing",
  "without more details",
  "could you provide more",
  "I would need to know",
  "I don't have specific",
  "limited context",
  "I'm unable to access",
  "I cannot access"
];

// Record types to test
const RECORD_TYPES = [
  'speedrun-prospect',
  'person',
  'companies',
  'leads',
  'prospects',
  'opportunities'
];

// Test scenarios for different user types and situations
const BATTLE_TEST_SCENARIOS = [
  // Entry Level Seller Scenarios
  {
    category: 'Entry Level Seller',
    user: 'tony@adrata.com',
    tests: [
      {
        name: 'Basic Company Research',
        query: 'find me information about Apple Inc',
        expectSuccess: true,
        description: 'Entry level seller asking for basic company info'
      },
      {
        name: 'Misspelled Company Name',
        query: 'find me info about Microsft Corporation',
        expectSuccess: true,
        description: 'Common misspelling should be handled gracefully'
      },
      {
        name: 'Vague Request',
        query: 'I need leads',
        expectSuccess: false,
        description: 'Should ask for clarification'
      },
      {
        name: 'Role Finding - Basic',
        query: 'find me the CEO of Nike',
        expectSuccess: true,
        description: 'Simple role finding request'
      },
      {
        name: 'Role Finding - Misspelled',
        query: 'find me the cheif executive officer of Gogle',
        expectSuccess: true,
        description: 'Misspelled role and company should work'
      }
    ]
  },
  
  // CRO/Executive Scenarios
  {
    category: 'CRO/Executive',
    user: 'dan@adrata.com',
    tests: [
      {
        name: 'Strategic Analysis',
        query: 'analyze the competitive landscape for Salesforce in the CRM market',
        expectSuccess: true,
        description: 'Executive-level strategic analysis request'
      },
      {
        name: 'Market Intelligence',
        query: 'what are the key buying signals for enterprise software companies',
        expectSuccess: true,
        description: 'High-level market intelligence query'
      },
      {
        name: 'Bulk Analysis',
        query: 'analyze these companies for acquisition potential: Microsoft, Oracle, Adobe',
        expectSuccess: true,
        description: 'Multi-company analysis request'
      }
    ]
  },

  // Nonsensical/Edge Case Scenarios
  {
    category: 'Edge Cases & Nonsense',
    user: 'tony@adrata.com',
    tests: [
      {
        name: 'Complete Nonsense',
        query: 'purple monkey dishwasher quantum banana',
        expectSuccess: false,
        description: 'Should handle complete nonsense gracefully'
      },
      {
        name: 'Mixed Languages',
        query: 'find me información sobre la empresa Apple',
        expectSuccess: true,
        description: 'Should handle mixed language queries'
      },
      {
        name: 'Extremely Long Query',
        query: 'I need you to find me information about a company that I think is called something like Apple or maybe it was Microsoft or Google I am not really sure but they make computers and software and I think they are based in California or maybe Washington and I need to find their CEO and CFO and maybe some other executives for a sales campaign that my manager wants me to run next week',
        expectSuccess: true,
        description: 'Should handle very long, rambling queries'
      },
      {
        name: 'Empty Query',
        query: '',
        expectSuccess: false,
        description: 'Should handle empty queries'
      },
      {
        name: 'Special Characters',
        query: 'find me @#$%^&*() company info!!!',
        expectSuccess: false,
        description: 'Should handle special characters gracefully'
      }
    ]
  },

  // Company Existence Testing
  {
    category: 'Company Existence',
    user: 'tony@adrata.com',
    tests: [
      {
        name: 'Real Company',
        query: 'find me the CEO of Microsoft',
        expectSuccess: true,
        description: 'Should find real companies'
      },
      {
        name: 'Fake Company',
        query: 'find me the CEO of XYZ Nonexistent Corporation Ltd',
        expectSuccess: false,
        description: 'Should handle non-existent companies gracefully'
      },
      {
        name: 'Ambiguous Company Name',
        query: 'find me info about Apple',
        expectSuccess: true,
        description: 'Should ask for clarification or assume Apple Inc'
      },
      {
        name: 'Very Similar Company Names',
        query: 'find me info about Meta vs Facebook',
        expectSuccess: true,
        description: 'Should understand company name changes'
      }
    ]
  },

  // File Upload Scenarios
  {
    category: 'File Upload Edge Cases',
    user: 'tony@adrata.com',
    tests: [
      {
        name: 'CSV with Misspelled Headers',
        query: 'process this CSV with company names',
        file: 'test-misspelled-headers.csv',
        expectSuccess: true,
        description: 'Should handle CSV files with misspelled headers'
      },
      {
        name: 'Empty CSV',
        query: 'process this empty CSV file',
        file: 'empty.csv',
        expectSuccess: false,
        description: 'Should handle empty files gracefully'
      }
    ]
  }
];

// Record Context Verification Scenarios - Tests that AI uses actual record data
const RECORD_CONTEXT_SCENARIOS = [
  {
    category: 'Person Record Context',
    recordType: 'person',
    tests: [
      {
        name: 'AI References Person Name',
        query: 'Tell me about this person',
        requiresInResponse: ['name'],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'AI should use the person name from context'
      },
      {
        name: 'AI References Company',
        query: 'What company do they work for?',
        requiresInResponse: ['company'],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'AI should know the company from context'
      },
      {
        name: 'AI Writes Personalized Email',
        query: 'Write me a cold email to this person',
        requiresInResponse: ['name', 'company'],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'Cold email should be personalized with name and company'
      },
      {
        name: 'AI Uses Intelligence Data',
        query: 'What is their influence level and how should I engage?',
        requiresInResponse: [],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'AI should use stored intelligence data'
      }
    ]
  },
  {
    category: 'Company Record Context',
    recordType: 'companies',
    tests: [
      {
        name: 'AI References Company Name',
        query: 'Tell me about this company',
        requiresInResponse: ['name'],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'AI should use the company name from context'
      },
      {
        name: 'AI Knows Industry',
        query: 'What industry is this company in?',
        requiresInResponse: [],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'AI should know the industry from context'
      },
      {
        name: 'AI Advises On Targeting',
        query: 'Who should I target at this company?',
        requiresInResponse: ['name'],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'AI should give targeting advice referencing the company'
      }
    ]
  },
  {
    category: 'Speedrun Context',
    recordType: 'speedrun-prospect',
    tests: [
      {
        name: 'AI Knows Speedrun Prospect',
        query: 'Tell me about this prospect',
        requiresInResponse: ['name'],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'AI should know speedrun prospect details'
      },
      {
        name: 'AI Gives Outreach Advice',
        query: 'How should I approach this prospect?',
        requiresInResponse: ['name'],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'AI should give personalized outreach advice'
      }
    ]
  },
  {
    category: 'Lead Record Context',
    recordType: 'leads',
    tests: [
      {
        name: 'AI References Lead',
        query: 'What should I do with this lead?',
        requiresInResponse: ['name'],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'AI should know lead details'
      }
    ]
  },
  {
    category: 'Opportunity Record Context',
    recordType: 'opportunities',
    tests: [
      {
        name: 'AI Knows Opportunity Details',
        query: 'Tell me about this opportunity',
        requiresInResponse: ['name'],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'AI should know opportunity details'
      },
      {
        name: 'AI Advises On Deal Advancement',
        query: 'How can I move this deal forward?',
        requiresInResponse: [],
        forbiddenInResponse: FORBIDDEN_PHRASES,
        description: 'AI should give deal advancement advice'
      }
    ]
  }
];

// Test data for file uploads
const TEST_FILES = {
  'test-misspelled-headers.csv': `Compnay Name,Webiste
Microsft,microsoft.com
Gogle,google.com
Amazn,amazon.com`,
  'empty.csv': ''
};

class AIRightPanelBattleTester {
  constructor(workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP') {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.workspaceId = workspaceId;
    this.testRecords = {};
    this.contextResults = [];
  }

  /**
   * Fetch sample records from database for context testing
   */
  async fetchTestRecords() {
    console.log('\n--- Fetching Test Records for Context Verification ---\n');
    
    try {
      // Fetch a person record
      const person = await prisma.people.findFirst({
        where: { 
          workspaceId: this.workspaceId,
          deletedAt: null,
          fullName: { not: null }
        },
        include: { company: true }
      });
      
      if (person) {
        this.testRecords.person = person;
        this.testRecords.people = person;
        this.testRecords['speedrun-prospect'] = {
          ...person,
          speedrunContext: {
            isSpeedrunProspect: true,
            currentApp: 'Speedrun',
            prospectIndex: 1
          }
        };
        this.testRecords.leads = { ...person, status: 'LEAD' };
        this.testRecords.prospects = { ...person, status: 'PROSPECT' };
        console.log(`  Found person: ${person.fullName}`);
      }
      
      // Fetch a company record
      const company = await prisma.companies.findFirst({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          name: { not: null }
        }
      });
      
      if (company) {
        this.testRecords.companies = company;
        console.log(`  Found company: ${company.name}`);
      }
      
      // Fetch an opportunity record
      const opportunity = await prisma.opportunities.findFirst({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null
        },
        include: { company: true }
      });
      
      if (opportunity) {
        this.testRecords.opportunities = opportunity;
        console.log(`  Found opportunity: ${opportunity.name}`);
      }
      
    } catch (error) {
      console.log(`  WARNING: Could not fetch test records: ${error.message}`);
    }
  }

  /**
   * Check if response contains any forbidden phrases
   */
  checkForbiddenPhrases(response) {
    const lowerResponse = response.toLowerCase();
    const found = [];
    
    for (const phrase of FORBIDDEN_PHRASES) {
      if (lowerResponse.includes(phrase.toLowerCase())) {
        found.push(phrase);
      }
    }
    
    return found;
  }

  /**
   * Check if response contains required fields from record
   */
  checkRequiredFields(response, record, requiredFields) {
    const lowerResponse = response.toLowerCase();
    const missing = [];
    const found = [];
    
    for (const field of requiredFields) {
      let value = null;
      
      switch (field) {
        case 'name':
          value = record.fullName || record.name || record.firstName;
          break;
        case 'company':
          value = record.companyName || record.company?.name;
          break;
        case 'title':
          value = record.jobTitle || record.title;
          break;
        case 'email':
          value = record.email;
          break;
        case 'industry':
          value = record.industry || record.company?.industry;
          break;
        default:
          value = record[field];
      }
      
      if (value && lowerResponse.includes(String(value).toLowerCase())) {
        found.push({ field, value });
      } else if (value) {
        missing.push({ field, value });
      }
    }
    
    return { found, missing };
  }

  async runAllTests() {
    console.log('================================================');
    console.log('   AI RIGHT PANEL BATTLE TESTING');
    console.log('================================================');
    console.log('Testing system resilience and data access\n');

    // Phase 1: Original battle tests
    console.log('\n========== PHASE 1: GENERAL RESILIENCE TESTS ==========\n');
    
    for (const scenario of BATTLE_TEST_SCENARIOS) {
      console.log(`\n--- Category: ${scenario.category} ---`);
      console.log(`User: ${scenario.user}`);

      for (const test of scenario.tests) {
        await this.runSingleTest(scenario.category, scenario.user, test);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Phase 2: Record context verification tests
    console.log('\n\n========== PHASE 2: RECORD CONTEXT VERIFICATION ==========\n');
    
    await this.fetchTestRecords();
    await this.runContextTests();

    // Print combined summary
    this.printSummary();
  }

  /**
   * Run record context verification tests
   */
  async runContextTests() {
    for (const scenario of RECORD_CONTEXT_SCENARIOS) {
      console.log(`\n--- ${scenario.category} ---`);
      
      const record = this.testRecords[scenario.recordType];
      
      if (!record) {
        console.log(`  SKIP: No ${scenario.recordType} record available`);
        continue;
      }
      
      const recordName = record.fullName || record.name || 'Unknown';
      console.log(`  Testing with: ${recordName}`);
      
      for (const test of scenario.tests) {
        await this.runContextTest(scenario, record, test);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  /**
   * Run a single context verification test
   */
  async runContextTest(scenario, record, test) {
    this.totalTests++;
    console.log(`\n  [TEST] ${test.name}`);
    console.log(`    Query: "${test.query}"`);
    
    try {
      // Call AI with record context
      const result = await this.testAIChatWithContext(record, scenario.recordType, test.query);
      
      if (!result.success) {
        console.log(`    [X] FAIL - API error: ${result.error}`);
        this.failedTests++;
        this.contextResults.push({
          category: scenario.category,
          test: test.name,
          passed: false,
          error: result.error
        });
        return;
      }
      
      const response = result.response || '';
      
      // Check for forbidden phrases
      const forbiddenFound = this.checkForbiddenPhrases(response);
      if (forbiddenFound.length > 0) {
        console.log(`    [X] FAIL - Contains forbidden phrase: "${forbiddenFound[0]}"`);
        this.failedTests++;
        this.contextResults.push({
          category: scenario.category,
          test: test.name,
          passed: false,
          error: `Contains forbidden phrase: ${forbiddenFound[0]}`
        });
        return;
      }
      
      // Check for required fields
      const { found, missing } = this.checkRequiredFields(response, record, test.requiresInResponse);
      
      if (missing.length > 0 && test.requiresInResponse.length > 0) {
        console.log(`    [X] FAIL - Missing personalization: ${missing.map(m => m.field).join(', ')}`);
        this.failedTests++;
        this.contextResults.push({
          category: scenario.category,
          test: test.name,
          passed: false,
          error: `Missing personalization: ${missing.map(m => m.field).join(', ')}`
        });
        return;
      }
      
      // Test passed
      console.log(`    [OK] PASS - Response is personalized and context-aware`);
      if (found.length > 0) {
        console.log(`         Found: ${found.map(f => f.field).join(', ')}`);
      }
      
      this.passedTests++;
      this.contextResults.push({
        category: scenario.category,
        test: test.name,
        passed: true,
        foundFields: found
      });
      
    } catch (error) {
      console.log(`    [X] FAIL - Error: ${error.message}`);
      this.failedTests++;
      this.contextResults.push({
        category: scenario.category,
        test: test.name,
        passed: false,
        error: error.message
      });
    }
  }

  /**
   * Test AI chat with record context (simulates frontend sending context)
   */
  async testAIChatWithContext(record, recordType, query) {
    try {
      const response = await fetch(`${API_BASE}/api/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          currentRecord: record,
          recordType: recordType,
          workspaceId: this.workspaceId,
          appType: recordType === 'speedrun-prospect' ? 'Speedrun' : 'Pipeline'
        })
      });

      const data = await response.json();
      
      return {
        success: response.ok && (data.response || data.message),
        response: data.response || data.message,
        statusCode: response.status,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runSingleTest(category, user, test) {
    this.totalTests++;
    console.log(`\n🧪 Test: ${test.name}`);
    console.log(`📝 Query: "${test.query}"`);
    console.log(`🎯 Expected: ${test.expectSuccess ? 'SUCCESS' : 'GRACEFUL_FAILURE'}`);

    try {
      let result;
      
      if (test.file) {
        // File upload test
        result = await this.testFileUpload(user, test.query, test.file);
      } else {
        // Regular AI chat test
        result = await this.testAIChat(user, test.query);
      }

      const success = this.evaluateResult(result, test.expectSuccess);
      
      if (success) {
        console.log('✅ PASS');
        this.passedTests++;
      } else {
        console.log('❌ FAIL');
        this.failedTests++;
      }

      this.results.push({
        category,
        user,
        test: test.name,
        query: test.query,
        expected: test.expectSuccess,
        actual: result.success,
        passed: success,
        response: result.response?.substring(0, 100) + '...',
        error: result.error
      });

    } catch (error) {
      console.log(`❌ FAIL - Error: ${error.message}`);
      this.failedTests++;
      
      this.results.push({
        category,
        user,
        test: test.name,
        query: test.query,
        expected: test.expectSuccess,
        actual: false,
        passed: false,
        error: error.message
      });
    }
  }

  async testAIChat(user, query) {
    try {
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          userId: user === 'tony@adrata.com' ? 'tony-luthor-test' : 'dan-mirolli',
          workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP'
        })
      });

      const data = await response.json();
      
      return {
        success: response.ok && data.response && data.response.length > 0,
        response: data.response || data.message,
        statusCode: response.status,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testFileUpload(user, query, filename) {
    try {
      // Create test file content
      const fileContent = TEST_FILES[filename] || '';
      
      const formData = new FormData();
      formData.append('file', new Blob([fileContent], { type: 'text/csv' }), filename);
      formData.append('message', query);
      formData.append('userId', user === 'tony@adrata.com' ? 'tony-luthor-test' : 'dan-mirolli');
      formData.append('workspaceId', '01K1VBYXHD0J895XAN0HGFBKJP');

      const response = await fetch(`${API_BASE}/api/ai/chat/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      return {
        success: response.ok && data.response && data.response.length > 0,
        response: data.response || data.message,
        statusCode: response.status,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  evaluateResult(result, expectedSuccess) {
    if (expectedSuccess) {
      // Test should succeed
      return result.success && result.response && !result.error;
    } else {
      // Test should fail gracefully (return helpful error message)
      return !result.success && result.response && result.response.includes('clarification' || 'help' || 'understand');
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('   BATTLE TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);

    // Failed general tests
    const failedGeneralTests = this.results.filter(r => !r.passed);
    if (failedGeneralTests.length > 0) {
      console.log('\nFAILED GENERAL TESTS:');
      failedGeneralTests.forEach(r => {
        console.log(`  [X] ${r.category} - ${r.test}`);
        console.log(`      Query: "${r.query}"`);
        console.log(`      Error: ${r.error || 'Unexpected result'}`);
      });
    }

    // Failed context tests
    const failedContextTests = this.contextResults.filter(r => !r.passed);
    if (failedContextTests.length > 0) {
      console.log('\nFAILED CONTEXT VERIFICATION TESTS:');
      failedContextTests.forEach(r => {
        console.log(`  [X] ${r.category} - ${r.test}`);
        console.log(`      Error: ${r.error}`);
      });
    }

    // Context test summary
    if (this.contextResults.length > 0) {
      const contextPassed = this.contextResults.filter(r => r.passed).length;
      const contextTotal = this.contextResults.length;
      const contextRate = Math.round((contextPassed / contextTotal) * 100);
      
      console.log('\n--- CONTEXT VERIFICATION RESULTS ---');
      console.log(`Context Tests: ${contextTotal}`);
      console.log(`Passed: ${contextPassed}`);
      console.log(`Failed: ${contextTotal - contextPassed}`);
      console.log(`Pass Rate: ${contextRate}%`);
      
      // Check for any forbidden phrase failures
      const forbiddenFailures = this.contextResults.filter(r => 
        !r.passed && r.error?.includes('forbidden phrase')
      );
      
      if (forbiddenFailures.length > 0) {
        console.log(`\nWARNING: ${forbiddenFailures.length} tests failed due to "no context" responses`);
        console.log('This indicates the AI is not receiving or using record data properly.');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('   PRODUCTION READINESS ASSESSMENT');
    console.log('='.repeat(80));
    
    const successRate = (this.passedTests / this.totalTests) * 100;
    const contextRate = this.contextResults.length > 0
      ? (this.contextResults.filter(r => r.passed).length / this.contextResults.length) * 100
      : 100;
    
    // Overall assessment
    const overallScore = (successRate + contextRate) / 2;
    
    console.log(`\nGeneral Resilience: ${successRate.toFixed(1)}%`);
    console.log(`Context Verification: ${contextRate.toFixed(1)}%`);
    console.log(`Overall Score: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 90) {
      console.log('\n[EXCELLENT] System is ready for production!');
      console.log('AI has full data access and responds appropriately.');
    } else if (overallScore >= 80) {
      console.log('\n[GOOD] System is mostly ready.');
      console.log('Minor issues need attention before launch.');
    } else if (overallScore >= 70) {
      console.log('\n[FAIR] System needs work.');
      console.log('Several issues need fixing before launch.');
    } else {
      console.log('\n[NEEDS ATTENTION] System has significant issues.');
      console.log('Major issues must be resolved before launch.');
    }

    console.log('\n' + '='.repeat(80));

    // Return results for programmatic use
    return {
      totalTests: this.totalTests,
      passed: this.passedTests,
      failed: this.failedTests,
      successRate,
      contextRate,
      overallScore,
      generalResults: this.results,
      contextResults: this.contextResults
    };
  }
}

// Export for use as module
module.exports = { 
  AIRightPanelBattleTester, 
  BATTLE_TEST_SCENARIOS, 
  RECORD_CONTEXT_SCENARIOS,
  FORBIDDEN_PHRASES,
  RECORD_TYPES
};

// Run the battle tests
if (require.main === module) {
  const args = process.argv.slice(2);
  const workspaceId = args[0] || process.env.WORKSPACE_ID || '01K1VBYXHD0J895XAN0HGFBKJP';
  
  console.log('Starting AI Right Panel Battle Testing...');
  console.log(`Workspace: ${workspaceId}\n`);
  
  const tester = new AIRightPanelBattleTester(workspaceId);
  tester.runAllTests()
    .then((results) => {
      console.log('\nBattle testing complete!');
      
      // Exit with error code if too many failures
      if (results && results.overallScore < 70) {
        console.log('\nExiting with error - too many failures.');
        process.exit(1);
      }
      
      process.exit(0);
    })
    .catch((error) => {
      console.error('Battle testing failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
