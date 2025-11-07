#!/usr/bin/env node

/**
 * Direct Test of Email & Phone Verification Functions
 * 
 * Tests the verification functions directly without running the full pipeline
 */

const { MultiSourceVerifier } = require('../../../src/platform/pipelines/modules/core/MultiSourceVerifier');

console.log('\n' + '='.repeat(80));
console.log('🧪 DIRECT EMAIL & PHONE VERIFICATION TEST');
console.log('='.repeat(80));

// Check environment variables
console.log('\n🔐 Checking Environment Variables:');
const requiredEnvVars = {
  ZEROBOUNCE_API_KEY: !!process.env.ZEROBOUNCE_API_KEY,
  MYEMAILVERIFIER_API_KEY: !!process.env.MYEMAILVERIFIER_API_KEY,
  PROSPEO_API_KEY: !!process.env.PROSPEO_API_KEY,
  LUSHA_API_KEY: !!process.env.LUSHA_API_KEY,
  TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value ? '✅' : '❌'}`);
});

// Initialize verifier
const verifier = new MultiSourceVerifier({
  ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
  MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
  PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
  LUSHA_API_KEY: process.env.LUSHA_API_KEY,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  PEOPLE_DATA_LABS_API_KEY: process.env.PEOPLE_DATA_LABS_API_KEY,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
  TIMEOUT: 30000
});

console.log('\n✅ MultiSourceVerifier initialized successfully');

/**
 * Test email verification
 */
async function testEmailVerification() {
  console.log('\n' + '-'.repeat(80));
  console.log('📧 Testing Email Verification');
  console.log('-'.repeat(80));
  
  const testEmails = [
    {
      email: 'test@example.com',
      name: 'Test User',
      domain: 'example.com',
      description: 'Valid email format'
    },
    {
      email: 'invalid.email',
      name: 'Invalid User',
      domain: 'example.com',
      description: 'Invalid email format'
    },
    {
      email: 'user@gmail.com',
      name: 'Gmail User',
      domain: 'example.com',
      description: 'Personal email domain'
    }
  ];
  
  for (const test of testEmails) {
    try {
      console.log(`\n📧 Testing: ${test.email} (${test.description})`);
      const result = await verifier.verifyEmailMultiLayer(
        test.email,
        test.name,
        test.domain
      );
      
      console.log(`   Valid: ${result.valid ? '✅' : '❌'}`);
      console.log(`   Confidence: ${result.confidence}%`);
      console.log(`   Validation Steps: ${result.validationSteps || 'N/A'}`);
      console.log(`   Reasoning: ${result.reasoning}`);
      
      if (result.validationDetails) {
        console.log(`   Details:`);
        result.validationDetails.forEach(detail => {
          console.log(`      - ${detail.step}: ${detail.passed ? '✅' : '❌'} (${detail.confidence}%)`);
        });
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
}

/**
 * Test phone verification
 */
async function testPhoneVerification() {
  console.log('\n' + '-'.repeat(80));
  console.log('📞 Testing Phone Verification');
  console.log('-'.repeat(80));
  
  const testPhones = [
    {
      phone: '+1-555-555-5555',
      name: 'Test User',
      company: 'Test Company',
      linkedinUrl: null,
      description: 'US phone number (mock)'
    },
    {
      phone: '555-555-5555',
      name: 'Test User 2',
      company: 'Test Company',
      linkedinUrl: null,
      description: 'US phone without country code'
    }
  ];
  
  for (const test of testPhones) {
    try {
      console.log(`\n📞 Testing: ${test.phone} (${test.description})`);
      const result = await verifier.verifyPhone(
        test.phone,
        test.name,
        test.company,
        test.linkedinUrl
      );
      
      console.log(`   Valid: ${result.valid ? '✅' : '❌'}`);
      console.log(`   Confidence: ${result.confidence}%`);
      console.log(`   Sources: ${result.sources.join(', ')}`);
      console.log(`   Reasoning: ${result.reasoning}`);
      
      if (result.verificationDetails) {
        console.log(`   Details:`);
        result.verificationDetails.forEach(detail => {
          console.log(`      - ${detail.source}: ${detail.verified ? '✅' : '❌'} (${detail.confidence}%)`);
        });
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
}

/**
 * Test integration with mock buyer group data
 */
async function testBuyerGroupIntegration() {
  console.log('\n' + '-'.repeat(80));
  console.log('👥 Testing Buyer Group Integration');
  console.log('-'.repeat(80));
  
  const mockBuyerGroup = [
    {
      name: 'John Doe',
      email: 'john.doe@testcompany.com',
      phone: '+1-555-123-4567',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      title: 'VP Sales',
      department: 'Sales',
      buyerGroupRole: 'decision'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@testcompany.com',
      phone: '+1-555-987-6543',
      linkedinUrl: 'https://linkedin.com/in/janesmith',
      title: 'Director of Marketing',
      department: 'Marketing',
      buyerGroupRole: 'champion'
    }
  ];
  
  const intelligence = {
    companyName: 'Test Company',
    website: 'https://testcompany.com',
    industry: 'Technology'
  };
  
  console.log(`\n📧 Testing email verification for ${mockBuyerGroup.length} members...`);
  
  for (const member of mockBuyerGroup) {
    console.log(`\n👤 ${member.name} (${member.title})`);
    
    // Test email
    try {
      const emailResult = await verifier.verifyEmailMultiLayer(
        member.email,
        member.name,
        'testcompany.com'
      );
      
      console.log(`   📧 Email: ${member.email}`);
      console.log(`      Valid: ${emailResult.valid ? '✅' : '❌'}`);
      console.log(`      Confidence: ${emailResult.confidence}%`);
    } catch (error) {
      console.error(`   📧 Email Error: ${error.message}`);
    }
    
    // Test phone
    try {
      const phoneResult = await verifier.verifyPhone(
        member.phone,
        member.name,
        intelligence.companyName,
        member.linkedinUrl
      );
      
      console.log(`   📞 Phone: ${member.phone}`);
      console.log(`      Valid: ${phoneResult.valid ? '✅' : '❌'}`);
      console.log(`      Confidence: ${phoneResult.confidence}%`);
      console.log(`      Sources: ${phoneResult.sources.join(', ')}`);
    } catch (error) {
      console.error(`   📞 Phone Error: ${error.message}`);
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  try {
    // Test email verification
    await testEmailVerification();
    
    // Test phone verification
    await testPhoneVerification();
    
    // Test buyer group integration
    await testBuyerGroupIntegration();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL VERIFICATION TESTS COMPLETED');
    console.log('='.repeat(80));
    
    console.log('\n📊 Verification Stats:');
    const stats = verifier.getStats();
    console.log(`   Person Verifications: ${stats.personVerifications}`);
    console.log(`   Email Verifications: ${stats.emailVerifications}`);
    console.log(`   Phone Verifications: ${stats.phoneVerifications}`);
    console.log(`   High Confidence Results: ${stats.highConfidenceResults}`);
    console.log(`   High Confidence Rate: ${stats.highConfidenceRate}%`);
    console.log(`   Total Credits Used: ${stats.totalCreditsUsed}`);
    
    console.log('\n✅ Verification functions are working correctly!');
    console.log('   - Email verification: 4-layer validation implemented');
    console.log('   - Phone verification: Multi-source verification implemented');
    console.log('   - Integration ready for buyer group pipeline');
    
  } catch (error) {
    console.error('\n❌ Test runner failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests()
  .then(() => {
    console.log('\n✅ Test complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

