#!/usr/bin/env node

/**
 * 🧪 STEP-BY-STEP BUYER GROUP TESTING
 * 
 * Interactive testing like Anaconda/Jupyter - test each step individually
 * See exactly what happens at each stage
 */

const fetch = require('node-fetch');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUser: 'dan',
  testWorkspace: 'adrata',
  testAccounts: ['Dell', 'Microsoft', 'Apple'],
  testRoles: ['CEO', 'CFO']
};

console.log('🧪 STEP-BY-STEP BUYER GROUP TESTING');
console.log('=====================================\n');

// STEP 1: Test Context Loading
async function step1_testContextLoading() {
  console.log('📊 STEP 1: CONTEXT LOADING');
  console.log('---------------------------');
  console.log(`Testing context loading for user: ${TEST_CONFIG.testUser} in workspace: ${TEST_CONFIG.testWorkspace}`);
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_CONFIG.testUser,
        workspaceId: TEST_CONFIG.testWorkspace
      })
    });
    
    const data = await response.json();
    
    console.log('\n🔍 CONTEXT RESPONSE:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    
    if (data.success) {
      console.log('\n📊 SELLER CONTEXT:');
      console.log(`   Has Profile: ${data.context.seller.hasProfile}`);
      console.log(`   Has Products: ${data.context.seller.hasProducts}`);
      console.log(`   Product Count: ${data.context.seller.productCount}`);
      console.log(`   Completeness: ${data.context.seller.completeness}%`);
      console.log(`   Target Industries: ${JSON.stringify(data.context.seller.targetIndustries)}`);
      console.log(`   Buying Committee Roles: ${JSON.stringify(data.context.seller.buyingCommitteeRoles)}`);
      
      console.log('\n🏢 ACCOUNT CONTEXT:');
      console.log(`   Has Accounts: ${data.context.accounts.hasAccounts}`);
      console.log(`   Account Count: ${data.context.accounts.accountCount}`);
      console.log(`   Needs Discovery: ${data.context.accounts.needsDiscovery}`);
      
      console.log('\n✅ VALIDATION:');
      console.log(`   Is Complete: ${data.context.validation.isComplete}`);
      console.log(`   Missing: ${JSON.stringify(data.context.validation.missing)}`);
      console.log(`   Recommendations: ${JSON.stringify(data.context.validation.recommendations)}`);
      
      return { success: true, context: data.context };
    } else {
      console.log(`   Error: ${data.error}`);
      return { success: false, error: data.error };
    }
    
  } catch (error) {
    console.log(`   ❌ Request Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// STEP 2: Test Single Account Buyer Group
async function step2_testSingleAccount() {
  console.log('\n\n🏢 STEP 2: SINGLE ACCOUNT BUYER GROUP');
  console.log('--------------------------------------');
  console.log(`Testing buyer group discovery for: ${TEST_CONFIG.testAccounts[0]}`);
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_CONFIG.testUser,
        workspaceId: TEST_CONFIG.testWorkspace,
        targetCompany: TEST_CONFIG.testAccounts[0]
      })
    });
    
    const data = await response.json();
    
    console.log('\n🔍 SINGLE ACCOUNT RESPONSE:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Analysis Type: ${data.analysis?.type}`);
    console.log(`   Has Buyer Group: ${data.analysis?.hasBuyerGroup}`);
    
    if (data.buyerGroup) {
      console.log('\n🎯 BUYER GROUP ANALYSIS:');
      console.log(`   Company: ${data.buyerGroup.companyName}`);
      console.log(`   Product Context: ${data.buyerGroup.productContext}`);
      console.log(`   Primary Contact: ${data.buyerGroup.primaryContact}`);
      console.log(`   Confidence: ${data.buyerGroup.confidence}%`);
      console.log(`   Analysis Time: ${data.buyerGroup.analysisTimeMs}ms`);
      console.log(`   Strategy: ${data.buyerGroup.strategy}`);
      
      console.log('\n👥 BUYER GROUP ROLES:');
      data.buyerGroup.roles.forEach(role => {
        console.log(`      • ${role.role} (${role.importance}) - ${role.reasoning}`);
      });
      
      return { success: true, buyerGroup: data.buyerGroup };
    } else {
      console.log(`   No buyer group returned`);
      if (data.context?.validation?.missing) {
        console.log(`   Missing: ${JSON.stringify(data.context.validation.missing)}`);
      }
      return { success: false, reason: 'No buyer group returned' };
    }
    
  } catch (error) {
    console.log(`   ❌ Request Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// STEP 3: Test Bulk Buyer Group Discovery
async function step3_testBulkDiscovery() {
  console.log('\n\n📦 STEP 3: BULK BUYER GROUP DISCOVERY');
  console.log('--------------------------------------');
  console.log(`Testing bulk discovery for: ${TEST_CONFIG.testAccounts.join(', ')}`);
  console.log(`Target roles: ${TEST_CONFIG.testRoles.join(', ')}`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/intelligence/buyer-group-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_CONFIG.testUser,
        workspaceId: TEST_CONFIG.testWorkspace,
        accounts: TEST_CONFIG.testAccounts,
        targetRoles: TEST_CONFIG.testRoles
      })
    });
    
    const totalTime = Date.now() - startTime;
    const data = await response.json();
    
    console.log('\n🔍 BULK DISCOVERY RESPONSE:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Total Time: ${totalTime}ms`);
    
    if (data.success && data.summary) {
      console.log('\n📊 SUMMARY STATISTICS:');
      console.log(`   Accounts Processed: ${data.summary.accountsProcessed}`);
      console.log(`   Total People Found: ${data.summary.totalPeopleFound}`);
      console.log(`   Overall Success Rate: ${data.summary.overallSuccessRate}%`);
      console.log(`   Avg People Per Account: ${data.summary.avgPeoplePerAccount}`);
      console.log(`   Processing Time: ${data.summary.processingTimeMs}ms`);
      console.log(`   API Calls Used: ${data.summary.apiCallsUsed}`);
      console.log(`   Cost Estimate: ${data.summary.costEstimate}`);
      
      console.log('\n🏢 BUYER GROUPS BY ACCOUNT:');
      data.buyerGroups.forEach(bg => {
        console.log(`\n   📋 ${bg.accountName}:`);
        console.log(`      People Found: ${bg.peopleCount}`);
        console.log(`      Success Rate: ${bg.successRate}%`);
        console.log(`      Search Time: ${bg.searchTimeMs}ms`);
        
        if (bg.people.length > 0) {
          console.log(`      👥 People:`);
          bg.people.forEach(person => {
            console.log(`         • ${person.name} (${person.role})`);
            console.log(`           Buyer Role: ${person.buyerGroupRole}`);
            console.log(`           Confidence: ${person.confidence}%`);
            if (person.email) console.log(`           Email: ${person.email}`);
            if (person.phone) console.log(`           Phone: ${person.phone}`);
          });
        } else {
          console.log(`      ❌ No people found`);
        }
      });
      
      return { success: true, result: data };
    } else {
      console.log(`   Error: ${data.error}`);
      if (data.details) console.log(`   Details: ${data.details}`);
      return { success: false, error: data.error };
    }
    
  } catch (error) {
    console.log(`   ❌ Request Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// STEP 4: Test Raw Lusha API (if we want to debug)
async function step4_testRawLushaAPI() {
  console.log('\n\n🔍 STEP 4: RAW LUSHA API TEST (Optional)');
  console.log('------------------------------------------');
  console.log('Testing direct Lusha API call...');
  
  const LUSHA_API_KEY = process.env.LUSHA_API_KEY;
  
  if (!LUSHA_API_KEY) {
    console.log('   ⚠️ LUSHA_API_KEY not found in environment variables');
    console.log('   Skipping raw API test');
    return { success: false, reason: 'No API key' };
  }
  
  try {
    const testCompany = 'Dell';
    const testRole = 'CEO';
    
    console.log(`   Testing: ${testRole} at ${testCompany}`);
    
    const response = await fetch('https://api.lusha.com/person', {
      method: 'POST',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        companyName: testCompany,
        title: testRole
      })
    });
    
    console.log(`\n🔍 RAW LUSHA RESPONSE:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`   Raw Response: ${responseText.substring(0, 500)}...`);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n📊 PARSED DATA:');
      console.log(`   Has Data: ${!!data.data}`);
      if (data.data) {
        console.log(`   First Name: ${data.data.firstName || 'N/A'}`);
        console.log(`   Last Name: ${data.data.lastName || 'N/A'}`);
        console.log(`   Title: ${data.data.title || 'N/A'}`);
        console.log(`   Email: ${data.data.email || 'N/A'}`);
        console.log(`   Phone Numbers: ${JSON.stringify(data.data.phoneNumbers || [])}`);
      }
      
      return { success: true, data: data };
    } else {
      return { success: false, status: response.status, error: responseText };
    }
    
  } catch (error) {
    console.log(`   ❌ Raw API Test Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runStepByStepTests() {
  console.log('🚀 Starting step-by-step buyer group testing...\n');
  
  // Run each step
  const step1Result = await step1_testContextLoading();
  const step2Result = await step2_testSingleAccount();
  const step3Result = await step3_testBulkDiscovery();
  const step4Result = await step4_testRawLushaAPI();
  
  // Summary
  console.log('\n\n📋 TEST SUMMARY');
  console.log('================');
  console.log(`Step 1 - Context Loading: ${step1Result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Step 2 - Single Account: ${step2Result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Step 3 - Bulk Discovery: ${step3Result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Step 4 - Raw Lusha API: ${step4Result.success ? '✅ PASSED' : step4Result.reason === 'No API key' ? '⏭️ SKIPPED' : '❌ FAILED'}`);
  
  console.log('\n💡 Next Steps:');
  if (!step1Result.success) {
    console.log('   - Fix context loading issues first');
  } else if (!step2Result.success) {
    console.log('   - Debug single account buyer group analysis');
  } else if (!step3Result.success) {
    console.log('   - Debug bulk discovery API');
  } else {
    console.log('   - All tests passed! Ready for production testing');
    console.log('   - Try with real Lusha API key for actual data');
    console.log('   - Test with larger account lists');
  }
}

// Run the tests
runStepByStepTests().catch(console.error);
