/**
 * Integration Tests for AI Chat API with Context
 * 
 * Tests the /api/ai-chat endpoint with context handling
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai-chat/route';
import { 
  createTestCurrentRecord,
  createTestListViewContext,
  createTestConversationHistory,
  createMockAIResponse
} from '../../utils/ai-context-test-factories';
import { 
  mockFetchResponse,
  mockFetchError,
  verifyAIReceivedContext
} from '../../utils/ai-context-test-helpers';

// Mock the AI services
jest.mock('@/platform/services/OpenRouterService', () => ({
  OpenRouterService: {
    generateResponse: jest.fn()
  }
}));

jest.mock('@/platform/services/ClaudeAIService', () => ({
  ClaudeAIService: {
    generateChatResponse: jest.fn()
  }
}));

jest.mock('@/platform/services/GradualRolloutService', () => ({
  GradualRolloutService: {
    shouldUseOpenRouter: jest.fn().mockReturnValue(true),
    recordRequest: jest.fn()
  }
}));

jest.mock('@/platform/services/ModelCostTracker', () => ({
  ModelCostTracker: {
    recordCost: jest.fn()
  }
}));

import { OpenRouterService } from '@/platform/services/OpenRouterService';
import { ClaudeAIService } from '@/platform/services/ClaudeAIService';
import { GradualRolloutService } from '@/platform/services/GradualRolloutService';
import { ModelCostTracker } from '@/platform/services/ModelCostTracker';

const mockOpenRouterService = OpenRouterService as jest.Mocked<typeof OpenRouterService>;
const mockClaudeAIService = ClaudeAIService as jest.Mocked<typeof ClaudeAIService>;
const mockGradualRolloutService = GradualRolloutService as jest.Mocked<typeof GradualRolloutService>;
const mockModelCostTracker = ModelCostTracker as jest.Mocked<typeof ModelCostTracker>;

describe('AI Chat API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request Processing', () => {
    it('should process request with current record context', async () => {
      const currentRecord = createTestCurrentRecord();
      const conversationHistory = createTestConversationHistory();
      const mockResponse = createMockAIResponse(true);

      mockOpenRouterService.generateResponse.mockResolvedValue(mockResponse);

      const requestBody = {
        message: 'Tell me about this lead',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory,
        currentRecord,
        recordType: 'lead',
        listViewContext: null,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: true,
        context: {
          currentUrl: 'http://localhost:3000/demo/pipeline/leads',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date().toISOString(),
          sessionId: 'test-session'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockOpenRouterService.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRecord,
          recordType: 'lead',
          listViewContext: null,
          message: 'Tell me about this lead',
          appType: 'pipeline',
          workspaceId: 'test-workspace-id',
          userId: 'test-user-id',
          conversationHistory
        })
      );
    });

    it('should process request with list view context', async () => {
      const listViewContext = createTestListViewContext();
      const mockResponse = createMockAIResponse(true);

      mockOpenRouterService.generateResponse.mockResolvedValue(mockResponse);

      const requestBody = {
        message: 'Who are my top leads?',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory: [],
        currentRecord: null,
        recordType: null,
        listViewContext,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: true,
        context: {
          currentUrl: 'http://localhost:3000/demo/pipeline/leads',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date().toISOString(),
          sessionId: 'test-session'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockOpenRouterService.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRecord: null,
          recordType: null,
          listViewContext,
          message: 'Who are my top leads?',
          appType: 'pipeline',
          workspaceId: 'test-workspace-id',
          userId: 'test-user-id'
        })
      );
    });

    it('should process request with both record and list view context', async () => {
      const currentRecord = createTestCurrentRecord();
      const listViewContext = createTestListViewContext();
      const mockResponse = createMockAIResponse(true);

      mockOpenRouterService.generateResponse.mockResolvedValue(mockResponse);

      const requestBody = {
        message: 'Compare this lead to others in the list',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory: [],
        currentRecord,
        recordType: 'lead',
        listViewContext,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: true,
        context: {
          currentUrl: 'http://localhost:3000/demo/pipeline/leads',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date().toISOString(),
          sessionId: 'test-session'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockOpenRouterService.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRecord,
          recordType: 'lead',
          listViewContext,
          message: 'Compare this lead to others in the list'
        })
      );
    });
  });

  describe('OpenRouter vs Claude Routing', () => {
    it('should use OpenRouter when shouldUseOpenRouter returns true', async () => {
      mockGradualRolloutService.shouldUseOpenRouter.mockReturnValue(true);
      const mockResponse = createMockAIResponse(true);
      mockOpenRouterService.generateResponse.mockResolvedValue(mockResponse);

      const requestBody = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory: [],
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: true
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockOpenRouterService.generateResponse).toHaveBeenCalled();
      expect(mockClaudeAIService.generateChatResponse).not.toHaveBeenCalled();
    });

    it('should fallback to Claude when OpenRouter fails', async () => {
      mockGradualRolloutService.shouldUseOpenRouter.mockReturnValue(true);
      const mockResponse = createMockAIResponse(true);
      
      mockOpenRouterService.generateResponse.mockRejectedValue(new Error('OpenRouter error'));
      mockClaudeAIService.generateChatResponse.mockResolvedValue(mockResponse);

      const requestBody = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory: [],
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: true
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockOpenRouterService.generateResponse).toHaveBeenCalled();
      expect(mockClaudeAIService.generateChatResponse).toHaveBeenCalled();
    });

    it('should use Claude when shouldUseOpenRouter returns false', async () => {
      mockGradualRolloutService.shouldUseOpenRouter.mockReturnValue(false);
      const mockResponse = createMockAIResponse(true);
      mockClaudeAIService.generateChatResponse.mockResolvedValue(mockResponse);

      const requestBody = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory: [],
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: false
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockClaudeAIService.generateChatResponse).toHaveBeenCalled();
      expect(mockOpenRouterService.generateResponse).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing message', async () => {
      const requestBody = {
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Message is required');
    });

    it('should handle invalid message type', async () => {
      const requestBody = {
        message: 123, // Invalid type
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Message must be a string');
    });

    it('should handle missing workspaceId', async () => {
      const requestBody = {
        message: 'Test message',
        appType: 'pipeline',
        userId: 'test-user-id'
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Workspace ID is required');
    });

    it('should handle missing userId', async () => {
      const requestBody = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id'
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('User ID is required');
    });

    it('should handle both services failing', async () => {
      mockGradualRolloutService.shouldUseOpenRouter.mockReturnValue(true);
      
      mockOpenRouterService.generateResponse.mockRejectedValue(new Error('OpenRouter error'));
      mockClaudeAIService.generateChatResponse.mockRejectedValue(new Error('Claude error'));

      const requestBody = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory: [],
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: true
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Both AI services failed');
    });
  });

  describe('Context Validation', () => {
    it('should log context information for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const currentRecord = createTestCurrentRecord();
      const listViewContext = createTestListViewContext();
      const mockResponse = createMockAIResponse(true);

      mockOpenRouterService.generateResponse.mockResolvedValue(mockResponse);

      const requestBody = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory: [],
        currentRecord,
        recordType: 'lead',
        listViewContext,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: true
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        '🤖 [AI CHAT] Processing request:',
        expect.objectContaining({
          hasCurrentRecord: true,
          recordType: 'lead',
          hasListViewContext: true,
          listViewRecordCount: 3
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing context gracefully', async () => {
      const mockResponse = createMockAIResponse(false);
      mockOpenRouterService.generateResponse.mockResolvedValue(mockResponse);

      const requestBody = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory: [],
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: true
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockOpenRouterService.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRecord: null,
          recordType: null,
          listViewContext: null
        })
      );
    });
  });

  describe('Response Formatting', () => {
    it('should return properly formatted response from OpenRouter', async () => {
      const mockResponse = {
        success: true,
        response: 'Test AI response',
        confidence: 0.9,
        model: 'claude-3-sonnet',
        tokensUsed: 1500,
        responseTime: 1200,
        cost: 0.0025
      };

      mockOpenRouterService.generateResponse.mockResolvedValue(mockResponse);

      const requestBody = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory: [],
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: true
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        response: 'Test AI response',
        confidence: 0.9,
        model: 'claude-3-sonnet',
        tokensUsed: 1500,
        responseTime: 1200,
        cost: 0.0025,
        todos: [],
        error: null
      });
    });

    it('should return properly formatted response from Claude', async () => {
      mockGradualRolloutService.shouldUseOpenRouter.mockReturnValue(false);
      
      const mockResponse = {
        success: true,
        response: 'Test Claude response',
        confidence: 0.95,
        model: 'claude-3-sonnet',
        tokensUsed: 1200
      };

      mockClaudeAIService.generateChatResponse.mockResolvedValue(mockResponse);

      const requestBody = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory: [],
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: false
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        response: 'Test Claude response',
        confidence: 0.95,
        model: 'claude-3-sonnet',
        tokensUsed: 1200,
        responseTime: 0,
        cost: 0,
        todos: [],
        error: null
      });
    });
  });

  describe('Cost Tracking', () => {
    it('should record cost for OpenRouter requests', async () => {
      const mockResponse = {
        success: true,
        response: 'Test response',
        model: 'claude-3-sonnet',
        provider: 'openrouter',
        tokensUsed: 1500,
        cost: 0.0025
      };

      mockOpenRouterService.generateResponse.mockResolvedValue(mockResponse);

      const requestBody = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        conversationHistory: [],
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        enableVoiceResponse: false,
        selectedVoiceId: 'default',
        useOpenRouter: true
      };

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockModelCostTracker.recordCost).toHaveBeenCalledWith({
        model: 'claude-3-sonnet',
        provider: 'openrouter',
        tokensUsed: 1500,
        cost: 0.0025,
        userId: 'test-user-id',
        workspaceId: 'test-workspace-id'
      });
    });
  });
});
