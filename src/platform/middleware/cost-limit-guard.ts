import { NextRequest, NextResponse } from 'next/server';
import { costTracker } from '@/platform/services/v1/IntelligenceCostTracker';

/**
 * Cost Limit Guard Middleware
 * 
 * Enforces budget limits on v1 intelligence APIs
 * 
 * Usage:
 * ```typescript
 * const guardResponse = await costLimitGuard(request, workspaceId);
 * if (guardResponse) return guardResponse;
 * ```
 */
export async function costLimitGuard(
  request: NextRequest,
  workspaceId: string
): Promise<NextResponse | null> {
  try {
    // Check budget
    const budget = await costTracker.checkBudget(workspaceId);

    // If budget exceeded, block request
    if (!budget.allowed) {
      console.error(
        `[Cost Guard] Budget limit exceeded for workspace ${workspaceId}. Daily: $${budget.dailySpent.toFixed(2)}/$${budget.dailyLimit}, Monthly: $${budget.monthlySpent.toFixed(2)}/$${budget.monthlyLimit}`
      );

      return NextResponse.json(
        {
          success: false,
          error: 'BUDGET_LIMIT_EXCEEDED',
          message: `API budget limit exceeded. Daily spent: $${budget.dailySpent.toFixed(2)} (limit: $${budget.dailyLimit}), Monthly spent: $${budget.monthlySpent.toFixed(2)} (limit: $${budget.monthlyLimit}). Please contact support to increase limits.`,
          details: {
            dailySpent: budget.dailySpent,
            dailyLimit: budget.dailyLimit,
            monthlySpent: budget.monthlySpent,
            monthlyLimit: budget.monthlyLimit,
            percentUsed: budget.percentUsed,
          },
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Check for alerts (but don't block)
    const alert = await costTracker.checkAndAlert(workspaceId);
    if (alert.shouldAlert) {
      console.warn(`[Cost Guard] ${alert.message} (workspace: ${workspaceId})`);
    }

    // Allow request to proceed
    return null;
  } catch (error) {
    console.error('[Cost Guard] Error checking budget:', error);
    // On error, allow request to proceed (fail open)
    return null;
  }
}

/**
 * Cost-aware wrapper for intelligence operations
 * 
 * Tracks costs and enforces limits automatically
 */
export async function withCostTracking<T>(
  workspaceId: string,
  userId: string | undefined,
  apiProvider: 'coresignal' | 'lusha' | 'perplexity' | 'pdl' | 'prospeo' | 'contactout',
  operation: string,
  estimatedCost: number,
  fn: () => Promise<T>
): Promise<T> {
  // Check budget before operation
  const budget = await costTracker.checkBudget(workspaceId);
  if (!budget.allowed) {
    throw new Error(
      `Budget limit exceeded. Daily: $${budget.dailySpent.toFixed(2)}/$${budget.dailyLimit}, Monthly: $${budget.monthlySpent.toFixed(2)}/$${budget.monthlyLimit}`
    );
  }

  const startTime = Date.now();
  let success = true;
  let errorMessage: string | undefined;

  try {
    // Execute operation
    const result = await fn();
    return result;
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  } finally {
    // Track cost
    await costTracker.trackCost({
      workspaceId,
      userId,
      apiProvider,
      operation,
      cost: estimatedCost,
      success,
      errorMessage,
    });

    const duration = Date.now() - startTime;
    console.log(
      `[Cost Tracking] ${apiProvider}.${operation}: $${estimatedCost.toFixed(4)} (${duration}ms, ${success ? 'success' : 'failed'})`
    );
  }
}


