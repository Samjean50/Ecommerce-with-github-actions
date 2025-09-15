// ecommerce-platform/api/jest.config.js
module.exports = {
    testEnvironment: 'node',
    rootDir: '.', // This ensures Jest looks in the current directory (api/)
    testMatch: [
      '**/__tests__/**/*.js',
      '**/?(*.)+(spec|test).js'
    ],
    collectCoverageFrom: [
      '**/*.js',
      '!**/node_modules/**',
      '!**/coverage/**',
      '!jest.config.js'
    ],
    // Remove any testRunner configuration if it's causing issues
  };