/**
 * AI Context Test Helpers
 * 
 * Helper functions for AI context testing
 */

import React from 'react';
import { renderHook, act, RenderHookResult } from '@testing-library/react';
import { ReactElement } from 'react';
import { 
  createTestListViewContext, 
  createTestCurrentRecord,
  createTestWorkspaceContext,
  createTestAIContextConfig,
  createMockAIResponse
} from './ai-context-test-factories';

// Helper to mock RecordContext provider
export const mockRecordContext = (context: any) => {
  const mockUseRecordContext = jest.fn().mockReturnValue(context);
  jest.doMock('@/platform/ui/context/RecordContextProvider', () => ({
    useRecordContext: mockUseRecordContext,
    RecordContextProvider: ({ children }: { children: React.ReactNode }) => children
  }));
  return mockUseRecordContext;
};

// Helper to verify AI received context
export const verifyAIReceivedContext = async (apiCall: any, expectedContext: any) => {
  const callBody = JSON.parse(apiCall.mock.calls[0][1].body);
  expect(callBody).toMatchObject(expectedContext);
};

// Helper to setup list view context
export const setupListViewContext = (records: any[], section: string) => {
  const context = createTestListViewContext({
    visibleRecords: records,
    activeSection: section
  });
  mockRecordContext({ 
    listViewContext: context,
    currentRecord: null,
    recordType: null,
    setCurrentRecord: jest.fn(),
    clearCurrentRecord: jest.fn(),
    setListViewContext: jest.fn(),
    clearListViewContext: jest.fn()
  });
  return context;
};

// Helper to setup record context
export const setupRecordContext = (record: any, type: string) => {
  mockRecordContext({
    currentRecord: record,
    recordType: type,
    listViewContext: null,
    setCurrentRecord: jest.fn(),
    clearCurrentRecord: jest.fn(),
    setListViewContext: jest.fn(),
    clearListViewContext: jest.fn()
  });
};

// Helper to setup both record and list view context
export const setupFullContext = (record: any, type: string, listRecords: any[], section: string) => {
  const listContext = createTestListViewContext({
    visibleRecords: listRecords,
    activeSection: section
  });
  
  mockRecordContext({
    currentRecord: record,
    recordType: type,
    listViewContext: listContext,
    setCurrentRecord: jest.fn(),
    clearCurrentRecord: jest.fn(),
    setListViewContext: jest.fn(),
    clearListViewContext: jest.fn()
  });
  
  return { record, type, listContext };
};

// Helper to mock AIContextService
export const mockAIContextService = (mockContext?: any) => {
  const mockBuildContext = jest.fn().mockResolvedValue(
    mockContext || {
      userContext: 'Mock user context',
      applicationContext: 'Mock application context',
      dataContext: 'Mock data context',
      recordContext: 'Mock record context',
      listViewContext: 'Mock list view context',
      systemContext: 'Mock system context',
      documentContext: 'Mock document context'
    }
  );
  
  jest.doMock('@/platform/ai/services/AIContextService', () => ({
    AIContextService: {
      buildContext: mockBuildContext,
      combineContext: jest.fn().mockReturnValue('Combined context string')
    }
  }));
  
  return mockBuildContext;
};

// Helper to mock EnhancedWorkspaceContextService
export const mockEnhancedWorkspaceContextService = (mockWorkspaceContext?: any) => {
  const mockBuildWorkspaceContext = jest.fn().mockResolvedValue(
    mockWorkspaceContext || createTestWorkspaceContext()
  );
  
  const mockBuildAIContextString = jest.fn().mockReturnValue('Mock workspace context string');
  
  jest.doMock('@/platform/ai/services/EnhancedWorkspaceContextService', () => ({
    EnhancedWorkspaceContextService: {
      buildWorkspaceContext: mockBuildWorkspaceContext,
      buildAIContextString: mockBuildAIContextString
    }
  }));
  
  return { mockBuildWorkspaceContext, mockBuildAIContextString };
};

// Helper to mock ClaudeAIService
export const mockClaudeAIService = (mockResponse?: any) => {
  const mockGenerateChatResponse = jest.fn().mockResolvedValue(
    mockResponse || createMockAIResponse(true)
  );
  
  jest.doMock('@/platform/services/ClaudeAIService', () => ({
    ClaudeAIService: {
      generateChatResponse: mockGenerateChatResponse
    }
  }));
  
  return mockGenerateChatResponse;
};

// Helper to mock OpenRouterService
export const mockOpenRouterService = (mockResponse?: any) => {
  const mockGenerateResponse = jest.fn().mockResolvedValue(
    mockResponse || createMockAIResponse(true)
  );
  
  jest.doMock('@/platform/services/OpenRouterService', () => ({
    OpenRouterService: {
      generateResponse: mockGenerateResponse
    }
  }));
  
  return mockGenerateResponse;
};

// Helper to mock fetch for API calls
export const mockFetchResponse = (response: any, status: number = 200) => {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
  };
  
  (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
  return mockResponse;
};

// Helper to mock fetch error
export const mockFetchError = (error: string = 'Network error') => {
  (global.fetch as jest.Mock).mockRejectedValue(new Error(error));
};

// Helper to test RecordContextProvider with renderHook
export const testRecordContextProvider = () => {
  const { RecordContextProvider, useRecordContext } = require('@/platform/ui/context/RecordContextProvider');
  
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(RecordContextProvider, {}, children);
  };
  
  return renderHook(() => useRecordContext(), { wrapper });
};

// Helper to test context updates
export const testContextUpdates = (
  hookResult: RenderHookResult<any, any>,
  testCases: Array<{
    action: () => void;
    expectedRecord: any;
    expectedType: string | null;
    expectedListView: any;
  }>
) => {
  testCases.forEach((testCase, index) => {
    it(`should handle context update ${index + 1}`, () => {
      act(() => {
        testCase.action();
      });
      
      expect(hookResult.result.current.currentRecord).toEqual(testCase.expectedRecord);
      expect(hookResult.result.current.recordType).toBe(testCase.expectedType);
      expect(hookResult.result.current.listViewContext).toEqual(testCase.expectedListView);
    });
  });
};

// Helper to verify console logging
export const verifyConsoleLogging = (expectedLogs: string[]) => {
  const consoleSpy = jest.spyOn(console, 'log');
  
  return {
    verify: () => {
      expectedLogs.forEach(expectedLog => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(expectedLog)
        );
      });
    },
    cleanup: () => {
      consoleSpy.mockRestore();
    }
  };
};

// Helper to test context validation
export const testContextValidation = (
  validationFunction: (context: any) => { isValid: boolean; warnings: string[] },
  testCases: Array<{
    context: any;
    expectedValid: boolean;
    expectedWarnings: string[];
  }>
) => {
  testCases.forEach((testCase, index) => {
    it(`should validate context ${index + 1} correctly`, () => {
      const result = validationFunction(testCase.context);
      
      expect(result.isValid).toBe(testCase.expectedValid);
      expect(result.warnings).toEqual(expect.arrayContaining(testCase.expectedWarnings));
    });
  });
};

// Helper to test AI response quality
export const testAIResponseQuality = (
  response: string,
  expectedElements: {
    includesContext?: boolean;
    referencesRecords?: string[];
    mentionsWorkspace?: boolean;
    providesSpecificAdvice?: boolean;
    acknowledgesLimitations?: boolean;
  }
) => {
  if (expectedElements.includesContext) {
    expect(response).not.toContain("I don't have specific context");
    expect(response).not.toContain("I can't see which record");
  }
  
  if (expectedElements.referencesRecords) {
    expectedElements.referencesRecords.forEach(recordName => {
      expect(response).toContain(recordName);
    });
  }
  
  if (expectedElements.mentionsWorkspace) {
    expect(response).toMatch(/workspace|business|company/i);
  }
  
  if (expectedElements.providesSpecificAdvice) {
    expect(response).toMatch(/recommend|suggest|advise|should|consider/i);
  }
  
  if (expectedElements.acknowledgesLimitations) {
    expect(response).toMatch(/limitation|context|information|available/i);
  }
};

// Helper to setup complete test environment
export const setupCompleteTestEnvironment = () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset document.cookie
  document.cookie = '';
  
  // Setup default mocks
  mockAIContextService();
  mockEnhancedWorkspaceContextService();
  mockClaudeAIService();
  mockOpenRouterService();
  
  return {
    cleanup: () => {
      jest.clearAllMocks();
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = '';
    }
  };
};

// Helper to create test scenarios
export const createTestScenarios = () => ({
  // Scenario 1: Speedrun list view
  speedrunListView: () => {
    const records = [
      createTestCurrentRecord({ id: '1', name: 'John Doe', company: 'Acme Corp' }),
      createTestCurrentRecord({ id: '2', name: 'Jane Smith', company: 'Tech Inc' })
    ];
    return setupListViewContext(records, 'speedrun');
  },
  
  // Scenario 2: Pipeline leads list view
  pipelineLeadsListView: () => {
    const records = [
      createTestCurrentRecord({ id: '1', name: 'John Doe', company: 'Acme Corp' }),
      createTestCurrentRecord({ id: '2', name: 'Jane Smith', company: 'Tech Inc' }),
      createTestCurrentRecord({ id: '3', name: 'Bob Johnson', company: 'StartupXYZ' })
    ];
    return setupListViewContext(records, 'leads');
  },
  
  // Scenario 3: Record detail view
  recordDetailView: () => {
    const record = createTestCurrentRecord();
    return setupRecordContext(record, 'lead');
  },
  
  // Scenario 4: Full context (record + list)
  fullContextView: () => {
    const record = createTestCurrentRecord();
    const listRecords = [
      createTestCurrentRecord({ id: '1', name: 'John Doe', company: 'Acme Corp' }),
      createTestCurrentRecord({ id: '2', name: 'Jane Smith', company: 'Tech Inc' })
    ];
    return setupFullContext(record, 'lead', listRecords, 'leads');
  },
  
  // Scenario 5: No context
  noContextView: () => {
    mockRecordContext({
      currentRecord: null,
      recordType: null,
      listViewContext: null,
      setCurrentRecord: jest.fn(),
      clearCurrentRecord: jest.fn(),
      setListViewContext: jest.fn(),
      clearListViewContext: jest.fn()
    });
  }
});

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to simulate user interactions
export const simulateUserInteraction = {
  setCurrentRecord: (hookResult: RenderHookResult<any, any>, record: any, type: string) => {
    act(() => {
      hookResult.result.current.setCurrentRecord(record, type);
    });
  },
  
  setListViewContext: (hookResult: RenderHookResult<any, any>, context: any) => {
    act(() => {
      hookResult.result.current.setListViewContext(context);
    });
  },
  
  clearCurrentRecord: (hookResult: RenderHookResult<any, any>) => {
    act(() => {
      hookResult.result.current.clearCurrentRecord();
    });
  },
  
  clearListViewContext: (hookResult: RenderHookResult<any, any>) => {
    act(() => {
      hookResult.result.current.clearListViewContext();
    });
  }
};

// Helper to create mock API responses
export const createMockAPIResponses = {
  success: (data: any) => ({
    success: true,
    data,
    message: 'Success'
  }),
  
  error: (message: string, code?: string) => ({
    success: false,
    error: message,
    code: code || 'GENERIC_ERROR'
  }),
  
  aiResponse: (response: string, includesContext: boolean = true) => ({
    success: true,
    response,
    confidence: 0.9,
    model: 'claude-3-sonnet',
    tokensUsed: 1500,
    includesContext
  })
};

// Export all helpers
export * from './test-helpers';
