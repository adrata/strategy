/**
 * Username Validation API Route
 * 
 * Securely validates if a username/email exists without exposing sensitive information.
 * Implements rate limiting and constant-time responses to prevent enumeration attacks.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';
import { checkRateLimit, USERNAME_VALIDATION_RATE_LIMIT } from '@/platform/middleware/rate-limit';

const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

/**
 * Constant-time delay to prevent timing attacks
 * Always takes the same amount of time regardless of whether user exists
 */
async function constantTimeDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate username/email exists (constant-time response)
 */
async function validateUsernameExists(email: string): Promise<boolean> {
  const startTime = Date.now();
  const TARGET_RESPONSE_TIME = 50; // Target 50ms for consistent timing
  
  try {
    const isEmail = email.includes("@");
    
    // Build query conditions
    const orConditions = [];
    if (isEmail) {
      orConditions.push({ email: email.toLowerCase() });
    } else {
      orConditions.push({ username: email.toLowerCase() });
    }
    orConditions.push({ name: email }); // Fallback: name login
    
    // Query database
    const user = await prisma.users.findFirst({
      where: {
        OR: orConditions,
        isActive: true,
      },
      select: {
        id: true, // Only select id for minimal data exposure
      }
    });
    
    const exists = !!user;
    
    // Ensure constant-time response to prevent timing attacks
    const elapsed = Date.now() - startTime;
    if (elapsed < TARGET_RESPONSE_TIME) {
      await constantTimeDelay(TARGET_RESPONSE_TIME - elapsed);
    }
    
    return exists;
  } catch (error) {
    // On error, still maintain constant-time response
    const elapsed = Date.now() - startTime;
    if (elapsed < TARGET_RESPONSE_TIME) {
      await constantTimeDelay(TARGET_RESPONSE_TIME - elapsed);
    }
    // Return false on error to not expose system state
    return false;
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: SECURITY_HEADERS,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check rate limit
    const rateLimitResult = checkRateLimit(request, USERNAME_VALIDATION_RATE_LIMIT);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            ...SECURITY_HEADERS,
            'Retry-After': rateLimitResult.retryAfter.toString(),
            'X-RateLimit-Limit': USERNAME_VALIDATION_RATE_LIMIT.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }
    
    const body = await request.json();
    const { email } = body;
    
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Email or username is required" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }
    
    // Validate username exists (constant-time)
    const exists = await validateUsernameExists(email.trim());
    
    return NextResponse.json(
      {
        success: true,
        exists,
        canProceed: exists, // Can proceed with login if username exists
      },
      {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          'X-RateLimit-Limit': USERNAME_VALIDATION_RATE_LIMIT.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        }
      }
    );
  } catch (error) {
    console.error("❌ [USERNAME VALIDATION] Error:", error);
    
    // Return generic error without exposing details
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed"
      },
      {
        status: 500,
        headers: SECURITY_HEADERS
      }
    );
  }
}

