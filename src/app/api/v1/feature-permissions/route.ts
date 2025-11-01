import { NextRequest, NextResponse } from 'next/server';
import {
  hasMultipleFeatureAccess,
  getWorkspaceFeatures,
  getUserFeatures,
  type FeatureName
} from '@/platform/services/feature-permission-service';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, workspaceId, features } = body;

    if (!userId || !workspaceId) {
      return NextResponse.json(
        { error: 'userId and workspaceId are required' },
        { status: 400 }
      );
    }

    // Load all features at once for better performance
    const [accessResults, workspaceData, userData] = await Promise.all([
      hasMultipleFeatureAccess(userId, workspaceId, features || ['OASIS', 'STACKS', 'ATRIUM', 'REVENUEOS', 'METRICS', 'CHRONICLE', 'DESKTOP_DOWNLOAD']),
      getWorkspaceFeatures(workspaceId),
      getUserFeatures(userId, workspaceId)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        featureAccess: accessResults,
        workspaceFeatures: workspaceData.enabledFeatures,
        userFeatures: userData.enabledFeatures
      }
    });

  } catch (error) {
    console.error('Error in feature-permissions API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load feature permissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
