import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = await params;
    
    // 1. Authenticate and authorize user
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

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;
    
    console.log(`🏢 [SBI COMPANY BY NAME API] Loading company: ${name} in workspace: ${workspaceId}`);
    
    // Find the company by name (case insensitive)
    const company = await prisma.companies.findFirst({
      where: {
        workspaceId: workspaceId,
        name: {
          contains: decodeURIComponent(name),
          mode: 'insensitive'
        },
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        industry: true,
        size: true,
        revenue: true,
        website: true,
        domain: true,
        location: true,
        description: true,
        status: true,
        parentCompany: true,
        acquisitionDate: true,
        confidence: true,
        sources: true,
        lastVerified: true,
        createdAt: true,
        updatedAt: true,
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            jobTitle: true,
            email: true,
            phone: true,
            linkedin: true,
            role: true,
            confidence: true,
            sources: true,
            lastVerified: true
          }
        },
        opportunities: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            confidence: true,
            source: true,
            createdAt: true
          }
        }
      }
    });

    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }

    console.log(`✅ [SBI COMPANY BY NAME API] Found company: ${company.name} with ${company.people.length} people and ${company.opportunities.length} opportunities`);

    return createSuccessResponse(company, {
      message: 'Company loaded successfully',
      companyId: company.id,
      peopleCount: company.people.length,
      opportunitiesCount: company.opportunities.length
    });

  } catch (error) {
    console.error('❌ [SBI COMPANY BY NAME API] Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'INTERNAL_ERROR',
      500
    );
  }
}
