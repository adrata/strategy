module.exports = {
  displayName: 'Actions Tests',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/actions-setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/platform/(.*)$': '<rootDir>/src/platform/$1',
    '^@/frontend/(.*)$': '<rootDir>/src/frontend/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  testMatch: [
    '<rootDir>/tests/unit/UniversalActionsTab.test.tsx',
    '<rootDir>/tests/integration/actions-api-validation.test.ts',
  ],
  collectCoverageFrom: [
    'src/frontend/components/pipeline/tabs/UniversalActionsTab.tsx',
    'src/app/api/v1/actions/[id]/route.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
};
