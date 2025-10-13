import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse, logAndCreateErrorResponse } from '@/platform/services/secure-api-helper';
import { cache } from '@/platform/services/unified-cache';

/**
 * Opportunity CRUD API v1 - Individual Opportunity Operations
 * Note: Opportunities use the companies table as per user specification
 * GET /api/v1/opportunities/[id] - Get a specific opportunity
 * PUT /api/v1/opportunities/[id] - Update an opportunity (full replacement)
 * PATCH /api/v1/opportunities/[id] - Partially update an opportunity
 * DELETE /api/v1/opportunities/[id] - Delete an opportunity
 */

// GET /api/v1/opportunities/[id] - Get a specific opportunity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize user using unified auth system
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

    // Get opportunity (company) with full details
    const opportunity = await prisma.companies.findFirst({
      where: {
        id,
        workspaceId: context.workspaceId,
        deletedAt: null,
      },
      include: {
        mainSeller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
          },
        },
        people: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            subject: true,
            description: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
        },
        _count: {
          select: {
            people: true,
            actions: true,
          },
        },
      },
    });

    if (!opportunity) {
      return createErrorResponse('Opportunity not found', 'OPPORTUNITY_NOT_FOUND', 404);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...opportunity,
        fullName: opportunity.name, // Use company name as fullName for consistency
        mainSellerId: opportunity.mainSellerId,
        mainSeller: opportunity.mainSeller 
          ? (opportunity.mainSeller.id === context.userId
              ? 'Me'
              : opportunity.mainSeller.firstName && opportunity.mainSeller.lastName 
                ? `${opportunity.mainSeller.firstName} ${opportunity.mainSeller.lastName}`.trim()                                                                    
                : opportunity.mainSeller.name || opportunity.mainSeller.email || '-')
          : '-',
        mainSellerData: opportunity.mainSeller
      },
    });

  } catch (error) {
    console.error('❌ [OPPORTUNITIES API] Get error:', error);
    return logAndCreateErrorResponse(
      error,
      'OPPORTUNITIES_GET_ERROR',
      500
    );
  }
}

// PUT /api/v1/opportunities/[id] - Update an opportunity (full replacement)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize user using unified auth system
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
    const body = await request.json();

    // Check if opportunity exists
    const existingOpportunity = await prisma.companies.findFirst({
      where: {
        id,
        workspaceId: context.workspaceId,
        deletedAt: null,
      },
    });

    if (!existingOpportunity) {
      return createErrorResponse('Opportunity not found', 'OPPORTUNITY_NOT_FOUND', 404);
    }

    // Update opportunity (company) with full data
    const updatedOpportunity = await prisma.companies.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      include: {
        mainSeller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            people: true,
            actions: true,
          },
        },
      },
    });

    // 🚀 CACHE: Invalidate opportunities cache
    try {
      await cache.invalidateByPattern(`opportunities-${context.workspaceId}-${context.userId}-*`);
      console.log(`🗑️ [OPPORTUNITIES API] Invalidated cache after update`);
    } catch (error) {
      console.warn('⚠️ [OPPORTUNITIES API] Cache invalidation failed:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedOpportunity,
        fullName: updatedOpportunity.name, // Use company name as fullName for consistency
        mainSellerId: updatedOpportunity.mainSellerId,
        mainSeller: updatedOpportunity.mainSeller 
          ? (updatedOpportunity.mainSeller.id === context.userId
              ? 'Me'
              : updatedOpportunity.mainSeller.firstName && updatedOpportunity.mainSeller.lastName 
                ? `${updatedOpportunity.mainSeller.firstName} ${updatedOpportunity.mainSeller.lastName}`.trim()                                                                    
                : updatedOpportunity.mainSeller.name || updatedOpportunity.mainSeller.email || '-')
          : '-',
        mainSellerData: updatedOpportunity.mainSeller
      },
      meta: {
        message: 'Opportunity updated successfully',
      },
    });

  } catch (error) {
    console.error('❌ [OPPORTUNITIES API] Update error:', error);
    return logAndCreateErrorResponse(
      error,
      'OPPORTUNITIES_UPDATE_ERROR',
      500
    );
  }
}

// PATCH /api/v1/opportunities/[id] - Partially update an opportunity
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize user using unified auth system
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
    const body = await request.json();

    // Check if opportunity exists
    const existingOpportunity = await prisma.companies.findFirst({
      where: {
        id,
        workspaceId: context.workspaceId,
        deletedAt: null,
      },
    });

    if (!existingOpportunity) {
      return createErrorResponse('Opportunity not found', 'OPPORTUNITY_NOT_FOUND', 404);
    }

    // Update opportunity (company) with partial data
    const updatedOpportunity = await prisma.companies.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      include: {
        mainSeller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            people: true,
            actions: true,
          },
        },
      },
    });

    // 🚀 CACHE: Invalidate opportunities cache
    try {
      await cache.invalidateByPattern(`opportunities-${context.workspaceId}-${context.userId}-*`);
      console.log(`🗑️ [OPPORTUNITIES API] Invalidated cache after patch`);
    } catch (error) {
      console.warn('⚠️ [OPPORTUNITIES API] Cache invalidation failed:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedOpportunity,
        fullName: updatedOpportunity.name, // Use company name as fullName for consistency
        mainSellerId: updatedOpportunity.mainSellerId,
        mainSeller: updatedOpportunity.mainSeller 
          ? (updatedOpportunity.mainSeller.id === context.userId
              ? 'Me'
              : updatedOpportunity.mainSeller.firstName && updatedOpportunity.mainSeller.lastName 
                ? `${updatedOpportunity.mainSeller.firstName} ${updatedOpportunity.mainSeller.lastName}`.trim()                                                                    
                : updatedOpportunity.mainSeller.name || updatedOpportunity.mainSeller.email || '-')
          : '-',
        mainSellerData: updatedOpportunity.mainSeller
      },
      meta: {
        message: 'Opportunity updated successfully',
      },
    });

  } catch (error) {
    console.error('❌ [OPPORTUNITIES API] Patch error:', error);
    return logAndCreateErrorResponse(
      error,
      'OPPORTUNITIES_PATCH_ERROR',
      500
    );
  }
}

// DELETE /api/v1/opportunities/[id] - Delete an opportunity (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize user using unified auth system
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

    // Check if opportunity exists
    const existingOpportunity = await prisma.companies.findFirst({
      where: {
        id,
        workspaceId: context.workspaceId,
        deletedAt: null,
      },
    });

    if (!existingOpportunity) {
      return createErrorResponse('Opportunity not found', 'OPPORTUNITY_NOT_FOUND', 404);
    }

    // Soft delete the opportunity (company)
    await prisma.companies.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 🚀 CACHE: Invalidate opportunities cache
    try {
      await cache.invalidateByPattern(`opportunities-${context.workspaceId}-${context.userId}-*`);
      console.log(`🗑️ [OPPORTUNITIES API] Invalidated cache after delete`);
    } catch (error) {
      console.warn('⚠️ [OPPORTUNITIES API] Cache invalidation failed:', error);
    }

    return NextResponse.json({
      success: true,
      data: { id },
      meta: {
        message: 'Opportunity deleted successfully',
      },
    });

  } catch (error) {
    console.error('❌ [OPPORTUNITIES API] Delete error:', error);
    return logAndCreateErrorResponse(
      error,
      'OPPORTUNITIES_DELETE_ERROR',
      500
    );
  }
}
