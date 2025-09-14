#!/usr/bin/env node

/**
 * Complex User Scenarios Test
 * Tests limitless possibilities and intelligent intent processing
 * Covers geographic queries, industry filtering, growth indicators, and more
 */

// Use native fetch in Node.js 18+ or fallback to node-fetch
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    fetch = require('node-fetch');
  }
} catch (error) {
  fetch = require('node-fetch');
}

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
  userId: 'tony-luthor-test'
};

class ComplexUserScenariosTest {
  constructor() {
    this.testResults = [];
    this.scenarios = this.buildTestScenarios();
  }

  buildTestScenarios() {
    return [
      // Geographic-based queries
      {
        category: 'Geographic Queries',
        scenarios: [
          {
            query: "Find me all the hospitals in Arizona",
            expectedIntent: 'company_search',
            expectedFilters: { industry: 'healthcare', location: 'Arizona', type: 'hospital' },
            complexity: 'medium'
          },
          {
            query: "Show me tech companies in Silicon Valley",
            expectedIntent: 'company_search',
            expectedFilters: { industry: 'technology', location: 'Silicon Valley' },
            complexity: 'medium'
          },
          {
            query: "Find manufacturing companies in the Midwest",
            expectedIntent: 'company_search',
            expectedFilters: { industry: 'manufacturing', region: 'Midwest' },
            complexity: 'medium'
          },
          {
            query: "List all banks in New York City",
            expectedIntent: 'company_search',
            expectedFilters: { industry: 'financial_services', location: 'New York City', type: 'bank' },
            complexity: 'medium'
          }
        ]
      },

      // Industry + Growth indicators
      {
        category: 'Growth & Industry Analysis',
        scenarios: [
          {
            query: "Find me all the growing SaaS companies",
            expectedIntent: 'company_search',
            expectedFilters: { industry: 'software', businessModel: 'SaaS', growthIndicator: 'growing' },
            complexity: 'high'
          },
          {
            query: "Show me fast-growing fintech startups",
            expectedIntent: 'company_search',
            expectedFilters: { industry: 'fintech', stage: 'startup', growthIndicator: 'fast-growing' },
            complexity: 'high'
          },
          {
            query: "Find recently funded biotech companies",
            expectedIntent: 'company_search',
            expectedFilters: { industry: 'biotechnology', fundingStatus: 'recently_funded' },
            complexity: 'high'
          },
          {
            query: "List unicorn companies in AI space",
            expectedIntent: 'company_search',
            expectedFilters: { industry: 'artificial_intelligence', valuation: 'unicorn' },
            complexity: 'high'
          }
        ]
      },

      // Role-based queries with complexity
      {
        category: 'Complex Role Searches',
        scenarios: [
          {
            query: "Find me CTOs at Series B companies in cybersecurity",
            expectedIntent: 'people_search',
            expectedFilters: { role: 'CTO', fundingStage: 'Series B', industry: 'cybersecurity' },
            complexity: 'high'
          },
          {
            query: "Show me VPs of Sales at companies with 100-500 employees",
            expectedIntent: 'people_search',
            expectedFilters: { role: 'VP of Sales', companySize: '100-500' },
            complexity: 'medium'
          },
          {
            query: "Find Chief Marketing Officers at B2B SaaS companies",
            expectedIntent: 'people_search',
            expectedFilters: { role: 'CMO', businessModel: 'B2B SaaS' },
            complexity: 'medium'
          },
          {
            query: "List HR Directors at remote-first companies",
            expectedIntent: 'people_search',
            expectedFilters: { role: 'HR Director', workModel: 'remote-first' },
            complexity: 'medium'
          }
        ]
      },

      // Fuzzy matching and misspellings
      {
        category: 'Fuzzy Matching & Error Handling',
        scenarios: [
          {
            query: "Find me a VP of Saels at Nkie", // Misspelled "Sales" and "Nike"
            expectedIntent: 'people_search',
            expectedCorrections: { 'Saels': 'Sales', 'Nkie': 'Nike' },
            complexity: 'medium'
          },
          {
            query: "Show me CFOs at Mircosoft", // Misspelled "Microsoft"
            expectedIntent: 'people_search',
            expectedCorrections: { 'Mircosoft': 'Microsoft' },
            complexity: 'low'
          },
          {
            query: "Find cheif technology officers at startps", // Multiple misspellings
            expectedIntent: 'people_search',
            expectedCorrections: { 'cheif': 'chief', 'startps': 'startups' },
            complexity: 'medium'
          }
        ]
      },

      // Nonsensical requests (should handle gracefully)
      {
        category: 'Nonsensical Requests',
        scenarios: [
          {
            query: "Find me purple elephants in the cloud",
            expectedIntent: 'unclear',
            expectedResponse: 'clarification_needed',
            complexity: 'high'
          },
          {
            query: "asdfghjkl qwertyuiop",
            expectedIntent: 'invalid',
            expectedResponse: 'invalid_input',
            complexity: 'low'
          },
          {
            query: "Show me the CEO of the moon",
            expectedIntent: 'unclear',
            expectedResponse: 'clarification_needed',
            complexity: 'medium'
          }
        ]
      },

      // Complex multi-criteria searches
      {
        category: 'Multi-Criteria Complex Searches',
        scenarios: [
          {
            query: "Find me VPs of Engineering at profitable SaaS companies in California with 200+ employees",
            expectedIntent: 'people_search',
            expectedFilters: {
              role: 'VP of Engineering',
              businessModel: 'SaaS',
              profitability: 'profitable',
              location: 'California',
              employeeCount: '200+'
            },
            complexity: 'very_high'
          },
          {
            query: "Show me recently hired CTOs at Series A fintech companies that raised funding in 2024",
            expectedIntent: 'people_search',
            expectedFilters: {
              role: 'CTO',
              hiringStatus: 'recently_hired',
              fundingStage: 'Series A',
              industry: 'fintech',
              fundingYear: '2024'
            },
            complexity: 'very_high'
          }
        ]
      },

      // Industry-specific specialized queries
      {
        category: 'Industry-Specific Queries',
        scenarios: [
          {
            query: "Find me all the credit unions in Texas",
            expectedIntent: 'company_search',
            expectedFilters: { type: 'credit_union', location: 'Texas' },
            complexity: 'medium'
          },
          {
            query: "Show me law firms specializing in IP law",
            expectedIntent: 'company_search',
            expectedFilters: { industry: 'legal', specialization: 'intellectual_property' },
            complexity: 'medium'
          },
          {
            query: "Find construction companies working on commercial projects",
            expectedIntent: 'company_search',
            expectedFilters: { industry: 'construction', projectType: 'commercial' },
            complexity: 'medium'
          },
          {
            query: "List all the title companies in Florida",
            expectedIntent: 'company_search',
            expectedFilters: { industry: 'real_estate', type: 'title_company', location: 'Florida' },
            complexity: 'medium'
          }
        ]
      },

      // Entry-level seller scenarios
      {
        category: 'Entry-Level Seller Scenarios',
        scenarios: [
          {
            query: "I need to find some leads for my territory",
            expectedIntent: 'lead_generation',
            expectedResponse: 'territory_clarification',
            complexity: 'medium'
          },
          {
            query: "Help me find companies to call today",
            expectedIntent: 'lead_generation',
            expectedResponse: 'criteria_clarification',
            complexity: 'low'
          },
          {
            query: "Who should I reach out to at Apple?",
            expectedIntent: 'people_search',
            expectedFilters: { company: 'Apple' },
            expectedResponse: 'role_clarification',
            complexity: 'medium'
          }
        ]
      },

      // CRO/Executive scenarios
      {
        category: 'CRO/Executive Scenarios',
        scenarios: [
          {
            query: "Show me market penetration analysis for our target accounts",
            expectedIntent: 'market_analysis',
            expectedResponse: 'account_list_needed',
            complexity: 'very_high'
          },
          {
            query: "Find me competitive intelligence on companies using Salesforce",
            expectedIntent: 'competitive_analysis',
            expectedFilters: { technology: 'Salesforce' },
            complexity: 'high'
          },
          {
            query: "Analyze buying committee structure at Fortune 500 companies",
            expectedIntent: 'buyer_group_analysis',
            expectedFilters: { companyType: 'Fortune 500' },
            complexity: 'very_high'
          }
        ]
      }
    ];
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Running: ${testName}`);
    try {
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'PASS',
        duration,
        result
      });
      
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'FAIL',
        error: error.message
      });
      
      console.error(`❌ ${testName} - FAILED: ${error.message}`);
      return { error: error.message };
    }
  }

  async testAIIntentProcessing(scenario) {
    const testName = `AI Intent: "${scenario.query.substring(0, 50)}..."`;
    
    return this.runTest(testName, async () => {
      // Test the AI chat endpoint for intent processing
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: scenario.query,
          workspaceId: TEST_CONFIG.workspaceId,
          userId: TEST_CONFIG.userId,
          context: 'intent_analysis'
        })
      });

      if (!response.ok) {
        throw new Error(`AI Chat API failed: ${response.status}`);
      }

      const result = await response.json();

      // Analyze the response for intent detection
      const analysis = {
        query: scenario.query,
        detectedIntent: this.extractIntent(result.response),
        expectedIntent: scenario.expectedIntent,
        complexity: scenario.complexity,
        responseTime: result.responseTime || 0,
        confidence: result.confidence || 0
      };

      // Check if corrections were suggested for misspellings
      if (scenario.expectedCorrections) {
        analysis.corrections = this.extractCorrections(result.response);
        analysis.expectedCorrections = scenario.expectedCorrections;
      }

      return analysis;
    });
  }

  async testCoreSignalQuery(scenario) {
    const testName = `CoreSignal: "${scenario.query.substring(0, 50)}..."`;
    
    return this.runTest(testName, async () => {
      // Test the CoreSignal API endpoint
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai/coresignal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: scenario.query,
          workspaceId: TEST_CONFIG.workspaceId,
          userId: TEST_CONFIG.userId,
          maxResults: 10
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        // For nonsensical queries, we expect graceful handling
        if (scenario.category === 'Nonsensical Requests') {
          return {
            query: scenario.query,
            handled_gracefully: true,
            error_message: errorText,
            status: response.status
          };
        }
        throw new Error(`CoreSignal API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      return {
        query: scenario.query,
        success: result.success,
        resultsCount: result.results?.length || 0,
        confidence: result.confidence || 0,
        provider: result.provider,
        responseTime: result.responseTime || 0
      };
    });
  }

  async testRoleFinderPipeline(scenario) {
    if (scenario.expectedIntent !== 'people_search') {
      return { skipped: true, reason: 'Not a people search scenario' };
    }

    const testName = `Role Finder: "${scenario.query.substring(0, 50)}..."`;
    
    return this.runTest(testName, async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/role-finder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: scenario.query,
          workspaceId: TEST_CONFIG.workspaceId,
          userId: TEST_CONFIG.userId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Role Finder API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      return {
        query: scenario.query,
        success: result.success,
        resultsCount: result.results?.length || 0,
        confidence: result.confidence || 0,
        accuracy: result.accuracy || 0
      };
    });
  }

  extractIntent(response) {
    // Simple intent extraction from AI response
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('find') && lowerResponse.includes('companies')) {
      return 'company_search';
    }
    if (lowerResponse.includes('find') && (lowerResponse.includes('people') || lowerResponse.includes('cto') || lowerResponse.includes('ceo'))) {
      return 'people_search';
    }
    if (lowerResponse.includes('analysis') || lowerResponse.includes('analyze')) {
      return 'analysis';
    }
    if (lowerResponse.includes('clarify') || lowerResponse.includes('unclear')) {
      return 'unclear';
    }
    if (lowerResponse.includes('invalid') || lowerResponse.includes('understand')) {
      return 'invalid';
    }
    
    return 'unknown';
  }

  extractCorrections(response) {
    // Extract suggested corrections from AI response
    const corrections = {};
    const correctionPatterns = [
      /did you mean "([^"]+)" instead of "([^"]+)"/gi,
      /correcting "([^"]+)" to "([^"]+)"/gi
    ];

    correctionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        corrections[match[2]] = match[1]; // original -> corrected
      }
    });

    return corrections;
  }

  async runScenarioCategory(category) {
    console.log(`\n📂 Testing Category: ${category.category}`);
    const categoryResults = [];

    for (const scenario of category.scenarios) {
      console.log(`\n🎯 Scenario: ${scenario.query}`);
      console.log(`   Complexity: ${scenario.complexity}`);

      // Test AI intent processing
      const intentResult = await this.testAIIntentProcessing(scenario);
      categoryResults.push({ type: 'intent', ...intentResult });

      // Test CoreSignal query (if applicable)
      const coreSignalResult = await this.testCoreSignalQuery(scenario);
      categoryResults.push({ type: 'coresignal', ...coreSignalResult });

      // Test Role Finder pipeline (if applicable)
      const roleFinderResult = await this.testRoleFinderPipeline(scenario);
      if (!roleFinderResult.skipped) {
        categoryResults.push({ type: 'role_finder', ...roleFinderResult });
      }

      // Small delay between scenarios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return categoryResults;
  }

  async run() {
    console.log('🚀 Starting Complex User Scenarios Test');
    console.log('Testing limitless possibilities and intelligent intent processing');
    console.log(`Total scenarios: ${this.scenarios.reduce((sum, cat) => sum + cat.scenarios.length, 0)}`);

    const allResults = [];

    try {
      for (const category of this.scenarios) {
        const categoryResults = await this.runScenarioCategory(category);
        allResults.push({
          category: category.category,
          results: categoryResults
        });
      }

      // Print comprehensive summary
      console.log('\n📊 Comprehensive Test Summary:');
      
      const totalTests = this.testResults.length;
      const passed = this.testResults.filter(t => t.status === 'PASS').length;
      const failed = this.testResults.filter(t => t.status === 'FAIL').length;
      
      console.log(`✅ Total Passed: ${passed}`);
      console.log(`❌ Total Failed: ${failed}`);
      console.log(`📈 Success Rate: ${((passed / totalTests) * 100).toFixed(1)}%`);

      // Category breakdown
      console.log('\n📂 Results by Category:');
      for (const categoryResult of allResults) {
        const categoryTests = this.testResults.filter(t => 
          t.name.includes(categoryResult.category) || 
          categoryResult.results.some(r => t.name.includes(r.query?.substring(0, 20)))
        );
        const categoryPassed = categoryTests.filter(t => t.status === 'PASS').length;
        const categoryTotal = categoryTests.length;
        
        console.log(`  ${categoryResult.category}: ${categoryPassed}/${categoryTotal} (${((categoryPassed/categoryTotal)*100).toFixed(1)}%)`);
      }

      // Intelligence assessment
      console.log('\n🧠 Intelligence Assessment:');
      const intentAccuracy = this.assessIntentAccuracy();
      const errorHandling = this.assessErrorHandling();
      const complexityHandling = this.assessComplexityHandling();

      console.log(`  Intent Detection Accuracy: ${intentAccuracy.toFixed(1)}%`);
      console.log(`  Error Handling Quality: ${errorHandling.toFixed(1)}%`);
      console.log(`  Complex Query Handling: ${complexityHandling.toFixed(1)}%`);

      if (passed === totalTests) {
        console.log('\n🎉 ALL TESTS PASSED! System is ready for limitless user scenarios.');
      } else {
        console.log(`\n⚠️  ${failed} tests failed. System needs improvement before launch.`);
      }

    } catch (error) {
      console.error('\n💥 Test suite failed:', error.message);
    }
  }

  assessIntentAccuracy() {
    const intentTests = this.testResults.filter(t => t.name.includes('AI Intent'));
    const accurate = intentTests.filter(t => 
      t.result && t.result.detectedIntent === t.result.expectedIntent
    ).length;
    return intentTests.length > 0 ? (accurate / intentTests.length) * 100 : 0;
  }

  assessErrorHandling() {
    const errorTests = this.testResults.filter(t => 
      t.name.includes('Nonsensical') || t.name.includes('Fuzzy')
    );
    const handledWell = errorTests.filter(t => t.status === 'PASS').length;
    return errorTests.length > 0 ? (handledWell / errorTests.length) * 100 : 0;
  }

  assessComplexityHandling() {
    const complexTests = this.testResults.filter(t => 
      t.result && (t.result.complexity === 'high' || t.result.complexity === 'very_high')
    );
    const handled = complexTests.filter(t => t.status === 'PASS').length;
    return complexTests.length > 0 ? (handled / complexTests.length) * 100 : 0;
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new ComplexUserScenariosTest();
  test.run().catch(console.error);
}

module.exports = ComplexUserScenariosTest;
