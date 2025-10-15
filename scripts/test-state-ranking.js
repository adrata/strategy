#!/usr/bin/env node

/**
 * State-Based Ranking Test Runner
 * 
 * Comprehensive test runner for the state-based ranking system
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 State-Based Ranking Test Suite');
console.log('==================================\n');

// Test configuration
const testConfig = {
  unit: {
    pattern: 'tests/unit/ranking/**/*.test.ts tests/unit/speedrun/speedrun-engine.test.ts',
    description: 'Unit Tests'
  },
  integration: {
    pattern: 'tests/integration/api/state-ranking-api.test.ts',
    description: 'API Integration Tests'
  },
  e2e: {
    pattern: 'tests/e2e/state-based-ranking.spec.ts',
    description: 'End-to-End Tests'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}Running: ${description}${colors.reset}`);
  log(`${colors.yellow}Command: ${command}${colors.reset}\n`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log(`${colors.green}✅ ${description} - PASSED${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} - FAILED${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return false;
  }
}

function checkTestFiles() {
  log(`${colors.blue}Checking test files...${colors.reset}`);
  
  const testFiles = [
    'tests/unit/ranking/state-ranking.test.ts',
    'tests/unit/speedrun/speedrun-engine.test.ts',
    'tests/integration/api/state-ranking-api.test.ts',
    'tests/e2e/state-based-ranking.spec.ts'
  ];
  
  let allFilesExist = true;
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`${colors.green}✅ ${file}${colors.reset}`);
    } else {
      log(`${colors.red}❌ ${file} - NOT FOUND${colors.reset}`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

function runTypeCheck() {
  log(`${colors.blue}Running TypeScript type check...${colors.reset}`);
  
  const filesToCheck = [
    'src/products/speedrun/state-ranking.ts',
    'src/products/speedrun/types/StateRankingTypes.ts',
    'src/products/speedrun/components/StateRankingManager.tsx',
    'src/app/api/v1/user/settings/route.ts',
    'src/app/api/v1/speedrun/state-data/route.ts'
  ];
  
  return runCommand(
    `npx tsc --noEmit --skipLibCheck ${filesToCheck.join(' ')}`,
    'TypeScript Type Check'
  );
}

function runLinting() {
  log(`${colors.blue}Running ESLint...${colors.reset}`);
  
  const filesToLint = [
    'src/products/speedrun/state-ranking.ts',
    'src/products/speedrun/types/StateRankingTypes.ts',
    'src/products/speedrun/components/StateRankingManager.tsx',
    'src/app/api/v1/user/settings/route.ts',
    'src/app/api/v1/speedrun/state-data/route.ts'
  ];
  
  return runCommand(
    `npx eslint ${filesToLint.join(' ')}`,
    'ESLint Check'
  );
}

function runUnitTests() {
  return runCommand(
    `npm test -- ${testConfig.unit.pattern}`,
    testConfig.unit.description
  );
}

function runIntegrationTests() {
  return runCommand(
    `npm test -- ${testConfig.integration.pattern}`,
    testConfig.integration.description
  );
}

function runE2ETests() {
  return runCommand(
    `npx playwright test ${testConfig.e2e.pattern}`,
    testConfig.e2e.description
  );
}

function runAllTests() {
  return runCommand(
    `npm test -- tests/unit/ranking/ tests/integration/api/state-ranking-api.test.ts`,
    'All Unit and Integration Tests'
  );
}

function generateTestReport() {
  log(`${colors.blue}Generating test coverage report...${colors.reset}`);
  
  return runCommand(
    `npm test -- --coverage --coverageReporters=text --coverageReporters=html tests/unit/ranking/`,
    'Test Coverage Report'
  );
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  log(`${colors.bright}State-Based Ranking Test Runner${colors.reset}`);
  log(`Command: ${command}\n`);
  
  let results = {
    files: false,
    types: false,
    lint: false,
    unit: false,
    integration: false,
    e2e: false,
    coverage: false
  };
  
  switch (command) {
    case 'files':
      results.files = checkTestFiles();
      break;
      
    case 'types':
      results.types = runTypeCheck();
      break;
      
    case 'lint':
      results.lint = runLinting();
      break;
      
    case 'unit':
      results.unit = runUnitTests();
      break;
      
    case 'integration':
      results.integration = runIntegrationTests();
      break;
      
    case 'e2e':
      results.e2e = runE2ETests();
      break;
      
    case 'coverage':
      results.coverage = generateTestReport();
      break;
      
    case 'all':
    default:
      log(`${colors.magenta}Running comprehensive test suite...${colors.reset}\n`);
      
      results.files = checkTestFiles();
      results.types = runTypeCheck();
      results.lint = runLinting();
      results.unit = runUnitTests();
      results.integration = runIntegrationTests();
      results.coverage = generateTestReport();
      
      // E2E tests are optional as they require a running application
      log(`${colors.yellow}Note: E2E tests require a running application${colors.reset}`);
      log(`${colors.yellow}Run 'npm run test:e2e' separately if needed${colors.reset}\n`);
      break;
  }
  
  // Summary
  log(`${colors.bright}Test Results Summary:${colors.reset}`);
  log('==================');
  
  Object.entries(results).forEach(([test, passed]) => {
    if (passed !== false) {
      const status = passed ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`;
      log(`${test.padEnd(12)} ${status}`);
    }
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    log(`\n${colors.green}🎉 All tests passed! State-based ranking system is ready.${colors.reset}`);
    process.exit(0);
  } else {
    log(`\n${colors.red}⚠️  Some tests failed. Please review the output above.${colors.reset}`);
    process.exit(1);
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(`${colors.bright}State-Based Ranking Test Runner${colors.reset}`);
  log('Usage: node scripts/test-state-ranking.js [command]\n');
  log('Commands:');
  log('  files        Check if all test files exist');
  log('  types        Run TypeScript type checking');
  log('  lint         Run ESLint on source files');
  log('  unit         Run unit tests');
  log('  integration  Run integration tests');
  log('  e2e          Run end-to-end tests');
  log('  coverage     Generate test coverage report');
  log('  all          Run all tests (default)');
  log('  --help, -h   Show this help message');
  process.exit(0);
}

main();
