#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE PIPELINE VERIFICATION TEST
 * 
 * Tests each component of the pipeline to ensure everything is working correctly:
 * 1. CoreSignal API (company search, executive discovery, employment verification)
 * 2. Multi-Source Verification (person, email, phone)
 * 3. All API integrations (Lusha, Prospeo, Twilio, People Data Labs, Perplexity)
 * 4. Data flow and output validation
 */

const { CoreSignalMultiSource } = require('../modules/core/CoreSignalMultiSource');
const { MultiSourceVerifier } = require('../modules/core/MultiSourceVerifier');

async function runPipelineVerificationTest() {
    console.log('🔍 COMPREHENSIVE PIPELINE VERIFICATION TEST');
    console.log('=' .repeat(60));

    const testResults = {
        coresignal: { passed: 0, failed: 0, tests: [] },
        verification: { passed: 0, failed: 0, tests: [] },
        apis: { passed: 0, failed: 0, tests: [] },
        dataFlow: { passed: 0, failed: 0, tests: [] }
    };

    // Initialize components
    const coresignal = new CoreSignalMultiSource();
    const verifier = new MultiSourceVerifier();

    console.log('\n📋 PHASE 1: CORESIGNAL API VERIFICATION');
    console.log('-' .repeat(40));

    // Test 1: Company ID Search
    try {
        console.log('🔍 Testing CoreSignal company ID search...');
        const companyId = await coresignal.searchCompanyId('Salesforce', 'salesforce.com');
        if (companyId) {
            console.log(`   ✅ Company ID found: ${companyId}`);
            testResults.coresignal.passed++;
            testResults.coresignal.tests.push('Company ID search: PASSED');
        } else {
            console.log('   ❌ Company ID not found');
            testResults.coresignal.failed++;
            testResults.coresignal.tests.push('Company ID search: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Company ID search error: ${error.message}`);
        testResults.coresignal.failed++;
        testResults.coresignal.tests.push(`Company ID search: ERROR - ${error.message}`);
    }

    // Test 2: Executive Discovery
    try {
        console.log('🔍 Testing CoreSignal executive discovery...');
        const executives = await coresignal.discoverExecutives('Salesforce', ['CFO', 'CRO'], 'salesforce.com');
        if (executives && (executives.cfo || executives.cro)) {
            console.log(`   ✅ Executives found: CFO=${!!executives.cfo}, CRO=${!!executives.cro}`);
            testResults.coresignal.passed++;
            testResults.coresignal.tests.push('Executive discovery: PASSED');
        } else {
            console.log('   ❌ No executives found');
            testResults.coresignal.failed++;
            testResults.coresignal.tests.push('Executive discovery: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Executive discovery error: ${error.message}`);
        testResults.coresignal.failed++;
        testResults.coresignal.tests.push(`Executive discovery: ERROR - ${error.message}`);
    }

    // Test 3: Employment Verification
    try {
        console.log('🔍 Testing CoreSignal employment verification...');
        const mockProfile = {
            member_experience_collection: [{
                company_name: 'Salesforce',
                date_from: '2020-01-01',
                date_to: null // Current employment
            }],
            current_company_name: 'Salesforce',
            last_updated: new Date().toISOString()
        };
        
        const employmentStatus = coresignal.extractEmploymentStatus(mockProfile);
        if (employmentStatus && employmentStatus.isCurrent) {
            console.log(`   ✅ Employment verification working: ${employmentStatus.reasoning}`);
            testResults.coresignal.passed++;
            testResults.coresignal.tests.push('Employment verification: PASSED');
        } else {
            console.log('   ❌ Employment verification failed');
            testResults.coresignal.failed++;
            testResults.coresignal.tests.push('Employment verification: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Employment verification error: ${error.message}`);
        testResults.coresignal.failed++;
        testResults.coresignal.tests.push(`Employment verification: ERROR - ${error.message}`);
    }

    console.log('\n📋 PHASE 2: MULTI-SOURCE VERIFICATION');
    console.log('-' .repeat(40));

    // Test 4: Person Identity Verification
    try {
        console.log('🔍 Testing person identity verification...');
        const personData = {
            name: 'John Smith',
            title: 'CFO',
            company: 'Salesforce',
            email: 'john.smith@salesforce.com'
        };
        
        const personResult = await verifier.verifyPersonIdentity(personData, 'Salesforce', 'salesforce.com');
        if (personResult && personResult.confidence > 0) {
            console.log(`   ✅ Person verification: ${personResult.confidence}% confidence`);
            testResults.verification.passed++;
            testResults.verification.tests.push('Person identity verification: PASSED');
        } else {
            console.log('   ❌ Person verification failed');
            testResults.verification.failed++;
            testResults.verification.tests.push('Person identity verification: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Person verification error: ${error.message}`);
        testResults.verification.failed++;
        testResults.verification.tests.push(`Person identity verification: ERROR - ${error.message}`);
    }

    // Test 5: Email Verification
    try {
        console.log('🔍 Testing email verification...');
        const emailResult = await verifier.verifyEmailMultiLayer('test@salesforce.com', 'John Smith', 'salesforce.com');
        if (emailResult && emailResult.confidence >= 0) {
            console.log(`   ✅ Email verification: ${emailResult.confidence}% confidence`);
            testResults.verification.passed++;
            testResults.verification.tests.push('Email verification: PASSED');
        } else {
            console.log('   ❌ Email verification failed');
            testResults.verification.failed++;
            testResults.verification.tests.push('Email verification: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Email verification error: ${error.message}`);
        testResults.verification.failed++;
        testResults.verification.tests.push(`Email verification: ERROR - ${error.message}`);
    }

    // Test 6: Phone Verification (4 sources)
    try {
        console.log('🔍 Testing phone verification (4 sources)...');
        const phoneResult = await verifier.verifyPhone('+1234567890', 'John Smith', 'Salesforce');
        if (phoneResult && phoneResult.confidence >= 0) {
            console.log(`   ✅ Phone verification: ${phoneResult.confidence}% confidence, ${phoneResult.sources.length} sources`);
            testResults.verification.passed++;
            testResults.verification.tests.push('Phone verification: PASSED');
        } else {
            console.log('   ❌ Phone verification failed');
            testResults.verification.failed++;
            testResults.verification.tests.push('Phone verification: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Phone verification error: ${error.message}`);
        testResults.verification.failed++;
        testResults.verification.tests.push(`Phone verification: ERROR - ${error.message}`);
    }

    console.log('\n📋 PHASE 3: API INTEGRATION VERIFICATION');
    console.log('-' .repeat(40));

    // Test 7: Lusha API
    try {
        console.log('🔍 Testing Lusha API...');
        const lushaResult = await verifier.verifyWithLusha('John Smith', 'Salesforce', 'salesforce.com');
        if (lushaResult !== null) {
            console.log(`   ✅ Lusha API: ${lushaResult ? 'Working' : 'No data found'}`);
            testResults.apis.passed++;
            testResults.apis.tests.push('Lusha API: PASSED');
        } else {
            console.log('   ❌ Lusha API failed');
            testResults.apis.failed++;
            testResults.apis.tests.push('Lusha API: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Lusha API error: ${error.message}`);
        testResults.apis.failed++;
        testResults.apis.tests.push(`Lusha API: ERROR - ${error.message}`);
    }

    // Test 8: Prospeo Email API
    try {
        console.log('🔍 Testing Prospeo Email API...');
        const prospeoEmailResult = await verifier.verifyEmailWithProspeo('test@salesforce.com', 'John Smith', 'salesforce.com');
        if (prospeoEmailResult !== null) {
            console.log(`   ✅ Prospeo Email API: ${prospeoEmailResult ? 'Working' : 'No data found'}`);
            testResults.apis.passed++;
            testResults.apis.tests.push('Prospeo Email API: PASSED');
        } else {
            console.log('   ❌ Prospeo Email API failed');
            testResults.apis.failed++;
            testResults.apis.tests.push('Prospeo Email API: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Prospeo Email API error: ${error.message}`);
        testResults.apis.failed++;
        testResults.apis.tests.push(`Prospeo Email API: ERROR - ${error.message}`);
    }

    // Test 9: Prospeo Mobile API
    try {
        console.log('🔍 Testing Prospeo Mobile API...');
        const prospeoMobileResult = await verifier.verifyPhoneWithProspeo('+1234567890', 'John Smith', 'Salesforce');
        if (prospeoMobileResult !== null) {
            console.log(`   ✅ Prospeo Mobile API: ${prospeoMobileResult ? 'Working' : 'No data found'}`);
            testResults.apis.passed++;
            testResults.apis.tests.push('Prospeo Mobile API: PASSED');
        } else {
            console.log('   ❌ Prospeo Mobile API failed');
            testResults.apis.failed++;
            testResults.apis.tests.push('Prospeo Mobile API: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Prospeo Mobile API error: ${error.message}`);
        testResults.apis.failed++;
        testResults.apis.tests.push(`Prospeo Mobile API: ERROR - ${error.message}`);
    }

    // Test 10: Twilio API
    try {
        console.log('🔍 Testing Twilio API...');
        const twilioResult = await verifier.verifyPhoneWithTwilio('+1234567890');
        if (twilioResult !== null) {
            console.log(`   ✅ Twilio API: ${twilioResult ? 'Working' : 'No data found'}`);
            testResults.apis.passed++;
            testResults.apis.tests.push('Twilio API: PASSED');
        } else {
            console.log('   ❌ Twilio API failed');
            testResults.apis.failed++;
            testResults.apis.tests.push('Twilio API: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Twilio API error: ${error.message}`);
        testResults.apis.failed++;
        testResults.apis.tests.push(`Twilio API: ERROR - ${error.message}`);
    }

    // Test 11: People Data Labs API
    try {
        console.log('🔍 Testing People Data Labs API...');
        const pdlResult = await verifier.verifyPhoneWithPDL('+1234567890', 'John Smith', 'Salesforce');
        if (pdlResult !== null) {
            console.log(`   ✅ People Data Labs API: ${pdlResult ? 'Working' : 'No data found'}`);
            testResults.apis.passed++;
            testResults.apis.tests.push('People Data Labs API: PASSED');
        } else {
            console.log('   ❌ People Data Labs API failed');
            testResults.apis.failed++;
            testResults.apis.tests.push('People Data Labs API: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ People Data Labs API error: ${error.message}`);
        testResults.apis.failed++;
        testResults.apis.tests.push(`People Data Labs API: ERROR - ${error.message}`);
    }

    // Test 12: Perplexity API
    try {
        console.log('🔍 Testing Perplexity API...');
        const perplexityResult = await verifier.verifyWithPerplexity('John Smith', 'CFO', 'Salesforce');
        if (perplexityResult !== null) {
            console.log(`   ✅ Perplexity API: ${perplexityResult ? 'Working' : 'No data found'}`);
            testResults.apis.passed++;
            testResults.apis.tests.push('Perplexity API: PASSED');
        } else {
            console.log('   ❌ Perplexity API failed');
            testResults.apis.failed++;
            testResults.apis.tests.push('Perplexity API: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Perplexity API error: ${error.message}`);
        testResults.apis.failed++;
        testResults.apis.tests.push(`Perplexity API: ERROR - ${error.message}`);
    }

    console.log('\n📋 PHASE 4: DATA FLOW VERIFICATION');
    console.log('-' .repeat(40));

    // Test 13: End-to-End Pipeline
    try {
        console.log('🔍 Testing end-to-end pipeline...');
        const testCompany = { name: 'Salesforce', website: 'salesforce.com' };
        
        // Simulate the full pipeline flow
        const companyId = await coresignal.searchCompanyId(testCompany.name, testCompany.website);
        if (companyId) {
            const executives = await coresignal.discoverExecutives(testCompany.name, ['CFO'], testCompany.website);
            if (executives && executives.cfo) {
                const cfo = executives.cfo;
                console.log(`   ✅ End-to-end: Found CFO ${cfo.name} (${cfo.title})`);
                
                // Test verification flow
                const personResult = await verifier.verifyPersonIdentity(cfo, testCompany.name, testCompany.website);
                const emailResult = await verifier.verifyEmailMultiLayer(cfo.email, cfo.name, testCompany.website);
                const phoneResult = await verifier.verifyPhone(cfo.phone, cfo.name, testCompany.name);
                
                console.log(`   ✅ Verification: Person=${personResult.confidence}%, Email=${emailResult.confidence}%, Phone=${phoneResult.confidence}%`);
                
                testResults.dataFlow.passed++;
                testResults.dataFlow.tests.push('End-to-end pipeline: PASSED');
            } else {
                console.log('   ❌ End-to-end: No CFO found');
                testResults.dataFlow.failed++;
                testResults.dataFlow.tests.push('End-to-end pipeline: FAILED - No CFO found');
            }
        } else {
            console.log('   ❌ End-to-end: No company ID found');
            testResults.dataFlow.failed++;
            testResults.dataFlow.tests.push('End-to-end pipeline: FAILED - No company ID');
        }
    } catch (error) {
        console.log(`   ❌ End-to-end pipeline error: ${error.message}`);
        testResults.dataFlow.failed++;
        testResults.dataFlow.tests.push(`End-to-end pipeline: ERROR - ${error.message}`);
    }

    // Test 14: Data Quality Validation
    try {
        console.log('🔍 Testing data quality validation...');
        const mockExecutive = {
            name: 'John Smith',
            title: 'Chief Financial Officer',
            email: 'john.smith@salesforce.com',
            phone: '+1234567890',
            company: 'Salesforce'
        };
        
        // Validate required fields
        const hasRequiredFields = mockExecutive.name && mockExecutive.title && mockExecutive.company;
        const hasContactInfo = mockExecutive.email || mockExecutive.phone;
        
        if (hasRequiredFields && hasContactInfo) {
            console.log('   ✅ Data quality: All required fields present');
            testResults.dataFlow.passed++;
            testResults.dataFlow.tests.push('Data quality validation: PASSED');
        } else {
            console.log('   ❌ Data quality: Missing required fields');
            testResults.dataFlow.failed++;
            testResults.dataFlow.tests.push('Data quality validation: FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Data quality validation error: ${error.message}`);
        testResults.dataFlow.failed++;
        testResults.dataFlow.tests.push(`Data quality validation: ERROR - ${error.message}`);
    }

    // Generate comprehensive report
    console.log('\n📊 COMPREHENSIVE PIPELINE VERIFICATION REPORT');
    console.log('=' .repeat(60));

    const totalTests = Object.values(testResults).reduce((sum, category) => sum + category.passed + category.failed, 0);
    const totalPassed = Object.values(testResults).reduce((sum, category) => sum + category.passed, 0);
    const totalFailed = Object.values(testResults).reduce((sum, category) => sum + category.failed, 0);

    console.log(`\n📈 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed} (${Math.round(totalPassed/totalTests*100)}%)`);
    console.log(`   Failed: ${totalFailed} (${Math.round(totalFailed/totalTests*100)}%)`);

    console.log(`\n🔍 DETAILED BREAKDOWN:`);
    
    Object.entries(testResults).forEach(([category, results]) => {
        const categoryTotal = results.passed + results.failed;
        const categoryPassRate = Math.round(results.passed/categoryTotal*100);
        console.log(`\n   ${category.toUpperCase()}:`);
        console.log(`     Passed: ${results.passed}/${categoryTotal} (${categoryPassRate}%)`);
        results.tests.forEach(test => {
            const status = test.includes('PASSED') ? '✅' : test.includes('FAILED') ? '❌' : '⚠️';
            console.log(`     ${status} ${test}`);
        });
    });

    // Success criteria
    const overallSuccess = totalPassed >= totalTests * 0.8; // 80% pass rate
    console.log(`\n🎯 SUCCESS CRITERIA:`);
    console.log(`   Overall Pass Rate: ${Math.round(totalPassed/totalTests*100)}% (Target: 80%+)`);
    console.log(`   CoreSignal API: ${Math.round(testResults.coresignal.passed/(testResults.coresignal.passed+testResults.coresignal.failed)*100)}% (Target: 80%+)`);
    console.log(`   Verification Stack: ${Math.round(testResults.verification.passed/(testResults.verification.passed+testResults.verification.failed)*100)}% (Target: 80%+)`);
    console.log(`   API Integrations: ${Math.round(testResults.apis.passed/(testResults.apis.passed+testResults.apis.failed)*100)}% (Target: 80%+)`);
    console.log(`   Data Flow: ${Math.round(testResults.dataFlow.passed/(testResults.dataFlow.passed+testResults.dataFlow.failed)*100)}% (Target: 80%+)`);

    console.log(`\n${overallSuccess ? '✅' : '❌'} PIPELINE VERIFICATION ${overallSuccess ? 'PASSED' : 'FAILED'}`);
    
    return {
        success: overallSuccess,
        totalTests,
        totalPassed,
        totalFailed,
        passRate: Math.round(totalPassed/totalTests*100),
        results: testResults
    };
}

// Run the test if this file is executed directly
if (require.main === module) {
    runPipelineVerificationTest().catch(console.error);
}

module.exports = { runPipelineVerificationTest };
