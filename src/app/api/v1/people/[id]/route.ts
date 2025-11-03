import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getV1AuthUser } from '../../auth';
import { findOrCreateCompany } from '@/platform/services/company-linking-service';
import { mergeCorePersonWithWorkspace } from '@/platform/services/core-entity-service';

/**
 * Individual Person CRUD API v1
 * GET /api/v1/people/[id] - Get a specific person
 * PUT /api/v1/people/[id] - Update a person (full replacement)
 * PATCH /api/v1/people/[id] - Partially update a person
 * DELETE /api/v1/people/[id] - Delete a person (soft delete by default, hard delete with ?mode=hard)
 */

// Force dynamic rendering for API routes (required for authentication and database queries)
export const dynamic = 'force-dynamic';

// GET /api/v1/people/[id] - Get a specific person
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

    const person = await prisma.people.findUnique({
      where: { 
        id,
        deletedAt: null, // Only show non-deleted records
        workspaceId: authUser.workspaceId // Ensure person belongs to user's workspace
      },
      include: {
        corePerson: true,
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
        mainSeller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
          },
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
            actions: {
              where: {
                deletedAt: null
              }
            },
          },
        },
      },
    });

    if (!person) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    // Merge core person data with workspace data
    const mergedPerson = mergeCorePersonWithWorkspace(person, person.corePerson || null);

    // Transform to use mainSeller terminology like speedrun
    const transformedPerson = {
      ...mergedPerson,
      mainSellerId: mergedPerson.mainSellerId,
      mainSeller: mergedPerson.mainSeller 
        ? (mergedPerson.mainSeller.id === authUser.id
            ? 'Me'
            : mergedPerson.mainSeller.firstName && mergedPerson.mainSeller.lastName 
              ? `${mergedPerson.mainSeller.firstName} ${mergedPerson.mainSeller.lastName}`.trim()
              : mergedPerson.mainSeller.name || mergedPerson.mainSeller.email || '-')
        : '-',
      mainSellerData: mergedPerson.mainSeller
    };

    console.log(`🔍 [PEOPLE API GET] Returning person data:`, {
      personId: id,
      email: transformedPerson.email,
      workEmail: transformedPerson.workEmail,
      hasEmail: !!transformedPerson.email,
      linkedinUrl: transformedPerson.linkedinUrl,
      linkedinNavigatorUrl: transformedPerson.linkedinNavigatorUrl,
      createdAt: transformedPerson.createdAt,
      updatedAt: transformedPerson.updatedAt,
      allFields: Object.keys(transformedPerson)
    });

    // 🔍 ENHANCED DATE DEBUGGING: Detailed logging for date fields
    console.log(`🔍 [DATE DEBUG] Detailed date field analysis:`, {
      personId: id,
      createdAt: {
        value: transformedPerson.createdAt,
        type: typeof transformedPerson.createdAt,
        isNull: transformedPerson.createdAt === null,
        isUndefined: transformedPerson.createdAt === undefined,
        isDate: transformedPerson.createdAt instanceof Date,
        stringified: JSON.stringify(transformedPerson.createdAt)
      },
      updatedAt: {
        value: transformedPerson.updatedAt,
        type: typeof transformedPerson.updatedAt,
        isNull: transformedPerson.updatedAt === null,
        isUndefined: transformedPerson.updatedAt === undefined,
        isDate: transformedPerson.updatedAt instanceof Date,
        stringified: JSON.stringify(transformedPerson.updatedAt)
      }
    });

    // 🔧 DATE SERIALIZATION FIX: Ensure dates are properly formatted for JSON serialization
    const responseData = {
      ...transformedPerson,
      // Explicitly ensure dates are properly formatted for JSON serialization
      createdAt: transformedPerson.createdAt ? new Date(transformedPerson.createdAt).toISOString() : null,
      // Use createdAt as fallback if updatedAt is null/undefined (common for older records)
      updatedAt: transformedPerson.updatedAt 
        ? new Date(transformedPerson.updatedAt).toISOString() 
        : transformedPerson.createdAt 
          ? new Date(transformedPerson.createdAt).toISOString()
          : null,
      // IMPORTANT: Explicitly include all editable fields to ensure they're always in response (even if null)
      // This ensures fields are present on initial load and prevents disappearing
      // Basic Information
      status: transformedPerson.status ?? null,
      fullName: transformedPerson.fullName ?? null,
      firstName: transformedPerson.firstName ?? null,
      lastName: transformedPerson.lastName ?? null,
      jobTitle: transformedPerson.jobTitle ?? null,
      department: transformedPerson.department ?? null,
      state: transformedPerson.state ?? null,
      bio: transformedPerson.bio ?? null,
      // Intelligence Snapshot
      isBuyerGroupMember: transformedPerson.isBuyerGroupMember ?? null,
      buyerGroupRole: transformedPerson.buyerGroupRole ?? null,
      influenceLevel: transformedPerson.influenceLevel ?? null,
      decisionPower: transformedPerson.decisionPower ?? (transformedPerson.customFields as any)?.decisionPower ?? null,
      engagementLevel: transformedPerson.engagementLevel ?? (transformedPerson.customFields as any)?.engagementLevel ?? null,
      // Contact Information
      email: transformedPerson.email ?? null,
      workEmail: transformedPerson.workEmail ?? null,
      phone: transformedPerson.phone ?? null,
      linkedinUrl: transformedPerson.linkedinUrl ?? null,
      linkedinNavigatorUrl: transformedPerson.linkedinNavigatorUrl ?? null,
      linkedinConnectionDate: transformedPerson.linkedinConnectionDate ?? null,
      // Engagement History
      lastAction: transformedPerson.lastAction ?? null,
      nextAction: transformedPerson.nextAction ?? null,
      // Notes
      notes: transformedPerson.notes ?? null
    };

    console.log(`🔍 [DATE SERIALIZATION] Final response data dates:`, {
      personId: id,
      createdAt: responseData.createdAt,
      updatedAt: responseData.updatedAt,
      createdAtType: typeof responseData.createdAt,
      updatedAtType: typeof responseData.updatedAt
    });

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error('❌ [PEOPLE API] Error fetching person:', {
      personId: id,
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
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch person';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch person',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/v1/people/[id] - Update a person (full replacement)
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

    // Check if person exists and belongs to user's workspace
    const existingPerson = await prisma.people.findUnique({
      where: { 
        id,
        deletedAt: null, // Only update non-deleted records
        workspaceId: authUser.workspaceId // Ensure person belongs to user's workspace
      },
    });

    if (!existingPerson) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    // Update full name if names changed
    if (body.firstName || body.lastName) {
      const firstName = body.firstName || existingPerson.firstName;
      const lastName = body.lastName || existingPerson.lastName;
      body.fullName = `${firstName} ${lastName}`;
    }

    // Update person
    const updatedPerson = await prisma.people.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
          },
        },
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
            actions: {
              where: {
                deletedAt: null
              }
            },
          },
        },
      },
    });

    // Generate a slug for updated person name; not persisted, returned for client navigation
    const updatedDisplayName = updatedPerson.fullName || `${updatedPerson.firstName ?? ''} ${updatedPerson.lastName ?? ''}`.trim() || '-';
    const generatedSlug = `${(updatedDisplayName || '-')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')}-${updatedPerson.id}`;

    return NextResponse.json({
      success: true,
      data: {
        ...updatedPerson,
        mainSellerId: updatedPerson.mainSellerId,
        mainSeller: updatedPerson.mainSeller 
          ? (updatedPerson.mainSeller.id === authUser.id
              ? 'Me'
              : updatedPerson.mainSeller.firstName && updatedPerson.mainSeller.lastName 
                ? `${updatedPerson.mainSeller.firstName} ${updatedPerson.mainSeller.lastName}`.trim()                                                                    
                : updatedPerson.mainSeller.name || updatedPerson.mainSeller.email || '-')
          : '-',
        mainSellerData: updatedPerson.mainSeller
      },
      meta: {
        message: 'Person updated successfully',
        slug: generatedSlug,
      },
    });

  } catch (error) {
    console.error('❌ [PEOPLE API] Error in PUT updating person:', {
      personId: id,
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
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Person with this information already exists' },
        { status: 400 }
      );
    }
    
    // Return more specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Failed to update person';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update person',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/people/[id] - Partially update a person
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
    
    console.log(`🔍 [PEOPLE API AUDIT] PATCH request received:`, {
      personId: id,
      requestBody: body,
      authUser: authUser.id,
      timestamp: new Date().toISOString()
    });

    // Check if person exists and belongs to user's workspace
    const existingPerson = await prisma.people.findUnique({
      where: { 
        id,
        deletedAt: null, // Only update non-deleted records
        workspaceId: authUser.workspaceId // Ensure person belongs to user's workspace
      },
    });

    if (!existingPerson) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    // Update full name if names changed
    if (body.firstName || body.lastName) {
      const firstName = body.firstName || existingPerson.firstName;
      const lastName = body.lastName || existingPerson.lastName;
      body.fullName = `${firstName} ${lastName}`;
    }

    // Special handling for globalRank updates
    let isRankUpdate = false;
    let oldRank = existingPerson.globalRank;
    let newRank = body.globalRank;
    
    if (body.globalRank !== undefined && body.globalRank !== existingPerson.globalRank) {
      isRankUpdate = true;
      console.log(`🔄 [PEOPLE API] Rank update detected: ${oldRank} → ${newRank} for person ${id}`);
    }

    // Whitelist of allowed fields for people updates
    const ALLOWED_PEOPLE_FIELDS = [
      'firstName', 'lastName', 'fullName', 'displayName', 'salutation', 'suffix',
      'jobTitle', 'title', 'department', 'status', 'priority', 
      'email', 'workEmail', 'personalEmail', 'phone', 'mobilePhone', 'workPhone', 
      'linkedinUrl', 'linkedinNavigatorUrl', 'linkedinConnectionDate', 
      'city', 'nextAction', 'nextActionDate', 'notes', 'tags', 'seniority',
      'engagementScore', 'engagementLevel', 'influenceLevel', 'decisionPower',
      'isBuyerGroupMember', 'engagementStrategy', 'buyerGroupOptimized',
      'communicationStyle', 'decisionPowerScore',
      'yearsExperience', 'certifications',
      'globalRank', 'companyRank',
      'vertical', 'achievements', 'budgetResponsibility', 'buyerGroupRole',
      'buyerGroupStatus', 'careerTimeline', 'coresignalData', 'currentCompany',
      'currentRole', 'dataCompleteness', 'decisionMaking', 'degrees',
      'emailConfidence', 'enrichedData', 'enrichmentScore', 'enrichmentSources',
      'engagementPriority', 'fieldsOfStudy', 'graduationYears', 'industryExperience', 'industrySkills',
      'influenceScore', 'institutions', 'languages', 'leadershipExperience',
      'mobileVerified', 'phoneConfidence', 'preferredContact', 'previousRoles',
      'publications', 'responseTime', 'roleHistory', 'rolePromoted',
      'softSkills', 'speakingEngagements', 'statusReason', 'statusUpdateDate',
      'teamSize', 'technicalSkills', 'totalExperience', 'yearsAtCompany',
      'yearsInRole', 'address', 'state', 'country', 'postalCode', 'bio',
      'profilePictureUrl', 'source', 'customFields', 'preferredLanguage',
      'timezone', 'emailVerified', 'phoneVerified', 'lastAction', 'lastActionDate',
      'actionStatus', 'entityId', 'mainSellerId', 'companyId', 'company',
      'dateOfBirth', 'gender', 'linkedinConnections', 'linkedinFollowers'
    ];

    // Filter body to only allowed fields FIRST
    updateData = Object.keys(body)
      .filter(key => ALLOWED_PEOPLE_FIELDS.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: body[key] }), {});

    // Handle company linking - process company field regardless of companyId presence
    if (updateData.company) {
      try {
        let companyName: string;
        
        // If companyId is already provided, just remove the company string field
        if (updateData.companyId) {
          console.log(`🏢 [PEOPLE API PATCH] CompanyId provided (${updateData.companyId}), removing company string field`);
          delete updateData.company;
        } else if (typeof updateData.company === 'string') {
          // String company name - find or create company
          companyName = updateData.company.trim();
          if (companyName) {
            console.log(`🏢 [PEOPLE API PATCH] Auto-linking company: "${companyName}"`);
            const companyResult = await findOrCreateCompany(
              companyName,
              existingPerson.workspaceId
            );
            updateData.companyId = companyResult.id;
            delete updateData.company;
            console.log(`✅ [PEOPLE API PATCH] ${companyResult.isNew ? 'Created' : 'Found'} company: ${companyResult.name} (${companyResult.id})`);
          }
        } else if (typeof updateData.company === 'object' && updateData.company.id) {
          // Company object with ID - use the existing company
          console.log(`🏢 [PEOPLE API PATCH] Using existing company: ${updateData.company.name} (${updateData.company.id})`);
          updateData.companyId = updateData.company.id;
          delete updateData.company;
        } else if (typeof updateData.company === 'object' && updateData.company.name) {
          // Company object without ID - find or create company
          companyName = updateData.company.name.trim();
          if (companyName) {
            console.log(`🏢 [PEOPLE API PATCH] Auto-linking company from object: "${companyName}"`);
            const companyResult = await findOrCreateCompany(
              companyName,
              existingPerson.workspaceId
            );
            updateData.companyId = companyResult.id;
            delete updateData.company;
            console.log(`✅ [PEOPLE API PATCH] ${companyResult.isNew ? 'Created' : 'Found'} company: ${companyResult.name} (${companyResult.id})`);
          }
        }
      } catch (error) {
        console.error('⚠️ [PEOPLE API PATCH] Failed to link company:', error);
        // Continue without company linking rather than failing the entire request
        delete updateData.company;
      }
    }

    console.log(`🔍 [PEOPLE API AUDIT] Database update preparation:`, {
      personId: id,
      updateData,
      allowedFields: ALLOWED_PEOPLE_FIELDS,
      filteredFields: Object.keys(updateData),
      originalRequestBody: body,
      fieldsInRequest: Object.keys(body),
      fieldsFilteredOut: Object.keys(body).filter(key => !ALLOWED_PEOPLE_FIELDS.includes(key)),
      // Show field types for debugging
      fieldTypes: Object.keys(updateData).reduce((acc, key) => {
        acc[key] = typeof updateData[key];
        return acc;
      }, {} as Record<string, string>)
    });

    // Check for empty updates
    if (Object.keys(updateData).length === 0) {
      console.warn('⚠️ [PEOPLE API] No fields to update - updateData is empty');
      return NextResponse.json({
        success: false,
        error: 'No valid fields to update',
        details: 'All fields were filtered out or empty'
      }, { status: 400 });
    }

    // Update person with partial data
    console.log(`🔍 [PEOPLE API AUDIT] About to execute Prisma update with data:`, {
      personId: id,
      updateData,
      updateDataKeys: Object.keys(updateData),
      updateDataValues: updateData
    });

    const updatedPerson = await prisma.people.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
          },
        },
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
    console.log(`✅ [PEOPLE API AUDIT] Database update completed:`, {
      personId: id,
      updatedFields: Object.keys(updateData),
      updatedValues: updateData,
      prismaResult: {
        id: updatedPerson.id,
        fullName: updatedPerson.fullName,
        email: updatedPerson.email,
        status: updatedPerson.status,
        priority: updatedPerson.priority,
        companyId: updatedPerson.companyId,
        updatedAt: updatedPerson.updatedAt
      },
      // Compare old vs new values for key fields
      changes: Object.keys(updateData).reduce((acc, key) => {
        const oldValue = (existingPerson as any)[key];
        const newValue = (updatedPerson as any)[key];
        if (oldValue !== newValue) {
          acc[key] = { old: oldValue, new: newValue };
        }
        return acc;
      }, {} as Record<string, { old: any; new: any }>)
    });

    // Special logging for linkedinNavigatorUrl updates
    if (updateData.linkedinNavigatorUrl !== undefined) {
      console.log(`🔍 [LINKEDIN NAVIGATOR API AUDIT] linkedinNavigatorUrl update in API:`, {
        personId: id,
        updateDataLinkedinNavigatorUrl: updateData.linkedinNavigatorUrl,
        existingPersonLinkedinNavigatorUrl: existingPerson.linkedinNavigatorUrl,
        updatedPersonLinkedinNavigatorUrl: updatedPerson.linkedinNavigatorUrl,
        wasUpdated: existingPerson.linkedinNavigatorUrl !== updatedPerson.linkedinNavigatorUrl,
        updateDataKeys: Object.keys(updateData),
        allowedFields: ALLOWED_PEOPLE_FIELDS.includes('linkedinNavigatorUrl')
      });
    }

    // Log data update as an action
    try {
      const updatedFields = Object.keys(updateData).filter(key => {
        const newValue = updateData[key as keyof typeof updateData];
        const oldValue = (existingPerson as any)[key];
        return newValue !== oldValue;
      });
      
      if (updatedFields.length > 0) {
        await prisma.actions.create({
          data: {
            personId: id,
            type: 'data_update',
            subject: `Updated ${updatedFields.join(', ')}`,
            description: `Data fields updated by ${authUser.name || authUser.email}`,
            status: 'COMPLETED',
            completedAt: new Date(),
            workspaceId: existingPerson.workspaceId,
            userId: authUser.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`📝 [PEOPLE API] Logged data update action for person ${id}: ${updatedFields.join(', ')}`);
      }
    } catch (actionError) {
      console.error('❌ [PEOPLE API] Failed to log data update action:', actionError);
      // Don't fail the main update if action logging fails
    }

    const responseData = {
      success: true,
      data: {
        ...updatedPerson,
        mainSellerId: updatedPerson.mainSellerId,
        mainSeller: updatedPerson.mainSeller 
          ? (updatedPerson.mainSeller.id === authUser.id
              ? 'Me'
              : updatedPerson.mainSeller.firstName && updatedPerson.mainSeller.lastName 
                ? `${updatedPerson.mainSeller.firstName} ${updatedPerson.mainSeller.lastName}`.trim()                                                                    
                : updatedPerson.mainSeller.name || updatedPerson.mainSeller.email || '-')
          : '-',
        mainSellerData: updatedPerson.mainSeller,
        // IMPORTANT: Explicitly include all editable fields to ensure they're always in response (even if null)
        // This prevents fields from disappearing when API response doesn't include them
        // Basic Information
        status: updatedPerson.status ?? null,
        fullName: updatedPerson.fullName ?? null,
        firstName: updatedPerson.firstName ?? null,
        lastName: updatedPerson.lastName ?? null,
        jobTitle: updatedPerson.jobTitle ?? null,
        department: updatedPerson.department ?? null,
        state: updatedPerson.state ?? null,
        bio: updatedPerson.bio ?? null,
        // Intelligence Snapshot
        isBuyerGroupMember: updatedPerson.isBuyerGroupMember ?? null,
        buyerGroupRole: updatedPerson.buyerGroupRole ?? null,
        influenceLevel: updatedPerson.influenceLevel ?? null,
        decisionPower: updatedPerson.decisionPower ?? (updatedPerson.customFields as any)?.decisionPower ?? null,
        engagementLevel: updatedPerson.engagementLevel ?? (updatedPerson.customFields as any)?.engagementLevel ?? null,
        // Contact Information
        email: updatedPerson.email ?? null,
        workEmail: updatedPerson.workEmail ?? null,
        phone: updatedPerson.phone ?? null,
        linkedinUrl: updatedPerson.linkedinUrl ?? null,
        linkedinNavigatorUrl: updatedPerson.linkedinNavigatorUrl ?? null,
        linkedinConnectionDate: updatedPerson.linkedinConnectionDate ?? null,
        // Engagement History
        lastAction: updatedPerson.lastAction ?? null,
        nextAction: updatedPerson.nextAction ?? null,
        // Notes
        notes: updatedPerson.notes ?? null
      },
      meta: {
        message: 'Person updated successfully',
      },
    };

    console.log(`🔍 [PEOPLE API AUDIT] Database update completed:`, {
      personId: id,
      updatedPerson,
      updateData,
      responseData,
      // Specifically check email field
      emailInUpdateData: (updateData as any).email,
      emailInUpdatedPerson: updatedPerson.email,
      emailInResponseData: (responseData.data as any).email,
      // Check LinkedIn fields
      linkedinUrlInUpdateData: (updateData as any).linkedinUrl,
      linkedinUrlInUpdatedPerson: updatedPerson.linkedinUrl,
      linkedinUrlInResponseData: (responseData.data as any).linkedinUrl,
      linkedinNavigatorUrlInUpdateData: (updateData as any).linkedinNavigatorUrl,
      linkedinNavigatorUrlInUpdatedPerson: updatedPerson.linkedinNavigatorUrl,
      linkedinNavigatorUrlInResponseData: (responseData.data as any).linkedinNavigatorUrl
    });

    // Auto-populate nextActionDate if it's null
    if (!updatedPerson.nextActionDate) {
      try {
        // Calculate nextActionDate based on rank or lastActionDate
        const lastActionDate = updatedPerson.lastActionDate || updatedPerson.createdAt;
        const rank = updatedPerson.globalRank || 1000; // Default rank if null
        
        // Calculate days to add based on rank (higher rank = more urgent = sooner)
        let daysToAdd = 7; // Default 1 week
        if (rank <= 10) daysToAdd = 1; // Top 10: tomorrow
        else if (rank <= 50) daysToAdd = 3; // Top 50: 3 days
        else if (rank <= 100) daysToAdd = 5; // Top 100: 5 days
        else if (rank <= 500) daysToAdd = 7; // Top 500: 1 week
        else daysToAdd = 14; // Others: 2 weeks
        
        const nextActionDate = new Date(lastActionDate);
        nextActionDate.setDate(nextActionDate.getDate() + daysToAdd);
        
        // Update the person with the calculated nextActionDate
        await prisma.people.update({
          where: { id },
          data: { nextActionDate }
        });
        
        console.log(`✅ [PEOPLE API] Auto-populated nextActionDate:`, {
          personId: id,
          rank,
          daysToAdd,
          nextActionDate,
          lastActionDate
        });
      } catch (nextActionError) {
        console.error('⚠️ [PEOPLE API] Failed to auto-populate nextActionDate:', nextActionError);
        // Don't fail the main update if nextActionDate calculation fails
      }
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ [PEOPLE API] Error updating person:', {
      personId: id,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      // Include Prisma-specific error details if available
      prismaCode: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
      prismaMessage: error && typeof error === 'object' && 'message' in error ? error.message : undefined,
      prismaMeta: error && typeof error === 'object' && 'meta' in error ? error.meta : undefined,
      prismaClientVersion: error && typeof error === 'object' && 'clientVersion' in error ? error.clientVersion : undefined,
      // Include request context for debugging
      requestBody: body || 'Not available - error occurred before body parsing',
      updateData: updateData || 'Not available - error occurred before updateData creation'
    });
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Person with this information already exists' },
        { status: 400 }
      );
    }
    
    // Return more specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Failed to update person';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update person',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/people/[id] - Delete a person (soft delete by default, hard delete with ?mode=hard)
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

    // Check if person exists and belongs to user's workspace
    const existingPerson = await prisma.people.findUnique({
      where: { 
        id,
        deletedAt: null, // Only delete non-deleted records
        workspaceId: authUser.workspaceId // Ensure person belongs to user's workspace
      },
      include: {
        _count: {
          select: {
            actions: {
              where: {
                deletedAt: null
              }
            },
          },
        },
      },
    });

    if (!existingPerson) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    // For hard delete, check if person has related data
    if (mode === 'hard' && existingPerson._count.actions > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot hard delete person with associated actions. Please remove or reassign them first.' },
        { status: 409 }
      );
    }

    if (mode === 'hard') {
      // Hard delete - permanently remove from database
      await prisma.people.delete({
        where: { id },
      });
    } else {
      // Soft delete - set deletedAt timestamp
      await prisma.people.update({
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
        message: `Person ${mode === 'hard' ? 'permanently deleted' : 'deleted'} successfully`,
        mode,
      },
    });

  } catch (error) {
    console.error('❌ [PEOPLE API] Error deleting person:', {
      personId: id,
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
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete person';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete person',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}