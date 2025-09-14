#!/usr/bin/env node

/**
 * 🧪 INDIVIDUAL STEP TESTERS
 * 
 * Run each step individually like Anaconda cells
 * Usage: node test-individual-steps.js step1
 *        node test-individual-steps.js step2
 *        node test-individual-steps.js step3
 *        node test-individual-steps.js lusha
 */

const fetch = require('node-fetch');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUser: 'dan',
  testWorkspace: 'adrata',
  testAccounts: ['Dell', 'Microsoft', 'Apple'],
  testRoles: ['CEO', 'CFO']
};

// Individual test functions
const STEPS = {
  
  // STEP 1: Context Loading
  async step1() {
    console.log('📊 STEP 1: CONTEXT LOADING');
    console.log('Testing context for user:', TEST_CONFIG.testUser);
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_CONFIG.testUser,
        workspaceId: TEST_CONFIG.testWorkspace
      })
    });
    
    const data = await response.json();
    
    console.log('\n🔍 Response:');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    
    if (data.success) {
      console.log('\n📊 Seller Context:');
      console.log('  Has Profile:', data.context.seller.hasProfile);
      console.log('  Has Products:', data.context.seller.hasProducts);
      console.log('  Product Count:', data.context.seller.productCount);
      console.log('  Completeness:', data.context.seller.completeness + '%');
      console.log('  Buying Committee Roles:', JSON.stringify(data.context.seller.buyingCommitteeRoles, null, 2));
      
      console.log('\n🏢 Account Context:');
      console.log('  Has Accounts:', data.context.accounts.hasAccounts);
      console.log('  Account Count:', data.context.accounts.accountCount);
      
      console.log('\n✅ Ready for buyer group analysis');
    } else {
      console.log('\n❌ Context loading failed:', data.error);
    }
    
    return data;
  },
  
  // STEP 2: Single Account Test
  async step2() {
    console.log('🏢 STEP 2: SINGLE ACCOUNT BUYER GROUP');
    console.log('Testing company:', TEST_CONFIG.testAccounts[0]);
    
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
    
    console.log('\n🔍 Response:');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Analysis Type:', data.analysis?.type);
    
    if (data.buyerGroup) {
      console.log('\n🎯 Buyer Group:');
      console.log('  Company:', data.buyerGroup.companyName);
      console.log('  Product Context:', data.buyerGroup.productContext);
      console.log('  Primary Contact:', data.buyerGroup.primaryContact);
      console.log('  Confidence:', data.buyerGroup.confidence + '%');
      console.log('  Strategy:', data.buyerGroup.strategy);
      
      console.log('\n👥 Roles:');
      data.buyerGroup.roles.forEach(role => {
        console.log(`    • ${role.role} (${role.importance}) - ${role.reasoning}`);
      });
    } else {
      console.log('\n❌ No buyer group returned');
      if (data.context?.validation?.missing) {
        console.log('Missing:', data.context.validation.missing);
      }
    }
    
    return data;
  },
  
  // STEP 3: Bulk Discovery
  async step3() {
    console.log('📦 STEP 3: BULK BUYER GROUP DISCOVERY');
    console.log('Testing accounts:', TEST_CONFIG.testAccounts.join(', '));
    console.log('Target roles:', TEST_CONFIG.testRoles.join(', '));
    
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
    
    console.log('\n🔍 Response:');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Total Time:', totalTime + 'ms');
    
    if (data.success && data.summary) {
      console.log('\n📊 Summary:');
      console.log('  Accounts Processed:', data.summary.accountsProcessed);
      console.log('  People Found:', data.summary.totalPeopleFound);
      console.log('  Success Rate:', data.summary.overallSuccessRate + '%');
      console.log('  API Calls:', data.summary.apiCallsUsed);
      console.log('  Cost Estimate:', data.summary.costEstimate);
      
      console.log('\n🏢 Results by Account:');
      data.buyerGroups.forEach(bg => {
        console.log(`\n  ${bg.accountName}:`);
        console.log(`    People: ${bg.peopleCount}, Success: ${bg.successRate}%`);
        bg.people.forEach(person => {
          console.log(`      • ${person.name} (${person.role}) - ${person.buyerGroupRole}`);
          if (person.email) console.log(`        📧 ${person.email}`);
        });
      });
    } else {
      console.log('\n❌ Bulk discovery failed:', data.error);
    }
    
    return data;
  },
  
  // STEP 4: Raw Lusha API Test
  async lusha() {
    console.log('🔍 LUSHA API DIRECT TEST');
    
    const LUSHA_API_KEY = process.env.LUSHA_API_KEY;
    
    if (!LUSHA_API_KEY) {
      console.log('❌ LUSHA_API_KEY not found in environment');
      console.log('Set it with: export LUSHA_API_KEY="your_key_here"');
      return { error: 'No API key' };
    }
    
    console.log('Testing: CEO at Dell');
    console.log('API Key:', LUSHA_API_KEY.substring(0, 8) + '...');
    
    const response = await fetch('https://api.lusha.com/person', {
      method: 'POST',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        companyName: 'Dell',
        title: 'CEO'
      })
    });
    
    console.log('\n🔍 Response:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Raw Response Length:', responseText.length);
    
    try {
      const data = JSON.parse(responseText);
      console.log('\n📊 Parsed Data:');
      console.log('Has Data:', !!data.data);
      
      if (data.data) {
        console.log('Name:', (data.data.firstName || '') + ' ' + (data.data.lastName || ''));
        console.log('Title:', data.data.title || 'N/A');
        console.log('Email:', data.data.email || 'N/A');
        console.log('Phone:', data.data.phoneNumbers?.[0] || 'N/A');
        console.log('Company:', data.data.companyName || 'N/A');
      }
      
      if (data.error) {
        console.log('API Error:', data.error);
      }
      
      return data;
      
    } catch (parseError) {
      console.log('\n❌ Failed to parse response as JSON');
      console.log('Raw response:', responseText.substring(0, 200) + '...');
      return { error: 'Parse error', raw: responseText };
    }
  },
  
  // Health check
  async health() {
    console.log('🏥 HEALTH CHECK');
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/intelligence`);
    const data = await response.json();
    
    console.log('\n🔍 Response:');
    console.log('Status:', response.status);
    console.log('API Status:', data.status);
    console.log('Version:', data.version);
    console.log('Capabilities:', data.capabilities?.length || 0);
    
    return data;
  }
};

// Main runner
async function runStep(stepName) {
  if (!stepName) {
    console.log('🧪 INDIVIDUAL STEP TESTER');
    console.log('========================');
    console.log('\nAvailable steps:');
    console.log('  node test-individual-steps.js step1   - Test context loading');
    console.log('  node test-individual-steps.js step2   - Test single account buyer group');
    console.log('  node test-individual-steps.js step3   - Test bulk discovery');
    console.log('  node test-individual-steps.js lusha   - Test raw Lusha API');
    console.log('  node test-individual-steps.js health  - Test API health');
    console.log('\nExample:');
    console.log('  node test-individual-steps.js step1');
    return;
  }
  
  const step = STEPS[stepName];
  if (!step) {
    console.log(`❌ Unknown step: ${stepName}`);
    console.log('Available steps:', Object.keys(STEPS).join(', '));
    return;
  }
  
  console.log(`🧪 Running ${stepName.toUpperCase()}...\n`);
  
  try {
    const result = await step();
    console.log('\n✅ Step completed successfully');
    return result;
  } catch (error) {
    console.log('\n❌ Step failed:', error.message);
    if (error.message.includes('fetch')) {
      console.log('💡 Make sure the development server is running: npm run dev');
    }
    return { error: error.message };
  }
}

// Run the specified step
const stepName = process.argv[2];
runStep(stepName);
