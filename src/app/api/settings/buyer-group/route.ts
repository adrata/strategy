import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/platform/database/prisma-client';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/buyer-group - Get buyer group configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { customFields: true }
    });

    if (!workspace || !workspace.customFields) {
      return NextResponse.json({
        success: true,
        config: null
      });
    }

    const customFields = typeof workspace.customFields === 'object' 
      ? workspace.customFields 
      : JSON.parse(workspace.customFields || '{}');

    const buyerGroupConfig = customFields.buyerGroupConfig || null;

    return NextResponse.json({
      success: true,
      config: buyerGroupConfig
    });

  } catch (error) {
    console.error('Error fetching buyer group config:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch buyer group configuration' 
    }, { status: 500 });
  }
}

/**
 * PUT /api/settings/buyer-group - Update buyer group configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const { workspaceId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const config = await request.json();

    console.log(`💾 [BUYER GROUP SETTINGS] Saving config for workspace ${workspaceId}:`, config);

    // Get existing customFields
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { customFields: true }
    });

    let customFields = {};
    if (workspace?.customFields) {
      customFields = typeof workspace.customFields === 'object'
        ? workspace.customFields
        : JSON.parse(workspace.customFields || '{}');
    }

    // Update buyer group config with metadata
    customFields.buyerGroupConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
      version: '1.0'
    };

    console.log(`💾 [BUYER GROUP SETTINGS] Updated customFields:`, customFields);

    // Save to database
    const updatedWorkspace = await prisma.workspaces.update({
      where: { id: workspaceId },
      data: {
        customFields: customFields,
        updatedAt: new Date()
      },
      select: {
        id: true,
        customFields: true,
        updatedAt: true
      }
    });

    console.log(`✅ [BUYER GROUP SETTINGS] Saved to database. Updated at: ${updatedWorkspace.updatedAt}`);

    // Verify the save worked by checking the saved data
    const savedCustomFields = typeof updatedWorkspace.customFields === 'object'
      ? updatedWorkspace.customFields
      : JSON.parse(updatedWorkspace.customFields || '{}');
    
    const savedConfig = savedCustomFields.buyerGroupConfig;
    
    if (!savedConfig) {
      console.error('⚠️ [BUYER GROUP SETTINGS] Warning: Config not found after save');
      return NextResponse.json({ 
        success: false, 
        error: 'Configuration was not saved correctly' 
      }, { status: 500 });
    }

    console.log(`✅ [BUYER GROUP SETTINGS] Verified saved config:`, {
      usaOnly: savedConfig.usaOnly,
      dealSizeRange: savedConfig.dealSizeRange,
      productCategory: savedConfig.productCategory,
      updatedAt: savedConfig.updatedAt
    });

    return NextResponse.json({
      success: true,
      message: 'Buyer group configuration saved successfully',
      config: savedConfig
    });

  } catch (error) {
    console.error('❌ [BUYER GROUP SETTINGS] Error updating buyer group config:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update buyer group configuration',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

