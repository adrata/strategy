import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
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

    console.log('🎯 Starting 5Bars Buyer Group Analysis...');
    
    // Get the 5Bars company data
    const company = await prisma.companies.findUnique({
      where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
      include: {
        people: true
      }
    });

    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }

    console.log(`📋 Company: ${company.name}`);
    console.log(`👥 Existing people: ${company.people.length}`);

    // Import and run the analysis script
    const FiveBarsBuyerGroupAnalyzer = require('../../../../scripts/analyze-5bars-buyer-group-comprehensive.js');
    const analyzer = new FiveBarsBuyerGroupAnalyzer();
    
    // Run the analysis
    const result = await analyzer.execute();
    
    const processingTime = Date.now() - startTime;

    return createSuccessResponse(result, {
      processingTime,
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error: any) {
    console.error('❌ [5BARS BUYER GROUP API] Error during analysis:', error);
    return createErrorResponse(
      'Failed to analyze 5Bars buyer group',
      'ANALYZE_5BARS_ERROR',
      500
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Get current 5Bars company data
    const company = await prisma.companies.findUnique({
      where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
      include: {
        people: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            email: true,
            customFields: true
          }
        }
      }
    });

    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }

    // Analyze existing buyer group data
    const customFields = company.customFields as Record<string, any> || {};
    const buyerGroupAnalysis = customFields['buyerGroupAnalysis'] || null;
    const coresignalData = customFields['coresignalData'] || null;

    // Count people by buyer group role
    const peopleByRole = {
      decisionMakers: 0,
      champions: 0,
      influencers: 0,
      stakeholders: 0,
      unknown: 0
    };

    company.people.forEach(person => {
      const personCustomFields = person.customFields as Record<string, any> || {};
      const role = personCustomFields['buyerGroupRole'];
      if (role === 'Decision Maker') peopleByRole.decisionMakers++;
      else if (role === 'Champion') peopleByRole.champions++;
      else if (role === 'Influencer') peopleByRole.influencers++;
      else if (role === 'Stakeholder') peopleByRole.stakeholders++;
      else peopleByRole.unknown++;
    });

    const data = {
      company: {
        id: company.id,
        name: company.name,
        peopleCount: company.people.length
      },
      buyerGroupAnalysis,
      coresignalData,
      peopleByRole
    };

    return createSuccessResponse(data, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error: any) {
    console.error('❌ [5BARS BUYER GROUP API] Error fetching data:', error);
    return createErrorResponse(
      'Failed to fetch 5Bars buyer group data',
      'FETCH_5BARS_DATA_ERROR',
      500
    );
  }
}
