#!/usr/bin/env node

/**
 * Actions Tab Performance Test Runner
 * 
 * Runs comprehensive tests to ensure the Actions tab performance optimizations
 * are working correctly.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running Actions Tab Performance Tests...\n');

const testSuites = [
  {
    name: 'Unit Tests - Cache & Loading State',
    command: 'npm test -- tests/unit/components/UniversalActionsTab-performance.test.tsx',
    description: 'Tests cache-first loading, loading state management, and API optimization'
  },
  {
    name: 'Integration Tests - User Flow',
    command: 'npm test -- tests/integration/components/actions-tab-performance.test.tsx',
    description: 'Tests full user flow including tab switching and record navigation'
  },
  {
    name: 'Performance Benchmarks',
    command: 'npm test -- tests/performance/actions-tab-benchmarks.test.ts',
    description: 'Tests rendering performance, memory usage, and network optimization'
  },
  {
    name: 'E2E Tests - Browser Performance',
    command: 'npx playwright test tests/e2e/actions-tab-performance.e2e.test.ts',
    description: 'Tests real browser performance and user experience'
  }
];

const results = [];

for (const suite of testSuites) {
  console.log(`📋 ${suite.name}`);
  console.log(`   ${suite.description}\n`);
  
  try {
    const startTime = Date.now();
    execSync(suite.command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    results.push({
      name: suite.name,
      status: 'PASSED',
      duration: `${duration}ms`
    });
    
    console.log(`✅ ${suite.name} - PASSED (${duration}ms)\n`);
  } catch (error) {
    results.push({
      name: suite.name,
      status: 'FAILED',
      duration: 'N/A',
      error: error.message
    });
    
    console.log(`❌ ${suite.name} - FAILED`);
    console.log(`   Error: ${error.message}\n`);
  }
}

// Summary
console.log('📊 Test Results Summary:');
console.log('========================\n');

let passedCount = 0;
let failedCount = 0;

results.forEach(result => {
  const status = result.status === 'PASSED' ? '✅' : '❌';
  console.log(`${status} ${result.name} - ${result.status} (${result.duration})`);
  
  if (result.status === 'PASSED') {
    passedCount++;
  } else {
    failedCount++;
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
});

console.log(`\n📈 Total: ${passedCount} passed, ${failedCount} failed`);

if (failedCount === 0) {
  console.log('\n🎉 All Actions Tab performance tests passed!');
  console.log('   The optimizations are working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the issues above.');
  process.exit(1);
}

// Performance expectations
console.log('\n📋 Performance Expectations:');
console.log('============================');
console.log('• Cached data should load within 50ms');
console.log('• No loading skeleton when cache exists');
console.log('• Only 1 API call for person records');
console.log('• Background refresh for stale cache');
console.log('• Memory efficient with no leaks');
console.log('• Handles 100+ actions efficiently');

