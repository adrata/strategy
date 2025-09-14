/**
 * Battle Test AI Right Panel - Comprehensive User Scenario Testing
 * Tests various user types, misspellings, nonsensical requests, and edge cases
 * Purpose: Ensure system is bulletproof for Monday launch
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

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

// Test data for file uploads
const TEST_FILES = {
  'test-misspelled-headers.csv': `Compnay Name,Webiste
Microsft,microsoft.com
Gogle,google.com
Amazn,amazon.com`,
  'empty.csv': ''
};

class AIRightPanelBattleTester {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runAllTests() {
    console.log('🚀 Starting AI Right Panel Battle Testing...');
    console.log('🎯 Testing system resilience for Monday launch\n');

    for (const scenario of BATTLE_TEST_SCENARIOS) {
      console.log(`\n📋 Testing Category: ${scenario.category}`);
      console.log(`👤 User: ${scenario.user}`);
      console.log('─'.repeat(60));

      for (const test of scenario.tests) {
        await this.runSingleTest(scenario.category, scenario.user, test);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.printSummary();
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
    console.log('🎯 BATTLE TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`📊 Total Tests: ${this.totalTests}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`📈 Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);

    if (this.failedTests > 0) {
      console.log('\n🚨 FAILED TESTS:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`❌ ${r.category} - ${r.test}`);
          console.log(`   Query: "${r.query}"`);
          console.log(`   Error: ${r.error || 'Unexpected result'}`);
        });
    }

    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT:');
    const successRate = (this.passedTests / this.totalTests) * 100;
    
    if (successRate >= 90) {
      console.log('🟢 EXCELLENT - System is ready for launch!');
    } else if (successRate >= 80) {
      console.log('🟡 GOOD - Minor issues need attention before launch');
    } else if (successRate >= 70) {
      console.log('🟠 FAIR - Several issues need fixing before launch');
    } else {
      console.log('🔴 POOR - Major issues must be resolved before launch');
    }

    console.log('\n📋 Detailed Results:');
    console.table(this.results.map(r => ({
      Category: r.category,
      Test: r.test,
      Expected: r.expected ? 'SUCCESS' : 'FAIL',
      Actual: r.actual ? 'SUCCESS' : 'FAIL',
      Status: r.passed ? '✅' : '❌'
    })));
  }
}

// Run the battle tests
if (require.main === module) {
  const tester = new AIRightPanelBattleTester();
  tester.runAllTests()
    .then(() => {
      console.log('\n🏁 Battle testing complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Battle testing failed:', error);
      process.exit(1);
    });
}

module.exports = { AIRightPanelBattleTester };
