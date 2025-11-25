/**
 * 🔍 AI CHAT DEBUG ENDPOINT
 * 
 * Minimal endpoint to debug 405 issues - no dependencies, no auth
 * This will help us determine if the 405 is from:
 * 1. Vercel edge/WAF
 * 2. Next.js routing
 * 3. Our code/middleware
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

// Log at module load time
console.log('🔍 [AI-CHAT-DEBUG] Route module loaded at:', new Date().toISOString());

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  console.log('✅ [AI-CHAT-DEBUG] POST handler REACHED at:', timestamp);
  console.log('🔍 [AI-CHAT-DEBUG] Request details:', {
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    headers: Object.fromEntries(request.headers.entries()),
  });

  try {
    const body = await request.text();
    console.log('🔍 [AI-CHAT-DEBUG] Request body length:', body.length);
    console.log('🔍 [AI-CHAT-DEBUG] Request body preview:', body.substring(0, 200));

    return NextResponse.json({
      success: true,
      message: 'POST request received successfully!',
      debug: {
        timestamp,
        method: request.method,
        url: request.url,
        pathname: request.nextUrl.pathname,
        bodyLength: body.length,
        headers: {
          'content-type': request.headers.get('content-type'),
          'user-agent': request.headers.get('user-agent'),
          'x-forwarded-for': request.headers.get('x-forwarded-for'),
          'x-vercel-id': request.headers.get('x-vercel-id'),
        }
      }
    });
  } catch (error) {
    console.error('❌ [AI-CHAT-DEBUG] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const results: Record<string, any> = {};
  
  // Test each import that the main route uses
  try {
    const { claudeAIService } = await import('@/platform/services/ClaudeAIService');
    results['ClaudeAIService'] = '✅ OK';
  } catch (e: any) { results['ClaudeAIService'] = `❌ ${e.message}`; }

  try {
    const { openRouterService } = await import('@/platform/services/OpenRouterService');
    results['OpenRouterService'] = '✅ OK';
  } catch (e: any) { results['OpenRouterService'] = `❌ ${e.message}`; }

  try {
    const { AIContextService } = await import('@/platform/ai/services/AIContextService');
    results['AIContextService'] = '✅ OK';
  } catch (e: any) { results['AIContextService'] = `❌ ${e.message}`; }

  try {
    const helpers = await import('@/platform/services/secure-api-helper');
    results['secure-api-helper'] = '✅ OK';
  } catch (e: any) { results['secure-api-helper'] = `❌ ${e.message}`; }

  try {
    const { promptInjectionGuard } = await import('@/platform/security/prompt-injection-guard');
    results['promptInjectionGuard'] = '✅ OK';
  } catch (e: any) { results['promptInjectionGuard'] = `❌ ${e.message}`; }

  try {
    const { rateLimiter } = await import('@/platform/security/rate-limiter');
    results['rateLimiter'] = '✅ OK';
  } catch (e: any) { results['rateLimiter'] = `❌ ${e.message}`; }

  try {
    const { securityMonitor } = await import('@/platform/security/security-monitor');
    results['securityMonitor'] = '✅ OK';
  } catch (e: any) { results['securityMonitor'] = `❌ ${e.message}`; }

  try {
    const tools = await import('@/platform/ai/tools/role-finder-tool');
    results['role-finder-tool'] = '✅ OK';
  } catch (e: any) { results['role-finder-tool'] = `❌ ${e.message}`; }

  const failed = Object.entries(results).filter(([_, v]) => String(v).startsWith('❌'));
  
  return NextResponse.json({
    success: failed.length === 0,
    message: failed.length === 0 ? 'All imports OK!' : `${failed.length} imports failed`,
    timestamp,
    results,
    failedImports: failed.map(([k]) => k)
  });
}

export async function OPTIONS(request: NextRequest) {
  console.log('✅ [AI-CHAT-DEBUG] OPTIONS handler REACHED');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

