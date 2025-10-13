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
      const mockUserData = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@adrata.com',
        workspaces: [{ id: 'test-workspace-id', name: 'Test Workspace' }]
      };

      mockAuthFetch.mockResolvedValueOnce(mockUserData);

      const result = await AIContextService['buildUserContext']('test-user-id', 'test-workspace-id');

      expect(result).toContain('Test User');
      expect(result).toContain('test@adrata.com');
      expect(result).toContain('Test Workspace');
    });

    it('should handle missing user data gracefully', async () => {
      mockAuthFetch.mockResolvedValueOnce(null);

      const result = await AIContextService['buildUserContext']('test-user-id', 'test-workspace-id');

      expect(result).toContain('User information not available');
    });

    it('should handle API errors gracefully', async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await AIContextService['buildUserContext']('test-user-id', 'test-workspace-id');

      expect(result).toContain('User information not available');
    });
  });

  describe('buildApplicationContext', () => {
    it('should build application context for pipeline', () => {
      const result = AIContextService['buildApplicationContext']('pipeline');

      expect(result).toContain('Pipeline');
      expect(result).toContain('leads, prospects, companies');
    });

    it('should build application context for speedrun', () => {
      const result = AIContextService['buildApplicationContext']('speedrun');

      expect(result).toContain('Speedrun');
      expect(result).toContain('outreach workflow');
    });

    it('should build application context for unknown app type', () => {
      const result = AIContextService['buildApplicationContext']('unknown');

      expect(result).toContain('General');
    });
  });

  describe('buildDataContext', () => {
    it('should build data context with workspace metrics', async () => {
      const mockDataContext = {
        workspaceMetrics: { people: 150, companies: 50, prospects: 75 },
        recentActivities: [
          { type: 'email', description: 'Sent follow-up', person: 'John Doe', company: 'Acme Corp' }
        ],
        personSearchResults: null
      };

      mockAuthFetch.mockResolvedValueOnce(mockDataContext);

      const result = await AIContextService['buildDataContext']('pipeline', 'test-workspace-id', 'test-user-id');

      expect(result).toContain('150 people');
      expect(result).toContain('50 companies');
      expect(result).toContain('75 prospects');
      expect(result).toContain('John Doe');
      expect(result).toContain('Acme Corp');
    });

    it('should handle missing data context gracefully', async () => {
      mockAuthFetch.mockResolvedValueOnce(null);

      const result = await AIContextService['buildDataContext']('pipeline', 'test-workspace-id', 'test-user-id');

      expect(result).toContain('Data context not available');
    });

    it('should handle API errors gracefully', async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await AIContextService['buildDataContext']('pipeline', 'test-workspace-id', 'test-user-id');

      expect(result).toContain('Data context not available');
    });
  });

  describe('buildRecordContext', () => {
    it('should build record context for lead', () => {
      const record = createTestCurrentRecord();
      const result = AIContextService['buildRecordContext'](record, 'lead');

      expect(result).toContain('John Doe');
      expect(result).toContain('Acme Corp');
      expect(result).toContain('VP of Sales');
      expect(result).toContain('lead');
    });

    it('should build record context for prospect', () => {
      const record = createTestCurrentRecord();
      const result = AIContextService['buildRecordContext'](record, 'prospect');

      expect(result).toContain('John Doe');
      expect(result).toContain('prospect');
    });

    it('should handle missing record gracefully', () => {
      const result = AIContextService['buildRecordContext'](null, 'lead');

      expect(result).toContain('No current record');
    });

    it('should handle record with missing fields gracefully', () => {
      const incompleteRecord = { id: '1' };
      const result = AIContextService['buildRecordContext'](incompleteRecord, 'lead');

      expect(result).toContain('Unknown');
    });
  });

  describe('buildListViewContext', () => {
    it('should build list view context with visible records', () => {
      const listViewContext = createTestListViewContext();
      const result = AIContextService['buildListViewContext'](listViewContext);

      expect(result).toContain('leads');
      expect(result).toContain('25');
      expect(result).toContain('John Doe');
      expect(result).toContain('Acme Corp');
      expect(result).toContain('Jane Smith');
      expect(result).toContain('Tech Inc');
    });

    it('should limit to top 10 records', () => {
      const manyRecords = Array.from({ length: 15 }, (_, i) => 
        createTestCurrentRecord({ id: `${i + 1}`, name: `Person ${i + 1}` })
      );
      const listViewContext = createTestListViewContext({
        visibleRecords: manyRecords,
        totalCount: 15
      });

      const result = AIContextService['buildListViewContext'](listViewContext);

      expect(result).toContain('Person 1');
      expect(result).toContain('Person 10');
      expect(result).not.toContain('Person 11');
      expect(result).toContain('... and 5 more records');
    });

    it('should handle missing list view context gracefully', () => {
      const result = AIContextService['buildListViewContext'](undefined);

      expect(result).toContain('No list view context available');
    });

    it('should include applied filters', () => {
      const listViewContext = createTestListViewContext({
        appliedFilters: {
          searchQuery: 'John',
          verticalFilter: 'Technology',
          statusFilter: 'active',
          priorityFilter: 'high',
          sortField: 'name',
          sortDirection: 'asc'
        }
      });

      const result = AIContextService['buildListViewContext'](listViewContext);

      expect(result).toContain('Search: John');
      expect(result).toContain('Vertical: Technology');
      expect(result).toContain('Status: active');
      expect(result).toContain('Priority: high');
      expect(result).toContain('Sort: name (asc)');
    });
  });

  describe('buildDocumentContext', () => {
    it('should build document context from uploaded files', () => {
      const documentContext = createTestDocumentContext();
      const result = AIContextService['buildDocumentContext'](documentContext);

      expect(result).toContain('prospect-list.csv');
      expect(result).toContain('John Doe');
      expect(result).toContain('Acme Corp');
      expect(result).toContain('2 rows');
    });

    it('should handle missing document context gracefully', () => {
      const result = AIContextService['buildDocumentContext'](null);

      expect(result).toContain('No documents uploaded');
    });

    it('should handle malformed document context gracefully', () => {
      const malformedContext = { fileName: 'test.csv' };
      const result = AIContextService['buildDocumentContext'](malformedContext);

      expect(result).toContain('test.csv');
      expect(result).toContain('Document parsing failed');
    });
  });

  describe('buildSystemContext', () => {
    it('should build system context from conversation history', () => {
      const conversationHistory = createTestConversationHistory();
      const result = AIContextService['buildSystemContext'](conversationHistory);

      expect(result).toContain('top prospects');
      expect(result).toContain('John Doe');
      expect(result).toContain('Acme Corp');
    });

    it('should handle empty conversation history', () => {
      const result = AIContextService['buildSystemContext']([]);

      expect(result).toContain('No previous conversation');
    });

    it('should limit conversation history to recent messages', () => {
      const longHistory = Array.from({ length: 20 }, (_, i) => ({
        role: 'user' as const,
        content: `Message ${i + 1}`,
        timestamp: new Date().toISOString()
      }));
      
      const result = AIContextService['buildSystemContext'](longHistory);

      expect(result).toContain('Message 16'); // Should include recent messages
      expect(result).not.toContain('Message 1'); // Should not include old messages
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

      expect(result.userContext).toContain('User information not available');
      expect(result.dataContext).toContain('Data context not available');
    });

    it('should handle malformed API responses gracefully', async () => {
      const config = createTestAIContextConfig();
      mockAuthFetch.mockResolvedValue('invalid json');

      const result = await AIContextService.buildContext(config);

      expect(result.userContext).toContain('User information not available');
    });

    it('should handle timeout errors gracefully', async () => {
      const config = createTestAIContextConfig();
      mockAuthFetch.mockRejectedValue(new Error('Request timeout'));

      const result = await AIContextService.buildContext(config);

      expect(result.userContext).toContain('User information not available');
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
      expect(result.listViewContext).toContain('... and 990 more records');
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

      expect(result.recordContext).toContain('John Doe');
      expect(result.listViewContext).toContain('leads');
      expect(result.documentContext).toContain('prospect-list.csv');
      expect(result.systemContext).toContain('top prospects');
    });
  });
});
