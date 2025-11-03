import { NextRequest, NextResponse } from 'next/server';
import { getV1AuthUser } from '../../auth';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * V1 Auth Status API
 * GET /api/v1/auth/status - Check authentication status
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getV1AuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        user: authUser
      },
      meta: {
        message: 'User is authenticated'
      }
    });

  } catch (error) {
    console.error('❌ [V1 AUTH] Status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
