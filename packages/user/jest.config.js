module.exports = {
  displayName: 'User Module',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './src',
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.spec.ts',
  ],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/test/**',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  moduleNameMapping: {
    '^@aiofix/shared$': '<rootDir>/../../shared/src',
    '^@aiofix/user$': '<rootDir>/../src',
  },
  testTimeout: 10000,
  verbose: true,
};
