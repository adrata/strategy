import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TrackCostParams {
  workspaceId: string;
  userId?: string;
  apiProvider: 'coresignal' | 'lusha' | 'perplexity' | 'pdl' | 'prospeo' | 'contactout';
  operation: string;
  cost: number;
  tokensUsed?: number;
  entityType?: 'person' | 'company';
  entityId?: string;
  requestData?: any;
  success?: boolean;
  errorMessage?: string;
}

export interface BudgetCheck {
  allowed: boolean;
  remaining: number;
  percentUsed: number;
  dailySpent: number;
  monthlySpent: number;
  dailyLimit: number;
  monthlyLimit: number;
}

export interface CostSummary {
  total: number;
  byProvider: Record<string, number>;
  byOperation: Record<string, number>;
  callCount: number;
  successRate: number;
}

/**
 * Intelligence Cost Tracker
 * 
 * Tracks API costs for intelligence operations with budget enforcement
 */
export class IntelligenceCostTracker {
  /**
   * Track API cost in real-time
   */
  async trackCost(params: TrackCostParams): Promise<void> {
    try {
      await prisma.api_cost_tracking.create({
        data: {
          workspaceId: params.workspaceId,
          userId: params.userId,
          apiProvider: params.apiProvider,
          operation: params.operation,
          cost: params.cost,
          tokensUsed: params.tokensUsed,
          entityType: params.entityType,
          entityId: params.entityId,
          requestData: params.requestData || {},
          success: params.success ?? true,
          errorMessage: params.errorMessage,
        },
      });

      console.log(
        `💰 [Cost Tracker] ${params.apiProvider}.${params.operation}: $${params.cost.toFixed(4)} (workspace: ${params.workspaceId})`
      );
    } catch (error) {
      console.error('[Cost Tracker] Error tracking cost:', error);
      // Don't throw - cost tracking shouldn't break the main flow
    }
  }

  /**
   * Check if workspace is within budget
   * 
   * Default limits:
   * - Daily: $50
   * - Monthly: $1000
   */
  async checkBudget(
    workspaceId: string,
    options: { dailyLimit?: number; monthlyLimit?: number } = {}
  ): Promise<BudgetCheck> {
    const dailyLimit = options.dailyLimit || 50;
    const monthlyLimit = options.monthlyLimit || 1000;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get daily spending
    const dailyRecords = await prisma.api_cost_tracking.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: startOfDay,
        },
      },
      select: {
        cost: true,
      },
    });

    const dailySpent = dailyRecords.reduce((sum, record) => sum + Number(record.cost), 0);

    // Get monthly spending
    const monthlyRecords = await prisma.api_cost_tracking.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      select: {
        cost: true,
      },
    });

    const monthlySpent = monthlyRecords.reduce((sum, record) => sum + Number(record.cost), 0);

    const dailyPercentUsed = (dailySpent / dailyLimit) * 100;
    const monthlyPercentUsed = (monthlySpent / monthlyLimit) * 100;
    const maxPercentUsed = Math.max(dailyPercentUsed, monthlyPercentUsed);

    const allowed = dailySpent < dailyLimit && monthlySpent < monthlyLimit;
    const remaining = Math.min(dailyLimit - dailySpent, monthlyLimit - monthlySpent);

    return {
      allowed,
      remaining: Math.max(0, remaining),
      percentUsed: maxPercentUsed,
      dailySpent,
      monthlySpent,
      dailyLimit,
      monthlyLimit,
    };
  }

  /**
   * Get cost summary for a period
   */
  async getCostSummary(
    workspaceId: string,
    period: 'day' | 'week' | 'month' | 'all' = 'day'
  ): Promise<CostSummary> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    const records = await prisma.api_cost_tracking.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        cost: true,
        apiProvider: true,
        operation: true,
        success: true,
      },
    });

    const total = records.reduce((sum, record) => sum + Number(record.cost), 0);
    const callCount = records.length;
    const successCount = records.filter((r) => r.success).length;
    const successRate = callCount > 0 ? (successCount / callCount) * 100 : 0;

    const byProvider: Record<string, number> = {};
    const byOperation: Record<string, number> = {};

    for (const record of records) {
      const cost = Number(record.cost);
      byProvider[record.apiProvider] = (byProvider[record.apiProvider] || 0) + cost;
      byOperation[record.operation || 'unknown'] =
        (byOperation[record.operation || 'unknown'] || 0) + cost;
    }

    return {
      total,
      byProvider,
      byOperation,
      callCount,
      successRate,
    };
  }

  /**
   * Get cost by entity (person or company)
   */
  async getEntityCost(
    entityType: 'person' | 'company',
    entityId: string
  ): Promise<number> {
    const records = await prisma.api_cost_tracking.findMany({
      where: {
        entityType,
        entityId,
      },
      select: {
        cost: true,
      },
    });

    return records.reduce((sum, record) => sum + Number(record.cost), 0);
  }

  /**
   * Alert if budget threshold reached
   */
  async checkAndAlert(workspaceId: string): Promise<{
    shouldAlert: boolean;
    level: 'warning' | 'critical' | 'emergency' | null;
    message: string;
  }> {
    const budget = await this.checkBudget(workspaceId);

    if (!budget.allowed) {
      return {
        shouldAlert: true,
        level: 'emergency',
        message: `🚨 BUDGET LIMIT EXCEEDED! Daily: $${budget.dailySpent.toFixed(2)}/$${budget.dailyLimit}, Monthly: $${budget.monthlySpent.toFixed(2)}/$${budget.monthlyLimit}`,
      };
    }

    if (budget.percentUsed >= 95) {
      return {
        shouldAlert: true,
        level: 'critical',
        message: `⚠️ CRITICAL: ${budget.percentUsed.toFixed(1)}% of budget used ($${Math.max(budget.dailySpent, budget.monthlySpent).toFixed(2)})`,
      };
    }

    if (budget.percentUsed >= 80) {
      return {
        shouldAlert: true,
        level: 'warning',
        message: `⚠️ WARNING: ${budget.percentUsed.toFixed(1)}% of budget used ($${Math.max(budget.dailySpent, budget.monthlySpent).toFixed(2)})`,
      };
    }

    return {
      shouldAlert: false,
      level: null,
      message: '',
    };
  }
}

// Singleton instance
export const costTracker = new IntelligenceCostTracker();


