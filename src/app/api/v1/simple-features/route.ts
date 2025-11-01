import { NextRequest, NextResponse } from 'next/server';
import { getSimpleFeatureAccess, type SimpleFeatureName } from '@/platform/services/simple-feature-service';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceSlug = searchParams.get('workspaceSlug');
    const userRole = searchParams.get('userRole') || 'VIEWER';
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: 'workspaceSlug is required' },
        { status: 400 }
      );
    }

    const featureAccess = getSimpleFeatureAccess(workspaceSlug, userRole, userId || undefined, userEmail || undefined);

    return NextResponse.json({
      success: true,
      workspaceSlug,
      userRole,
      userId,
      userEmail,
      featureAccess
    });

  } catch (error) {
    console.error('Error in simple-features API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load feature access',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceSlug, userRole = 'VIEWER', userId, userEmail } = body;

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: 'workspaceSlug is required' },
        { status: 400 }
      );
    }

    const featureAccess = getSimpleFeatureAccess(workspaceSlug, userRole, userId, userEmail);

    return NextResponse.json({
      success: true,
      workspaceSlug,
      userRole,
      userId,
      userEmail,
      featureAccess
    });

  } catch (error) {
    console.error('Error in simple-features API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load feature access',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
