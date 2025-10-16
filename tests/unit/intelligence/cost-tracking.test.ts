import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntelligenceCostTracker } from '@/platform/services/v1/IntelligenceCostTracker';

// Mock Prisma Client
const mockCreate = vi.fn();
const mockFindMany = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    api_cost_tracking: {
      create: mockCreate,
      findMany: mockFindMany,
    },
  })),
}));

describe('IntelligenceCostTracker', () => {
  let tracker: IntelligenceCostTracker;
  const workspaceId = 'test-workspace-123';
  const userId = 'test-user-456';

  beforeEach(() => {
    tracker = new IntelligenceCostTracker();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('trackCost', () => {
    it('should track cost successfully', async () => {
      mockCreate.mockResolvedValue({
        id: 'cost-123',
        workspaceId,
        userId,
        apiProvider: 'coresignal',
        operation: 'enrich_person',
        cost: 0.15,
        success: true,
      });

      await tracker.trackCost({
        workspaceId,
        userId,
        apiProvider: 'coresignal',
        operation: 'enrich_person',
        cost: 0.15,
        entityType: 'person',
        entityId: 'person-789',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId,
          userId,
          apiProvider: 'coresignal',
          operation: 'enrich_person',
          cost: 0.15,
          entityType: 'person',
          entityId: 'person-789',
          success: true,
        }),
      });
    });

    it('should handle errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(
        tracker.trackCost({
          workspaceId,
          userId,
          apiProvider: 'lusha',
          operation: 'verify_email',
          cost: 0.08,
        })
      ).resolves.toBeUndefined();
    });

    it('should track failed operations', async () => {
      await tracker.trackCost({
        workspaceId,
        userId,
        apiProvider: 'perplexity',
        operation: 'research',
        cost: 0.20,
        success: false,
        errorMessage: 'API timeout',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          success: false,
          errorMessage: 'API timeout',
        }),
      });
    });
  });

  describe('checkBudget', () => {
    it('should allow requests within budget', async () => {
      // Mock daily spending: $25 (under $50 limit)
      mockFindMany.mockResolvedValueOnce([
        { cost: 10.0 },
        { cost: 15.0 },
      ]);
      // Mock monthly spending: $300 (under $1000 limit)
      mockFindMany.mockResolvedValueOnce([
        { cost: 100.0 },
        { cost: 200.0 },
      ]);

      const result = await tracker.checkBudget(workspaceId);

      expect(result.allowed).toBe(true);
      expect(result.dailySpent).toBe(25.0);
      expect(result.monthlySpent).toBe(300.0);
      expect(result.percentUsed).toBeLessThan(80);
    });

    it('should block requests exceeding daily limit', async () => {
      // Mock daily spending: $55 (exceeds $50 limit)
      mockFindMany.mockResolvedValueOnce([
        { cost: 30.0 },
        { cost: 25.0 },
      ]);
      // Mock monthly spending: $300
      mockFindMany.mockResolvedValueOnce([
        { cost: 300.0 },
      ]);

      const result = await tracker.checkBudget(workspaceId);

      expect(result.allowed).toBe(false);
      expect(result.dailySpent).toBe(55.0);
      expect(result.percentUsed).toBeGreaterThan(100);
    });

    it('should block requests exceeding monthly limit', async () => {
      // Mock daily spending: $40
      mockFindMany.mockResolvedValueOnce([
        { cost: 40.0 },
      ]);
      // Mock monthly spending: $1050 (exceeds $1000 limit)
      mockFindMany.mockResolvedValueOnce([
        { cost: 1050.0 },
      ]);

      const result = await tracker.checkBudget(workspaceId);

      expect(result.allowed).toBe(false);
      expect(result.monthlySpent).toBe(1050.0);
    });

    it('should support custom budget limits', async () => {
      mockFindMany.mockResolvedValueOnce([{ cost: 75.0 }]);
      mockFindMany.mockResolvedValueOnce([{ cost: 500.0 }]);

      const result = await tracker.checkBudget(workspaceId, {
        dailyLimit: 100,
        monthlyLimit: 2000,
      });

      expect(result.allowed).toBe(true);
      expect(result.dailyLimit).toBe(100);
      expect(result.monthlyLimit).toBe(2000);
    });
  });

  describe('getCostSummary', () => {
    it('should calculate cost summary correctly', async () => {
      mockFindMany.mockResolvedValue([
        { cost: 10.0, apiProvider: 'coresignal', operation: 'enrich_person', success: true },
        { cost: 15.0, apiProvider: 'lusha', operation: 'verify_email', success: true },
        { cost: 20.0, apiProvider: 'perplexity', operation: 'research', success: false },
        { cost: 12.0, apiProvider: 'coresignal', operation: 'company_lookup', success: true },
      ]);

      const result = await tracker.getCostSummary(workspaceId, 'day');

      expect(result.total).toBe(57.0);
      expect(result.callCount).toBe(4);
      expect(result.successRate).toBe(75); // 3 out of 4 succeeded
      expect(result.byProvider).toEqual({
        coresignal: 22.0,
        lusha: 15.0,
        perplexity: 20.0,
      });
      expect(result.byOperation).toEqual({
        enrich_person: 10.0,
        verify_email: 15.0,
        research: 20.0,
        company_lookup: 12.0,
      });
    });

    it('should handle empty results', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await tracker.getCostSummary(workspaceId, 'week');

      expect(result.total).toBe(0);
      expect(result.callCount).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.byProvider).toEqual({});
      expect(result.byOperation).toEqual({});
    });
  });

  describe('checkAndAlert', () => {
    it('should not alert when below 80% threshold', async () => {
      mockFindMany.mockResolvedValueOnce([{ cost: 30.0 }]); // 60% of daily
      mockFindMany.mockResolvedValueOnce([{ cost: 600.0 }]); // 60% of monthly

      const result = await tracker.checkAndAlert(workspaceId);

      expect(result.shouldAlert).toBe(false);
      expect(result.level).toBeNull();
    });

    it('should show warning at 80% threshold', async () => {
      mockFindMany.mockResolvedValueOnce([{ cost: 40.0 }]); // 80% of daily
      mockFindMany.mockResolvedValueOnce([{ cost: 800.0 }]); // 80% of monthly

      const result = await tracker.checkAndAlert(workspaceId);

      expect(result.shouldAlert).toBe(true);
      expect(result.level).toBe('warning');
      expect(result.message).toContain('WARNING');
    });

    it('should show critical alert at 95% threshold', async () => {
      mockFindMany.mockResolvedValueOnce([{ cost: 48.0 }]); // 96% of daily
      mockFindMany.mockResolvedValueOnce([{ cost: 960.0 }]); // 96% of monthly

      const result = await tracker.checkAndAlert(workspaceId);

      expect(result.shouldAlert).toBe(true);
      expect(result.level).toBe('critical');
      expect(result.message).toContain('CRITICAL');
    });

    it('should show emergency alert when limit exceeded', async () => {
      mockFindMany.mockResolvedValueOnce([{ cost: 55.0 }]); // 110% of daily
      mockFindMany.mockResolvedValueOnce([{ cost: 1100.0 }]); // 110% of monthly

      const result = await tracker.checkAndAlert(workspaceId);

      expect(result.shouldAlert).toBe(true);
      expect(result.level).toBe('emergency');
      expect(result.message).toContain('EXCEEDED');
    });
  });

  describe('getEntityCost', () => {
    it('should calculate total cost for an entity', async () => {
      const entityId = 'person-123';
      mockFindMany.mockResolvedValue([
        { cost: 10.0 },
        { cost: 15.0 },
        { cost: 5.0 },
      ]);

      const result = await tracker.getEntityCost('person', entityId);

      expect(result).toBe(30.0);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          entityType: 'person',
          entityId,
        },
        select: {
          cost: true,
        },
      });
    });
  });
});


