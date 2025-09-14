#!/usr/bin/env node

/**
 * 🧪 PIPELINE INTEGRATION TEST SCRIPT
 * 
 * Quick validation script to test the integrated pipeline before running
 * the full dashboard testing. This ensures the basic integration works.
 */

// Use dynamic import for fetch in Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test company for quick validation
const TEST_COMPANY = {
  Website: 'stripe.com',
  'Top 1000': '0',
  'Account Owner': 'Integration Test'
};

async function testPipelineIntegration() {
  console.log('🧪 TESTING PIPELINE INTEGRATION');
  console.log('=' .repeat(60));
  console.log(`Testing with: ${TEST_COMPANY.Website}`);
  
  const startTime = Date.now();
  
  try {
    // Test the main pipeline endpoint
    console.log('\n📍 Testing main pipeline endpoint...');
    const response = await fetch('http://localhost:3000/api/top100/pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company: TEST_COMPANY
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log('\n✅ PIPELINE INTEGRATION TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`⏱️  Processing Time: ${Math.round(totalTime / 1000)}s`);
    console.log(`✅ Success: ${result.success}`);
    
    if (result.success && result.result && result.result.length > 0) {
      const companyResult = result.result[0];
      
      console.log(`🏢 Company: ${companyResult.companyName}`);
      console.log(`👔 CFO: ${companyResult.cfo?.name || 'Not found'} (${companyResult.cfo?.confidence || 0}%)`);
      console.log(`📈 CRO: ${companyResult.cro?.name || 'Not found'} (${companyResult.cro?.confidence || 0}%)`);
      console.log(`📧 CFO Email: ${companyResult.cfo?.email || 'Not found'}`);
      console.log(`📧 CRO Email: ${companyResult.cro?.email || 'Not found'}`);
      console.log(`🎯 Overall Confidence: ${companyResult.overallConfidence}%`);
      console.log(`🔬 Research Method: ${companyResult.researchMethod}`);
      
      // Check if this is real API integration vs simulated
      const isRealAPI = companyResult.researchMethod?.includes('Real API');
      console.log(`🚀 Real API Integration: ${isRealAPI ? '✅ YES' : '❌ NO (still simulated)'}`);
      
      if (companyResult.acquisitionInfo?.isAcquired) {
        console.log(`🏢 Acquisition: ${companyResult.acquisitionInfo.parentCompany}`);
      }
      
      if (result.result.length > 1) {
        console.log(`📋 Additional Records: ${result.result.length - 1} (parent companies/PE firms)`);
      }
      
      // Validation checks
      console.log('\n🔍 VALIDATION CHECKS');
      console.log('=' .repeat(40));
      
      const checks = [
        { name: 'Company name extracted', passed: !!companyResult.companyName },
        { name: 'CFO or CRO found', passed: !!(companyResult.cfo?.name || companyResult.cro?.name) },
        { name: 'Contact information', passed: !!(companyResult.cfo?.email || companyResult.cro?.email) },
        { name: 'Confidence > 0%', passed: companyResult.overallConfidence > 0 },
        { name: 'Processing < 2 minutes', passed: totalTime < 120000 },
        { name: 'Real API integration', passed: isRealAPI }
      ];
      
      let passedChecks = 0;
      checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
        if (check.passed) passedChecks++;
      });
      
      const successRate = (passedChecks / checks.length) * 100;
      console.log(`\n📊 Validation Score: ${passedChecks}/${checks.length} (${Math.round(successRate)}%)`);
      
      if (successRate >= 80) {
        console.log('🎉 INTEGRATION TEST PASSED - Ready for dashboard testing!');
      } else if (successRate >= 60) {
        console.log('⚠️  INTEGRATION TEST PARTIAL - Some issues need attention');
      } else {
        console.log('❌ INTEGRATION TEST FAILED - Significant issues detected');
      }
      
    } else {
      console.log('❌ No results returned from pipeline');
    }
    
  } catch (error) {
    console.error(`❌ Integration test failed: ${error.message}`);
    console.log('\n🔧 TROUBLESHOOTING TIPS:');
    console.log('1. Make sure the Next.js dev server is running (npm run dev)');
    console.log('2. Check that all API keys are properly configured in .env');
    console.log('3. Verify the top100 modules are accessible');
    console.log('4. Check the console for detailed error messages');
  }
}

// Run the test
if (require.main === module) {
  testPipelineIntegration().catch(console.error);
}

module.exports = { testPipelineIntegration };
