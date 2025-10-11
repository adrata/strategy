#!/usr/bin/env node

/**
 * 🧪 API VERIFICATION TEST SUITE
 * 
 * Comprehensive testing of all API integrations to ensure they work correctly
 * before running the full pipeline
 */

const { CoreSignalMultiSource } = require('../modules/core/CoreSignalMultiSource');
const { MultiSourceVerifier } = require('../modules/core/MultiSourceVerifier');
require('dotenv').config();

class APIVerificationTest {
    constructor() {
        this.config = {
            CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
            CORESIGNAL_BASE_URL: 'https://api.coresignal.com',
            LUSHA_API_KEY: process.env.LUSHA_API_KEY,
            PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
            ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
            MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
            PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
            PEOPLE_DATA_LABS_API_KEY: process.env.PEOPLE_DATA_LABS_API_KEY,
            TIMEOUT: 30000
        };

        this.coresignal = new CoreSignalMultiSource(this.config);
        this.verifier = new MultiSourceVerifier(this.config);
        
        this.testResults = {
            coresignal: { passed: 0, failed: 0, tests: [] },
            perplexity: { passed: 0, failed: 0, tests: [] },
            lusha: { passed: 0, failed: 0, tests: [] },
            emailVerifiers: { passed: 0, failed: 0, tests: [] }
        };
    }

    async runAllTests() {
        console.log('🧪 API VERIFICATION TEST SUITE\n');
        console.log('Testing all API integrations...\n');

        try {
            // Test 1: CoreSignal API
            console.log('1️⃣ Testing CoreSignal API...');
            await this.testCoreSignal();

            // Test 2: Perplexity API
            console.log('\n2️⃣ Testing Perplexity API...');
            await this.testPerplexity();

            // Test 3: Lusha API
            console.log('\n3️⃣ Testing Lusha API...');
            await this.testLusha();

            // Test 4: Email Verification APIs
            console.log('\n4️⃣ Testing Email Verification APIs...');
            await this.testEmailVerifiers();

            // Summary
            this.printSummary();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }
    }

    async testCoreSignal() {
        const tests = [
            {
                name: 'Company ID Search - HighRadius',
                test: () => this.coresignal.searchCompanyId('highradius', 'www.highradius.com'),
                expected: 'number'
            },
            {
                name: 'Company ID Search - Optimizely',
                test: () => this.coresignal.searchCompanyId('optimizely', 'www.optimizely.com'),
                expected: 'number'
            },
            {
                name: 'Company ID Search - Exadel',
                test: () => this.coresignal.searchCompanyId('exadel', 'www.exadel.com'),
                expected: 'number'
            },
            {
                name: 'Employee Preview - HighRadius',
                test: () => this.coresignal.previewEmployees('highradius'),
                expected: 'array'
            },
            {
                name: 'Executive Discovery - HighRadius',
                test: () => this.coresignal.discoverExecutives('highradius', ['CFO', 'CRO'], 'www.highradius.com'),
                expected: 'object'
            }
        ];

        for (const test of tests) {
            try {
                console.log(`   🔍 ${test.name}...`);
                const result = await test.test();
                
                if (this.validateResult(result, test.expected)) {
                    console.log(`   ✅ ${test.name}: PASSED`);
                    this.testResults.coresignal.passed++;
                    this.testResults.coresignal.tests.push({ name: test.name, status: 'PASSED', result: typeof result });
                } else {
                    console.log(`   ❌ ${test.name}: FAILED (Expected ${test.expected}, got ${typeof result})`);
                    this.testResults.coresignal.failed++;
                    this.testResults.coresignal.tests.push({ name: test.name, status: 'FAILED', result: typeof result });
                }
            } catch (error) {
                console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
                this.testResults.coresignal.failed++;
                this.testResults.coresignal.tests.push({ name: test.name, status: 'ERROR', error: error.message });
            }
        }
    }

    async testPerplexity() {
        const tests = [
            {
                name: 'Employment Verification - Valid Person',
                test: () => this.verifier.verifyWithPerplexity('Dixit Jasani', 'CFO', 'HighRadius'),
                expected: 'object'
            },
            {
                name: 'Employment Verification - Invalid Person',
                test: () => this.verifier.verifyWithPerplexity('John Doe', 'CEO', 'FakeCompany'),
                expected: 'object'
            }
        ];

        for (const test of tests) {
            try {
                console.log(`   🔍 ${test.name}...`);
                const result = await test.test();
                
                if (this.validateResult(result, test.expected)) {
                    console.log(`   ✅ ${test.name}: PASSED`);
                    this.testResults.perplexity.passed++;
                    this.testResults.perplexity.tests.push({ name: test.name, status: 'PASSED', result: typeof result });
                } else {
                    console.log(`   ❌ ${test.name}: FAILED (Expected ${test.expected}, got ${typeof result})`);
                    this.testResults.perplexity.failed++;
                    this.testResults.perplexity.tests.push({ name: test.name, status: 'FAILED', result: typeof result });
                }
            } catch (error) {
                console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
                this.testResults.perplexity.failed++;
                this.testResults.perplexity.tests.push({ name: test.name, status: 'ERROR', error: error.message });
            }
        }
    }

    async testLusha() {
        const tests = [
            {
                name: 'Person Lookup - Valid Person',
                test: () => this.verifier.verifyWithLusha('Dixit Jasani', 'HighRadius', 'highradius.com'),
                expected: 'object'
            },
            {
                name: 'Person Lookup - Invalid Person',
                test: () => this.verifier.verifyWithLusha('John Doe', 'FakeCompany', 'fakecompany.com'),
                expected: 'object'
            }
        ];

        for (const test of tests) {
            try {
                console.log(`   🔍 ${test.name}...`);
                const result = await test.test();
                
                if (this.validateResult(result, test.expected)) {
                    console.log(`   ✅ ${test.name}: PASSED`);
                    this.testResults.lusha.passed++;
                    this.testResults.lusha.tests.push({ name: test.name, status: 'PASSED', result: typeof result });
                } else {
                    console.log(`   ❌ ${test.name}: FAILED (Expected ${test.expected}, got ${typeof result})`);
                    this.testResults.lusha.failed++;
                    this.testResults.lusha.tests.push({ name: test.name, status: 'FAILED', result: typeof result });
                }
            } catch (error) {
                console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
                this.testResults.lusha.failed++;
                this.testResults.lusha.tests.push({ name: test.name, status: 'ERROR', error: error.message });
            }
        }
    }

    async testEmailVerifiers() {
        const testEmail = 'dixit.jasani@highradius.com';
        
        const tests = [
            {
                name: 'Email Syntax Validation',
                test: () => this.verifier.validateEmailSyntax(testEmail),
                expected: 'boolean'
            },
            {
                name: 'Email Domain Validation',
                test: () => this.verifier.validateEmailDomain(testEmail, 'highradius.com'),
                expected: 'object'
            },
            {
                name: 'Email SMTP Validation',
                test: () => this.verifier.validateEmailSMTP(testEmail),
                expected: 'object'
            }
        ];

        for (const test of tests) {
            try {
                console.log(`   🔍 ${test.name}...`);
                const result = await test.test();
                
                if (this.validateResult(result, test.expected)) {
                    console.log(`   ✅ ${test.name}: PASSED`);
                    this.testResults.emailVerifiers.passed++;
                    this.testResults.emailVerifiers.tests.push({ name: test.name, status: 'PASSED', result: typeof result });
                } else {
                    console.log(`   ❌ ${test.name}: FAILED (Expected ${test.expected}, got ${typeof result})`);
                    this.testResults.emailVerifiers.failed++;
                    this.testResults.emailVerifiers.tests.push({ name: test.name, status: 'FAILED', result: typeof result });
                }
            } catch (error) {
                console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
                this.testResults.emailVerifiers.failed++;
                this.testResults.emailVerifiers.tests.push({ name: test.name, status: 'ERROR', error: error.message });
            }
        }
    }

    validateResult(result, expected) {
        if (expected === 'number') return typeof result === 'number' && result > 0;
        if (expected === 'array') return Array.isArray(result);
        if (expected === 'object') return typeof result === 'object' && result !== null;
        if (expected === 'boolean') return typeof result === 'boolean';
        return typeof result === expected;
    }

    printSummary() {
        console.log('\n📊 TEST SUMMARY\n');
        
        const totalPassed = Object.values(this.testResults).reduce((sum, api) => sum + api.passed, 0);
        const totalFailed = Object.values(this.testResults).reduce((sum, api) => sum + api.failed, 0);
        const totalTests = totalPassed + totalFailed;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${totalPassed} ✅`);
        console.log(`Failed: ${totalFailed} ❌`);
        console.log(`Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%\n`);

        // Detailed results
        for (const [apiName, results] of Object.entries(this.testResults)) {
            console.log(`${apiName.toUpperCase()}:`);
            console.log(`  Passed: ${results.passed}, Failed: ${results.failed}`);
            
            if (results.failed > 0) {
                console.log('  Failed Tests:');
                results.tests.filter(t => t.status !== 'PASSED').forEach(test => {
                    console.log(`    - ${test.name}: ${test.status}`);
                });
            }
            console.log('');
        }

        if (totalFailed === 0) {
            console.log('🎉 All API tests passed! Ready for production run.');
        } else {
            console.log('⚠️ Some API tests failed. Review and fix before production run.');
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new APIVerificationTest();
    tester.runAllTests().catch(console.error);
}

module.exports = APIVerificationTest;
