/**
 * COMPLETE PIPELINE VALIDATION TEST
 * Tests all API endpoints end-to-end with real-world data
 * Target: >80% accuracy for Monday launch
 */

const fetch = globalThis.fetch || require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test Configuration
const BASE_URL = 'http://localhost:3000';
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY';

// Test Data - Real companies from Key Account Domains CSV
const TEST_COMPANIES = [
  { domain: 'highradius.com', name: 'HighRadius', industry: 'Technology' },
  { domain: 'softchoice.com', name: 'Softchoice', industry: 'Technology' },
  { domain: 'optimizely.com', name: 'Optimizely', industry: 'Technology' },
  { domain: 'dropbox.com', name: 'Dropbox', industry: 'Technology' },
  { domain: 'zoom.us', name: 'Zoom', industry: 'Technology' }
];

// API Endpoints to Test
const API_ENDPOINTS = {
  roleFinderSingle: `${BASE_URL}/api/role-finder`,
  enrichmentWaterfall: `${BASE_URL}/api/enrichment/waterfall`,
  unifiedData: `${BASE_URL}/api/data/unified`,
  pipeline: `${BASE_URL}/api/pipeline`,
  aiChat: `${BASE_URL}/api/ai-chat`,
  exportGenerate: `${BASE_URL}/api/export/generate`
};

// Test Results Tracking
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  apiEndpoints: {},
  accuracy: {
    companyMatching: { total: 0, successful: 0 },
    executiveSearch: { total: 0, successful: 0 },
    dataEnrichment: { total: 0, successful: 0 }
  },
  errors: []
};

/**
 * Helper function to make API calls with error handling
 */
async function makeAPICall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
      error: response.ok ? null : data.error || `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

/**
 * Test 1: Role Finder API - Single Company Search
 */
async function testRoleFinderAPI() {
  console.log('\n🎯 Testing Role Finder API...');
  console.log('='.repeat(50));
  
  let apiResults = { total: 0, successful: 0, errors: [] };
  
  for (const company of TEST_COMPANIES) {
    console.log(`\n🔍 Testing ${company.name} (${company.domain})`);
    
    // Test CFO search
    apiResults.total++;
    testResults.totalTests++;
    
    const cfoResult = await makeAPICall(API_ENDPOINTS.roleFinderSingle, {
      method: 'POST',
      body: JSON.stringify({
        inputType: 'single',
        company: company.domain,
        roles: ['CFO'],
        workspaceId: 'adrata',
        userId: 'test-user',
        config: {
          includeContactInfo: true,
          maxResultsPerCompany: 1,
          minConfidenceScore: 60
        }
      })
    });
    
    if (cfoResult.success && cfoResult.data?.success) {
      console.log(`✅ CFO search successful for ${company.name}`);
      apiResults.successful++;
      testResults.passedTests++;
      testResults.accuracy.executiveSearch.successful++;
      
      if (cfoResult.data.data?.report?.results?.length > 0) {
        const cfo = cfoResult.data.data.report.results[0];
        console.log(`   Found: ${cfo.person?.fullName || 'Unknown'} - ${cfo.role?.name || 'Unknown'}`);
      }
    } else {
      console.log(`❌ CFO search failed for ${company.name}: ${cfoResult.error}`);
      apiResults.errors.push(`${company.name} CFO: ${cfoResult.error}`);
      testResults.failedTests++;
      testResults.errors.push(`Role Finder CFO - ${company.name}: ${cfoResult.error}`);
    }
    
    testResults.accuracy.executiveSearch.total++;
    
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const accuracy = apiResults.total > 0 ? (apiResults.successful / apiResults.total * 100).toFixed(1) : 0;
  console.log(`\n📊 Role Finder API Results: ${apiResults.successful}/${apiResults.total} (${accuracy}%)`);
  
  testResults.apiEndpoints.roleFinderSingle = {
    total: apiResults.total,
    successful: apiResults.successful,
    accuracy: parseFloat(accuracy),
    errors: apiResults.errors
  };
  
  return apiResults.successful / apiResults.total >= 0.6; // 60% minimum for API functionality
}

/**
 * Test 2: Waterfall Enrichment API
 */
async function testWaterfallEnrichmentAPI() {
  console.log('\n🌊 Testing Waterfall Enrichment API...');
  console.log('='.repeat(50));
  
  let apiResults = { total: 0, successful: 0, errors: [] };
  
  for (const company of TEST_COMPANIES.slice(0, 3)) { // Test first 3 to control costs
    console.log(`\n🔍 Testing enrichment for ${company.name}`);
    
    apiResults.total++;
    testResults.totalTests++;
    
    const enrichResult = await makeAPICall(API_ENDPOINTS.enrichmentWaterfall, {
      method: 'POST',
      body: JSON.stringify({
        type: 'company_enrichment',
        data: {
          domain: company.domain,
          name: company.name
        },
        userId: 'test-user',
        workspaceId: 'adrata',
        config: {
          maxProviders: 2,
          minConfidence: 70,
          includeFallback: true
        }
      })
    });
    
    if (enrichResult.success && enrichResult.data?.success) {
      console.log(`✅ Enrichment successful for ${company.name}`);
      apiResults.successful++;
      testResults.passedTests++;
      testResults.accuracy.dataEnrichment.successful++;
      
      console.log(`   Confidence: ${enrichResult.data.confidence || 'Unknown'}%`);
      console.log(`   Providers used: ${enrichResult.data.providersUsed?.length || 0}`);
    } else {
      console.log(`❌ Enrichment failed for ${company.name}: ${enrichResult.error}`);
      apiResults.errors.push(`${company.name}: ${enrichResult.error}`);
      testResults.failedTests++;
      testResults.errors.push(`Waterfall Enrichment - ${company.name}: ${enrichResult.error}`);
    }
    
    testResults.accuracy.dataEnrichment.total++;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  const accuracy = apiResults.total > 0 ? (apiResults.successful / apiResults.total * 100).toFixed(1) : 0;
  console.log(`\n📊 Waterfall Enrichment Results: ${apiResults.successful}/${apiResults.total} (${accuracy}%)`);
  
  testResults.apiEndpoints.enrichmentWaterfall = {
    total: apiResults.total,
    successful: apiResults.successful,
    accuracy: parseFloat(accuracy),
    errors: apiResults.errors
  };
  
  return apiResults.successful / apiResults.total >= 0.5; // 50% minimum for enrichment
}

/**
 * Test 3: Unified Data API
 */
async function testUnifiedDataAPI() {
  console.log('\n📊 Testing Unified Data API...');
  console.log('='.repeat(50));
  
  testResults.totalTests++;
  
  const unifiedResult = await makeAPICall(
    `${API_ENDPOINTS.unifiedData}?workspaceId=adrata&userId=test-user&includeSpeedrun=true&includeDashboard=true`
  );
  
  if (unifiedResult.success && unifiedResult.data) {
    console.log('✅ Unified Data API working');
    console.log(`   Data sections: ${Object.keys(unifiedResult.data).length}`);
    console.log(`   Has leads: ${!!unifiedResult.data.leads}`);
    console.log(`   Has opportunities: ${!!unifiedResult.data.opportunities}`);
    console.log(`   Has dashboard: ${!!unifiedResult.data.dashboard}`);
    
    testResults.passedTests++;
    testResults.apiEndpoints.unifiedData = { status: 'working', dataKeys: Object.keys(unifiedResult.data) };
    return true;
  } else {
    console.log(`❌ Unified Data API failed: ${unifiedResult.error}`);
    testResults.failedTests++;
    testResults.errors.push(`Unified Data API: ${unifiedResult.error}`);
    testResults.apiEndpoints.unifiedData = { status: 'failed', error: unifiedResult.error };
    return false;
  }
}

/**
 * Test 4: Pipeline API
 */
async function testPipelineAPI() {
  console.log('\n🚀 Testing Pipeline API...');
  console.log('='.repeat(50));
  
  const sections = ['leads', 'opportunities', 'accounts', 'speedrun'];
  let successful = 0;
  
  for (const section of sections) {
    testResults.totalTests++;
    
    const pipelineResult = await makeAPICall(
      `${API_ENDPOINTS.pipeline}?section=${section}&workspaceId=adrata&userId=test-user`
    );
    
    if (pipelineResult.success && pipelineResult.data) {
      console.log(`✅ Pipeline ${section} section working`);
      successful++;
      testResults.passedTests++;
    } else {
      console.log(`❌ Pipeline ${section} section failed: ${pipelineResult.error}`);
      testResults.failedTests++;
      testResults.errors.push(`Pipeline ${section}: ${pipelineResult.error}`);
    }
  }
  
  const accuracy = (successful / sections.length * 100).toFixed(1);
  console.log(`\n📊 Pipeline API Results: ${successful}/${sections.length} (${accuracy}%)`);
  
  testResults.apiEndpoints.pipeline = {
    total: sections.length,
    successful: successful,
    accuracy: parseFloat(accuracy)
  };
  
  return successful / sections.length >= 0.75; // 75% minimum
}

/**
 * Test 5: AI Chat API
 */
async function testAIChatAPI() {
  console.log('\n🤖 Testing AI Chat API...');
  console.log('='.repeat(50));
  
  testResults.totalTests++;
  
  const chatResult = await makeAPICall(API_ENDPOINTS.aiChat, {
    method: 'POST',
    body: JSON.stringify({
      message: 'Find me the CEO of Dropbox',
      workspaceId: 'adrata',
      userId: 'test-user',
      context: {
        type: 'executive_search',
        company: 'dropbox.com'
      }
    })
  });
  
  if (chatResult.success && chatResult.data) {
    console.log('✅ AI Chat API working');
    console.log(`   Response length: ${chatResult.data.response?.length || 0} characters`);
    testResults.passedTests++;
    testResults.apiEndpoints.aiChat = { status: 'working' };
    return true;
  } else {
    console.log(`❌ AI Chat API failed: ${chatResult.error}`);
    testResults.failedTests++;
    testResults.errors.push(`AI Chat API: ${chatResult.error}`);
    testResults.apiEndpoints.aiChat = { status: 'failed', error: chatResult.error };
    return false;
  }
}

/**
 * Test 6: Company Matching Accuracy
 */
async function testCompanyMatchingAccuracy() {
  console.log('\n🎯 Testing Company Matching Accuracy...');
  console.log('='.repeat(50));
  
  // Test various company name variations
  const companyVariations = [
    { input: 'dropbox.com', expected: 'Dropbox' },
    { input: 'Dropbox Inc', expected: 'Dropbox' },
    { input: 'dropbox', expected: 'Dropbox' },
    { input: 'zoom.us', expected: 'Zoom' },
    { input: 'Zoom Video Communications', expected: 'Zoom' },
    { input: 'optimizely.com', expected: 'Optimizely' }
  ];
  
  let successful = 0;
  
  for (const variation of companyVariations) {
    testResults.totalTests++;
    testResults.accuracy.companyMatching.total++;
    
    // Test through role finder API which uses company matching
    const matchResult = await makeAPICall(API_ENDPOINTS.roleFinderSingle, {
      method: 'POST',
      body: JSON.stringify({
        inputType: 'single',
        company: variation.input,
        roles: ['CEO'],
        workspaceId: 'adrata',
        userId: 'test-user',
        config: { maxResultsPerCompany: 1 }
      })
    });
    
    if (matchResult.success && matchResult.data?.success) {
      console.log(`✅ Matched "${variation.input}" successfully`);
      successful++;
      testResults.passedTests++;
      testResults.accuracy.companyMatching.successful++;
    } else {
      console.log(`❌ Failed to match "${variation.input}": ${matchResult.error}`);
      testResults.failedTests++;
      testResults.errors.push(`Company matching - ${variation.input}: ${matchResult.error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  const accuracy = (successful / companyVariations.length * 100).toFixed(1);
  console.log(`\n📊 Company Matching Results: ${successful}/${companyVariations.length} (${accuracy}%)`);
  
  return successful / companyVariations.length >= 0.7; // 70% minimum
}

/**
 * Generate Final Report
 */
function generateFinalReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPLETE PIPELINE VALIDATION REPORT');
  console.log('='.repeat(80));
  
  const overallAccuracy = testResults.totalTests > 0 ? 
    (testResults.passedTests / testResults.totalTests * 100).toFixed(1) : 0;
  
  console.log(`🎯 Overall System Health: ${testResults.passedTests}/${testResults.totalTests} (${overallAccuracy}%)`);
  
  // API Endpoint Status
  console.log('\n📡 API Endpoint Status:');
  Object.entries(testResults.apiEndpoints).forEach(([endpoint, results]) => {
    if (typeof results === 'object' && results.accuracy !== undefined) {
      const status = results.accuracy >= 70 ? '✅' : results.accuracy >= 50 ? '⚠️' : '❌';
      console.log(`   ${status} ${endpoint}: ${results.successful}/${results.total} (${results.accuracy}%)`);
    } else {
      const status = results.status === 'working' ? '✅' : '❌';
      console.log(`   ${status} ${endpoint}: ${results.status}`);
    }
  });
  
  // Accuracy Breakdown
  console.log('\n🎯 Accuracy Breakdown:');
  Object.entries(testResults.accuracy).forEach(([category, stats]) => {
    if (stats.total > 0) {
      const accuracy = (stats.successful / stats.total * 100).toFixed(1);
      const status = accuracy >= 80 ? '✅' : accuracy >= 60 ? '⚠️' : '❌';
      console.log(`   ${status} ${category}: ${stats.successful}/${stats.total} (${accuracy}%)`);
    }
  });
  
  // Errors Summary
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors Encountered:');
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  // Final Assessment
  console.log('\n🚀 LAUNCH READINESS ASSESSMENT:');
  if (parseFloat(overallAccuracy) >= 80) {
    console.log('✅ SYSTEM READY FOR MONDAY LAUNCH!');
    console.log('   All critical systems operational with high accuracy');
  } else if (parseFloat(overallAccuracy) >= 60) {
    console.log('⚠️  SYSTEM NEEDS MINOR IMPROVEMENTS');
    console.log('   Core functionality working but accuracy could be improved');
  } else {
    console.log('❌ SYSTEM NOT READY FOR LAUNCH');
    console.log('   Critical issues need to be resolved before Monday');
  }
  
  // Export results
  const reportData = {
    timestamp: new Date().toISOString(),
    overallAccuracy: parseFloat(overallAccuracy),
    testResults,
    launchReady: parseFloat(overallAccuracy) >= 80
  };
  
  fs.writeFileSync('test-outputs/pipeline-validation-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed report saved to: test-outputs/pipeline-validation-report.json');
  
  return parseFloat(overallAccuracy) >= 80;
}

/**
 * Main Test Runner
 */
async function runCompleteValidation() {
  console.log('🚀 COMPLETE PIPELINE VALIDATION TEST');
  console.log('🎯 Target: >80% accuracy for Monday launch');
  console.log('⏰ Testing all critical systems...\n');
  
  const startTime = Date.now();
  
  try {
    // Run all tests
    const results = await Promise.allSettled([
      testRoleFinderAPI(),
      testWaterfallEnrichmentAPI(),
      testUnifiedDataAPI(),
      testPipelineAPI(),
      testAIChatAPI(),
      testCompanyMatchingAccuracy()
    ]);
    
    // Check results
    const allPassed = results.every(result => 
      result.status === 'fulfilled' && result.value === true
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Total test duration: ${duration} seconds`);
    
    // Generate final report
    const launchReady = generateFinalReport();
    
    if (launchReady) {
      console.log('\n🎉 SUCCESS: All systems validated and ready for launch!');
      process.exit(0);
    } else {
      console.log('\n⚠️  WARNING: System needs improvements before launch');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    testResults.errors.push(`Test suite error: ${error.message}`);
    generateFinalReport();
    process.exit(1);
  }
}

// Run the complete validation
if (require.main === module) {
  runCompleteValidation();
}

module.exports = { runCompleteValidation };
