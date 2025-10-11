#!/usr/bin/env node

/**
 * 🧪 OPENROUTER INTEGRATION TEST
 * 
 * Parallel testing script to validate OpenRouter integration
 * and compare responses with Claude direct integration.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  testQueries: [
    {
      name: 'Simple Query',
      message: 'What is AI?',
      expectedComplexity: 'simple',
      expectedCost: 0.001
    },
    {
      name: 'Standard Query',
      message: 'How can I improve my sales pipeline?',
      expectedComplexity: 'standard',
      expectedCost: 0.01
    },
    {
      name: 'Complex Query',
      message: 'Analyze the buyer group strategy for enterprise software companies and recommend optimization approaches for our sales team',
      expectedComplexity: 'complex',
      expectedCost: 0.05
    },
    {
      name: 'Research Query',
      message: 'Search for the latest trends in AI-powered sales tools and find current market leaders',
      expectedComplexity: 'research',
      expectedCost: 0.02
    }
  ],
  iterations: 3,
  timeout: 30000
};

// Test results storage
const testResults = {
  openRouter: [],
  claude: [],
  comparison: [],
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    averageCostSavings: 0,
    averageResponseTime: 0
  }
};

/**
 * Make HTTP request to API endpoint
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: TEST_CONFIG.timeout
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test OpenRouter integration
 */
async function testOpenRouter(query, iteration) {
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/ai-chat`, {
      message: query.message,
      appType: 'pipeline',
      workspaceId: 'test-workspace',
      userId: 'test-user',
      useOpenRouter: true,
      context: {
        testRun: true,
        iteration,
        timestamp: new Date().toISOString()
      }
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    return {
      success: response.status === 200 && response.data.success,
      response: response.data.response,
      metadata: response.data.metadata,
      processingTime,
      error: response.data.error || null,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
      status: 500
    };
  }
}

/**
 * Test Claude direct integration
 */
async function testClaude(query, iteration) {
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/ai-chat`, {
      message: query.message,
      appType: 'pipeline',
      workspaceId: 'test-workspace',
      userId: 'test-user',
      useOpenRouter: false, // Force Claude direct
      context: {
        testRun: true,
        iteration,
        timestamp: new Date().toISOString()
      }
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    return {
      success: response.status === 200 && response.data.success,
      response: response.data.response,
      metadata: response.data.metadata,
      processingTime,
      error: response.data.error || null,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
      status: 500
    };
  }
}

/**
 * Run parallel test for a single query
 */
async function runParallelTest(query, iteration) {
  console.log(`\n🧪 Testing: ${query.name} (Iteration ${iteration + 1})`);
  console.log(`📝 Query: "${query.message}"`);

  // Run both tests in parallel
  const [openRouterResult, claudeResult] = await Promise.all([
    testOpenRouter(query, iteration),
    testClaude(query, iteration)
  ]);

  // Store results
  testResults.openRouter.push({
    query: query.name,
    iteration,
    ...openRouterResult
  });

  testResults.claude.push({
    query: query.name,
    iteration,
    ...claudeResult
  });

  // Compare results
  const comparison = {
    query: query.name,
    iteration,
    openRouterSuccess: openRouterResult.success,
    claudeSuccess: claudeResult.success,
    openRouterTime: openRouterResult.processingTime,
    claudeTime: claudeResult.processingTime,
    openRouterCost: openRouterResult.metadata?.cost || 0,
    claudeCost: claudeResult.metadata?.cost || 0,
    openRouterModel: openRouterResult.metadata?.model || 'unknown',
    claudeModel: claudeResult.metadata?.model || 'unknown',
    complexity: openRouterResult.metadata?.routingInfo?.complexity || 0,
    fallbackUsed: openRouterResult.metadata?.routingInfo?.fallbackUsed || false
  };

  testResults.comparison.push(comparison);

  // Log results
  console.log(`✅ OpenRouter: ${openRouterResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   Model: ${comparison.openRouterModel}`);
  console.log(`   Cost: $${comparison.openRouterCost.toFixed(4)}`);
  console.log(`   Time: ${comparison.openRouterTime}ms`);
  console.log(`   Complexity: ${comparison.complexity}`);
  
  console.log(`✅ Claude: ${claudeResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   Model: ${comparison.claudeModel}`);
  console.log(`   Cost: $${comparison.claudeCost.toFixed(4)}`);
  console.log(`   Time: ${comparison.claudeTime}ms`);

  if (openRouterResult.success && claudeResult.success) {
    const costSavings = comparison.claudeCost > 0 ? 
      ((comparison.claudeCost - comparison.openRouterCost) / comparison.claudeCost) * 100 : 0;
    console.log(`💰 Cost Savings: ${costSavings.toFixed(1)}%`);
  }

  return comparison;
}

/**
 * Generate test report
 */
function generateReport() {
  const totalTests = testResults.comparison.length;
  const successfulTests = testResults.comparison.filter(t => t.openRouterSuccess && t.claudeSuccess).length;
  const failedTests = totalTests - successfulTests;

  // Calculate averages
  const avgOpenRouterTime = testResults.comparison.reduce((sum, t) => sum + t.openRouterTime, 0) / totalTests;
  const avgClaudeTime = testResults.comparison.reduce((sum, t) => sum + t.claudeTime, 0) / totalTests;
  
  const totalOpenRouterCost = testResults.comparison.reduce((sum, t) => sum + t.openRouterCost, 0);
  const totalClaudeCost = testResults.comparison.reduce((sum, t) => sum + t.claudeCost, 0);
  const avgCostSavings = totalClaudeCost > 0 ? ((totalClaudeCost - totalOpenRouterCost) / totalClaudeCost) * 100 : 0;

  // Model usage statistics
  const modelUsage = {};
  testResults.comparison.forEach(t => {
    modelUsage[t.openRouterModel] = (modelUsage[t.openRouterModel] || 0) + 1;
  });

  // Complexity distribution
  const complexityDistribution = {
    simple: testResults.comparison.filter(t => t.complexity < 30).length,
    standard: testResults.comparison.filter(t => t.complexity >= 30 && t.complexity < 70).length,
    complex: testResults.comparison.filter(t => t.complexity >= 70).length
  };

  testResults.summary = {
    totalTests,
    passed: successfulTests,
    failed: failedTests,
    averageCostSavings: avgCostSavings,
    averageResponseTime: avgOpenRouterTime,
    totalOpenRouterCost,
    totalClaudeCost,
    modelUsage,
    complexityDistribution,
    fallbackRate: testResults.comparison.filter(t => t.fallbackUsed).length / totalTests * 100
  };

  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${successfulTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${(successfulTests / totalTests * 100).toFixed(1)}%`);
  console.log(`\n💰 COST ANALYSIS`);
  console.log(`Total OpenRouter Cost: $${totalOpenRouterCost.toFixed(4)}`);
  console.log(`Total Claude Cost: $${totalClaudeCost.toFixed(4)}`);
  console.log(`Average Cost Savings: ${avgCostSavings.toFixed(1)}%`);
  console.log(`\n⚡ PERFORMANCE`);
  console.log(`Average OpenRouter Time: ${avgOpenRouterTime.toFixed(0)}ms`);
  console.log(`Average Claude Time: ${avgClaudeTime.toFixed(0)}ms`);
  console.log(`\n🎯 MODEL USAGE`);
  Object.entries(modelUsage).forEach(([model, count]) => {
    console.log(`${model}: ${count} times (${(count / totalTests * 100).toFixed(1)}%)`);
  });
  console.log(`\n🧠 COMPLEXITY DISTRIBUTION`);
  console.log(`Simple: ${complexityDistribution.simple} (${(complexityDistribution.simple / totalTests * 100).toFixed(1)}%)`);
  console.log(`Standard: ${complexityDistribution.standard} (${(complexityDistribution.standard / totalTests * 100).toFixed(1)}%)`);
  console.log(`Complex: ${complexityDistribution.complex} (${(complexityDistribution.complex / totalTests * 100).toFixed(1)}%)`);
  console.log(`\n🔄 FALLBACK RATE: ${testResults.summary.fallbackRate.toFixed(1)}%`);

  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'output', 'openrouter-test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return testResults.summary;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting OpenRouter Integration Tests');
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`Test Queries: ${TEST_CONFIG.testQueries.length}`);
  console.log(`Iterations per query: ${TEST_CONFIG.iterations}`);

  const startTime = Date.now();

  try {
    // Run all tests
    for (const query of TEST_CONFIG.testQueries) {
      for (let i = 0; i < TEST_CONFIG.iterations; i++) {
        await runParallelTest(query, i);
        testResults.summary.totalTests++;
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`\n⏱️ Total test time: ${(totalTime / 1000).toFixed(1)}s`);

    // Generate and return report
    const summary = generateReport();
    
    // Determine if tests passed
    const successRate = (summary.passed / summary.totalTests) * 100;
    const costSavingsTarget = 20; // 20% minimum cost savings
    
    if (successRate >= 80 && summary.averageCostSavings >= costSavingsTarget) {
      console.log('\n✅ TESTS PASSED - OpenRouter integration is working correctly!');
      process.exit(0);
    } else {
      console.log('\n❌ TESTS FAILED - Issues detected with OpenRouter integration');
      if (successRate < 80) {
        console.log(`   - Success rate too low: ${successRate.toFixed(1)}% (target: 80%)`);
      }
      if (summary.averageCostSavings < costSavingsTarget) {
        console.log(`   - Cost savings too low: ${summary.averageCostSavings.toFixed(1)}% (target: ${costSavingsTarget}%)`);
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testOpenRouter, testClaude };
