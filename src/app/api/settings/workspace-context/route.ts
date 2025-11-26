import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/platform/database/prisma-client';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    
    if (!userId || !workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: {
        productPortfolio: true,
        targetIndustries: true,
        valuePropositions: true,
        businessModel: true,
        industry: true
      }
    });

    if (!workspace) {
      return NextResponse.json({
        success: false,
        error: 'Workspace not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      context: {
        productPortfolio: workspace.productPortfolio || [],
        targetIndustries: workspace.targetIndustries || [],
        valuePropositions: workspace.valuePropositions || [],
        businessModel: workspace.businessModel || '',
        industry: workspace.industry || ''
      }
    });

  } catch (error) {
    console.error('Error fetching workspace context:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch workspace context'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    
    if (!userId || !workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const body = await request.json();
    const { productPortfolio, targetIndustries, valuePropositions, businessModel, industry } = body;

    // Filter out empty strings from arrays
    const cleanedProductPortfolio = (productPortfolio || []).filter((item: string) => item.trim() !== '');
    const cleanedTargetIndustries = (targetIndustries || []).filter((item: string) => item.trim() !== '');
    const cleanedValuePropositions = (valuePropositions || []).filter((item: string) => item.trim() !== '');

    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: {
        productPortfolio: cleanedProductPortfolio,
        targetIndustries: cleanedTargetIndustries,
        valuePropositions: cleanedValuePropositions,
        businessModel: businessModel || null,
        industry: industry || null,
        updatedAt: new Date()
      }
    });

    console.log('✅ [Workspace Context] Updated AI context for workspace:', workspaceId);

    return NextResponse.json({
      success: true,
      message: 'Workspace AI context updated successfully'
    });

  } catch (error) {
    console.error('Error updating workspace context:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update workspace context'
    }, { status: 500 });
  }
}

