import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { OpportunityStatusService } from '@/platform/services/OpportunityStatusService';

// Vercel runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Individual Opportunity CRUD API v1
 * GET /api/v1/opportunities/[id] - Get a specific opportunity
 * PATCH /api/v1/opportunities/[id] - Partially update an opportunity
 * DELETE /api/v1/opportunities/[id] - Delete an opportunity (soft delete + revert company/people)
 */

// GET /api/v1/opportunities/[id] - Get a specific opportunity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    const { context, response } = authResult;

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Validate prisma client is available
    if (!prisma || !prisma.companies) {
      console.error('[OPPORTUNITIES API] Prisma client not initialized');
      return createErrorResponse(
        'Database connection error',
        'DATABASE_ERROR',
        500
      );
    }

    // 🚀 STREAMLINED SCHEMA: Opportunities are companies with OPPORTUNITY status
    // Check if opportunities model exists (regular schema) or use companies (streamlined schema)
    const hasOpportunitiesModel = prisma.opportunities !== undefined;
    
    let opportunity: any;
    
    if (hasOpportunitiesModel) {
      // Regular schema: Query opportunities table
      opportunity = await prisma.opportunities.findFirst({
        where: {
          id,
          workspaceId: context.workspaceId,
          deletedAt: null,
          OR: [
            { ownerId: context.userId },
            { ownerId: null }
          ]
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              size: true,
              revenue: true,
              description: true,
              descriptionEnriched: true,
              status: true,
              lastAction: true,
              lastActionDate: true,
              nextAction: true,
              nextActionDate: true
            }
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } else {
      // Streamlined schema: Query companies table with OPPORTUNITY status
      const company = await prisma.companies.findFirst({
        where: {
          id,
          workspaceId: context.workspaceId,
          deletedAt: null,
          status: 'OPPORTUNITY',
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
          ]
        },
        include: {
          customFields: true, // Include customFields for AI context (intelligence data)
          mainSeller: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      if (company) {
        // Transform company to opportunity format for consistent API response
        opportunity = {
          id: company.id,
          name: company.name,
          description: company.description,
          amount: company.opportunityAmount,
          stage: company.opportunityStage || 'Discovery',
          probability: company.opportunityProbability || 0.1,
          expectedCloseDate: company.expectedCloseDate,
          actualCloseDate: company.actualCloseDate,
          ownerId: company.mainSellerId,
          workspaceId: company.workspaceId,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          deletedAt: company.deletedAt,
          customFields: company.customFields, // Include customFields for AI context
          company: {
            id: company.id,
            name: company.name,
            industry: company.industry,
            size: company.size,
            revenue: company.revenue,
            description: company.description,
            descriptionEnriched: company.descriptionEnriched,
            status: company.status,
            lastAction: company.lastAction,
            lastActionDate: company.lastActionDate,
            nextAction: company.nextAction,
            nextActionDate: company.nextActionDate
          },
          owner: company.mainSeller
        };
      }
    }

    if (!opportunity) {
      return createErrorResponse('Opportunity not found', 'NOT_FOUND', 404);
    }

    // Validate company relation exists (only for regular schema)
    if (hasOpportunitiesModel && !opportunity.company) {
      console.error('[OPPORTUNITIES API] Opportunity missing company relation:', opportunity.id);
      return createErrorResponse(
        'Opportunity company data not found',
        'MISSING_COMPANY_DATA',
        500
      );
    }

    // Transform to match existing Opportunity interface
    // Include company as both string and object to support different UI expectations
    const companyObject = hasOpportunitiesModel ? {
      id: opportunity.company.id,
      name: opportunity.company.name,
      industry: opportunity.company.industry,
      size: opportunity.company.size,
      revenue: opportunity.company.revenue,
      description: opportunity.company.description,
      descriptionEnriched: opportunity.company.descriptionEnriched,
      status: opportunity.company.status,
      lastAction: opportunity.company.lastAction,
      lastActionDate: opportunity.company.lastActionDate,
      nextAction: opportunity.company.nextAction,
      nextActionDate: opportunity.company.nextActionDate
    } : {
      id: opportunity.company.id,
      name: opportunity.company.name,
      industry: opportunity.company.industry,
      size: opportunity.company.size,
      revenue: opportunity.company.revenue,
      description: opportunity.company.description,
      descriptionEnriched: opportunity.company.descriptionEnriched,
      status: opportunity.company.status,
      lastAction: opportunity.company.lastAction,
      lastActionDate: opportunity.company.lastActionDate,
      nextAction: opportunity.company.nextAction,
      nextActionDate: opportunity.company.nextActionDate
    };

    const transformed = {
      id: opportunity.id,
      name: opportunity.name,
      // Company as object (for full access to company data - UI handles both string and object formats)
      company: companyObject,
      account: { name: opportunity.company.name },
      status: opportunity.company.status || 'OPPORTUNITY',
      lastAction: opportunity.company.lastAction || '-',
      nextAction: opportunity.company.nextAction || '-',
      amount: opportunity.amount ? parseFloat(opportunity.amount.toString()) : 0,
      revenue: opportunity.amount ? parseFloat(opportunity.amount.toString()) : 0,
      stage: opportunity.stage,
      opportunityStage: opportunity.stage,
      companyId: hasOpportunitiesModel ? opportunity.companyId : opportunity.id,
      industry: opportunity.company.industry || undefined,
      size: opportunity.company.size || '-',
      lastActionDate: opportunity.company.lastActionDate,
      nextActionDate: opportunity.company.nextActionDate,
      assignedUserId: opportunity.ownerId,
      workspaceId: opportunity.workspaceId,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      description: opportunity.description || '',
      summary: opportunity.description || '',
      opportunityAmount: opportunity.amount ? parseFloat(opportunity.amount.toString()) : 0,
      opportunityProbability: opportunity.probability || 0,
      expectedCloseDate: opportunity.expectedCloseDate,
      customFields: opportunity.customFields || {} // Include actual customFields for AI context
    };

    return createSuccessResponse(transformed);
  } catch (error) {
    console.error('[OPPORTUNITIES API] Error fetching opportunity:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch opportunity',
      'FETCH_ERROR',
      500
    );
  }
}

// PATCH /api/v1/opportunities/[id] - Partially update an opportunity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    const { context, response } = authResult;

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // 🚀 STREAMLINED SCHEMA: Check which schema we're using
    const hasOpportunitiesModel = prisma.opportunities !== undefined;
    
    // Verify opportunity exists and user has access
    let existing: any;
    
    if (hasOpportunitiesModel) {
      existing = await prisma.opportunities.findFirst({
        where: {
          id,
          workspaceId: context.workspaceId,
          deletedAt: null,
          OR: [
            { ownerId: context.userId },
            { ownerId: null }
          ]
        }
      });
    } else {
      existing = await prisma.companies.findFirst({
        where: {
          id,
          workspaceId: context.workspaceId,
          deletedAt: null,
          status: 'OPPORTUNITY',
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
          ]
        }
      });
    }

    if (!existing) {
      return createErrorResponse('Opportunity not found', 'NOT_FOUND', 404);
    }

    const body = await request.json();
    const updateData: any = {};

    if (hasOpportunitiesModel) {
      // Regular schema: Update opportunities table
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      
      // Handle both UI field names (opportunityAmount) and database field names (amount)
      if (body.opportunityAmount !== undefined || body.amount !== undefined) {
        const value = body.opportunityAmount !== undefined ? body.opportunityAmount : body.amount;
        updateData.amount = value ? parseFloat(value.toString()) : null;
      }
      
      // Handle both UI field names (opportunityStage) and database field names (stage)
      if (body.opportunityStage !== undefined || body.stage !== undefined) {
        updateData.stage = body.opportunityStage !== undefined ? body.opportunityStage : body.stage;
      }
      
      // Handle both UI field names (opportunityProbability) and database field names (probability)
      // UI sends percentage (0-100), database stores decimal (0-1)
      if (body.opportunityProbability !== undefined || body.probability !== undefined) {
        const value = body.opportunityProbability !== undefined ? body.opportunityProbability : body.probability;
        // If value > 1, assume it's a percentage and convert to decimal
        updateData.probability = value > 1 ? parseFloat(value.toString()) / 100 : parseFloat(value.toString());
      }
      
      if (body.expectedCloseDate !== undefined) {
        updateData.expectedCloseDate = body.expectedCloseDate ? new Date(body.expectedCloseDate) : null;
      }
      if (body.actualCloseDate !== undefined) {
        updateData.actualCloseDate = body.actualCloseDate ? new Date(body.actualCloseDate) : null;
      }
      if (body.ownerId !== undefined) updateData.ownerId = body.ownerId;

      const updated = await prisma.opportunities.update({
        where: { id },
        data: updateData,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              size: true,
              revenue: true,
              description: true,
              descriptionEnriched: true,
              status: true
            }
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } else {
      // Streamlined schema: Update companies table with opportunity fields
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      
      // Map opportunity fields to company fields
      if (body.opportunityAmount !== undefined || body.amount !== undefined) {
        const value = body.opportunityAmount !== undefined ? body.opportunityAmount : body.amount;
        updateData.opportunityAmount = value ? parseFloat(value.toString()) : null;
      }
      
      if (body.opportunityStage !== undefined || body.stage !== undefined) {
        updateData.opportunityStage = body.opportunityStage !== undefined ? body.opportunityStage : body.stage;
      }
      
      if (body.opportunityProbability !== undefined || body.probability !== undefined) {
        const value = body.opportunityProbability !== undefined ? body.opportunityProbability : body.probability;
        // If value > 1, assume it's a percentage and convert to decimal
        updateData.opportunityProbability = value > 1 ? parseFloat(value.toString()) / 100 : parseFloat(value.toString());
      }
      
      if (body.expectedCloseDate !== undefined) {
        updateData.expectedCloseDate = body.expectedCloseDate ? new Date(body.expectedCloseDate) : null;
      }
      if (body.actualCloseDate !== undefined) {
        updateData.actualCloseDate = body.actualCloseDate ? new Date(body.actualCloseDate) : null;
      }
      if (body.ownerId !== undefined) updateData.mainSellerId = body.ownerId;

      const updated = await prisma.companies.update({
        where: { id },
        data: updateData,
        include: {
          mainSeller: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      // Transform to match opportunity format
      const updatedOpportunity = {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        amount: updated.opportunityAmount,
        stage: updated.opportunityStage,
        probability: updated.opportunityProbability,
        expectedCloseDate: updated.expectedCloseDate,
        actualCloseDate: updated.actualCloseDate,
        ownerId: updated.mainSellerId,
        company: {
          id: updated.id,
          name: updated.name,
          industry: updated.industry,
          size: updated.size,
          revenue: updated.revenue,
          description: updated.description,
          descriptionEnriched: updated.descriptionEnriched,
          status: updated.status
        },
        owner: updated.mainSeller
      };
      
      // Use transformed data for response
      const companyObject = {
        id: updatedOpportunity.company.id,
        name: updatedOpportunity.company.name,
        industry: updatedOpportunity.company.industry,
        size: updatedOpportunity.company.size,
        revenue: updatedOpportunity.company.revenue,
        description: updatedOpportunity.company.description,
        descriptionEnriched: updatedOpportunity.company.descriptionEnriched,
        status: updatedOpportunity.company.status
      };

      const transformed = {
        id: updatedOpportunity.id,
        name: updatedOpportunity.name,
        company: companyObject,
        account: { name: updatedOpportunity.company.name },
        status: 'OPPORTUNITY',
        amount: updatedOpportunity.amount ? parseFloat(updatedOpportunity.amount.toString()) : 0,
        stage: updatedOpportunity.stage,
        opportunityStage: updatedOpportunity.stage,
        companyId: updatedOpportunity.id,
        industry: updatedOpportunity.company.industry || undefined,
        size: updatedOpportunity.company.size || '-',
        assignedUserId: updatedOpportunity.ownerId,
        workspaceId: existing.workspaceId,
        createdAt: existing.createdAt,
        updatedAt: updated.updatedAt,
        description: updatedOpportunity.description || '',
        opportunityAmount: updatedOpportunity.amount ? parseFloat(updatedOpportunity.amount.toString()) : 0,
        opportunityProbability: updatedOpportunity.probability || 0,
        expectedCloseDate: updatedOpportunity.expectedCloseDate,
        customFields: updatedOpportunity.customFields || {} // Include actual customFields for AI context
      };

      return createSuccessResponse(transformed);
    }

    // Regular schema: Transform response - include company as object for full data access
    const companyObject = {
      id: updated.company.id,
      name: updated.company.name,
      industry: updated.company.industry,
      size: updated.company.size,
      revenue: updated.company.revenue,
      description: updated.company.description,
      descriptionEnriched: updated.company.descriptionEnriched,
      status: updated.company.status
    };

    const transformed = {
      id: updated.id,
      name: updated.name,
      // Company as object (for full access to company data - UI handles both string and object formats)
      company: companyObject,
      account: { name: updated.company.name },
      status: 'OPPORTUNITY',
      amount: updated.amount ? parseFloat(updated.amount.toString()) : 0,
      stage: updated.stage,
      opportunityStage: updated.stage,
      companyId: updated.companyId,
      industry: updated.company.industry || undefined,
      size: updated.company.size || '-',
      assignedUserId: updated.ownerId,
      workspaceId: updated.workspaceId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      description: updated.description || '',
      opportunityAmount: updated.amount ? parseFloat(updated.amount.toString()) : 0,
      opportunityProbability: updated.probability || 0,
      expectedCloseDate: updated.expectedCloseDate,
      customFields: updated.customFields || {} // Include actual customFields for AI context
    };

    return createSuccessResponse(transformed);
  } catch (error) {
    console.error('[OPPORTUNITIES API] Error updating opportunity:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update opportunity',
      'UPDATE_ERROR',
      500
    );
  }
}

// DELETE /api/v1/opportunities/[id] - Delete an opportunity (soft delete + revert company/people)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    const { context, response } = authResult;

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Get opportunity with company info
    const opportunity = await prisma.opportunities.findFirst({
      where: {
        id,
        workspaceId: context.workspaceId,
        deletedAt: null,
        OR: [
          { ownerId: context.userId },
          { ownerId: null }
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!opportunity) {
      return createErrorResponse('Opportunity not found', 'NOT_FOUND', 404);
    }

    // Soft delete the opportunity
    await prisma.opportunities.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Revert company and people to PROSPECT if no other opportunities exist
    await OpportunityStatusService.revertCompanyAndPeopleToProspect(id, context.workspaceId);

    return createSuccessResponse({ success: true, id });
  } catch (error) {
    console.error('[OPPORTUNITIES API] Error deleting opportunity:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to delete opportunity',
      'DELETE_ERROR',
      500
    );
  }
}

