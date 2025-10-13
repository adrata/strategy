/**
 * Unit Tests for Context Validation Layer
 * 
 * Tests the context validation functionality in AI services
 */

import { ClaudeAIService } from '@/platform/services/ClaudeAIService';
import { 
  createTestCurrentRecord,
  createTestListViewContext,
  createTestWorkspaceContext,
  createTestValidationWarnings,
  createTestContextValidation
} from '../../utils/ai-context-test-factories';

// Mock the ClaudeAIService dependencies
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

describe('Context Validation Layer', () => {
  let claudeService: ClaudeAIService;

  beforeEach(() => {
    jest.clearAllMocks();
    claudeService = new ClaudeAIService();
  });

  describe('validateContext', () => {
    it('should validate complete context successfully', () => {
      const request = {
        message: 'Test message',
        currentRecord: createTestCurrentRecord(),
        listViewContext: createTestListViewContext(),
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn when workspace context is missing', () => {
      const request = {
        message: 'Test message',
        currentRecord: createTestCurrentRecord(),
        listViewContext: createTestListViewContext(),
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: null,
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'Workspace business context not available - AI may not know what you sell or your target market'
      );
    });

    it('should warn when no record or list view context is available', () => {
      const request = {
        message: 'Test message',
        currentRecord: null,
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'No current record or list view context - AI cannot provide specific advice about visible records'
      );
    });

    it('should warn when list view context is stale', () => {
      const staleListViewContext = createTestListViewContext();
      // Set lastUpdated to 10 minutes ago
      staleListViewContext.lastUpdated = new Date(Date.now() - 10 * 60 * 1000);

      const request = {
        message: 'Test message',
        currentRecord: null,
        listViewContext: staleListViewContext,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'List view context is older than 5 minutes - data may be stale'
      );
    });

    it('should handle multiple validation failures', () => {
      const staleListViewContext = createTestListViewContext();
      staleListViewContext.lastUpdated = new Date(Date.now() - 10 * 60 * 1000);

      const request = {
        message: 'Test message',
        currentRecord: null,
        listViewContext: staleListViewContext,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: null,
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(3);
      expect(result.warnings).toContain(
        'Workspace business context not available - AI may not know what you sell or your target market'
      );
      expect(result.warnings).toContain(
        'No current record or list view context - AI cannot provide specific advice about visible records'
      );
      expect(result.warnings).toContain(
        'List view context is older than 5 minutes - data may be stale'
      );
    });

    it('should validate fresh list view context', () => {
      const freshListViewContext = createTestListViewContext();
      // Set lastUpdated to 2 minutes ago
      freshListViewContext.lastUpdated = new Date(Date.now() - 2 * 60 * 1000);

      const request = {
        message: 'Test message',
        currentRecord: null,
        listViewContext: freshListViewContext,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate current record context without list view', () => {
      const request = {
        message: 'Test message',
        currentRecord: createTestCurrentRecord(),
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate list view context without current record', () => {
      const request = {
        message: 'Test message',
        currentRecord: null,
        listViewContext: createTestListViewContext(),
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Context Validation Edge Cases', () => {
    it('should handle undefined dataContext', () => {
      const request = {
        message: 'Test message',
        currentRecord: createTestCurrentRecord(),
        listViewContext: createTestListViewContext(),
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = claudeService['validateContext'](request, undefined);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'Workspace business context not available - AI may not know what you sell or your target market'
      );
    });

    it('should handle empty dataContext', () => {
      const request = {
        message: 'Test message',
        currentRecord: createTestCurrentRecord(),
        listViewContext: createTestListViewContext(),
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const result = claudeService['validateContext'](request, {});

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'Workspace business context not available - AI may not know what you sell or your target market'
      );
    });

    it('should handle malformed list view context', () => {
      const malformedListViewContext = {
        visibleRecords: null,
        activeSection: 'leads',
        appliedFilters: {},
        totalCount: 0,
        lastUpdated: new Date()
      };

      const request = {
        message: 'Test message',
        currentRecord: null,
        listViewContext: malformedListViewContext as any,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'No current record or list view context - AI cannot provide specific advice about visible records'
      );
    });

    it('should handle very old list view context', () => {
      const veryOldListViewContext = createTestListViewContext();
      // Set lastUpdated to 1 hour ago
      veryOldListViewContext.lastUpdated = new Date(Date.now() - 60 * 60 * 1000);

      const request = {
        message: 'Test message',
        currentRecord: null,
        listViewContext: veryOldListViewContext,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'List view context is older than 5 minutes - data may be stale'
      );
    });
  });

  describe('Validation Warning Messages', () => {
    it('should provide specific warning for workspace context', () => {
      const request = {
        message: 'Test message',
        currentRecord: createTestCurrentRecord(),
        listViewContext: createTestListViewContext(),
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: null,
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      const workspaceWarning = result.warnings.find(w => 
        w.includes('Workspace business context not available')
      );
      expect(workspaceWarning).toContain('AI may not know what you sell or your target market');
    });

    it('should provide specific warning for record context', () => {
      const request = {
        message: 'Test message',
        currentRecord: null,
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      const recordWarning = result.warnings.find(w => 
        w.includes('No current record or list view context')
      );
      expect(recordWarning).toContain('AI cannot provide specific advice about visible records');
    });

    it('should provide specific warning for stale data', () => {
      const staleListViewContext = createTestListViewContext();
      staleListViewContext.lastUpdated = new Date(Date.now() - 10 * 60 * 1000);

      const request = {
        message: 'Test message',
        currentRecord: null,
        listViewContext: staleListViewContext,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      const staleWarning = result.warnings.find(w => 
        w.includes('List view context is older than 5 minutes')
      );
      expect(staleWarning).toContain('data may be stale');
    });
  });

  describe('Validation Performance', () => {
    it('should validate context quickly', () => {
      const request = {
        message: 'Test message',
        currentRecord: createTestCurrentRecord(),
        listViewContext: createTestListViewContext(),
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const startTime = Date.now();
      const result = claudeService['validateContext'](request, dataContext);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10); // Should complete within 10ms
      expect(result).toBeDefined();
    });

    it('should handle large list view contexts efficiently', () => {
      const largeListViewContext = createTestListViewContext({
        visibleRecords: Array.from({ length: 1000 }, (_, i) => 
          createTestCurrentRecord({ id: `${i}`, name: `Person ${i}` })
        ),
        totalCount: 1000
      });

      const request = {
        message: 'Test message',
        currentRecord: null,
        listViewContext: largeListViewContext,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { people: 150, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const startTime = Date.now();
      const result = claudeService['validateContext'](request, dataContext);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should complete within 50ms
      expect(result.isValid).toBe(true);
    });
  });

  describe('Integration with Test Data', () => {
    it('should work with realistic test data', () => {
      const request = {
        message: 'Who are my top prospects?',
        currentRecord: createTestCurrentRecord(),
        listViewContext: createTestListViewContext(),
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: createTestWorkspaceContext(),
        workspaceMetrics: { 
          people: 150, 
          companies: 50, 
          prospects: 75,
          leads: 150,
          opportunities: 25
        },
        recentActivities: [
          { type: 'email', description: 'Sent follow-up', person: 'John Doe', company: 'Acme Corp' }
        ],
        personSearchResults: {
          query: 'John',
          results: [createTestCurrentRecord()],
          count: 1
        }
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle partial test data gracefully', () => {
      const request = {
        message: 'Test message',
        currentRecord: null,
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: null,
        workspaceMetrics: null,
        recentActivities: null,
        personSearchResults: null
      };

      const result = claudeService['validateContext'](request, dataContext);

      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
