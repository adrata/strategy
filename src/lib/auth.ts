import { NextRequest } from 'next/server';
import { getSession } from '@/platform/auth/session';

export async function verifyAuth(request: NextRequest) {
  try {
    // Get session from the unified auth system
    const session = await getSession();
    
    if (!session || !session.user) {
      return {
        success: false,
        error: 'Unauthorized',
        status: 401
      };
    }

    return {
      success: true,
      user: session.user,
      session
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 500
    };
  }
}
