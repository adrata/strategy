module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@tanstack/react-query))',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    '../src-mobile/**/*.{ts,tsx}',
    '!../src-mobile/**/*.d.ts',
    '!../src-mobile/**/*.stories.{ts,tsx}',
    '!../src-mobile/**/__tests__/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src-mobile/$1',
  },
  coverageDirectory: '<rootDir>/../tests/mobile/coverage',
  testEnvironment: 'node',
};
