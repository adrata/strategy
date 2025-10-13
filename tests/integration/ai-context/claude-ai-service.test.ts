/**
 * Integration Tests for ClaudeAIService with Context
 * 
 * Tests ClaudeAIService with context handling and validation
 */

import { ClaudeAIService } from '@/platform/services/ClaudeAIService';
import { 
  createTestCurrentRecord,
  createTestListViewContext,
  createTestWorkspaceContext,
  createTestConversationHistory,
  createMockAIResponse
} from '../../utils/ai-context-test-factories';

// Mock dependencies
jest.mock('@/platform/database/prisma-client', () => ({
  prisma: {
    users: { findFirst: jest.fn() },
    workspaces: { findFirst: jest.fn() },
    people: { findMany: jest.fn() },
    companies: { findMany: jest.fn() },
    actions: { findMany: jest.fn() }
  }
}));

jest.mock('@/platform/ai/services/EnhancedWorkspaceContextService', () => ({
  EnhancedWorkspaceContextService: {
    buildWorkspaceContext: jest.fn(),
    buildAIContextString: jest.fn()
  }
}));

jest.mock('@/platform/ai/tools/browser-tools', () => ({
  BrowserTools: {
    searchPerson: jest.fn()
  }
}));

jest.mock('@/platform/services/BrowserAutomationService', () => ({
  browserAutomationService: {
    searchPerson: jest.fn()
  }
}));

import { prisma } from '@/platform/database/prisma-client';
import { EnhancedWorkspaceContextService } from '@/platform/ai/services/EnhancedWorkspaceContextService';
import { BrowserTools } from '@/platform/ai/tools/browser-tools';
import { browserAutomationService } from '@/platform/services/BrowserAutomationService';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockEnhancedWorkspaceContextService = EnhancedWorkspaceContextService as jest.Mocked<typeof EnhancedWorkspaceContextService>;
const mockBrowserTools = BrowserTools as jest.Mocked<typeof BrowserTools>;
const mockBrowserAutomationService = browserAutomationService as jest.Mocked<typeof browserAutomationService>;

describe('ClaudeAIService Integration Tests', () => {
  let claudeService: ClaudeAIService;

  beforeEach(() => {
    jest.clearAllMocks();
    claudeService = new ClaudeAIService();
  });

  describe('generateChatResponse with Context', () => {
    it('should generate response with current record context', async () => {
      const currentRecord = createTestCurrentRecord();
      const conversationHistory = createTestConversationHistory();
      const mockWorkspaceContext = createTestWorkspaceContext();
      const mockDataContext = {
        workspaceMetrics: { people: 150, companies: 50, prospects: 75 },
        recentActivities: [
          { type: 'email', description: 'Sent follow-up', person: 'John Doe', company: 'Acme Corp' }
        ],
        personSearchResults: null
      };

      // Mock data fetching
      mockPrisma.users.findFirst.mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@adrata.com'
      } as any);

      mockPrisma.workspaces.findFirst.mockResolvedValue({
        id: 'test-workspace-id',
        name: 'Test Workspace'
      } as any);

      mockPrisma.people.findMany.mockResolvedValue([]);
      mockPrisma.companies.findMany.mockResolvedValue([]);
      mockPrisma.actions.findMany.mockResolvedValue([]);

      mockEnhancedWorkspaceContextService.buildWorkspaceContext.mockResolvedValue(mockWorkspaceContext);
      mockEnhancedWorkspaceContextService.buildAIContextString.mockReturnValue('Mock workspace context string');

      const request = {
        message: 'Tell me about this lead',
        conversationHistory,
        currentRecord,
        recordType: 'lead',
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      // Mock the actual AI response
      const mockAIResponse = createMockAIResponse(true);
      jest.spyOn(claudeService as any, 'callAnthropicAPI').mockResolvedValue(mockAIResponse);

      const result = await claudeService.generateChatResponse(request);

      expect(result.success).toBe(true);
      expect(result.response).toContain('John Doe');
      expect(result.response).toContain('Acme Corp');
    });

    it('should generate response with list view context', async () => {
      const listViewContext = createTestListViewContext();
      const mockWorkspaceContext = createTestWorkspaceContext();
      const mockDataContext = {
        workspaceMetrics: { people: 150, companies: 50, prospects: 75 },
        recentActivities: [],
        personSearchResults: null
      };

      // Mock data fetching
      mockPrisma.users.findFirst.mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@adrata.com'
      } as any);

      mockPrisma.workspaces.findFirst.mockResolvedValue({
        id: 'test-workspace-id',
        name: 'Test Workspace'
      } as any);

      mockPrisma.people.findMany.mockResolvedValue([]);
      mockPrisma.companies.findMany.mockResolvedValue([]);
      mockPrisma.actions.findMany.mockResolvedValue([]);

      mockEnhancedWorkspaceContextService.buildWorkspaceContext.mockResolvedValue(mockWorkspaceContext);
      mockEnhancedWorkspaceContextService.buildAIContextString.mockReturnValue('Mock workspace context string');

      const request = {
        message: 'Who are my top leads?',
        conversationHistory: [],
        currentRecord: null,
        recordType: null,
        listViewContext,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      // Mock the actual AI response
      const mockAIResponse = createMockAIResponse(true);
      jest.spyOn(claudeService as any, 'callAnthropicAPI').mockResolvedValue(mockAIResponse);

      const result = await claudeService.generateChatResponse(request);

      expect(result.success).toBe(true);
      expect(result.response).toContain('leads');
    });

    it('should generate response with both record and list view context', async () => {
      const currentRecord = createTestCurrentRecord();
      const listViewContext = createTestListViewContext();
      const mockWorkspaceContext = createTestWorkspaceContext();

      // Mock data fetching
      mockPrisma.users.findFirst.mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@adrata.com'
      } as any);

      mockPrisma.workspaces.findFirst.mockResolvedValue({
        id: 'test-workspace-id',
        name: 'Test Workspace'
      } as any);

      mockPrisma.people.findMany.mockResolvedValue([]);
      mockPrisma.companies.findMany.mockResolvedValue([]);
      mockPrisma.actions.findMany.mockResolvedValue([]);

      mockEnhancedWorkspaceContextService.buildWorkspaceContext.mockResolvedValue(mockWorkspaceContext);
      mockEnhancedWorkspaceContextService.buildAIContextString.mockReturnValue('Mock workspace context string');

      const request = {
        message: 'Compare this lead to others in the list',
        conversationHistory: [],
        currentRecord,
        recordType: 'lead',
        listViewContext,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      // Mock the actual AI response
      const mockAIResponse = createMockAIResponse(true);
      jest.spyOn(claudeService as any, 'callAnthropicAPI').mockResolvedValue(mockAIResponse);

      const result = await claudeService.generateChatResponse(request);

      expect(result.success).toBe(true);
      expect(result.response).toContain('John Doe');
      expect(result.response).toContain('leads');
    });
  });

  describe('buildEnhancedSystemPrompt with Context', () => {
    it('should build system prompt with current record context', () => {
      const currentRecord = createTestCurrentRecord();
      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const request = {
        message: 'Test message',
        currentRecord,
        recordType: 'lead',
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = claudeService['buildEnhancedSystemPrompt'](request, dataContext);

      expect(result).toContain('John Doe');
      expect(result).toContain('Acme Corp');
      expect(result).toContain('VP of Sales');
      expect(result).toContain('lead');
      expect(result).toContain('Pipeline');
    });

    it('should build system prompt with list view context', () => {
      const listViewContext = createTestListViewContext();
      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const request = {
        message: 'Test message',
        currentRecord: null,
        recordType: null,
        listViewContext,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = claudeService['buildEnhancedSystemPrompt'](request, dataContext);

      expect(result).toContain('LIST VIEW CONTEXT');
      expect(result).toContain('leads');
      expect(result).toContain('John Doe');
      expect(result).toContain('Acme Corp');
      expect(result).toContain('Jane Smith');
      expect(result).toContain('Tech Inc');
    });

    it('should build system prompt with workspace business context', () => {
      const mockWorkspaceContext = createTestWorkspaceContext();
      const dataContext = {
        workspaceContext: mockWorkspaceContext,
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      mockEnhancedWorkspaceContextService.buildAIContextString.mockReturnValue('Mock workspace context string');

      const request = {
        message: 'Test message',
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = claudeService['buildEnhancedSystemPrompt'](request, dataContext);

      expect(result).toContain('Mock workspace context string');
    });

    it('should build system prompt with recent activities context', () => {
      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [
          { type: 'email', description: 'Sent follow-up', person: 'John Doe', company: 'Acme Corp' },
          { type: 'call', description: 'Discovery call', person: 'Jane Smith', company: 'Tech Inc' }
        ],
        personSearchResults: null
      };

      const request = {
        message: 'Test message',
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = claudeService['buildEnhancedSystemPrompt'](request, dataContext);

      expect(result).toContain('RECENT ACTIVITIES');
      expect(result).toContain('Sent follow-up');
      expect(result).toContain('John Doe');
      expect(result).toContain('Acme Corp');
      expect(result).toContain('Discovery call');
      expect(result).toContain('Jane Smith');
      expect(result).toContain('Tech Inc');
    });

    it('should build system prompt with person search results context', () => {
      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: {
          query: 'John',
          results: [
            {
              id: '1',
              fullName: 'John Doe',
              jobTitle: 'VP of Sales',
              email: 'john.doe@acme.com',
              company: { name: 'Acme Corp', industry: 'Technology' },
              actions: [
                { type: 'email', description: 'Sent proposal', createdAt: '2024-01-15T10:00:00Z' }
              ]
            }
          ],
          count: 1
        }
      };

      const request = {
        message: 'Test message',
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = claudeService['buildEnhancedSystemPrompt'](request, dataContext);

      expect(result).toContain('PERSON SEARCH RESULTS FOR "John"');
      expect(result).toContain('John Doe');
      expect(result).toContain('VP of Sales');
      expect(result).toContain('Acme Corp');
      expect(result).toContain('Technology');
      expect(result).toContain('Sent proposal');
    });

    it('should include context validation warnings when context is incomplete', () => {
      const dataContext = {
        workspaceContext: null,
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const request = {
        message: 'Test message',
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = claudeService['buildEnhancedSystemPrompt'](request, dataContext);

      expect(result).toContain('⚠️ CONTEXT WARNINGS');
      expect(result).toContain('Workspace business context not available');
    });
  });

  describe('getDataContext Integration', () => {
    it('should fetch comprehensive data context', async () => {
      const mockUser = { id: 'test-user-id', name: 'Test User' };
      const mockWorkspace = { id: 'test-workspace-id', name: 'Test Workspace' };
      const mockPeople = [
        { id: '1', fullName: 'John Doe', company: { name: 'Acme Corp' } }
      ];
      const mockCompanies = [
        { id: '1', name: 'Acme Corp', industry: 'Technology' }
      ];
      const mockActions = [
        { id: '1', type: 'email', description: 'Sent follow-up', person: 'John Doe', company: 'Acme Corp' }
      ];
      const mockWorkspaceContext = createTestWorkspaceContext();

      mockPrisma.users.findFirst.mockResolvedValue(mockUser as any);
      mockPrisma.workspaces.findFirst.mockResolvedValue(mockWorkspace as any);
      mockPrisma.people.findMany.mockResolvedValue(mockPeople as any);
      mockPrisma.companies.findMany.mockResolvedValue(mockCompanies as any);
      mockPrisma.actions.findMany.mockResolvedValue(mockActions as any);
      mockEnhancedWorkspaceContextService.buildWorkspaceContext.mockResolvedValue(mockWorkspaceContext);

      const request = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = await claudeService['getDataContext'](request);

      expect(result.workspaceContext).toEqual(mockWorkspaceContext);
      expect(result.workspaceMetrics).toBeDefined();
      expect(result.recentActivities).toHaveLength(1);
      expect(result.recentActivities[0]).toMatchObject({
        type: 'email',
        description: 'Sent follow-up',
        person: 'John Doe',
        company: 'Acme Corp'
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.users.findFirst.mockRejectedValue(new Error('Database error'));

      const request = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = await claudeService['getDataContext'](request);

      expect(result).toEqual({});
    });
  });

  describe('Person Search Integration', () => {
    it('should perform person search when message contains search intent', async () => {
      const mockSearchResults = {
        query: 'John',
        results: [
          {
            id: '1',
            fullName: 'John Doe',
            jobTitle: 'VP of Sales',
            email: 'john.doe@acme.com',
            company: { name: 'Acme Corp', industry: 'Technology' }
          }
        ],
        count: 1
      };

      mockBrowserTools.searchPerson.mockResolvedValue(mockSearchResults);

      const request = {
        message: 'Find people named John',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = await claudeService['getDataContext'](request);

      expect(mockBrowserTools.searchPerson).toHaveBeenCalledWith('John', 'test-workspace-id');
      expect(result.personSearchResults).toEqual(mockSearchResults);
    });

    it('should not perform person search when message does not contain search intent', async () => {
      const request = {
        message: 'Tell me about my leads',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = await claudeService['getDataContext'](request);

      expect(mockBrowserTools.searchPerson).not.toHaveBeenCalled();
      expect(result.personSearchResults).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const request = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      // Mock API error
      jest.spyOn(claudeService as any, 'callAnthropicAPI').mockRejectedValue(new Error('API Error'));

      const result = await claudeService.generateChatResponse(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });

    it('should handle missing context gracefully', async () => {
      const request = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      // Mock successful API response
      const mockAIResponse = createMockAIResponse(false);
      jest.spyOn(claudeService as any, 'callAnthropicAPI').mockResolvedValue(mockAIResponse);

      const result = await claudeService.generateChatResponse(request);

      expect(result.success).toBe(true);
      expect(result.response).toContain("I don't have specific context");
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeListViewContext = createTestListViewContext({
        visibleRecords: Array.from({ length: 1000 }, (_, i) => 
          createTestCurrentRecord({ id: `${i}`, name: `Person ${i}` })
        ),
        totalCount: 1000
      });

      const request = {
        message: 'Test message',
        currentRecord: null,
        recordType: null,
        listViewContext: largeListViewContext,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      // Mock data fetching
      mockPrisma.users.findFirst.mockResolvedValue({ id: 'test-user-id', name: 'Test User' } as any);
      mockPrisma.workspaces.findFirst.mockResolvedValue({ id: 'test-workspace-id', name: 'Test Workspace' } as any);
      mockPrisma.people.findMany.mockResolvedValue([]);
      mockPrisma.companies.findMany.mockResolvedValue([]);
      mockPrisma.actions.findMany.mockResolvedValue([]);
      mockEnhancedWorkspaceContextService.buildWorkspaceContext.mockResolvedValue(createTestWorkspaceContext());

      // Mock successful API response
      const mockAIResponse = createMockAIResponse(true);
      jest.spyOn(claudeService as any, 'callAnthropicAPI').mockResolvedValue(mockAIResponse);

      const startTime = Date.now();
      const result = await claudeService.generateChatResponse(request);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result.success).toBe(true);
    });
  });
});
