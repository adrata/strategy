#!/usr/bin/env node

/**
 * 🧪 DANO NOTARY EVERYDAY - STEP BY STEP TEST
 * 
 * Test for Dano in the Notary Everyday workspace going after one of his 150 accounts
 * Go step by step, ensure each part works before moving to the next
 */

const fetch = require('node-fetch');

// Dano's test configuration
const DANO_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUser: 'dano',  // Changed from 'dan' to 'dano'
  testWorkspace: 'notary-everyday',  // Changed to notary everyday workspace
  // Some potential accounts from title companies/notary services
  testAccounts: ['First American Title', 'Old Republic Title', 'Chicago Title'],
  testRoles: ['CEO', 'CFO', 'CTO', 'VP Operations']  // Relevant for notary/title companies
};

console.log('🧪 DANO NOTARY EVERYDAY - STEP BY STEP TEST');
console.log('============================================');
console.log(`User: ${DANO_CONFIG.testUser}`);
console.log(`Workspace: ${DANO_CONFIG.testWorkspace}`);
console.log(`Target Accounts: ${DANO_CONFIG.testAccounts.join(', ')}`);
console.log('');

// STEP 1: Health Check
async function step1_healthCheck() {
  console.log('🏥 STEP 1: API HEALTH CHECK');
  console.log('---------------------------');
  
  try {
    const response = await fetch(`${DANO_CONFIG.baseUrl}/api/intelligence`);
    const data = await response.json();
    
    console.log('✅ API Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   API Status: ${data.status}`);
    console.log(`   Version: ${data.version}`);
    console.log(`   Capabilities: ${data.capabilities?.length || 0}`);
    
    if (response.status === 200 && data.status === 'operational') {
      console.log('✅ API is healthy and ready');
      return { success: true };
    } else {
      console.log('❌ API health check failed');
      return { success: false, error: 'API not healthy' };
    }
    
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    console.log('💡 Make sure the development server is running: npm run dev');
    return { success: false, error: error.message };
  }
}

// STEP 2: Context Loading for Dano
async function step2_contextLoading() {
  console.log('\n\n📊 STEP 2: CONTEXT LOADING FOR DANO');
  console.log('------------------------------------');
  console.log(`Loading context for user: ${DANO_CONFIG.testUser} in workspace: ${DANO_CONFIG.testWorkspace}`);
  
  try {
    const response = await fetch(`${DANO_CONFIG.baseUrl}/api/intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: DANO_CONFIG.testUser,
        workspaceId: DANO_CONFIG.testWorkspace
      })
    });
    
    const data = await response.json();
    
    console.log('\n🔍 CONTEXT RESPONSE:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    
    if (data.success) {
      console.log('\n📊 DANO\'S SELLER CONTEXT:');
      console.log(`   Has Profile: ${data.context.seller.hasProfile}`);
      console.log(`   Has Products: ${data.context.seller.hasProducts}`);
      console.log(`   Product Count: ${data.context.seller.productCount}`);
      console.log(`   Completeness: ${data.context.seller.completeness}%`);
      console.log(`   Territory: ${data.context.seller.territory || 'Not set'}`);
      console.log(`   Avg Deal Size: ${data.context.seller.avgDealSize || 'Not set'}`);
      console.log(`   Win Rate: ${data.context.seller.winRate || 'Not set'}`);
      
      console.log('\n🎯 NOTARY/TITLE INDUSTRY CONTEXT:');
      console.log(`   Target Industries: ${JSON.stringify(data.context.seller.targetIndustries)}`);
      console.log(`   Buying Committee Roles: ${JSON.stringify(data.context.seller.buyingCommitteeRoles)}`);
      
      console.log('\n🏢 ACCOUNT CONTEXT:');
      console.log(`   Has Accounts: ${data.context.accounts.hasAccounts}`);
      console.log(`   Account Count: ${data.context.accounts.accountCount}`);
      console.log(`   Needs Discovery: ${data.context.accounts.needsDiscovery}`);
      console.log(`   Total Pipeline Value: $${data.context.accounts.totalPipelineValue || 0}`);
      
      console.log('\n✅ VALIDATION:');
      console.log(`   Context Complete: ${data.context.validation.isComplete}`);
      console.log(`   Missing Elements: ${JSON.stringify(data.context.validation.missing)}`);
      console.log(`   Recommendations: ${JSON.stringify(data.context.validation.recommendations)}`);
      
      if (data.context.validation.isComplete) {
        console.log('\n🚀 READY FOR BUYER GROUP ANALYSIS!');
        return { success: true, context: data.context };
      } else {
        console.log('\n⚠️ CONTEXT INCOMPLETE - Need to set up seller profile first');
        return { success: false, reason: 'incomplete_context', missing: data.context.validation.missing };
      }
      
    } else {
      console.log(`   ❌ Context loading failed: ${data.error}`);
      return { success: false, error: data.error };
    }
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// STEP 3: Single Account Buyer Group Test
async function step3_singleAccountTest() {
  console.log('\n\n🏢 STEP 3: SINGLE ACCOUNT BUYER GROUP TEST');
  console.log('-------------------------------------------');
  
  const targetAccount = DANO_CONFIG.testAccounts[0]; // First American Title
  console.log(`Testing buyer group discovery for: ${targetAccount}`);
  console.log('This should map Dano\'s notary/title service to their decision makers');
  
  try {
    const response = await fetch(`${DANO_CONFIG.baseUrl}/api/intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: DANO_CONFIG.testUser,
        workspaceId: DANO_CONFIG.testWorkspace,
        targetCompany: targetAccount
      })
    });
    
    const data = await response.json();
    
    console.log('\n🔍 BUYER GROUP RESPONSE:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Analysis Type: ${data.analysis?.type}`);
    console.log(`   Has Buyer Group: ${data.analysis?.hasBuyerGroup}`);
    
    if (data.buyerGroup) {
      console.log('\n🎯 BUYER GROUP ANALYSIS FOR TITLE COMPANY:');
      console.log(`   Company: ${data.buyerGroup.companyName}`);
      console.log(`   Product Context: ${data.buyerGroup.productContext}`);
      console.log(`   Primary Contact: ${data.buyerGroup.primaryContact}`);
      console.log(`   Confidence: ${data.buyerGroup.confidence}%`);
      console.log(`   Analysis Time: ${data.buyerGroup.analysisTimeMs}ms`);
      
      console.log('\n📋 ENGAGEMENT STRATEGY:');
      console.log(`   ${data.buyerGroup.strategy}`);
      
      console.log('\n👥 BUYER GROUP ROLES FOR NOTARY SERVICES:');
      data.buyerGroup.roles.forEach(role => {
        console.log(`      • ${role.role} (${role.importance}) - ${role.reasoning}`);
      });
      
      console.log('\n✅ BUYER GROUP ANALYSIS SUCCESSFUL!');
      return { success: true, buyerGroup: data.buyerGroup };
      
    } else {
      console.log('\n❌ No buyer group returned');
      if (data.context?.validation?.missing) {
        console.log(`   Missing context: ${JSON.stringify(data.context.validation.missing)}`);
      }
      if (data.analysis?.nextSteps) {
        console.log(`   Next steps: ${JSON.stringify(data.analysis.nextSteps)}`);
      }
      return { success: false, reason: 'no_buyer_group' };
    }
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// STEP 4: Bulk Discovery Test (Dano's 150 accounts scenario)
async function step4_bulkDiscoveryTest() {
  console.log('\n\n📦 STEP 4: BULK DISCOVERY TEST (DANO\'S 150 ACCOUNTS)');
  console.log('-----------------------------------------------------');
  console.log(`Simulating Dano's bulk buyer group discovery for title companies`);
  console.log(`Testing with: ${DANO_CONFIG.testAccounts.join(', ')}`);
  console.log(`Target roles: ${DANO_CONFIG.testRoles.join(', ')}`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${DANO_CONFIG.baseUrl}/api/intelligence/buyer-group-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: DANO_CONFIG.testUser,
        workspaceId: DANO_CONFIG.testWorkspace,
        accounts: DANO_CONFIG.testAccounts,
        targetRoles: DANO_CONFIG.testRoles
      })
    });
    
    const totalTime = Date.now() - startTime;
    const data = await response.json();
    
    console.log('\n🔍 BULK DISCOVERY RESPONSE:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Total Time: ${totalTime}ms`);
    
    if (data.success && data.summary) {
      console.log('\n📊 DANO\'S BULK DISCOVERY RESULTS:');
      console.log(`   Title Companies Processed: ${data.summary.accountsProcessed}`);
      console.log(`   Total Decision Makers Found: ${data.summary.totalPeopleFound}`);
      console.log(`   Overall Success Rate: ${data.summary.overallSuccessRate}%`);
      console.log(`   Avg Decision Makers Per Company: ${data.summary.avgPeoplePerAccount}`);
      console.log(`   Processing Time: ${data.summary.processingTimeMs}ms`);
      console.log(`   API Calls Used: ${data.summary.apiCallsUsed}`);
      console.log(`   Estimated Cost: ${data.summary.costEstimate}`);
      
      console.log('\n🏢 TITLE COMPANY BUYER GROUPS:');
      data.buyerGroups.forEach(bg => {
        console.log(`\n   📋 ${bg.accountName}:`);
        console.log(`      Decision Makers Found: ${bg.peopleCount}`);
        console.log(`      Success Rate: ${bg.successRate}%`);
        console.log(`      Search Time: ${bg.searchTimeMs}ms`);
        
        if (bg.people.length > 0) {
          console.log(`      👥 Key Decision Makers:`);
          bg.people.forEach(person => {
            console.log(`         • ${person.name} (${person.role})`);
            console.log(`           Buyer Role: ${person.buyerGroupRole}`);
            console.log(`           Confidence: ${person.confidence}%`);
            if (person.email) console.log(`           Email: ${person.email}`);
            if (person.phone) console.log(`           Phone: ${person.phone}`);
          });
        } else {
          console.log(`      ❌ No decision makers found`);
        }
      });
      
      // Project to 150 accounts
      const avgTimePerAccount = data.summary.processingTimeMs / data.summary.accountsProcessed;
      const projectedTimeFor150 = Math.round(avgTimePerAccount * 150 / 1000);
      const projectedPeopleFor150 = Math.round(data.summary.avgPeoplePerAccount * 150);
      const projectedCostFor150 = (data.summary.apiCallsUsed / data.summary.accountsProcessed) * 150 * 0.10;
      
      console.log('\n🚀 PROJECTION FOR DANO\'S 150 ACCOUNTS:');
      console.log(`   Estimated Time: ${projectedTimeFor150} seconds (${Math.round(projectedTimeFor150/60)} minutes)`);
      console.log(`   Estimated People Found: ${projectedPeopleFor150} decision makers`);
      console.log(`   Estimated Cost: $${projectedCostFor150.toFixed(2)}`);
      
      console.log('\n✅ BULK DISCOVERY SUCCESSFUL!');
      return { success: true, result: data, projections: {
        timeFor150: projectedTimeFor150,
        peopleFor150: projectedPeopleFor150,
        costFor150: projectedCostFor150
      }};
      
    } else {
      console.log(`   ❌ Bulk discovery failed: ${data.error}`);
      if (data.details) console.log(`   Details: ${data.details}`);
      return { success: false, error: data.error };
    }
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runDanoTest() {
  console.log('🚀 Starting Dano Notary Everyday step-by-step test...\n');
  
  // Step 1: Health Check
  const step1Result = await step1_healthCheck();
  if (!step1Result.success) {
    console.log('\n❌ STOPPING: API health check failed');
    return;
  }
  
  // Step 2: Context Loading
  const step2Result = await step2_contextLoading();
  if (!step2Result.success) {
    console.log('\n❌ STOPPING: Context loading failed');
    if (step2Result.reason === 'incomplete_context') {
      console.log('\n💡 ACTION NEEDED: Set up Dano\'s seller profile in Notary Everyday workspace');
      console.log('   Missing:', step2Result.missing);
    }
    return;
  }
  
  // Step 3: Single Account Test
  const step3Result = await step3_singleAccountTest();
  if (!step3Result.success) {
    console.log('\n❌ STOPPING: Single account buyer group failed');
    return;
  }
  
  // Step 4: Bulk Discovery Test
  const step4Result = await step4_bulkDiscoveryTest();
  
  // Final Summary
  console.log('\n\n📋 DANO NOTARY EVERYDAY TEST SUMMARY');
  console.log('====================================');
  console.log(`Step 1 - API Health: ${step1Result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Step 2 - Context Loading: ${step2Result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Step 3 - Single Account: ${step3Result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Step 4 - Bulk Discovery: ${step4Result.success ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (step1Result.success && step2Result.success && step3Result.success && step4Result.success) {
    console.log('\n🎉 ALL TESTS PASSED! Dano is ready to find buyer groups for his 150 title company accounts!');
    
    if (step4Result.projections) {
      console.log('\n📊 READY FOR PRODUCTION:');
      console.log(`   Time for 150 accounts: ${Math.round(step4Result.projections.timeFor150/60)} minutes`);
      console.log(`   Expected decision makers: ${step4Result.projections.peopleFor150}`);
      console.log(`   Estimated cost: $${step4Result.projections.costFor150.toFixed(2)}`);
    }
  } else {
    console.log('\n💡 Next Steps: Fix the failed steps before proceeding to production');
  }
}

// Run the test
runDanoTest().catch(console.error);
