import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
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
    
    console.log(`🏢 [COMPANY BY NAME API] Loading company: ${name} in workspace: ${workspaceId}`);
    
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
        city: true,
        state: true,
        country: true,
        address: true,
        description: true,
        customFields: true,
        updatedAt: true,
        rank: true,
        ownerId: true,
        lastAction: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true,
        actionStatus: true,
        // CoreSignal Enrichment Fields - Basic Information
        legalName: true,
        tradingName: true,
        localName: true,
        email: true,
        phone: true,
        fax: true,
        postalCode: true,
        // CoreSignal Enrichment Fields - Business Information
        sector: true,
        employeeCount: true,
        foundedYear: true,
        currency: true,
        // CoreSignal Enrichment Fields - Intelligence Overview
        linkedinUrl: true,
        linkedinFollowers: true,
        activeJobPostings: true,
        // CoreSignal Enrichment Fields - Industry Classification
        naicsCodes: true,
        sicCodes: true,
        // CoreSignal Enrichment Fields - Social Media
        facebookUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        youtubeUrl: true,
        githubUrl: true,
        // CoreSignal Enrichment Fields - Business Intelligence
        technologiesUsed: true,
        competitors: true,
        tags: true,
        // CoreSignal Enrichment Fields - Company Status
        isPublic: true,
        stockSymbol: true,
        logoUrl: true,
        // CoreSignal Enrichment Fields - Domain and Website
        domain: true,
        // CoreSignal Enrichment Fields - Headquarters Location
        hqLocation: true,
        hqFullAddress: true,
        hqCity: true,
        hqState: true,
        hqStreet: true,
        hqZipcode: true,
        // CoreSignal Enrichment Fields - Social Media Followers
        twitterFollowers: true,
        owlerFollowers: true,
        // CoreSignal Enrichment Fields - Company Updates and Activity
        companyUpdates: true,
        numTechnologiesUsed: true,
        // CoreSignal Enrichment Fields - Enhanced Descriptions
        descriptionEnriched: true,
        descriptionMetadataRaw: true,
        // CoreSignal Enrichment Fields - Regional Information
        hqRegion: true,
        hqCountryIso2: true,
        hqCountryIso3: true
      }
    });
    
    if (!company) {
      console.log(`❌ [COMPANY BY NAME API] Company not found: ${name}`);
      return createErrorResponse(
        'Company not found',
        'COMPANY_NOT_FOUND',
        404
      );
    }
    
    console.log(`✅ [COMPANY BY NAME API] Company loaded: ${company.name}`);
    console.log(`📊 [COMPANY BY NAME API] Enriched data:`, {
      linkedinFollowers: company.linkedinFollowers,
      technologiesUsed: company.technologiesUsed?.length || 0,
      isPublic: company.isPublic,
      stockSymbol: company.stockSymbol,
      employeeCount: company.employeeCount
    });
    
    return createSuccessResponse(company, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });
    
  } catch (error) {
    console.error('❌ [COMPANY BY NAME API] Error loading company:', error);
    return createErrorResponse(
      'Failed to load company',
      'COMPANY_LOAD_ERROR',
      500
    );
  }}
