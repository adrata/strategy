import { NextRequest, NextResponse } from 'next/server';
import { getV1AuthUser } from '../../auth';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * V1 Sign-out API
 * POST /api/v1/auth/sign-out - Sign out user (invalidate token)
 */
export async function POST(request: NextRequest) {
  try {
    // For JWT tokens, we can't actually invalidate them server-side
    // The client should discard the token
    // In a more sophisticated system, you'd maintain a blacklist of tokens
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Signed out successfully'
      },
      meta: {
        message: 'Please discard your token on the client side'
      }
    });

  } catch (error) {
    console.error('❌ [V1 AUTH] Sign-out error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
