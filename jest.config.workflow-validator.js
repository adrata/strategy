/**
 * 🧪 Jest Configuration for Workflow Validator Tests
 * 
 * Comprehensive test configuration for TDD
 */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/workflow-validator-setup.ts'],
  
  // Test patterns
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/app/(locker)/private/TOP/interactive-workflow-validator/**/*.{js,jsx,ts,tsx}',
    'src/app/api/workflow/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
    // Specific thresholds for critical files
    'src/app/(locker)/private/TOP/interactive-workflow-validator/page.tsx': {
      branches: 85,
      functions: 90,
      lines: 95,
      statements: 95,
    },
    'src/app/api/workflow/execute-step/route.ts': {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance monitoring
  detectOpenHandles: true,
  forceExit: true,
  
  // Custom reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test-reports',
        filename: 'workflow-validator-report.html',
        expand: true,
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: './test-reports',
        outputName: 'junit.xml',
      },
    ],
  ],
  
  // Global setup
  globalSetup: '<rootDir>/tests/setup/global-setup.ts',
  
  // Global teardown
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',
  
  // Test results processor
  testResultsProcessor: '<rootDir>/tests/setup/test-results-processor.ts',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
