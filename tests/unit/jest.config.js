/**
 * Jest configuration for unit tests
 * Supports both Backend (Node.js) and Mobile (React Native) testing
 */

module.exports = {
  displayName: 'Unit Tests',
  testMatch: ['<rootDir>/**/*.test.{js,ts,tsx}'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  
  // Projects configuration for different test environments
  projects: [
    {
      displayName: 'Backend Tests',
      testMatch: ['<rootDir>/backend/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      roots: ['<rootDir>/backend'],
      moduleFileExtensions: ['js', 'ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest'
      },
      collectCoverageFrom: [
        'backend/**/*.{js,ts}',
        '!backend/**/*.d.ts',
        '!backend/node_modules/**',
        '!backend/dist/**',
        '!backend/build/**'
      ],
      setupFilesAfterEnv: ['<rootDir>/setup/backend.setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/../../backend/src/$1'
      }
    },
    {
      displayName: 'Mobile Tests',
      testMatch: ['<rootDir>/mobile/**/*.test.{js,ts,tsx}'],
      preset: 'jest-expo',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/mobile'],
      moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
      transform: {
        '^.+\\.(js|ts|tsx)$': 'babel-jest'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation)'
      ],
      collectCoverageFrom: [
        'mobile/**/*.{js,ts,tsx}',
        '!mobile/**/*.d.ts',
        '!mobile/**/node_modules/**',
        '!mobile/**/coverage/**',
        '!mobile/**/*.config.{js,ts}',
        '!mobile/**/metro.config.js'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/setup/mobile.setup.js',
        '@testing-library/jest-native/extend-expect'
      ],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/../../mobile/$1'
      }
    }
  ],

  // Global configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Test reporting
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/reports',
        filename: 'unit-test-report.html',
        expand: true
      }
    ]
  ],

  verbose: true,
  bail: false,
  errorOnDeprecated: true
};
