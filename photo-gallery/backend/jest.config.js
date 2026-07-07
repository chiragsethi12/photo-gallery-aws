// jest.config.js - Jest testing configuration for backend
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testEnvironment: 'node',
  testTimeout: 30000,
};
