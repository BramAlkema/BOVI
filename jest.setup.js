// Jest setup file for BOVI tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock setTimeout/setInterval for timer tests
jest.useFakeTimers();