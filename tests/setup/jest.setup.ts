/**
 * Jest Setup Configuration
 * 
 * Global test setup for authentication and UI testing
 */

import React from 'react';
import '@testing-library/jest-dom';

// Mock Prisma client globally to prevent database connection attempts
jest.mock('@/platform/database/prisma-client', () => ({
  prisma: {
    users: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaces: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspace_users: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    companies: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    people: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    actions: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock Prisma client from @prisma/client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    users: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaces: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    companies: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    people: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    actions: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

// Mock AI Context Services
jest.mock('@/platform/ai/services/AIContextService', () => ({
  AIContextService: {
    buildContext: jest.fn().mockImplementation(async (config) => {
      // Return different mock responses based on config
      if (!config.currentRecord) {
        return {
          userContext: 'Mock user context',
          applicationContext: 'Mock application context',
          dataContext: 'Mock data context',
          recordContext: 'No current record',
          listViewContext: config.listViewContext ? 'Mock list view context' : 'No list view context available',
          systemContext: config.conversationHistory?.length > 0 ? 'Mock system context' : 'No previous conversation',
          documentContext: config.documentContext ? 'Mock document context' : 'No documents uploaded'
        };
      }
      return {
        userContext: 'Mock user context',
        applicationContext: 'Mock application context',
        dataContext: 'Mock data context',
        recordContext: 'Mock record context',
        listViewContext: 'Mock list view context',
        systemContext: 'Mock system context',
        documentContext: 'Mock document context'
      };
    }),
    combineContext: jest.fn().mockImplementation((context) => {
      return `You are an intelligent sales assistant and expert advisor, speaking as the user's business representative.

${context.userContext}

${context.applicationContext}

${context.dataContext}

${context.recordContext}

${context.listViewContext}

${context.systemContext}

${context.documentContext}

Please provide helpful, specific, and actionable advice based on the context provided.`;
    })
  }
}));

jest.mock('@/platform/ai/services/EnhancedWorkspaceContextService', () => ({
  EnhancedWorkspaceContextService: {
    buildWorkspaceContext: jest.fn().mockResolvedValue({
      workspace: {
        id: 'test-workspace-id',
        name: 'Test Workspace',
        businessModel: 'B2B SaaS'
      },
      company: {
        name: 'Test Company',
        industryServed: ['Technology']
      },
      data: {
        totalPeople: 150,
        totalCompanies: 50
      }
    }),
    buildAIContextString: jest.fn().mockReturnValue('Mock workspace context string')
  }
}));

jest.mock('@/platform/services/ClaudeAIService', () => ({
  ClaudeAIService: jest.fn().mockImplementation(() => ({
    generateChatResponse: jest.fn().mockResolvedValue({
      success: true,
      response: 'Mock AI response',
      confidence: 0.9,
      model: 'claude-3-sonnet',
      tokensUsed: 1500
    }),
    validateContext: jest.fn().mockImplementation((request, dataContext) => {
      const warnings = [];
      if (!dataContext?.workspaceContext) {
        warnings.push('Workspace business context not available - AI may not know what you sell or your target market');
      }
      if (!request.currentRecord && (!request.listViewContext || !request.listViewContext.visibleRecords)) {
        warnings.push('No current record or list view context - AI cannot provide specific advice about visible records');
      }
      if (request.listViewContext && request.listViewContext.lastUpdated) {
        const ageMinutes = (Date.now() - request.listViewContext.lastUpdated.getTime()) / (1000 * 60);
        if (ageMinutes > 5) {
          warnings.push('List view context is older than 5 minutes - data may be stale');
        }
      }
      return { isValid: warnings.length === 0, warnings };
    })
  }))
}));

jest.mock('@/platform/services/OpenRouterService', () => ({
  OpenRouterService: {
    generateResponse: jest.fn().mockResolvedValue({
      success: true,
      response: 'Mock OpenRouter response',
      confidence: 0.9,
      model: 'claude-3-sonnet',
      tokensUsed: 1500
    })
  }
}));

// Note: RecordContextProvider is not mocked to allow real component testing

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock Web APIs for Node.js environment
global.Request = class MockRequest {
  constructor(public url: string, public init?: RequestInit) {}
  async json() {
    return JSON.parse(this.init?.body as string || '{}');
  }
  async text() {
    return this.init?.body as string || '';
  }
} as any;

global.Response = class MockResponse {
  constructor(public body?: any, public init?: ResponseInit) {}
  async json() {
    return this.body;
  }
  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
  get ok() {
    return (this.init?.status || 200) >= 200 && (this.init?.status || 200) < 300;
  }
  get status() {
    return this.init?.status || 200;
  }
} as any;

global.Headers = class MockHeaders {
  private headers = new Map<string, string>();
  
  constructor(init?: HeadersInit) {
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.headers.set(key, value));
      } else if (init instanceof Headers) {
        init.forEach((value, key) => this.headers.set(key, value));
      } else {
        Object.entries(init).forEach(([key, value]) => this.headers.set(key, value));
      }
    }
  }
  
  get(name: string) {
    return this.headers.get(name) || null;
  }
  
  set(name: string, value: string) {
    this.headers.set(name, value);
  }
  
  has(name: string) {
    return this.headers.has(name);
  }
  
  delete(name: string) {
    this.headers.delete(name);
  }
  
  forEach(callback: (value: string, key: string) => void) {
    this.headers.forEach(callback);
  }
} as any;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/sign-in',
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return React.createElement('a', { href, ...props }, children);
  };
});

// Mock window.location (simplified)
if (typeof window !== 'undefined' && !window.location) {
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000/sign-in',
      hostname: 'localhost',
      search: '',
      pathname: '/sign-in',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    },
    writable: true,
  });
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  value: '',
  writable: true,
});

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn((message) => {
    // Suppress known test environment warnings
    if (typeof message === 'string' && message.includes('Not implemented: navigation')) {
      return;
    }
    originalConsoleError(message);
  });
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
  document.cookie = '';
  (global.fetch as jest.Mock).mockClear();
});

// Global test timeout
jest.setTimeout(10000);
