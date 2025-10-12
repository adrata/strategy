import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

/**
 * PATCH /api/opportunities/[id]/stage - Update opportunity stage
 * This endpoint handles updating the stage field for companies (opportunities)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { id } = params;
    const { stage, workspaceId, userId } = await request.json();

    if (!id || !stage) {
      return createErrorResponse('Missing required fields: id and stage', 'MISSING_FIELDS', 400);
    }

    // Validate stage value
    const validStages = ['qualification', 'discovery', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
    if (!validStages.includes(stage)) {
      return createErrorResponse(`Invalid stage. Must be one of: ${validStages.join(', ')}`, 'INVALID_STAGE', 400);
    }

    console.log(`🔄 [OPPORTUNITY STAGE] Updating company ${id} stage to ${stage} for workspace: ${context.workspaceId}`);

    // Update the company's stage field
    const updatedCompany = await prisma.companies.update({
      where: {
        id: id,
        workspaceId: context.workspaceId // Ensure user can only update companies in their workspace
      },
      data: {
        stage: stage,
        updatedAt: new Date()
      }
    });

    console.log(`✅ [OPPORTUNITY STAGE] Successfully updated company ${id} stage to ${stage}`);

    return createSuccessResponse({
      id: updatedCompany.id,
      stage: updatedCompany.stage,
      name: updatedCompany.name
    }, {
      message: 'Stage updated successfully',
      workspaceId: context.workspaceId,
      userId: context.userId
    });

  } catch (error) {
    console.error('❌ [OPPORTUNITY STAGE] Error updating stage:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return createErrorResponse('Opportunity not found or access denied', 'NOT_FOUND', 404);
      }
    }

    return createErrorResponse(
      'Failed to update opportunity stage',
      'STAGE_UPDATE_ERROR',
      500
    );
  }
}
