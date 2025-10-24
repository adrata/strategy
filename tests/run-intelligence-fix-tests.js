#!/usr/bin/env node

/**
 * Test Runner for Company Intelligence API Fixes
 * 
 * This script runs comprehensive tests to verify that the Prisma relation
 * errors have been resolved and the intelligence APIs work correctly.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Company Intelligence API Fix Tests...\n');

// Test configuration
const testConfig = {
  testFile: 'tests/api/company-intelligence-fix.test.ts',
  timeout: 30000, // 30 seconds
  verbose: true
};

// Check if test file exists
if (!fs.existsSync(testConfig.testFile)) {
  console.error('❌ Test file not found:', testConfig.testFile);
  process.exit(1);
}

console.log('📋 Test Configuration:');
console.log(`   Test File: ${testConfig.testFile}`);
console.log(`   Timeout: ${testConfig.timeout}ms`);
console.log(`   Verbose: ${testConfig.verbose}`);
console.log('');

// Run the tests
try {
  console.log('🚀 Starting tests...\n');
  
  const testCommand = `npx jest ${testConfig.testFile} --verbose --timeout=${testConfig.timeout}`;
  console.log(`Running: ${testCommand}\n`);
  
  const result = execSync(testCommand, { 
    encoding: 'utf8',
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ All tests completed successfully!');
  console.log('🎉 Company Intelligence API fixes are working correctly!');
  
} catch (error) {
  console.error('\n❌ Test execution failed:');
  console.error(error.message);
  
  if (error.status) {
    console.error(`Exit code: ${error.status}`);
  }
  
  console.log('\n🔍 Troubleshooting:');
  console.log('1. Ensure the database is running and accessible');
  console.log('2. Check that Prisma schema is up to date');
  console.log('3. Verify test data setup is correct');
  console.log('4. Check for any remaining Prisma relation errors');
  
  process.exit(1);
}
