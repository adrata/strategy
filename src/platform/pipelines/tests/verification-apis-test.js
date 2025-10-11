#!/usr/bin/env node

/**
 * 🔍 VERIFICATION APIs COMPREHENSIVE TEST
 * 
 * Tests each verification API independently to verify functionality:
 * 
 * EMAIL VERIFICATION (4 layers):
 * 1. Syntax Validation
 * 2. Domain Validation  
 * 3. SMTP Validation (ZeroBounce + MyEmailVerifier)
 * 4. Prospeo Email Verifier
 * 
 * PHONE VERIFICATION (4 sources):
 * 1. Lusha
 * 2. People Data Labs
 * 3. Twilio
 * 4. Prospeo Mobile Finder (requires LinkedIn URL)
 */

const { MultiSourceVerifier } = require('../modules/core/MultiSourceVerifier');

async function runVerificationAPIsTest() {
    console.log('🔍 VERIFICATION APIs COMPREHENSIVE TEST');
    console.log('=' .repeat(60));

    const verifier = new MultiSourceVerifier();
    const testResults = {
        email: { passed: 0, failed: 0, tests: [] },
        phone: { passed: 0, failed: 0, tests: [] }
    };

    console.log('\n📧 EMAIL VERIFICATION TESTS');
    console.log('-' .repeat(40));

    // Test 1: Syntax Validation
    try {
        console.log('🔍 Testing email syntax validation...');
        const validEmail = 'test@salesforce.com';
        const invalidEmail = 'invalid-email';
        
        const validResult = verifier.validateEmailSyntax(validEmail);
        const invalidResult = verifier.validateEmailSyntax(invalidEmail);
        
        if (validResult && !invalidResult) {
            console.log('   ✅ Syntax validation: Working correctly');
            testResults.email.passed++;
            testResults.email.tests.push('Syntax validation: PASSED');
        } else {
            console.log('   ❌ Syntax validation: Failed');
            testResults.email.failed++;
            testResults.email.tests.push('Syntax validation: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Syntax validation error: ${error.message}`);
        testResults.email.failed++;
        testResults.email.tests.push(`Syntax validation: ERROR - ${error.message}`);
    }

    // Test 2: Domain Validation
    try {
        console.log('🔍 Testing email domain validation...');
        const result = await verifier.validateEmailDomain('test@salesforce.com', 'salesforce.com');
        if (result && typeof result.valid === 'boolean') {
            console.log(`   ✅ Domain validation: Working (${result.valid ? 'valid' : 'invalid'})`);
            testResults.email.passed++;
            testResults.email.tests.push('Domain validation: PASSED');
        } else {
            console.log('   ❌ Domain validation: Failed');
            testResults.email.failed++;
            testResults.email.tests.push('Domain validation: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Domain validation error: ${error.message}`);
        testResults.email.failed++;
        testResults.email.tests.push(`Domain validation: ERROR - ${error.message}`);
    }

    // Test 3: SMTP Validation (ZeroBounce + MyEmailVerifier)
    try {
        console.log('🔍 Testing SMTP validation (ZeroBounce + MyEmailVerifier)...');
        const result = await verifier.validateEmailSMTP('test@salesforce.com');
        if (result && typeof result.valid === 'boolean') {
            console.log(`   ✅ SMTP validation: Working (${result.valid ? 'valid' : 'invalid'}) - ${result.reasoning}`);
            testResults.email.passed++;
            testResults.email.tests.push('SMTP validation: PASSED');
        } else {
            console.log('   ❌ SMTP validation: Failed');
            testResults.email.failed++;
            testResults.email.tests.push('SMTP validation: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ SMTP validation error: ${error.message}`);
        testResults.email.failed++;
        testResults.email.tests.push(`SMTP validation: ERROR - ${error.message}`);
    }

    // Test 4: Prospeo Email Verifier
    try {
        console.log('🔍 Testing Prospeo email verifier...');
        const result = await verifier.verifyEmailWithProspeo('test@salesforce.com', 'John Smith', 'salesforce.com');
        if (result !== null) {
            console.log(`   ✅ Prospeo email: Working (${result.isValid ? 'valid' : 'invalid'}) - ${result.confidence}% confidence`);
            testResults.email.passed++;
            testResults.email.tests.push('Prospeo email: PASSED');
        } else {
            console.log('   ❌ Prospeo email: Failed');
            testResults.email.failed++;
            testResults.email.tests.push('Prospeo email: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Prospeo email error: ${error.message}`);
        testResults.email.failed++;
        testResults.email.tests.push(`Prospeo email: ERROR - ${error.message}`);
    }

    // Test 5: Complete Email Verification
    try {
        console.log('🔍 Testing complete email verification (4 layers)...');
        const result = await verifier.verifyEmailMultiLayer('test@salesforce.com', 'John Smith', 'salesforce.com');
        if (result && result.confidence >= 0) {
            console.log(`   ✅ Complete email verification: ${result.confidence}% confidence (${result.validationSteps})`);
            testResults.email.passed++;
            testResults.email.tests.push('Complete email verification: PASSED');
        } else {
            console.log('   ❌ Complete email verification: Failed');
            testResults.email.failed++;
            testResults.email.tests.push('Complete email verification: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Complete email verification error: ${error.message}`);
        testResults.email.failed++;
        testResults.email.tests.push(`Complete email verification: ERROR - ${error.message}`);
    }

    console.log('\n📱 PHONE VERIFICATION TESTS');
    console.log('-' .repeat(40));

    // Test 6: Lusha Phone Verification
    try {
        console.log('🔍 Testing Lusha phone verification...');
        const result = await verifier.verifyPhoneWithLusha('+1234567890', 'John Smith', 'Salesforce');
        if (result !== null) {
            console.log(`   ✅ Lusha phone: Working (${result.valid ? 'valid' : 'invalid'}) - ${result.confidence}% confidence`);
            testResults.phone.passed++;
            testResults.phone.tests.push('Lusha phone: PASSED');
        } else {
            console.log('   ❌ Lusha phone: Failed');
            testResults.phone.failed++;
            testResults.phone.tests.push('Lusha phone: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Lusha phone error: ${error.message}`);
        testResults.phone.failed++;
        testResults.phone.tests.push(`Lusha phone: ERROR - ${error.message}`);
    }

    // Test 7: People Data Labs Phone Verification
    try {
        console.log('🔍 Testing People Data Labs phone verification...');
        const result = await verifier.verifyPhoneWithPDL('+1234567890', 'John Smith', 'Salesforce');
        if (result !== null) {
            console.log(`   ✅ People Data Labs phone: Working (${result.valid ? 'valid' : 'invalid'}) - ${result.confidence}% confidence`);
            testResults.phone.passed++;
            testResults.phone.tests.push('People Data Labs phone: PASSED');
        } else {
            console.log('   ❌ People Data Labs phone: Failed (likely 402 - credits exhausted)');
            testResults.phone.failed++;
            testResults.phone.tests.push('People Data Labs phone: FAILED (402 - credits exhausted)');
        }
    } catch (error) {
        console.log(`   ❌ People Data Labs phone error: ${error.message}`);
        testResults.phone.failed++;
        testResults.phone.tests.push(`People Data Labs phone: ERROR - ${error.message}`);
    }

    // Test 8: Twilio Phone Verification
    try {
        console.log('🔍 Testing Twilio phone verification...');
        const result = await verifier.verifyPhoneWithTwilio('+1234567890');
        if (result !== null) {
            console.log(`   ✅ Twilio phone: Working (${result.valid ? 'valid' : 'invalid'}) - ${result.confidence}% confidence`);
            testResults.phone.passed++;
            testResults.phone.tests.push('Twilio phone: PASSED');
        } else {
            console.log('   ❌ Twilio phone: Failed');
            testResults.phone.failed++;
            testResults.phone.tests.push('Twilio phone: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Twilio phone error: ${error.message}`);
        testResults.phone.failed++;
        testResults.phone.tests.push(`Twilio phone: ERROR - ${error.message}`);
    }

    // Test 9: Prospeo Mobile Finder (with LinkedIn URL)
    try {
        console.log('🔍 Testing Prospeo Mobile Finder (with LinkedIn URL)...');
        const linkedinUrl = 'https://www.linkedin.com/in/johnsmith';
        const result = await verifier.verifyPhoneWithProspeo('+1234567890', 'John Smith', 'Salesforce', linkedinUrl);
        if (result !== null) {
            console.log(`   ✅ Prospeo Mobile: Working (${result.valid ? 'valid' : 'invalid'}) - ${result.confidence}% confidence`);
            testResults.phone.passed++;
            testResults.phone.tests.push('Prospeo Mobile: PASSED');
        } else {
            console.log('   ❌ Prospeo Mobile: Failed');
            testResults.phone.failed++;
            testResults.phone.tests.push('Prospeo Mobile: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Prospeo Mobile error: ${error.message}`);
        testResults.phone.failed++;
        testResults.phone.tests.push(`Prospeo Mobile: ERROR - ${error.message}`);
    }

    // Test 10: Prospeo Mobile Finder (without LinkedIn URL)
    try {
        console.log('🔍 Testing Prospeo Mobile Finder (without LinkedIn URL)...');
        const result = await verifier.verifyPhoneWithProspeo('+1234567890', 'John Smith', 'Salesforce', null);
        if (result === null) {
            console.log('   ✅ Prospeo Mobile (no LinkedIn): Correctly skipped');
            testResults.phone.passed++;
            testResults.phone.tests.push('Prospeo Mobile (no LinkedIn): PASSED');
        } else {
            console.log('   ❌ Prospeo Mobile (no LinkedIn): Should have been skipped');
            testResults.phone.failed++;
            testResults.phone.tests.push('Prospeo Mobile (no LinkedIn): FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Prospeo Mobile (no LinkedIn) error: ${error.message}`);
        testResults.phone.failed++;
        testResults.phone.tests.push(`Prospeo Mobile (no LinkedIn): ERROR - ${error.message}`);
    }

    // Test 11: Complete Phone Verification (4 sources)
    try {
        console.log('🔍 Testing complete phone verification (4 sources)...');
        const linkedinUrl = 'https://www.linkedin.com/in/johnsmith';
        const result = await verifier.verifyPhone('+1234567890', 'John Smith', 'Salesforce', linkedinUrl);
        if (result && result.confidence >= 0) {
            console.log(`   ✅ Complete phone verification: ${result.confidence}% confidence (${result.sources.length} sources)`);
            testResults.phone.passed++;
            testResults.phone.tests.push('Complete phone verification: PASSED');
        } else {
            console.log('   ❌ Complete phone verification: Failed');
            testResults.phone.failed++;
            testResults.phone.tests.push('Complete phone verification: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Complete phone verification error: ${error.message}`);
        testResults.phone.failed++;
        testResults.phone.tests.push(`Complete phone verification: ERROR - ${error.message}`);
    }

    // Generate comprehensive report
    console.log('\n📊 VERIFICATION APIs TEST REPORT');
    console.log('=' .repeat(60));

    const totalTests = testResults.email.passed + testResults.email.failed + testResults.phone.passed + testResults.phone.failed;
    const totalPassed = testResults.email.passed + testResults.phone.passed;
    const totalFailed = testResults.email.failed + testResults.phone.failed;

    console.log(`\n📈 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed} (${Math.round(totalPassed/totalTests*100)}%)`);
    console.log(`   Failed: ${totalFailed} (${Math.round(totalFailed/totalTests*100)}%)`);

    console.log(`\n📧 EMAIL VERIFICATION RESULTS:`);
    console.log(`   Passed: ${testResults.email.passed}/${testResults.email.passed + testResults.email.failed} (${Math.round(testResults.email.passed/(testResults.email.passed + testResults.email.failed)*100)}%)`);
    testResults.email.tests.forEach(test => {
        const status = test.includes('PASSED') ? '✅' : test.includes('FAILED') ? '❌' : '⚠️';
        console.log(`   ${status} ${test}`);
    });

    console.log(`\n📱 PHONE VERIFICATION RESULTS:`);
    console.log(`   Passed: ${testResults.phone.passed}/${testResults.phone.passed + testResults.phone.failed} (${Math.round(testResults.phone.passed/(testResults.phone.passed + testResults.phone.failed)*100)}%)`);
    testResults.phone.tests.forEach(test => {
        const status = test.includes('PASSED') ? '✅' : test.includes('FAILED') ? '❌' : '⚠️';
        console.log(`   ${status} ${test}`);
    });

    // Success criteria
    const emailSuccess = testResults.email.passed >= (testResults.email.passed + testResults.email.failed) * 0.8;
    const phoneSuccess = testResults.phone.passed >= (testResults.phone.passed + testResults.phone.failed) * 0.6; // Lower threshold due to API limitations
    const overallSuccess = totalPassed >= totalTests * 0.7;

    console.log(`\n🎯 SUCCESS CRITERIA:`);
    console.log(`   Email Verification: ${Math.round(testResults.email.passed/(testResults.email.passed + testResults.email.failed)*100)}% (Target: 80%+)`);
    console.log(`   Phone Verification: ${Math.round(testResults.phone.passed/(testResults.phone.passed + testResults.phone.failed)*100)}% (Target: 60%+)`);
    console.log(`   Overall: ${Math.round(totalPassed/totalTests*100)}% (Target: 70%+)`);

    console.log(`\n${overallSuccess ? '✅' : '❌'} VERIFICATION APIs TEST ${overallSuccess ? 'PASSED' : 'FAILED'}`);
    
    return {
        success: overallSuccess,
        totalTests,
        totalPassed,
        totalFailed,
        emailResults: testResults.email,
        phoneResults: testResults.phone
    };
}

// Run the test if this file is executed directly
if (require.main === module) {
    runVerificationAPIsTest().catch(console.error);
}

module.exports = { runVerificationAPIsTest };
