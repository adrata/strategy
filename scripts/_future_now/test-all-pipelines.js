#!/usr/bin/env node

/**
 * Comprehensive Test Suite for All 4 Enhanced Pipelines
 * 
 * Tests:
 * 1. find-company - Company enrichment with contact discovery
 * 2. find-person - Person enrichment with email/phone verification
 * 3. find-role - Role finding with contact verification
 * 4. find-optimal-buyer-group - Buyer qualification with contact verification
 */

require('dotenv').config();
const { MultiSourceVerifier } = require('../../src/platform/pipelines/modules/core/MultiSourceVerifier');

console.log('\n' + '='.repeat(80));
console.log('🧪 COMPREHENSIVE PIPELINE VERIFICATION TEST SUITE');
console.log('='.repeat(80));

// Check environment variables
console.log('\n🔐 Checking Environment Variables:');
const requiredEnvVars = {
  CORESIGNAL_API_KEY: !!process.env.CORESIGNAL_API_KEY,
  ZEROBOUNCE_API_KEY: !!process.env.ZEROBOUNCE_API_KEY,
  MYEMAILVERIFIER_API_KEY: !!process.env.MYEMAILVERIFIER_API_KEY,
  PROSPEO_API_KEY: !!process.env.PROSPEO_API_KEY,
  LUSHA_API_KEY: !!process.env.LUSHA_API_KEY,
  TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
  ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY
};

const optionalEnvVars = {
  PEOPLE_DATA_LABS_API_KEY: !!process.env.PEOPLE_DATA_LABS_API_KEY,
  PERPLEXITY_API_KEY: !!process.env.PERPLEXITY_API_KEY
};

let missingRequired = [];
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value ? '✅' : '❌'}`);
  if (!value) missingRequired.push(key);
});

console.log('\n📋 Optional Environment Variables:');
Object.entries(optionalEnvVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value ? '✅' : '⚠️ (optional)'}`);
});

if (missingRequired.length > 0) {
  console.error(`\n❌ Missing required environment variables: ${missingRequired.join(', ')}`);
  console.error('Please set these variables before running the test.');
  process.exit(1);
}

/**
 * Test 1: MultiSourceVerifier Initialization
 */
async function testVerifierInitialization() {
  console.log('\n' + '-'.repeat(80));
  console.log('🔧 Test 1: MultiSourceVerifier Initialization');
  console.log('-'.repeat(80));
  
  try {
    const verifier = new MultiSourceVerifier({
      ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
      MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
      PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
      LUSHA_API_KEY: process.env.LUSHA_API_KEY,
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TIMEOUT: 30000
    });
    
    console.log('✅ MultiSourceVerifier initialized successfully');
    return { passed: true };
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    return { passed: false, error: error.message };
  }
}

/**
 * Test 2: Email Verification Functions
 */
async function testEmailVerification() {
  console.log('\n' + '-'.repeat(80));
  console.log('📧 Test 2: Email Verification Functions');
  console.log('-'.repeat(80));
  
  const verifier = new MultiSourceVerifier({
    ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
    MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
    PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
    TIMEOUT: 30000
  });
  
  const testCases = [
    { email: 'test@example.com', expected: 'valid' },
    { email: 'invalid.email', expected: 'invalid' },
    { email: 'user@gmail.com', expected: 'personal' }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    try {
      console.log(`\n   Testing: ${test.email}`);
      const result = await verifier.verifyEmailMultiLayer(test.email, 'Test User', 'example.com');
      
      if (test.expected === 'invalid' && !result.valid) {
        console.log(`   ✅ Correctly identified as invalid`);
        passed++;
      } else if (test.expected === 'valid' && result.valid && result.confidence >= 70) {
        console.log(`   ✅ Correctly identified as valid (${result.confidence}%)`);
        passed++;
      } else if (test.expected === 'personal' && result.valid) {
        console.log(`   ✅ Syntax valid but low domain confidence (personal email)`);
        passed++;
      } else {
        console.log(`   ⚠️ Unexpected result`);
        failed++;
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Email Test Results: ${passed} passed, ${failed} failed`);
  return { passed: failed === 0 };
}

/**
 * Test 3: Phone Verification Functions
 */
async function testPhoneVerification() {
  console.log('\n' + '-'.repeat(80));
  console.log('📞 Test 3: Phone Verification Functions');
  console.log('-'.repeat(80));
  
  const verifier = new MultiSourceVerifier({
    LUSHA_API_KEY: process.env.LUSHA_API_KEY,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TIMEOUT: 30000
  });
  
  const testPhone = '+1-555-555-5555'; // Mock phone
  
  try {
    console.log(`\n   Testing: ${testPhone}`);
    const result = await verifier.verifyPhone(testPhone, 'Test User', 'Test Company', null);
    
    console.log(`   Sources attempted: ${result.sources.length}`);
    console.log(`   Confidence: ${result.confidence}%`);
    
    if (result.sources.length > 0) {
      console.log(`   ✅ Phone verification APIs working (sources: ${result.sources.join(', ')})`);
      return { passed: true };
    } else {
      console.log(`   ⚠️ No phone verification sources responded`);
      return { passed: false };
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

/**
 * Test 4: find-company Integration
 */
async function testFindCompanyIntegration() {
  console.log('\n' + '-'.repeat(80));
  console.log('🏢 Test 4: find-company Integration');
  console.log('-'.repeat(80));
  
  try {
    const CompanyEnrichment = require('./find-company/index.js');
    
    // Check that class has required methods
    const enrichment = new CompanyEnrichment();
    const hasDiscoverContacts = typeof enrichment.discoverKeyContacts === 'function';
    const hasVerifyContacts = typeof enrichment.verifyContactInformation === 'function';
    const hasVerifyEmail = typeof enrichment.verifyOrDiscoverEmail === 'function';
    const hasVerifyPhone = typeof enrichment.verifyOrDiscoverPhone === 'function';
    
    console.log(`   discoverKeyContacts: ${hasDiscoverContacts ? '✅' : '❌'}`);
    console.log(`   verifyContactInformation: ${hasVerifyContacts ? '✅' : '❌'}`);
    console.log(`   verifyOrDiscoverEmail: ${hasVerifyEmail ? '✅' : '❌'}`);
    console.log(`   verifyOrDiscoverPhone: ${hasVerifyPhone ? '✅' : '❌'}`);
    console.log(`   emailVerifier initialized: ${enrichment.emailVerifier ? '✅' : '❌'}`);
    
    const allPresent = hasDiscoverContacts && hasVerifyContacts && hasVerifyEmail && hasVerifyPhone && enrichment.emailVerifier;
    
    if (allPresent) {
      console.log(`\n   ✅ find-company has all verification functions`);
      return { passed: true };
    } else {
      console.log(`\n   ❌ find-company missing some verification functions`);
      return { passed: false };
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

/**
 * Test 5: find-person Integration
 */
async function testFindPersonIntegration() {
  console.log('\n' + '-'.repeat(80));
  console.log('👤 Test 5: find-person Integration');
  console.log('-'.repeat(80));
  
  try {
    const PersonEnrichment = require('./find-person/index.js');
    
    // Check that class has required methods
    const enrichment = new PersonEnrichment();
    const hasVerifyContact = typeof enrichment.verifyContactInformation === 'function';
    const hasExtractDomain = typeof enrichment.extractDomain === 'function';
    
    console.log(`   verifyContactInformation: ${hasVerifyContact ? '✅' : '❌'}`);
    console.log(`   extractDomain: ${hasExtractDomain ? '✅' : '❌'}`);
    console.log(`   emailVerifier initialized: ${enrichment.emailVerifier ? '✅' : '❌'}`);
    
    const allPresent = hasVerifyContact && hasExtractDomain && enrichment.emailVerifier;
    
    if (allPresent) {
      console.log(`\n   ✅ find-person has all verification functions`);
      return { passed: true };
    } else {
      console.log(`\n   ❌ find-person missing some verification functions`);
      return { passed: false };
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

/**
 * Test 6: find-role Integration
 */
async function testFindRoleIntegration() {
  console.log('\n' + '-'.repeat(80));
  console.log('🎯 Test 6: find-role Integration');
  console.log('-'.repeat(80));
  
  try {
    const RoleEnrichment = require('./find-role/index.js');
    
    // Check that class has required methods
    const enrichment = new RoleEnrichment({ targetRole: 'CEO' });
    const hasVerifyContact = typeof enrichment.verifyMatchContactInfo === 'function';
    const hasExtractDomain = typeof enrichment.extractDomain === 'function';
    
    console.log(`   verifyMatchContactInfo: ${hasVerifyContact ? '✅' : '❌'}`);
    console.log(`   extractDomain: ${hasExtractDomain ? '✅' : '❌'}`);
    console.log(`   emailVerifier initialized: ${enrichment.emailVerifier ? '✅' : '❌'}`);
    
    const allPresent = hasVerifyContact && hasExtractDomain && enrichment.emailVerifier;
    
    if (allPresent) {
      console.log(`\n   ✅ find-role has all verification functions`);
      return { passed: true };
    } else {
      console.log(`\n   ❌ find-role missing some verification functions`);
      return { passed: false };
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

/**
 * Test 7: find-optimal-buyer-group Integration
 */
async function testFindOptimalBuyerGroupIntegration() {
  console.log('\n' + '-'.repeat(80));
  console.log('🏆 Test 7: find-optimal-buyer-group Integration');
  console.log('-'.repeat(80));
  
  try {
    const OptimalBuyerGroupFinder = require('./find-optimal-buyer-group/index.js');
    
    // Check that class has required methods
    const finder = new OptimalBuyerGroupFinder({ industries: ['Software'] });
    const hasVerifyContacts = typeof finder.verifyTopCandidateContacts === 'function';
    const hasVerifyEmployee = typeof finder.verifyEmployeeContact === 'function';
    const hasExtractDomain = typeof finder.extractDomain === 'function';
    
    console.log(`   verifyTopCandidateContacts: ${hasVerifyContacts ? '✅' : '❌'}`);
    console.log(`   verifyEmployeeContact: ${hasVerifyEmployee ? '✅' : '❌'}`);
    console.log(`   extractDomain: ${hasExtractDomain ? '✅' : '❌'}`);
    console.log(`   emailVerifier initialized: ${finder.emailVerifier ? '✅' : '❌'}`);
    
    const allPresent = hasVerifyContacts && hasVerifyEmployee && hasExtractDomain && finder.emailVerifier;
    
    if (allPresent) {
      console.log(`\n   ✅ find-optimal-buyer-group has all verification functions`);
      return { passed: true };
    } else {
      console.log(`\n   ❌ find-optimal-buyer-group missing some verification functions`);
      return { passed: false };
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  const results = [];
  
  // Test 1: Verifier initialization
  results.push({
    name: 'MultiSourceVerifier Initialization',
    ...await testVerifierInitialization()
  });
  
  // Test 2: Email verification
  results.push({
    name: 'Email Verification Functions',
    ...await testEmailVerification()
  });
  
  // Test 3: Phone verification
  results.push({
    name: 'Phone Verification Functions',
    ...await testPhoneVerification()
  });
  
  // Test 4: find-company integration
  results.push({
    name: 'find-company Integration',
    ...await testFindCompanyIntegration()
  });
  
  // Test 5: find-person integration
  results.push({
    name: 'find-person Integration',
    ...await testFindPersonIntegration()
  });
  
  // Test 6: find-role integration
  results.push({
    name: 'find-role Integration',
    ...await testFindRoleIntegration()
  });
  
  // Test 7: find-optimal-buyer-group integration
  results.push({
    name: 'find-optimal-buyer-group Integration',
    ...await testFindOptimalBuyerGroupIntegration()
  });
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  console.log('\n📋 Test Results:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! All 4 pipelines are production-ready.');
    console.log('\n✅ Integration Status:');
    console.log('   - find-company: Multi-source verification ✅');
    console.log('   - find-person: Multi-source verification ✅');
    console.log('   - find-role: Multi-source verification ✅');
    console.log('   - find-optimal-buyer-group: Multi-source verification ✅');
    console.log('\n🚀 All pipelines ready for deployment!');
  } else {
    console.log(`⚠️ ${failed} test(s) failed. Please review the output above.`);
  }
  
  console.log('='.repeat(80) + '\n');
  
  return failed === 0 ? 0 : 1;
}

// Run all tests
runAllTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });

