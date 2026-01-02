import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import {
  PullFrameworkSettingsService,
  type PullFrameworkConfig,
  DEFAULT_PULL_DISCOVERY_FLOW
} from '@/platform/services/pull-framework-settings';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/pull-framework
 *
 * Get PULL framework settings for the current workspace
 * Used by settings UI to display/edit PULL configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);

    // Get PULL framework settings
    const settings = await PullFrameworkSettingsService.getSettings(workspaceId);

    if (!settings) {
      // Return default configuration if none exists
      const defaultConfig = PullFrameworkSettingsService.getDefaultConfig();
      return NextResponse.json({
        success: true,
        settings: defaultConfig,
        isDefault: true,
        message: 'No custom PULL framework configured - using defaults'
      });
    }

    return NextResponse.json({
      success: true,
      settings,
      isDefault: false
    });

  } catch (error) {
    console.error('Error fetching PULL framework settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch PULL framework settings'
    }, { status: 500 });
  }
}

/**
 * PUT /api/settings/pull-framework
 *
 * Update PULL framework settings for the current workspace
 * This configures how the AI assistant guides discovery calls
 */
export async function PUT(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const settings: PullFrameworkConfig = await request.json();

    // Validate required fields
    if (!settings.productName) {
      return NextResponse.json({
        success: false,
        error: 'Product name is required'
      }, { status: 400 });
    }

    // Save settings
    const saved = await PullFrameworkSettingsService.saveSettings(workspaceId, settings);

    if (!saved) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save PULL framework settings'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'PULL framework settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating PULL framework settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update PULL framework settings'
    }, { status: 500 });
  }
}

/**
 * POST /api/settings/pull-framework
 *
 * Additional actions for PULL framework:
 * - Get discovery guidance based on current call state
 * - Analyze conversation for PULL state
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const body = await request.json();

    const { action, ...params } = body;

    switch (action) {
      case 'get-discovery-guidance': {
        // Get next question based on current PULL state
        const { currentPullState } = params;

        const guidance = await PullFrameworkSettingsService.generateDiscoveryGuidance(
          workspaceId,
          currentPullState || {}
        );

        return NextResponse.json({
          success: true,
          guidance
        });
      }

      case 'get-discovery-questions': {
        // Get all discovery questions
        const questions = await PullFrameworkSettingsService.getDiscoveryQuestions(workspaceId);

        return NextResponse.json({
          success: true,
          questions
        });
      }

      case 'get-opening-question': {
        // Get the opening question for calls
        const openingQuestion = await PullFrameworkSettingsService.getOpeningQuestion(workspaceId);

        return NextResponse.json({
          success: true,
          openingQuestion
        });
      }

      case 'get-pull-signals': {
        // Get PULL signals for company scoring
        const signals = await PullFrameworkSettingsService.getPullSignals(workspaceId);

        return NextResponse.json({
          success: true,
          signals
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in PULL framework action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute PULL framework action'
    }, { status: 500 });
  }
}
