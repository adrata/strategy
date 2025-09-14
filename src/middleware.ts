/**
 * Middleware Configuration
 * 
 * Currently disabled due to production issues with privacy middleware
 * that were causing MIDDLEWARE_INVOCATION_FAILED errors.
 * 
 * This minimal implementation provides a pass-through only approach
 * to restore service stability.
 */

import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Pass-through implementation - no processing
  return NextResponse.next();
}

// Disabled middleware matching to prevent processing
export const config = {
  matcher: [],  // Empty matcher disables middleware processing
};