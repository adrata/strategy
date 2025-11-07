#!/usr/bin/env node

/**
 * Test Email & Phone Multi-Source Verification Integration
 * 
 * Tests the new email and phone verification stages in the buyer group pipeline
 */

const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');

const prisma = new PrismaClient();

// Test Configuration
const TEST_CONFIG = {
  workspaceId: 'workspace_clz0z4y7l0000qhuj3k4z5t0h', // Replace with your workspace ID
  dealSize: 150000,
  productCategory: 'sales',
  skipDatabase: true, // Don't save to database during testing
  
  // Test companies - use companies with known contacts
  testCompanies: [
    {
      name: 'Salesforce',
      linkedinUrl: 'https://www.linkedin.com/company/salesforce',
      website: 'https://www.salesforce.com',
      expected: {
        minMembers: 3,
        shouldHaveEmails: true,
        shouldHavePhones: true
      }
    },
    {
      name: 'HubSpot',
      linkedinUrl: 'https://www.linkedin.com/company/hubspot',
      website: 'https://www.hubspot.com',
      expected: {
        minMembers: 3,
        shouldHaveEmails: true,
        shouldHavePhones: true
      }
    }
  ]
};

/**
 * Test email verification functionality
 */
async function testEmailVerification(buyerGroup) {
  console.log('\n📧 Testing Email Verification...');
  
  const stats = {
    totalMembers: buyerGroup.length,
    withEmail: 0,
    emailVerified: 0,
    emailDiscovered: 0,
    averageConfidence: 0,
    totalCost: 0
  };
  
  let confidenceSum = 0;
  
  for (const member of buyerGroup) {
    if (member.email) {
      stats.withEmail++;
    }
    
    if (member.emailVerified) {
      stats.emailVerified++;
      confidenceSum += member.emailConfidence || 0;
    }
    
    if (member.emailSource === 'discovered') {
      stats.emailDiscovered++;
    }
    
    stats.totalCost += member.emailVerificationCost || 0;
  }
  
  stats.averageConfidence = stats.emailVerified > 0 
    ? Math.round(confidenceSum / stats.emailVerified) 
    : 0;
  
  console.log('\n📊 Email Verification Results:');
  console.log(`   Total Members: ${stats.totalMembers}`);
  console.log(`   With Email: ${stats.withEmail} (${Math.round(stats.withEmail / stats.totalMembers * 100)}%)`);
  console.log(`   Verified: ${stats.emailVerified} (${Math.round(stats.emailVerified / stats.withEmail * 100)}%)`);
  console.log(`   Discovered: ${stats.emailDiscovered}`);
  console.log(`   Average Confidence: ${stats.averageConfidence}%`);
  console.log(`   Total Cost: $${stats.totalCost.toFixed(4)}`);
  
  // Print sample email details
  console.log('\n📋 Sample Email Details:');
  buyerGroup.slice(0, 3).forEach((member, i) => {
    console.log(`\n   ${i + 1}. ${member.name}`);
    console.log(`      Email: ${member.email || 'N/A'}`);
    console.log(`      Verified: ${member.emailVerified ? '✅' : '❌'}`);
    console.log(`      Confidence: ${member.emailConfidence || 0}%`);
    console.log(`      Source: ${member.emailSource || 'unknown'}`);
    if (member.emailVerificationDetails && member.emailVerificationDetails.length > 0) {
      console.log(`      Validation Steps: ${member.emailVerificationDetails.map(d => d.step || d.layer).join(', ')}`);
    }
  });
  
  return stats;
}

/**
 * Test phone verification functionality
 */
async function testPhoneVerification(buyerGroup) {
  console.log('\n📞 Testing Phone Verification...');
  
  const stats = {
    totalMembers: buyerGroup.length,
    withPhone: 0,
    phoneVerified: 0,
    phoneDiscovered: 0,
    averageConfidence: 0,
    totalCost: 0,
    phoneTypes: {
      direct: 0,
      mobile: 0,
      work: 0,
      unknown: 0
    }
  };
  
  let confidenceSum = 0;
  
  for (const member of buyerGroup) {
    if (member.phone || member.phone1) {
      stats.withPhone++;
    }
    
    if (member.phoneVerified) {
      stats.phoneVerified++;
      confidenceSum += member.phoneConfidence || 0;
    }
    
    if (member.phoneSource === 'discovered') {
      stats.phoneDiscovered++;
    }
    
    // Count phone types
    const phoneType = member.phoneType || 'unknown';
    stats.phoneTypes[phoneType] = (stats.phoneTypes[phoneType] || 0) + 1;
    
    stats.totalCost += member.phoneVerificationCost || 0;
  }
  
  stats.averageConfidence = stats.phoneVerified > 0 
    ? Math.round(confidenceSum / stats.phoneVerified) 
    : 0;
  
  console.log('\n📊 Phone Verification Results:');
  console.log(`   Total Members: ${stats.totalMembers}`);
  console.log(`   With Phone: ${stats.withPhone} (${Math.round(stats.withPhone / stats.totalMembers * 100)}%)`);
  console.log(`   Verified: ${stats.phoneVerified} (${stats.withPhone > 0 ? Math.round(stats.phoneVerified / stats.withPhone * 100) : 0}%)`);
  console.log(`   Discovered: ${stats.phoneDiscovered}`);
  console.log(`   Average Confidence: ${stats.averageConfidence}%`);
  console.log(`   Total Cost: $${stats.totalCost.toFixed(4)}`);
  console.log(`\n   Phone Types:`);
  console.log(`      Direct: ${stats.phoneTypes.direct}`);
  console.log(`      Mobile: ${stats.phoneTypes.mobile}`);
  console.log(`      Work: ${stats.phoneTypes.work}`);
  console.log(`      Unknown: ${stats.phoneTypes.unknown}`);
  
  // Print sample phone details
  console.log('\n📋 Sample Phone Details:');
  buyerGroup.slice(0, 3).forEach((member, i) => {
    console.log(`\n   ${i + 1}. ${member.name}`);
    console.log(`      Phone: ${member.phone || member.phone1 || 'N/A'}`);
    console.log(`      Verified: ${member.phoneVerified ? '✅' : '❌'}`);
    console.log(`      Confidence: ${member.phoneConfidence || 0}%`);
    console.log(`      Type: ${member.phoneType || 'unknown'}`);
    console.log(`      Source: ${member.phoneSource || 'unknown'}`);
    if (member.phoneVerificationDetails && member.phoneVerificationDetails.length > 0) {
      console.log(`      Verification Sources: ${member.phoneVerificationDetails.map(d => d.source).join(', ')}`);
    }
  });
  
  return stats;
}

/**
 * Run test for a single company
 */
async function testCompany(companyConfig) {
  console.log('\n' + '='.repeat(80));
  console.log(`🏢 Testing Company: ${companyConfig.name}`);
  console.log('='.repeat(80));
  
  try {
    // Find or mock company record
    let company = await prisma.companies.findFirst({
      where: {
        workspaceId: TEST_CONFIG.workspaceId,
        OR: [
          { website: { contains: companyConfig.website.replace('https://www.', '').replace('https://', '') } },
          { name: { contains: companyConfig.name, mode: 'insensitive' } }
        ]
      }
    });
    
    if (!company) {
      console.log(`⚠️ Company not found in database, creating mock company record...`);
      company = {
        id: 'test-company-' + Date.now(),
        name: companyConfig.name,
        website: companyConfig.website,
        linkedinUrl: companyConfig.linkedinUrl,
        workspaceId: TEST_CONFIG.workspaceId
      };
    }
    
    // Initialize pipeline
    const pipeline = new SmartBuyerGroupPipeline({
      prisma,
      workspaceId: TEST_CONFIG.workspaceId,
      dealSize: TEST_CONFIG.dealSize,
      productCategory: TEST_CONFIG.productCategory,
      targetCompany: companyConfig.linkedinUrl,
      skipDatabase: TEST_CONFIG.skipDatabase
    });
    
    // Run pipeline
    console.log('\n🚀 Running buyer group discovery pipeline...');
    const startTime = Date.now();
    const result = await pipeline.run(company);
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Pipeline completed in ${duration}ms`);
    console.log(`💰 Total Cost: $${result.costs.total.toFixed(4)}`);
    console.log(`   - Preview: $${result.costs.preview.toFixed(4)}`);
    console.log(`   - Collect: $${result.costs.collect.toFixed(4)}`);
    console.log(`   - Email: $${result.costs.email.toFixed(4)}`);
    console.log(`   - Phone: $${result.costs.phone.toFixed(4)}`);
    
    // Test email verification
    const emailStats = await testEmailVerification(result.buyerGroup);
    
    // Test phone verification
    const phoneStats = await testPhoneVerification(result.buyerGroup);
    
    // Validate expectations
    console.log('\n✅ Validation Results:');
    const validations = {
      memberCount: result.buyerGroup.length >= companyConfig.expected.minMembers,
      hasEmails: companyConfig.expected.shouldHaveEmails ? emailStats.withEmail > 0 : true,
      hasPhones: companyConfig.expected.shouldHavePhones ? phoneStats.withPhone > 0 : true,
      emailConfidence: emailStats.averageConfidence >= 70,
      phoneConfidence: phoneStats.averageConfidence >= 70
    };
    
    console.log(`   Member Count (>= ${companyConfig.expected.minMembers}): ${validations.memberCount ? '✅' : '❌'}`);
    console.log(`   Has Emails: ${validations.hasEmails ? '✅' : '❌'}`);
    console.log(`   Has Phones: ${validations.hasPhones ? '✅' : '❌'}`);
    console.log(`   Email Confidence (>= 70%): ${validations.emailConfidence ? '✅' : '❌'}`);
    console.log(`   Phone Confidence (>= 70%): ${validations.phoneConfidence ? '✅' : '❌'}`);
    
    const allPassed = Object.values(validations).every(v => v === true);
    
    return {
      company: companyConfig.name,
      passed: allPassed,
      duration,
      costs: result.costs,
      emailStats,
      phoneStats,
      validations
    };
    
  } catch (error) {
    console.error(`\n❌ Test failed for ${companyConfig.name}:`, error.message);
    console.error(error.stack);
    return {
      company: companyConfig.name,
      passed: false,
      error: error.message
    };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 EMAIL & PHONE VERIFICATION INTEGRATION TEST');
  console.log('='.repeat(80));
  
  // Check environment variables
  console.log('\n🔐 Checking Environment Variables:');
  const requiredEnvVars = [
    'CORESIGNAL_API_KEY',
    'LUSHA_API_KEY',
    'ZEROBOUNCE_API_KEY',
    'MYEMAILVERIFIER_API_KEY',
    'PROSPEO_API_KEY'
  ];
  
  const optionalEnvVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'PEOPLE_DATA_LABS_API_KEY',
    'PERPLEXITY_API_KEY'
  ];
  
  let missingRequired = [];
  
  requiredEnvVars.forEach(envVar => {
    const isSet = !!process.env[envVar];
    console.log(`   ${envVar}: ${isSet ? '✅' : '❌'}`);
    if (!isSet) missingRequired.push(envVar);
  });
  
  console.log('\n📋 Optional Environment Variables:');
  optionalEnvVars.forEach(envVar => {
    const isSet = !!process.env[envVar];
    console.log(`   ${envVar}: ${isSet ? '✅' : '⚠️ (optional)'}`);
  });
  
  if (missingRequired.length > 0) {
    console.error(`\n❌ Missing required environment variables: ${missingRequired.join(', ')}`);
    console.error('Please set these variables before running the test.');
    process.exit(1);
  }
  
  // Run tests for each company
  const results = [];
  
  for (const companyConfig of TEST_CONFIG.testCompanies) {
    const result = await testCompany(companyConfig);
    results.push(result);
    
    // Wait between tests to avoid rate limiting
    if (TEST_CONFIG.testCompanies.indexOf(companyConfig) < TEST_CONFIG.testCompanies.length - 1) {
      console.log('\n⏳ Waiting 5 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  results.forEach(result => {
    if (!result.error) {
      console.log(`\n${result.passed ? '✅' : '❌'} ${result.company}`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Total Cost: $${result.costs.total.toFixed(4)}`);
      console.log(`   Email: ${result.emailStats.emailVerified}/${result.emailStats.withEmail} verified (${result.emailStats.averageConfidence}% avg confidence)`);
      console.log(`   Phone: ${result.phoneStats.phoneVerified}/${result.phoneStats.withPhone} verified (${result.phoneStats.averageConfidence}% avg confidence)`);
    } else {
      console.log(`\n❌ ${result.company}: ${result.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  
  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED! Email and phone verification working correctly.');
  } else {
    console.log(`⚠️ ${failed} test(s) failed. Please review the output above.`);
  }
  
  console.log('='.repeat(80) + '\n');
  
  // Exit with appropriate code
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runTests()
  .catch(error => {
    console.error('\n❌ Test runner failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

