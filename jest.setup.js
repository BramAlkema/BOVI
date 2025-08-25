// Jest setup file for BOVI tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock BroadcastChannel for Node.js environment
global.BroadcastChannel = class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  postMessage(data) {}
  addEventListener(event, handler) {}
  removeEventListener(event, handler) {}
  close() {}
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key) => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
);

// Mock URL methods
global.URL = {
  createObjectURL: jest.fn(() => 'mock-object-url'),
  revokeObjectURL: jest.fn()
};

// Mock Blob
global.Blob = class MockBlob {
  constructor(parts, options) {
    this.parts = parts;
    this.options = options;
    this.size = parts ? parts.reduce((acc, part) => acc + part.length, 0) : 0;
    this.type = options?.type || '';
  }
};

// Mock setTimeout/setInterval for timer tests
jest.useFakeTimers();