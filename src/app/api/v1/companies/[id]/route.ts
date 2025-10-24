import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getV1AuthUser } from '../../auth';

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

    const company = await prisma.companies.findUnique({
      where: { 
        id,
        deletedAt: null // Only show non-deleted records
      },
      select: {
        // Base company fields
        id: true,
        name: true,
        website: true,
        description: true,
        industry: true,
        size: true,
        revenue: true,
        employeeCount: true,
        status: true,
        priority: true,
        tags: true,
        notes: true,
        customFields: true,
        lastAction: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true,
        globalRank: true,
        competitors: true, // Include competitors field
        linkedinUrl: true,
        linkedinNavigatorUrl: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
        // Relations
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

    return NextResponse.json({
      success: true,
      data: company,
    });

  } catch (error) {
    console.error('Error fetching company:', error);
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

    // Check if company exists
    const existingCompany = await prisma.companies.findUnique({
      where: { 
        id,
        deletedAt: null // Only update non-deleted records
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

    return NextResponse.json({
      success: true,
      data: updatedCompany,
      meta: {
        message: 'Company updated successfully',
      },
    });

  } catch (error) {
    console.error('Error updating company:', error);
    
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

    // Check if company exists
    const existingCompany = await prisma.companies.findUnique({
      where: { 
        id,
        deletedAt: null // Only update non-deleted records
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
      'linkedinUrl', 'linkedinNavigatorUrl', 'linkedinFollowers', 'twitterUrl', 'twitterFollowers', 
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
      'targetIndustry'
    ];

    // Filter body to only allowed fields
    const updateData = Object.keys(body)
      .filter(key => ALLOWED_COMPANY_FIELDS.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: body[key] }), {});

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
      updatedFields: Object.keys(updateData),
      updatedValues: updateData,
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
    try {
      const updatedFields = Object.keys(updateData).filter(key => 
        updateData[key] !== existingCompany[key]
      );
      
      if (updatedFields.length > 0) {
        await prisma.actions.create({
          data: {
            companyId: id,
            type: 'data_update',
            subject: `Updated ${updatedFields.join(', ')}`,
            description: `Company data fields updated by ${authUser.name || authUser.email}`,
            status: 'completed',
            completedAt: new Date(),
            workspaceId: existingCompany.workspaceId,
            userId: authUser.id,
            ownerId: authUser.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`📝 [COMPANIES API] Logged data update action for company ${id}: ${updatedFields.join(', ')}`);
      }
    } catch (actionError) {
      console.error('Failed to log company data update action:', actionError);
      // Don't fail the main update if action logging fails
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
      ...(error && typeof error === 'object' && 'code' in error && {
        prismaCode: error.code,
        prismaMessage: 'message' in error ? error.message : undefined,
        meta: 'meta' in error ? error.meta : undefined
      })
    });
    
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Company with this information already exists' },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update company';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update company',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
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
    
    // Check if company exists
    const existingCompany = await prisma.companies.findUnique({
      where: { 
        id,
        deletedAt: null // Only delete non-deleted records
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
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}
