const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Clean Jest config for fresh start
const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/test-backup/",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Performance optimizations
  maxWorkers: "50%",
  workerIdleMemoryLimit: "512MB",
  // Cache configuration
  cache: true,
  cacheDirectory: "<rootDir>/.jest-cache",
  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/__tests__/**",
    "!src/**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Test timeout
  testTimeout: 30000,
  // Memory leak detection
  detectLeaks: false,
  detectOpenHandles: false,
  // Transform ignore patterns
  transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],
  // Module directories
  moduleDirectories: ["node_modules", "<rootDir>/"],
  // Test match patterns - will find tests when you create them
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}",
    "<rootDir>/tests/**/*.{test,spec}.{js,jsx,ts,tsx}",
  ],
  // Verbose output only in CI
  verbose: process.env.CI === "true",
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
