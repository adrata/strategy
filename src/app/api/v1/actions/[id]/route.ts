import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getV1AuthUser } from '../../auth';
import { isMeaningfulAction } from '@/platform/utils/meaningfulActions';
import { IntelligentNextActionService } from '@/platform/services/IntelligentNextActionService';

// Required for static export (desktop build)
export const dynamic = 'force-static';

const prisma = new PrismaClient();

/**
 * Individual Action CRUD API v1
 * GET /api/v1/actions/[id] - Get a specific action
 * PUT /api/v1/actions/[id] - Update an action (full replacement)
 * PATCH /api/v1/actions/[id] - Partially update an action
 * DELETE /api/v1/actions/[id] - Delete an action
 */

// GET /api/v1/actions/[id] - Get a specific action
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const action = await prisma.actions.findUnique({
      where: { 
        id,
        deletedAt: null // Only show non-deleted records
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
            status: true,
            priority: true,
          },
          where: {
            deletedAt: null // Only show non-deleted companies
          }
        },
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
            status: true,
            priority: true,
          },
          where: {
            deletedAt: null // Only show non-deleted people
          }
        },
      },
    });

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: action,
    });

  } catch (error) {
    console.error('Error fetching action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch action' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/actions/[id] - Update an action (full replacement)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Check if action exists
    const existingAction = await prisma.actions.findUnique({
      where: { 
        id,
        deletedAt: null // Only update non-deleted records
      },
    });

    if (!existingAction) {
      return NextResponse.json(
        { success: false, error: 'Action not found' },
        { status: 404 }
      );
    }

    // Prepare update data with automatic completion handling
    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    // 🔄 BIDIRECTIONAL SYNC: Handle status ↔ completedAt synchronization
    
    // If status is being changed to COMPLETED, set completedAt
    if (body.status === 'COMPLETED' && existingAction.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
      console.log('🔄 [ACTIONS PUT] Auto-syncing completedAt due to status change to COMPLETED:', {
        actionId: id,
        status: body.status,
        completedAt: updateData.completedAt
      });
    }
    
    // If completedAt is being set, automatically set status to COMPLETED
    if (body.completedAt && body.status !== 'COMPLETED') {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date(body.completedAt);
      console.log('🔄 [ACTIONS PUT] Auto-syncing status to COMPLETED due to completedAt date:', {
        actionId: id,
        completedAt: updateData.completedAt,
        status: updateData.status
      });
    }
    
    // If completedAt is being cleared (set to null), set status back to PLANNED
    if (body.completedAt === null && existingAction.completedAt && body.status !== 'PLANNED') {
      updateData.status = 'PLANNED';
      updateData.completedAt = null;
      console.log('🔄 [ACTIONS PUT] Auto-syncing status to PLANNED due to completedAt being cleared:', {
        actionId: id,
        completedAt: updateData.completedAt,
        status: updateData.status
      });
    }

    // Update action
    const updatedAction = await prisma.actions.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
          },
        },
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
          },
        },
      },
    });

    // Update person's lastAction fields if action is completed AND is a meaningful action
    if (updatedAction.personId && updatedAction.status === 'COMPLETED' && isMeaningfulAction(updatedAction.type)) {
      try {
        await prisma.people.update({
          where: { id: updatedAction.personId },
          data: {
            lastAction: updatedAction.subject,
            lastActionDate: updatedAction.completedAt || updatedAction.updatedAt,
            actionStatus: updatedAction.status
          }
        });
        console.log('✅ [ACTIONS PUT] Updated person lastAction fields for meaningful action:', {
          personId: updatedAction.personId,
          actionType: updatedAction.type,
          lastAction: updatedAction.subject,
          lastActionDate: updatedAction.completedAt || updatedAction.updatedAt
        });

        // 🎯 AUTO RE-RANKING: Trigger automatic re-ranking for speedrun when engagement actions are completed
        try {
          const reRankResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/speedrun/re-rank`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
            },
            body: JSON.stringify({
              trigger: 'action_update',
              personId: updatedAction.personId,
              actionType: updatedAction.type,
              timestamp: new Date().toISOString()
            })
          });
          
          if (reRankResponse.ok) {
            console.log('✅ [ACTIONS PUT] Triggered automatic re-ranking after engagement action update');
          } else {
            console.warn('⚠️ [ACTIONS PUT] Re-ranking request failed but continuing:', reRankResponse.status);
          }
        } catch (reRankError) {
          console.error('⚠️ [ACTIONS PUT] Background re-ranking failed (non-blocking):', reRankError);
        }
      } catch (error) {
        console.error('❌ [ACTIONS PUT] Failed to update person lastAction fields:', error);
      }
    } else if (updatedAction.personId && updatedAction.status === 'COMPLETED' && !isMeaningfulAction(updatedAction.type)) {
      console.log('⏭️ [ACTIONS PUT] Skipping lastAction update for system action:', {
        personId: updatedAction.personId,
        actionType: updatedAction.type,
        subject: updatedAction.subject
      });
    }

    // Update company's lastAction fields if action is completed AND is a meaningful action
    if (updatedAction.companyId && updatedAction.status === 'COMPLETED' && isMeaningfulAction(updatedAction.type)) {
      try {
        await prisma.companies.update({
          where: { id: updatedAction.companyId },
          data: {
            lastAction: updatedAction.subject,
            lastActionDate: updatedAction.completedAt || updatedAction.updatedAt,
            actionStatus: updatedAction.status
          }
        });
        console.log('✅ [ACTIONS PUT] Updated company lastAction fields for engagement action:', {
          companyId: updatedAction.companyId,
          actionType: updatedAction.type,
          lastAction: updatedAction.subject,
          lastActionDate: updatedAction.completedAt || updatedAction.updatedAt
        });
      } catch (error) {
        console.error('❌ [ACTIONS PUT] Failed to update company lastAction fields:', error);
      }
    } else if (updatedAction.companyId && updatedAction.status === 'COMPLETED' && !isMeaningfulAction(updatedAction.type)) {
      console.log('⏭️ [ACTIONS PUT] Skipping lastAction update for system action:', {
        companyId: updatedAction.companyId,
        actionType: updatedAction.type,
        subject: updatedAction.subject
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedAction,
      meta: {
        message: 'Action updated successfully',
      },
    });

  } catch (error) {
    console.error('Error updating action:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update action' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/actions/[id] - Partially update an action
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Check if action exists
    const existingAction = await prisma.actions.findUnique({
      where: { 
        id,
        deletedAt: null // Only update non-deleted records
      },
    });

    if (!existingAction) {
      return NextResponse.json(
        { success: false, error: 'Action not found' },
        { status: 404 }
      );
    }

    // Validate foreign key references if provided AND being changed
    if (body.companyId && body.companyId !== existingAction.companyId) {
      console.log('🔍 [ACTIONS PATCH] Validating company reference (being changed):', { 
        newCompanyId: body.companyId,
        existingCompanyId: existingAction.companyId
      });
      const companyExists = await prisma.companies.findUnique({
        where: { id: body.companyId, deletedAt: null }
      });
      if (!companyExists) {
        console.error('❌ [ACTIONS PATCH] Validation failed - company not found:', {
          companyId: body.companyId,
          context: { userId: authUser.id, workspaceId: authUser.workspaceId }
        });
        return NextResponse.json(
          { success: false, error: `Company with ID ${body.companyId} not found or has been deleted` },
          { status: 400 }
        );
      }
      console.log('✅ [ACTIONS PATCH] Company reference validated:', { companyName: companyExists.name });
    }

    if (body.personId && body.personId !== existingAction.personId) {
      console.log('🔍 [ACTIONS PATCH] Validating person reference (being changed):', { 
        newPersonId: body.personId,
        existingPersonId: existingAction.personId
      });
      const personExists = await prisma.people.findUnique({
        where: { id: body.personId, deletedAt: null }
      });
      if (!personExists) {
        console.error('❌ [ACTIONS PATCH] Validation failed - person not found:', {
          personId: body.personId,
          context: { userId: authUser.id, workspaceId: authUser.workspaceId }
        });
        return NextResponse.json(
          { success: false, error: `Person with ID ${body.personId} not found or has been deleted` },
          { status: 400 }
        );
      }
      console.log('✅ [ACTIONS PATCH] Person reference validated:', { personName: personExists.fullName || personExists.firstName });
    }

    // Prepare update data with automatic completion handling
    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    // 🔄 BIDIRECTIONAL SYNC: Handle status ↔ completedAt synchronization
    
    // If status is being changed to COMPLETED, set completedAt
    if (body.status === 'COMPLETED' && existingAction.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
      console.log('🔄 [ACTIONS PATCH] Auto-syncing completedAt due to status change to COMPLETED:', {
        actionId: id,
        status: body.status,
        completedAt: updateData.completedAt
      });
    }
    
    // If completedAt is being set, automatically set status to COMPLETED
    if (body.completedAt && body.status !== 'COMPLETED') {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date(body.completedAt);
      console.log('🔄 [ACTIONS PATCH] Auto-syncing status to COMPLETED due to completedAt date:', {
        actionId: id,
        completedAt: updateData.completedAt,
        status: updateData.status
      });
    }
    
    // If completedAt is being cleared (set to null), set status back to PLANNED
    if (body.completedAt === null && existingAction.completedAt && body.status !== 'PLANNED') {
      updateData.status = 'PLANNED';
      updateData.completedAt = null;
      console.log('🔄 [ACTIONS PATCH] Auto-syncing status to PLANNED due to completedAt being cleared:', {
        actionId: id,
        completedAt: updateData.completedAt,
        status: updateData.status
      });
    }

    // Update action with partial data
    const updatedAction = await prisma.actions.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
          },
        },
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
          },
        },
      },
    });

    // Update person's lastAction fields if action is completed AND is a meaningful action
    if (updatedAction.personId && updatedAction.status === 'COMPLETED' && isMeaningfulAction(updatedAction.type)) {
      try {
        await prisma.people.update({
          where: { id: updatedAction.personId },
          data: {
            lastAction: updatedAction.subject,
            lastActionDate: updatedAction.completedAt || updatedAction.updatedAt,
            actionStatus: updatedAction.status
          }
        });
        console.log('✅ [ACTIONS PATCH] Updated person lastAction fields for meaningful action:', {
          personId: updatedAction.personId,
          actionType: updatedAction.type,
          lastAction: updatedAction.subject,
          lastActionDate: updatedAction.completedAt || updatedAction.updatedAt
        });

        // 🎯 AUTO RE-RANKING: Trigger automatic re-ranking for speedrun when engagement actions are completed
        try {
          const reRankResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/speedrun/re-rank`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
            },
            body: JSON.stringify({
              trigger: 'action_patch',
              personId: updatedAction.personId,
              actionType: updatedAction.type,
              timestamp: new Date().toISOString()
            })
          });
          
          if (reRankResponse.ok) {
            console.log('✅ [ACTIONS PATCH] Triggered automatic re-ranking after engagement action patch');
          } else {
            console.warn('⚠️ [ACTIONS PATCH] Re-ranking request failed but continuing:', reRankResponse.status);
          }
        } catch (reRankError) {
          console.error('⚠️ [ACTIONS PATCH] Background re-ranking failed (non-blocking):', reRankError);
        }
      } catch (error) {
        console.error('❌ [ACTIONS PATCH] Failed to update person lastAction fields:', error);
      }
    } else if (updatedAction.personId && updatedAction.status === 'COMPLETED' && !isMeaningfulAction(updatedAction.type)) {
      console.log('⏭️ [ACTIONS PATCH] Skipping lastAction update for system action:', {
        personId: updatedAction.personId,
        actionType: updatedAction.type,
        subject: updatedAction.subject
      });
    }

    // Update company's lastAction fields if action is completed AND is a meaningful action
    if (updatedAction.companyId && updatedAction.status === 'COMPLETED' && isMeaningfulAction(updatedAction.type)) {
      try {
        await prisma.companies.update({
          where: { id: updatedAction.companyId },
          data: {
            lastAction: updatedAction.subject,
            lastActionDate: updatedAction.completedAt || updatedAction.updatedAt,
            actionStatus: updatedAction.status
          }
        });
        console.log('✅ [ACTIONS PATCH] Updated company lastAction fields for engagement action:', {
          companyId: updatedAction.companyId,
          actionType: updatedAction.type,
          lastAction: updatedAction.subject,
          lastActionDate: updatedAction.completedAt || updatedAction.updatedAt
        });
      } catch (error) {
        console.error('❌ [ACTIONS PATCH] Failed to update company lastAction fields:', error);
      }
    } else if (updatedAction.companyId && updatedAction.status === 'COMPLETED' && !isMeaningfulAction(updatedAction.type)) {
      console.log('⏭️ [ACTIONS PATCH] Skipping lastAction update for system action:', {
        companyId: updatedAction.companyId,
        actionType: updatedAction.type,
        subject: updatedAction.subject
      });
    }

    // 🚀 GENERATE NEXT ACTIONS: Update next actions for person and company
    try {
      const nextActionService = new IntelligentNextActionService({
        workspaceId: authUser.workspaceId,
        userId: authUser.id
      });
      
      await nextActionService.updateNextActionOnNewAction(updatedAction);
      console.log('✅ [ACTIONS PATCH] Updated next actions for person and company');
    } catch (error) {
      console.error('⚠️ [ACTIONS PATCH] Failed to update next actions:', error);
      // Don't fail the main update if next action generation fails
    }

    return NextResponse.json({
      success: true,
      data: updatedAction,
      meta: {
        message: 'Action updated successfully',
      },
    });

  } catch (error) {
    console.error('Error updating action:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update action' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/actions/[id] - Delete an action
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'soft'; // Default to soft delete

    // Check if action exists
    const existingAction = await prisma.actions.findUnique({
      where: { 
        id,
        deletedAt: null // Only delete non-deleted records
      },
    });

    if (!existingAction) {
      return NextResponse.json(
        { success: false, error: 'Action not found' },
        { status: 404 }
      );
    }

    if (mode === 'hard') {
      // Hard delete - permanently remove from database
      await prisma.actions.delete({
        where: { id },
      });
    } else {
      // Soft delete - set deletedAt timestamp
      await prisma.actions.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: null,
      meta: {
        message: `Action ${mode === 'hard' ? 'permanently deleted' : 'deleted'} successfully`,
        mode,
      },
    });

  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete action' },
      { status: 500 }
    );
  }
}
