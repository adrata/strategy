import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getV1AuthUser } from '../../auth';

/**
 * Individual Person CRUD API v1
 * GET /api/v1/people/[id] - Get a specific person
 * PUT /api/v1/people/[id] - Update a person (full replacement)
 * PATCH /api/v1/people/[id] - Partially update a person
 * DELETE /api/v1/people/[id] - Delete a person (soft delete by default, hard delete with ?mode=hard)
 */

// GET /api/v1/people/[id] - Get a specific person
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    const person = await prisma.people.findUnique({
      where: { 
        id,
        deletedAt: null // Only show non-deleted records
      },
      include: {
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

    // Transform to use mainSeller terminology like speedrun
    const transformedPerson = {
      ...person,
      mainSellerId: person.mainSellerId,
      mainSeller: person.mainSeller 
        ? (person.mainSeller.id === authUser.id
            ? 'Me'
            : person.mainSeller.firstName && person.mainSeller.lastName 
              ? `${person.mainSeller.firstName} ${person.mainSeller.lastName}`.trim()
              : person.mainSeller.name || person.mainSeller.email || '-')
        : '-',
      mainSellerData: person.mainSeller
    };

    return NextResponse.json({
      success: true,
      data: transformedPerson,
    });

  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch person' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/people/[id] - Update a person (full replacement)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const body = await request.json();

    // Check if person exists
    const existingPerson = await prisma.people.findUnique({
      where: { 
        id,
        deletedAt: null // Only update non-deleted records
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
      },
    });

  } catch (error) {
    console.error('Error updating person:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Person with this information already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update person' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/people/[id] - Partially update a person
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const body = await request.json();

    // Check if person exists
    const existingPerson = await prisma.people.findUnique({
      where: { 
        id,
        deletedAt: null // Only update non-deleted records
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
      'firstName', 'lastName', 'fullName', 'jobTitle', 'department', 'status',
      'priority', 'email', 'workEmail', 'phone', 'mobilePhone', 'linkedinUrl',
      'city', 'nextAction', 'nextActionDate', 'notes', 'tags', 'seniority',
      'engagementScore', 'engagementLevel', 'influenceLevel', 'decisionPower',
      'isBuyerGroupMember', 'engagementStrategy', 'buyerGroupOptimized',
      'communicationStyle', 'decisionPowerScore', 'relationshipWarmth',
      'yearsExperience', 'educationLevel', 'skills', 'certifications',
      'valueDriver', 'bestContactTime', 'industry', 'globalRank', 'companyRank',
      'vertical', 'achievements', 'budgetResponsibility', 'buyerGroupRole',
      'buyerGroupStatus', 'careerTimeline', 'coresignalData', 'currentCompany',
      'currentRole', 'dataCompleteness', 'decisionMaking', 'degrees',
      'emailConfidence', 'enrichedData', 'enrichmentScore', 'enrichmentSources',
      'fieldsOfStudy', 'graduationYears', 'industryExperience', 'industrySkills',
      'influenceScore', 'institutions', 'languages', 'leadershipExperience',
      'mobileVerified', 'phoneConfidence', 'preferredContact', 'previousRoles',
      'publications', 'responseTime', 'roleHistory', 'rolePromoted',
      'softSkills', 'speakingEngagements', 'statusReason', 'statusUpdateDate',
      'teamSize', 'technicalSkills', 'totalExperience', 'yearsAtCompany',
      'yearsInRole', 'address', 'state', 'country', 'postalCode', 'bio',
      'profilePictureUrl', 'source', 'customFields', 'preferredLanguage',
      'timezone', 'emailVerified', 'phoneVerified', 'lastAction', 'lastActionDate',
      'actionStatus', 'entityId', 'mainSellerId'
    ];

    // Filter body to only allowed fields
    const updateData = Object.keys(body)
      .filter(key => ALLOWED_PEOPLE_FIELDS.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: body[key] }), {});

    // Update person with partial data
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
      },
    });

  } catch (error) {
    console.error('Error updating person:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Person with this information already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update person' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/people/[id] - Delete a person (soft delete by default, hard delete with ?mode=hard)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'soft'; // Default to soft delete

    // Check if person exists
    const existingPerson = await prisma.people.findUnique({
      where: { 
        id,
        deletedAt: null // Only delete non-deleted records
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
    console.error('Error deleting person:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete person' },
      { status: 500 }
    );
  }
}