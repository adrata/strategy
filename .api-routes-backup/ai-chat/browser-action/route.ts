/**
 * 🌐 BROWSER ACTION API ENDPOINT
 * 
 * Handles browser automation requests from Claude AI
 * Provides web navigation, content extraction, and search capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { browserAutomationService } from '@/platform/services/BrowserAutomationService';
import { BrowserTools } from '@/platform/ai/tools/browser-tools';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // Max 10 requests per minute

  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, sessionId, parameters } = body;

    // Validate required fields
    if (!action || !sessionId) {
      return NextResponse.json(
        { error: 'Action and sessionId are required' },
        { status: 400 }
      );
    }

    // Validate tool call
    if (!BrowserTools.validateToolCall(action, parameters)) {
      return NextResponse.json(
        { error: 'Invalid tool call parameters' },
        { status: 400 }
      );
    }

    console.log('🌐 [BROWSER ACTION] Processing:', {
      action,
      sessionId,
      userId: user.id,
      parameters: Object.keys(parameters)
    });

    let result;

    // Execute browser action based on type
    switch (action) {
      case 'navigate_to_url':
        result = await browserAutomationService.navigateToUrl(
          sessionId,
          parameters.url,
          {
            extractText: parameters.extract_text !== false,
            extractLinks: parameters.extract_links || false,
            waitForSelector: parameters.wait_for_selector,
            screenshot: parameters.screenshot || false
          }
        );
        break;

      case 'search_web':
        result = await browserAutomationService.searchWeb(
          sessionId,
          parameters.query,
          {
            maxResults: parameters.max_results || 10,
            searchEngine: parameters.search_engine || 'google'
          }
        );
        break;

      case 'extract_page_content':
        result = await browserAutomationService.extractContent(
          sessionId,
          parameters.url,
          parameters.selectors,
          parameters.extract_type || 'text'
        );
        break;

      case 'take_screenshot':
        result = await browserAutomationService.takeScreenshot(
          sessionId,
          parameters.url,
          {
            fullPage: parameters.full_page || false,
            selector: parameters.selector
          }
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    console.log('✅ [BROWSER ACTION] Completed:', {
      action,
      success: result.success,
      url: result.url,
      contentLength: result.content?.length || 0
    });

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('❌ [BROWSER ACTION] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session information
    const session = browserAutomationService.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        startTime: session.startTime,
        isActive: session.isActive,
        actionCount: session.actions.length,
        resultCount: session.results.length
      }
    });

  } catch (error) {
    console.error('❌ [BROWSER ACTION] GET Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Close session
    await browserAutomationService.closeSession(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session closed successfully'
    });

  } catch (error) {
    console.error('❌ [BROWSER ACTION] DELETE Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
