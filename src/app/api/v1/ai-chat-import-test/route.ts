/**
 * 🔍 AI CHAT IMPORT TEST
 * Tests each import individually to find what's breaking
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// Test imports one by one
let importResults: Record<string, string> = {};

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {};
  
  // Test 1: ClaudeAIService
  try {
    const { claudeAIService } = await import('@/platform/services/ClaudeAIService');
    results['ClaudeAIService'] = claudeAIService ? '✅ OK' : '❌ null';
  } catch (e: any) {
    results['ClaudeAIService'] = `❌ ${e.message}`;
  }

  // Test 2: OpenRouterService
  try {
    const { openRouterService } = await import('@/platform/services/OpenRouterService');
    results['OpenRouterService'] = openRouterService ? '✅ OK' : '❌ null';
  } catch (e: any) {
    results['OpenRouterService'] = `❌ ${e.message}`;
  }

  // Test 3: ModelCostTracker
  try {
    const { modelCostTracker } = await import('@/platform/services/ModelCostTracker');
    results['ModelCostTracker'] = modelCostTracker ? '✅ OK' : '❌ null';
  } catch (e: any) {
    results['ModelCostTracker'] = `❌ ${e.message}`;
  }

  // Test 4: GradualRolloutService
  try {
    const { gradualRolloutService } = await import('@/platform/services/GradualRolloutService');
    results['GradualRolloutService'] = gradualRolloutService ? '✅ OK' : '❌ null';
  } catch (e: any) {
    results['GradualRolloutService'] = `❌ ${e.message}`;
  }

  // Test 5: secure-api-helper
  try {
    const helpers = await import('@/platform/services/secure-api-helper');
    results['secure-api-helper'] = helpers.getSecureApiContext ? '✅ OK' : '❌ missing functions';
  } catch (e: any) {
    results['secure-api-helper'] = `❌ ${e.message}`;
  }

  // Test 6: AIContextService
  try {
    const { AIContextService } = await import('@/platform/ai/services/AIContextService');
    results['AIContextService'] = AIContextService ? '✅ OK' : '❌ null';
  } catch (e: any) {
    results['AIContextService'] = `❌ ${e.message}`;
  }

  // Test 7: prompt-injection-guard
  try {
    const { promptInjectionGuard } = await import('@/platform/security/prompt-injection-guard');
    results['promptInjectionGuard'] = promptInjectionGuard ? '✅ OK' : '❌ null';
  } catch (e: any) {
    results['promptInjectionGuard'] = `❌ ${e.message}`;
  }

  // Test 8: ai-response-validator
  try {
    const { aiResponseValidator } = await import('@/platform/security/ai-response-validator');
    results['aiResponseValidator'] = aiResponseValidator ? '✅ OK' : '❌ null';
  } catch (e: any) {
    results['aiResponseValidator'] = `❌ ${e.message}`;
  }

  // Test 9: rate-limiter
  try {
    const { rateLimiter } = await import('@/platform/security/rate-limiter');
    results['rateLimiter'] = rateLimiter ? '✅ OK' : '❌ null';
  } catch (e: any) {
    results['rateLimiter'] = `❌ ${e.message}`;
  }

  // Test 10: security-monitor
  try {
    const { securityMonitor } = await import('@/platform/security/security-monitor');
    results['securityMonitor'] = securityMonitor ? '✅ OK' : '❌ null';
  } catch (e: any) {
    results['securityMonitor'] = `❌ ${e.message}`;
  }

  // Test 11: role-finder-tool
  try {
    const tools = await import('@/platform/ai/tools/role-finder-tool');
    results['role-finder-tool'] = tools.shouldUseRoleFinderTool ? '✅ OK' : '❌ missing functions';
  } catch (e: any) {
    results['role-finder-tool'] = `❌ ${e.message}`;
  }

  // Test 12: connection-pool (dynamic import used in route)
  try {
    const { getPrismaClient } = await import('@/platform/database/connection-pool');
    results['connection-pool'] = getPrismaClient ? '✅ OK' : '❌ null';
  } catch (e: any) {
    results['connection-pool'] = `❌ ${e.message}`;
  }

  const failedImports = Object.entries(results).filter(([_, v]) => v.startsWith('❌'));
  
  return NextResponse.json({
    success: failedImports.length === 0,
    message: failedImports.length === 0 ? 'All imports OK!' : `${failedImports.length} imports failed`,
    results,
    failedImports: failedImports.map(([k]) => k)
  });
}

