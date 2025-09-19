/**
 * 🧪 Test Setup for Interactive Workflow Validator
 * 
 * Comprehensive test configuration and utilities
 */
import { configure } from '@testing-library/react';
import { server } from './msw-server';
import '@testing-library/jest-dom';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock fetch
global.fetch = jest.fn();

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  // Start MSW server
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

afterEach(() => {
  // Reset MSW handlers
  server.resetHandlers();
  
  // Clear all mocks
  jest.clearAllMocks();
});

afterAll(() => {
  // Restore console methods
  console.error = originalError;
  console.warn = originalWarn;
  
  // Stop MSW server
  server.close();
});

// Test utilities
export const createMockWorkflowStep = (overrides = {}) => ({
  id: 'step1',
  name: 'Test Step',
  description: 'Test step description',
  status: 'pending' as const,
  dependencies: [],
  parallel: false,
  ...overrides,
});

export const createMockWorkflowExecution = (overrides = {}) => ({
  id: 'test-workflow',
  companyName: 'Test Company',
  steps: [createMockWorkflowStep()],
  startTime: Date.now(),
  status: 'idle' as const,
  ...overrides,
});

export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

export const mockApiResponse = (data: any, status = 200) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  });
};

export const mockApiError = (message: string, status = 500) => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(message));
};
