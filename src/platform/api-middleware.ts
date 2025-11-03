/**
 * API Middleware
 * Middleware for API endpoints that handle rate limiting, usage tracking, and scope validation
 */

import { NextRequest, NextResponse } from "next/server";
import { getUnifiedAuthUser } from "@/platform/api-auth";
import { checkScope } from "@/platform/api-rate-limiter";
import { trackUsage } from "@/platform/api-usage-tracker";
import { getClientIp } from "@/platform/api-rate-limiter";

export interface ApiMiddlewareOptions {
  requiredScope?: string;
  trackUsage?: boolean;
}

/**
 * API middleware wrapper
 * Handles authentication, rate limiting (already in auth), scope checking, and usage tracking
 */
export async function withApiMiddleware(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
  options: ApiMiddlewareOptions = {}
) {
  const startTime = Date.now();
  let response: NextResponse | null = null;
  let apiKeyId: string | null = null;

  try {
    // Authenticate (includes IP check and rate limiting)
    const user = await getUnifiedAuthUser(request);

    if (!user || !user.workspaceId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Check scope if required
    // If user has API key, check scopes; if no API key (JWT auth), allow (legacy behavior)
    if (options.requiredScope) {
      if (user._apiKey?.scopes) {
        // API key auth - check scopes
        const hasScope = checkScope(options.requiredScope, user._apiKey.scopes);
        if (!hasScope) {
          return NextResponse.json(
            {
              error: "Insufficient permissions",
              code: "SCOPE_REQUIRED",
              requiredScope: options.requiredScope
            },
            { status: 403 }
          );
        }
      }
      // If JWT auth (no _apiKey), allow through (legacy behavior for backward compatibility)
    }

    // Store API key ID for usage tracking
    if (user._apiKey) {
      apiKeyId = user._apiKey.id;
    }

    // Execute handler
    response = await handler(request, user);

    // Track usage (non-blocking)
    if (options.trackUsage !== false && apiKeyId) {
      const responseTime = Date.now() - startTime;
      const url = new URL(request.url);
      
      trackUsage({
        apiKeyId,
        endpoint: url.pathname,
        method: request.method,
        statusCode: response.status,
        responseTime,
        ipAddress: getClientIp(request as any),
        userAgent: request.headers.get("user-agent") || undefined
      }).catch(() => {
        // Ignore tracking errors
      });

      // Add rate limit headers
      if (user._apiKey?.rateLimitInfo) {
        response.headers.set(
          "X-RateLimit-Remaining",
          user._apiKey.rateLimitInfo.remaining.toString()
        );
        response.headers.set(
          "X-RateLimit-Reset",
          new Date(user._apiKey.rateLimitInfo.resetAt).toISOString()
        );
      }
    }

    return response;

  } catch (error: any) {
    // Handle rate limit errors
    if (error?.message?.startsWith("RATE_LIMIT_EXCEEDED:")) {
      const retryAfter = parseInt(error.message.split(":")[1] || "60");
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Retry-After": retryAfter.toString()
          }
        }
      );
    }

    console.error("❌ [API MIDDLEWARE] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

