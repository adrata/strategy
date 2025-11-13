import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getV1AuthUser } from '../../auth';
import { mergeCoreCompanyWithWorkspace } from '@/platform/services/core-entity-service';

// Vercel runtime configuration for proper HTTP method handling
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Clean and normalize website URL
 * Handles various input formats: example.com, www.example.com, https://example.com, https//:example.com, etc.
 */
function cleanWebsiteUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let cleaned = url.trim();
  
  // Remove common typos in protocol
  cleaned = cleaned.replace(/^https?\/\/?:?/i, '');
  
  // Remove leading www. if present
  cleaned = cleaned.replace(/^www\./i, '');
  
  // If no protocol exists, prepend https://
  if (!cleaned.match(/^https?:\/\//i)) {
    cleaned = `https://${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Individual Company CRUD API v1
 * GET /api/v1/companies/[id] - Get a specific company
 * PUT /api/v1/companies/[id] - Update a company (full replacement)
 * PATCH /api/v1/companies/[id] - Partially update a company
 * DELETE /api/v1/companies/[id] - Delete a company (soft delete by default, hard delete with ?mode=hard)
 */

// GET /api/v1/companies/[id] - Get a specific company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const company = await prisma.companies.findFirst({
      where: { 
        id,
        deletedAt: null, // Only show non-deleted records
        workspaceId: authUser.workspaceId, // Ensure company belongs to user's workspace
      },
      include: {
        // Relations
        coreCompany: true,
        mainSeller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        people: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
            status: true,
          },
          where: {
            deletedAt: null // Only show non-deleted people
          },
          take: 10,
        },
        actions: {
          select: {
            id: true,
            type: true,
            subject: true,
            status: true,
            priority: true,
            scheduledAt: true,
            completedAt: true,
          },
          where: {
            deletedAt: null // Only show non-deleted actions
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            },
            actions: {
              where: {
                deletedAt: null
              }
            },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Merge core company data with workspace data
    const mergedCompany = mergeCoreCompanyWithWorkspace(company, company.coreCompany || null);

    // IMPORTANT: Explicitly include all editable fields to ensure they're always in response (even if null)
    // This ensures fields are present on initial load and prevents disappearing
    const responseData = {
      ...mergedCompany,
      // Basic Information
      name: mergedCompany.name ?? null,
      legalName: mergedCompany.legalName ?? null,
      tradingName: mergedCompany.tradingName ?? null,
      description: mergedCompany.description ?? null,
      descriptionEnriched: mergedCompany.descriptionEnriched ?? null,
      website: mergedCompany.website ?? null,
      // Contact Information
      email: mergedCompany.email ?? null,
      phone: mergedCompany.phone ?? null,
      fax: mergedCompany.fax ?? null,
      linkedinUrl: mergedCompany.linkedinUrl ?? null,
      linkedinFollowers: mergedCompany.linkedinFollowers ?? null,
      // Location
      address: mergedCompany.address ?? null,
      city: mergedCompany.city ?? null,
      state: mergedCompany.state ?? null,
      country: mergedCompany.country ?? null,
      postalCode: mergedCompany.postalCode ?? null,
      hqLocation: mergedCompany.hqLocation ?? null,
      hqFullAddress: mergedCompany.hqFullAddress ?? null,
      hqCity: mergedCompany.hqCity ?? null,
      hqState: mergedCompany.hqState ?? null,
      // Business Information
      industry: mergedCompany.industry ?? null,
      sector: mergedCompany.sector ?? null,
      employeeCount: mergedCompany.employeeCount ?? null,
      revenue: mergedCompany.revenue ?? null,
      foundedYear: mergedCompany.foundedYear ?? null,
      // Engagement
      lastAction: mergedCompany.lastAction ?? null,
      nextAction: mergedCompany.nextAction ?? null,
      // Notes
      notes: mergedCompany.notes ?? null
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error('❌ [COMPANIES API] Error fetching company:', {
      companyId: id,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/companies/[id] - Update a company (full replacement)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Clean and validate website URL only if it's being explicitly updated to a non-empty value
    if (body.website !== undefined && typeof body.website === 'string' && body.website.trim().length > 0) {
      const cleanedWebsite = cleanWebsiteUrl(body.website);
      try {
        new URL(cleanedWebsite);
        // Update the body with the cleaned URL
        body.website = cleanedWebsite;
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid website URL format' },
          { status: 400 }
        );
      }
    }

    // Check if company exists and belongs to user's workspace
    const existingCompany = await prisma.companies.findUnique({
      where: { 
        id,
        deletedAt: null, // Only update non-deleted records
        workspaceId: authUser.workspaceId // Ensure company belongs to user's workspace
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Update company (full replacement)
    const updatedCompany = await prisma.companies.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      include: {
        mainSeller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            },
            actions: {
              where: {
                deletedAt: null
              }
            },
          },
        },
      },
    });

    // Auto-trigger enrichment if website or linkedinUrl was updated
    const enrichmentFields = ['website', 'linkedinUrl'];
    const shouldTriggerEnrichment = enrichmentFields.some(field => 
      body[field] !== undefined && body[field] !== existingCompany[field]
    );

    if (shouldTriggerEnrichment) {
      setImmediate(async () => {
        try {
          const { EnrichmentService } = await import('@/platform/services/enrichment-service');
          const authToken = request.headers.get('Authorization') || undefined;
          EnrichmentService.triggerEnrichmentAsync(
            'company',
            id,
            'update',
            authUser.workspaceId,
            authToken || undefined,
            enrichmentFields.filter(field => body[field] !== undefined)
          );
          console.log('🤖 [COMPANIES API] Auto-triggered enrichment check for updated company', id);
        } catch (error) {
          console.error('⚠️ [COMPANIES API] Failed to trigger enrichment:', error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedCompany,
      meta: {
        message: 'Company updated successfully',
      },
    });

  } catch (error) {
    console.error('❌ [COMPANIES API] Error updating company:', {
      companyId: id,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      // Include Prisma-specific error details if available
      prismaCode: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
      prismaMessage: error && typeof error === 'object' && 'message' in error ? error.message : undefined,
      prismaMeta: error && typeof error === 'object' && 'meta' in error ? error.meta : undefined
    });
    
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Company with this information already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/companies/[id] - Partially update a company
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  let body: any;
  let updateData: any;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    body = await request.json();
    
    console.log(`🔍 [COMPANY API AUDIT] PATCH request received:`, {
      companyId: id,
      requestBody: body,
      authUser: authUser.id
    });

    // Clean and validate website URL only if it's being explicitly updated to a non-empty value
    if (body.website !== undefined && typeof body.website === 'string' && body.website.trim().length > 0) {
      const cleanedWebsite = cleanWebsiteUrl(body.website);
      try {
        new URL(cleanedWebsite);
        // Update the body with the cleaned URL
        body.website = cleanedWebsite;
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid website URL format' },
          { status: 400 }
        );
      }
    }

    // Check if company exists and belongs to user's workspace
    const existingCompany = await prisma.companies.findUnique({
      where: { 
        id,
        deletedAt: null, // Only update non-deleted records
        workspaceId: authUser.workspaceId // Ensure company belongs to user's workspace
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Whitelist of allowed fields for companies updates
    const ALLOWED_COMPANY_FIELDS = [
      'name', 'legalName', 'tradingName', 'localName', 'description', 'website', 
      'email', 'phone', 'fax', 'address', 'city', 'state', 'country', 'postalCode', 
      'industry', 'sector', 'size', 'revenue', 'currency', 'employeeCount', 
      'foundedYear', 'registrationNumber', 'taxId', 'vatNumber', 'domain', 
      'logoUrl', 'status', 'priority', 'tags', 'customFields', 'notes', 
      'lastAction', 'lastActionDate', 'nextAction', 'nextActionDate', 
      'nextActionReasoning', 'nextActionPriority', 'nextActionType',
      'actionStatus', 'globalRank', 'entityId', 'mainSellerId', 'actualCloseDate',
      'expectedCloseDate', 'opportunityAmount', 'opportunityProbability', 
      'opportunityStage', 'acquisitionDate', 'competitors',
      // Intelligence fields
      'businessChallenges', 'businessPriorities', 'competitiveAdvantages', 
      'growthOpportunities', 'strategicInitiatives', 'successMetrics', 
      'marketThreats', 'keyInfluencers', 'decisionTimeline', 'marketPosition', 
      'digitalMaturity', 'techStack',
      // Social media fields
      'linkedinUrl', 'linkedinFollowers', 'twitterUrl', 'twitterFollowers', 
      'facebookUrl', 'instagramUrl', 'youtubeUrl', 'githubUrl',
      // HQ Location fields
      'hqLocation', 'hqFullAddress', 'hqCity', 'hqState', 'hqStreet', 
      'hqZipcode', 'hqRegion', 'hqCountryIso2', 'hqCountryIso3',
      // Business fields
      'lastFundingAmount', 'lastFundingDate', 'stockSymbol', 'isPublic', 
      'naicsCodes', 'sicCodes',
      // Tech fields
      'activeJobPostings', 'numTechnologiesUsed', 'technologiesUsed',
      // SBI fields
      'confidence', 'sources', 'lastVerified', 'parentCompanyName', 'parentCompanyDomain',
      // Additional fields found in UI
      'companySize', // Used in UniversalRecordTemplate.tsx Overview tab
      'targetIndustry', // Used in UniversalCompanyTab.tsx
      'accountValue', 'growthRate', 'expansionPotential', // Used in UniversalBusinessTab.tsx
      'healthScore', 'roiAchieved', 'timeToValue', // Used in UniversalSuccessTab.tsx
      'performanceScore', 'partnerRevenue', 'revenueGrowth', 'dealsClosed', // Used in UniversalPerformanceTab.tsx
      'activeOpportunities', 'jointRevenue', 'activeProjects', // Used in UniversalCollaborationTab.tsx
      // Additional fields found in tabs
      'hqRegion', // Used in UniversalCompanyTab.tsx
    ];

    // Filter body to only allowed fields FIRST
    const requestedFields = Object.keys(body);
    const allowedFields = requestedFields.filter(key => ALLOWED_COMPANY_FIELDS.includes(key));
    const filteredFields = requestedFields.filter(key => !ALLOWED_COMPANY_FIELDS.includes(key));
    
    updateData = allowedFields.reduce((obj, key) => ({ ...obj, [key]: body[key] }), {});
    
    // Log field filtering for debugging
    if (filteredFields.length > 0) {
      console.warn('⚠️ [COMPANY API] Fields filtered out (not in whitelist):', {
        filteredFields,
        requestedFields,
        allowedFields,
        companyId: id
      });
    }
    
    console.log('🔍 [COMPANY API] Field processing:', {
      requestedFields,
      allowedFields,
      filteredFields,
      updateDataKeys: Object.keys(updateData),
      companyId: id
    });

    // Sanitize date fields - convert "-" or empty strings to null
    const DATE_FIELDS = [
      'lastFundingDate',
      'acquisitionDate', 
      'lastVerified',
      'foundedYear',
      'lastActionDate',
      'nextActionDate',
      'actualCloseDate',
      'expectedCloseDate'
    ];

    for (const field of DATE_FIELDS) {
      if (field in updateData) {
        const value = updateData[field];
        // Convert "-", empty string, or invalid dates to null
        if (value === "-" || value === "" || value === undefined) {
          updateData[field] = null;
          console.log(`🔄 [DATE SANITIZATION] Converted ${field} from "${value}" to null`);
        } else if (typeof value === 'string') {
          // Validate it's a proper ISO date
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            updateData[field] = null;
            console.log(`🔄 [DATE SANITIZATION] Converted invalid date ${field} from "${value}" to null`);
          }
        }
      }
    }

    // Sync regular address fields to HQ fields for consistency (1:1 mapping)
    // This ensures both field sets stay in sync and eliminates confusion
    if ('address' in updateData && updateData.address !== undefined) {
      updateData.hqStreet = updateData.address;
      console.log(`🔄 [FIELD SYNC] Synced address -> hqStreet: ${updateData.address}`);
    }
    if ('city' in updateData && updateData.city !== undefined) {
      updateData.hqCity = updateData.city;
      console.log(`🔄 [FIELD SYNC] Synced city -> hqCity: ${updateData.city}`);
    }
    if ('state' in updateData && updateData.state !== undefined) {
      updateData.hqState = updateData.state;
      console.log(`🔄 [FIELD SYNC] Synced state -> hqState: ${updateData.state}`);
    }
    if ('postalCode' in updateData && updateData.postalCode !== undefined) {
      updateData.hqZipcode = updateData.postalCode;
      console.log(`🔄 [FIELD SYNC] Synced postalCode -> hqZipcode: ${updateData.postalCode}`);
    }
    
    // Also sync HQ fields to regular fields for backward compatibility
    if ('hqStreet' in updateData && updateData.hqStreet !== undefined && !('address' in updateData)) {
      updateData.address = updateData.hqStreet;
      console.log(`🔄 [FIELD SYNC] Synced hqStreet -> address: ${updateData.hqStreet}`);
    }
    if ('hqCity' in updateData && updateData.hqCity !== undefined && !('city' in updateData)) {
      updateData.city = updateData.hqCity;
      console.log(`🔄 [FIELD SYNC] Synced hqCity -> city: ${updateData.hqCity}`);
    }
    if ('hqState' in updateData && updateData.hqState !== undefined && !('state' in updateData)) {
      updateData.state = updateData.hqState;
      console.log(`🔄 [FIELD SYNC] Synced hqState -> state: ${updateData.hqState}`);
    }
    if ('hqZipcode' in updateData && updateData.hqZipcode !== undefined && !('postalCode' in updateData)) {
      updateData.postalCode = updateData.hqZipcode;
      console.log(`🔄 [FIELD SYNC] Synced hqZipcode -> postalCode: ${updateData.hqZipcode}`);
    }

    console.log(`🔍 [COMPANY API AUDIT] Database update preparation:`, {
      companyId: id,
      updateData,
      allowedFields: ALLOWED_COMPANY_FIELDS,
      filteredFields: Object.keys(updateData),
      originalRequestBody: body,
      fieldsInRequest: Object.keys(body),
      fieldsFilteredOut: Object.keys(body).filter(key => !ALLOWED_COMPANY_FIELDS.includes(key)),
      fieldTypes: Object.keys(updateData).reduce((acc, key) => {
        acc[key] = typeof updateData[key];
        return acc;
      }, {} as Record<string, string>)
    });

    // Check for empty updates
    if (Object.keys(updateData).length === 0) {
      console.warn('⚠️ [COMPANY API] No fields to update - updateData is empty');
      return NextResponse.json({
        success: false,
        error: 'No valid fields to update',
        details: 'All fields were filtered out or empty'
      }, { status: 400 });
    }

    // Update company (partial update)
    const updatedCompany = await prisma.companies.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        mainSeller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            },
            actions: {
              where: {
                deletedAt: null
              }
            },
          },
        },
      },
    });

    // Log what actually got updated in the database
    console.log(`✅ [COMPANY API AUDIT] Database update completed:`, {
      companyId: id,
      fieldsUpdated: Object.keys(updateData),
      updatedValues: updateData,
      actualLegalName: updatedCompany.legalName,
      actualDescription: updatedCompany.description,
      actualPhone: updatedCompany.phone,
      prismaResult: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        website: updatedCompany.website,
        industry: updatedCompany.industry,
        status: updatedCompany.status,
        priority: updatedCompany.priority,
        updatedAt: updatedCompany.updatedAt
      },
      changes: Object.keys(updateData).reduce((acc, key) => {
        const oldValue = (existingCompany as any)[key];
        const newValue = (updatedCompany as any)[key];
        if (oldValue !== newValue) {
          acc[key] = { old: oldValue, new: newValue };
        }
        return acc;
      }, {} as Record<string, { old: any; new: any }>)
    });

    // Log data update as an action
    // Skip activity log for notes-only updates to prevent log spam from autosave
    try {
      const updatedFields = Object.keys(updateData).filter(key => 
        updateData[key] !== existingCompany[key]
      );
      
      // Only create activity log if there are updated fields AND it's not just a notes-only update
      const isNotesOnlyUpdate = updatedFields.length === 1 && updatedFields[0] === 'notes';
      
      if (updatedFields.length > 0 && !isNotesOnlyUpdate) {
        await prisma.actions.create({
          data: {
            companyId: id,
            type: 'data_update',
            subject: `Updated ${updatedFields.join(', ')}`,
            description: `Company data fields updated by ${authUser.name || authUser.email}`,
            status: 'COMPLETED',
            completedAt: new Date(),
            workspaceId: existingCompany.workspaceId,
            userId: authUser.id
          }
        });
        
        console.log(`📝 [COMPANIES API] Logged data update action for company ${id}: ${updatedFields.join(', ')}`);
      } else if (isNotesOnlyUpdate) {
        console.log(`📝 [COMPANIES API] Skipping activity log for notes-only update (autosave) for company ${id}`);
      }
    } catch (actionError) {
      console.error('Failed to log company data update action:', actionError);
      // Don't fail the main update if action logging fails
    }

    // Auto-populate nextActionDate if it's null
    if (!updatedCompany.nextActionDate) {
      try {
        // Calculate nextActionDate based on rank or lastActionDate
        const lastActionDate = updatedCompany.lastActionDate || updatedCompany.createdAt;
        const rank = updatedCompany.globalRank || 1000; // Default rank if null
        
        // Calculate days to add based on rank (higher rank = more urgent = sooner)
        let daysToAdd = 7; // Default 1 week
        if (rank <= 10) daysToAdd = 1; // Top 10: tomorrow
        else if (rank <= 50) daysToAdd = 3; // Top 50: 3 days
        else if (rank <= 100) daysToAdd = 5; // Top 100: 5 days
        else if (rank <= 500) daysToAdd = 7; // Top 500: 1 week
        else daysToAdd = 14; // Others: 2 weeks
        
        const nextActionDate = new Date(lastActionDate);
        nextActionDate.setDate(nextActionDate.getDate() + daysToAdd);
        
        // Update the company with the calculated nextActionDate
        await prisma.companies.update({
          where: { id },
          data: { nextActionDate }
        });
        
        console.log(`✅ [COMPANY API] Auto-populated nextActionDate:`, {
          companyId: id,
          rank,
          daysToAdd,
          nextActionDate,
          lastActionDate
        });
      } catch (nextActionError) {
        console.error('⚠️ [COMPANY API] Failed to auto-populate nextActionDate:', nextActionError);
        // Don't fail the main update if nextActionDate calculation fails
      }
    }

    console.log(`🔍 [COMPANY API AUDIT] Database update completed:`, {
      companyId: id,
      updatedCompany,
      updateData,
      responseData: {
        success: true,
        data: updatedCompany,
        meta: {
          message: 'Company updated successfully',
        },
      }
    });

    // Auto-trigger enrichment if website or linkedinUrl was updated
    const enrichmentFields = ['website', 'linkedinUrl'];
    const changedEnrichmentFields = enrichmentFields.filter(field => 
      updateData[field] !== undefined && updateData[field] !== existingCompany[field]
    );

    if (changedEnrichmentFields.length > 0) {
      setImmediate(async () => {
        try {
          const { EnrichmentService } = await import('@/platform/services/enrichment-service');
          const authToken = request.headers.get('Authorization') || undefined;
          EnrichmentService.triggerEnrichmentAsync(
            'company',
            id,
            'update',
            authUser.workspaceId,
            authToken || undefined,
            changedEnrichmentFields
          );
          console.log('🤖 [COMPANIES API] Auto-triggered enrichment check for updated company', id, 'changed fields:', changedEnrichmentFields);
        } catch (error) {
          console.error('⚠️ [COMPANIES API] Failed to trigger enrichment:', error);
        }
      });
    }

    // IMPORTANT: Explicitly include all editable fields to ensure they're always in response (even if null)
    // This prevents fields from disappearing when API response doesn't include them
    const responseData = {
      success: true,
      data: {
        ...updatedCompany,
        // Basic Information
        name: updatedCompany.name ?? null,
        legalName: updatedCompany.legalName ?? null,
        tradingName: updatedCompany.tradingName ?? null,
        description: updatedCompany.description ?? null,
        website: updatedCompany.website ?? null,
        // Contact Information
        email: updatedCompany.email ?? null,
        phone: updatedCompany.phone ?? null,
        fax: updatedCompany.fax ?? null,
        linkedinUrl: updatedCompany.linkedinUrl ?? null,
        linkedinFollowers: updatedCompany.linkedinFollowers ?? null,
        // Location
        address: updatedCompany.address ?? null,
        city: updatedCompany.city ?? null,
        state: updatedCompany.state ?? null,
        country: updatedCompany.country ?? null,
        postalCode: updatedCompany.postalCode ?? null,
        hqLocation: updatedCompany.hqLocation ?? null,
        hqFullAddress: updatedCompany.hqFullAddress ?? null,
        hqCity: updatedCompany.hqCity ?? null,
        hqState: updatedCompany.hqState ?? null,
        // Business Information
        industry: updatedCompany.industry ?? null,
        sector: updatedCompany.sector ?? null,
        employeeCount: updatedCompany.employeeCount ?? null,
        revenue: updatedCompany.revenue ?? null,
        foundedYear: updatedCompany.foundedYear ?? null,
        // Engagement
        lastAction: updatedCompany.lastAction ?? null,
        nextAction: updatedCompany.nextAction ?? null,
        // Notes
        notes: updatedCompany.notes ?? null
      },
      meta: {
        message: 'Company updated successfully',
      },
    };

    return NextResponse.json(responseData);

  } catch (error) {
    // Log the full error with stack trace
    console.error('❌ [COMPANIES API] Error updating company:', {
      companyId: id,
      requestBody: body,
      updateData,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      prismaCode: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
      prismaMessage: error && typeof error === 'object' && 'message' in error ? error.message : undefined,
      prismaMeta: error && typeof error === 'object' && 'meta' in error ? error.meta : undefined
    });
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'Company with this information already exists', code: 'DUPLICATE' },
          { status: 400 }
        );
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { success: false, error: 'Company not found or has been deleted', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update company';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update company',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        code: 'UPDATE_FAILED'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/companies/[id] - Delete a company (soft delete by default, hard delete with ?mode=hard)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'soft'; // Default to soft delete
    
    // Check if company exists and belongs to user's workspace
    const existingCompany = await prisma.companies.findUnique({
      where: { 
        id,
        deletedAt: null, // Only delete non-deleted records
        workspaceId: authUser.workspaceId // Ensure company belongs to user's workspace
      },
      include: {
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            },
            actions: {
              where: {
                deletedAt: null
              }
            },
          },
        },
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // For hard delete, check if company has related data
    if (mode === 'hard' && (existingCompany._count.people > 0 || existingCompany._count.actions > 0)) {
      return NextResponse.json(
        { success: false, error: 'Cannot hard delete company with associated people or actions. Please remove or reassign them first.' },
        { status: 409 }
      );
    }

    if (mode === 'hard') {
      // Hard delete - permanently remove from database
      await prisma.companies.delete({
        where: { id },
      });
    } else {
      // Soft delete - set deletedAt timestamp
      await prisma.companies.update({
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
        message: `Company ${mode === 'hard' ? 'permanently deleted' : 'deleted'} successfully`,
        mode,
      },
    });

  } catch (error) {
    console.error('❌ [COMPANIES API] Error deleting company:', {
      companyId: id,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}

// OPTIONS /api/v1/companies/[id] - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

