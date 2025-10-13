/**
 * Unit Tests for AIContextService
 * 
 * Tests the AIContextService functionality for building comprehensive AI context
 */

import { AIContextService } from '@/platform/ai/services/AIContextService';
import { 
  createTestAIContextConfig,
  createTestCurrentRecord,
  createTestListViewContext,
  createTestWorkspaceContext,
  createTestConversationHistory,
  createTestDocumentContext,
  createTestEnhancedAIContext,
  createTestDataWithRelationships
} from '../../utils/ai-context-test-factories';

// Mock the authFetch function
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn()
}));

import { authFetch } from '@/platform/api-fetch';
const mockAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

describe('AIContextService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildContext', () => {
    it('should build comprehensive context from configuration', async () => {
      const config = createTestAIContextConfig();
      const mockUserData = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@adrata.com',
        workspaces: [{ id: 'test-workspace-id', name: 'Test Workspace' }]
      };
      const mockWorkspaceData = createTestWorkspaceContext();
      const mockDataContext = {
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      mockAuthFetch
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(mockWorkspaceData) // Workspace data
        .mockResolvedValueOnce(mockDataContext); // Data context

      const result = await AIContextService.buildContext(config);

      expect(result).toHaveProperty('userContext');
      expect(result).toHaveProperty('applicationContext');
      expect(result).toHaveProperty('dataContext');
      expect(result).toHaveProperty('recordContext');
      expect(result).toHaveProperty('listViewContext');
      expect(result).toHaveProperty('systemContext');
      expect(result).toHaveProperty('documentContext');
    });

    it('should handle missing current record gracefully', async () => {
      const config = createTestAIContextConfig({
        currentRecord: null,
        recordType: null
      });

      mockAuthFetch
        .mockResolvedValueOnce({ id: 'test-user-id', name: 'Test User' })
        .mockResolvedValueOnce(createTestWorkspaceContext())
        .mockResolvedValueOnce({ workspaceMetrics: {}, recentActivities: [] });

      const result = await AIContextService.buildContext(config);

      expect(result.recordContext).toContain('No current record');
    });

    it('should handle missing list view context gracefully', async () => {
      const config = createTestAIContextConfig({
        listViewContext: null
      });

      mockAuthFetch
        .mockResolvedValueOnce({ id: 'test-user-id', name: 'Test User' })
        .mockResolvedValueOnce(createTestWorkspaceContext())
        .mockResolvedValueOnce({ workspaceMetrics: {}, recentActivities: [] });

      const result = await AIContextService.buildContext(config);

      expect(result.listViewContext).toContain('No list view context available');
    });

    it('should handle missing document context gracefully', async () => {
      const config = createTestAIContextConfig({
        documentContext: null
      });

      mockAuthFetch
        .mockResolvedValueOnce({ id: 'test-user-id', name: 'Test User' })
        .mockResolvedValueOnce(createTestWorkspaceContext())
        .mockResolvedValueOnce({ workspaceMetrics: {}, recentActivities: [] });

      const result = await AIContextService.buildContext(config);

      expect(result.documentContext).toContain('No documents uploaded');
    });

    it('should handle empty conversation history', async () => {
      const config = createTestAIContextConfig({
        conversationHistory: []
      });

      mockAuthFetch
        .mockResolvedValueOnce({ id: 'test-user-id', name: 'Test User' })
        .mockResolvedValueOnce(createTestWorkspaceContext())
        .mockResolvedValueOnce({ workspaceMetrics: {}, recentActivities: [] });

      const result = await AIContextService.buildContext(config);

      expect(result.systemContext).toContain('No previous conversation');
    });
  });

  describe('buildUserContext', () => {
    it('should build user context with workspace data', async () => {
      const config = createTestAIContextConfig();
      const mockUserData = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@adrata.com',
        workspaces: [{ id: 'test-workspace-id', name: 'Test Workspace' }]
      };

      mockAuthFetch.mockResolvedValueOnce(mockUserData);

      const result = await AIContextService.buildContext(config);

      expect(result.userContext).toContain('Mock user context');
    });

    it('should handle missing user data gracefully', async () => {
      const config = createTestAIContextConfig();
      mockAuthFetch.mockResolvedValueOnce(null);

      const result = await AIContextService.buildContext(config);

      expect(result.userContext).toContain('Mock user context');
    });

    it('should handle API errors gracefully', async () => {
      const config = createTestAIContextConfig();
      mockAuthFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await AIContextService.buildContext(config);

      expect(result.userContext).toContain('Mock user context');
    });
  });

  describe('Application Context', () => {
    it('should build application context for pipeline', async () => {
      const config = createTestAIContextConfig({ appType: 'pipeline' });
      const result = await AIContextService.buildContext(config);

      expect(result.applicationContext).toContain('Mock application context');
    });

    it('should build application context for speedrun', async () => {
      const config = createTestAIContextConfig({ appType: 'speedrun' });
      const result = await AIContextService.buildContext(config);

      expect(result.applicationContext).toContain('Mock application context');
    });
  });

  describe('Data Context', () => {
    it('should build data context with workspace metrics', async () => {
      const config = createTestAIContextConfig();
      const mockDataContext = {
        workspaceMetrics: { people: 150, companies: 50, prospects: 75 },
        recentActivities: [
          { type: 'email', description: 'Sent follow-up', person: 'John Doe', company: 'Acme Corp' }
        ],
        personSearchResults: null
      };

      mockAuthFetch.mockResolvedValueOnce(mockDataContext);

      const result = await AIContextService.buildContext(config);

      expect(result.dataContext).toContain('Mock data context');
    });

    it('should handle missing data context gracefully', async () => {
      const config = createTestAIContextConfig();
      mockAuthFetch.mockResolvedValueOnce(null);

      const result = await AIContextService.buildContext(config);

      expect(result.dataContext).toContain('Mock data context');
    });
  });

  describe('Record Context', () => {
    it('should build record context for lead', async () => {
      const record = createTestCurrentRecord();
      const config = createTestAIContextConfig({ currentRecord: record, recordType: 'lead' });
      const result = await AIContextService.buildContext(config);

      expect(result.recordContext).toContain('Mock record context');
    });

    it('should handle missing record gracefully', async () => {
      const config = createTestAIContextConfig({ currentRecord: null, recordType: null });
      const result = await AIContextService.buildContext(config);

      expect(result.recordContext).toContain('No current record');
    });
  });

  describe('List View Context', () => {
    it('should build list view context with visible records', async () => {
      const listViewContext = createTestListViewContext();
      const config = createTestAIContextConfig({ listViewContext });
      const result = await AIContextService.buildContext(config);

      expect(result.listViewContext).toContain('Mock list view context');
    });

    it('should handle missing list view context gracefully', async () => {
      const config = createTestAIContextConfig({ listViewContext: null });
      const result = await AIContextService.buildContext(config);

      expect(result.listViewContext).toContain('No list view context available');
    });
  });

  describe('Document Context', () => {
    it('should build document context from uploaded files', async () => {
      const documentContext = createTestDocumentContext();
      const config = createTestAIContextConfig({ documentContext });
      const result = await AIContextService.buildContext(config);

      expect(result.documentContext).toContain('Mock document context');
    });

    it('should handle missing document context gracefully', async () => {
      const config = createTestAIContextConfig({ documentContext: null });
      const result = await AIContextService.buildContext(config);

      expect(result.documentContext).toContain('No documents uploaded');
    });
  });

  describe('System Context', () => {
    it('should build system context from conversation history', async () => {
      const conversationHistory = createTestConversationHistory();
      const config = createTestAIContextConfig({ conversationHistory });
      const result = await AIContextService.buildContext(config);

      expect(result.systemContext).toContain('Mock system context');
    });

    it('should handle empty conversation history', async () => {
      const config = createTestAIContextConfig({ conversationHistory: [] });
      const result = await AIContextService.buildContext(config);

      expect(result.systemContext).toContain('No previous conversation');
    });
  });

  describe('combineContext', () => {
    it('should combine all context types into final prompt', () => {
      const context = createTestEnhancedAIContext();
      const result = AIContextService.combineContext(context);

      expect(result).toContain('intelligent sales assistant');
      expect(result).toContain('USER CONTEXT:');
      expect(result).toContain('APPLICATION CONTEXT:');
      expect(result).toContain('DATA CONTEXT:');
      expect(result).toContain('CURRENT RECORD CONTEXT:');
      expect(result).toContain('LIST VIEW CONTEXT:');
      expect(result).toContain('SYSTEM CONTEXT:');
      expect(result).toContain('DOCUMENT CONTEXT:');
    });

    it('should include personality instructions when available', () => {
      const contextWithPersonality = {
        ...createTestEnhancedAIContext(),
        userContext: 'USER CONTEXT: Test User\n=== PERSONALITY INSTRUCTIONS ===\nBe friendly and helpful'
      };

      const result = AIContextService.combineContext(contextWithPersonality);

      expect(result).toContain('=== PERSONALITY INSTRUCTIONS ===');
      expect(result).toContain('Be friendly and helpful');
    });

    it('should handle missing context sections gracefully', () => {
      const incompleteContext = {
        userContext: 'USER CONTEXT: Test User',
        applicationContext: '',
        dataContext: '',
        recordContext: '',
        listViewContext: '',
        systemContext: '',
        documentContext: ''
      };

      const result = AIContextService.combineContext(incompleteContext);

      expect(result).toContain('intelligent sales assistant');
      expect(result).toContain('USER CONTEXT: Test User');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const config = createTestAIContextConfig();
      mockAuthFetch.mockRejectedValue(new Error('Network error'));

      const result = await AIContextService.buildContext(config);

      expect(result.userContext).toContain('Mock user context');
      expect(result.dataContext).toContain('Mock data context');
    });

    it('should handle malformed API responses gracefully', async () => {
      const config = createTestAIContextConfig();
      mockAuthFetch.mockResolvedValue('invalid json');

      const result = await AIContextService.buildContext(config);

      expect(result.userContext).toContain('Mock user context');
    });

    it('should handle timeout errors gracefully', async () => {
      const config = createTestAIContextConfig();
      mockAuthFetch.mockRejectedValue(new Error('Request timeout'));

      const result = await AIContextService.buildContext(config);

      expect(result.userContext).toContain('Mock user context');
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const config = createTestAIContextConfig({
        listViewContext: createTestListViewContext({
          visibleRecords: Array.from({ length: 1000 }, (_, i) => 
            createTestCurrentRecord({ id: `${i}`, name: `Person ${i}` })
          ),
          totalCount: 1000
        })
      });

      mockAuthFetch
        .mockResolvedValueOnce({ id: 'test-user-id', name: 'Test User' })
        .mockResolvedValueOnce(createTestWorkspaceContext())
        .mockResolvedValueOnce({ workspaceMetrics: {}, recentActivities: [] });

      const startTime = Date.now();
      const result = await AIContextService.buildContext(config);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.listViewContext).toContain('Mock list view context');
    });
  });

  describe('Integration with Test Data', () => {
    it('should work with realistic test data', async () => {
      const testData = createTestDataWithRelationships();
      const config = testData.aiContextConfig;

      mockAuthFetch
        .mockResolvedValueOnce({ id: 'test-user-id', name: 'Test User' })
        .mockResolvedValueOnce(testData.workspace)
        .mockResolvedValueOnce({
          workspaceMetrics: testData.workspaceMetrics,
          recentActivities: testData.recentActivities,
          personSearchResults: testData.personSearchResults
        });

      const result = await AIContextService.buildContext(config);

      expect(result.recordContext).toContain('Mock record context');
      expect(result.listViewContext).toContain('Mock list view context');
      expect(result.documentContext).toContain('Mock document context');
      expect(result.systemContext).toContain('Mock system context');
    });
  });
});
