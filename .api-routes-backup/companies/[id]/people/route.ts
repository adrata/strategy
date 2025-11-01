import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let context: SecureApiContext | null = null;
  
  try {
    // Authenticate and authorize user
    const { context: authContext, response } = await getSecureApiContext(request);
    if (response) {
      return response;
    }
    context = authContext;

    const companyId = params.id;
    const body = await request.json();
    
    // Verify the company exists and user has access
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        workspaceId: context.workspaceId,
        deletedAt: null
      }
    });

    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }
    
    // Check if we're linking an existing person or creating a new one
    if (body.personId) {
      // Link existing person to company
      return await linkExistingPersonToCompany(companyId, body.personId, context);
    } else {
      // Create new person and link to company
      return await createNewPersonForCompany(companyId, body, context);
    }
  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'COMPANIES_PEOPLE_API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to process request',
      'COMPANIES_PEOPLE_ERROR',
      500
    );
  }
}

async function linkExistingPersonToCompany(companyId: string, personId: string, context: SecureApiContext) {
  try {
    // First, get the person to verify they exist and user has access
    const person = await prisma.people.findFirst({
      where: {
        id: personId,
        workspaceId: context.workspaceId,
        deletedAt: null
      }
    });

    if (!person) {
      return createErrorResponse('Person not found', 'PERSON_NOT_FOUND', 404);
    }
    
    // Update the person with the company information
    const updatedPerson = await prisma.people.update({
      where: { id: personId },
      data: {
        companyId: companyId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true
          }
        }
      }
    });
    
    return createSuccessResponse(updatedPerson, 'Person successfully linked to company');
    
  } catch (error) {
    console.error('Error linking person to company:', error);
    return createErrorResponse('Failed to link person to company', 'LINK_PERSON_ERROR', 500);
  }
}

async function createNewPersonForCompany(companyId: string, personData: any, context: SecureApiContext) {
  try {
    // Get company information
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        workspaceId: context.workspaceId,
        deletedAt: null
      }
    });

    if (!company) {
      return createErrorResponse('Company not found', 'COMPANY_NOT_FOUND', 404);
    }
    
    // Create the person with company association
    const newPerson = await prisma.people.create({
      data: {
        firstName: personData.firstName || '',
        lastName: personData.lastName || '',
        fullName: `${personData.firstName || ''} ${personData.lastName || ''}`.trim(),
        email: personData.email || null,
        phone: personData.phone || null,
        jobTitle: personData.jobTitle || null,
        state: personData.state || null,
        companyId: companyId,
        status: personData.status || 'LEAD',
        source: personData.source || 'Manual Entry',
        workspaceId: context.workspaceId,
        mainSellerId: context.userId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true
          }
        }
      }
    });
    
    return createSuccessResponse(newPerson, 'Person successfully created and linked to company');
    
  } catch (error) {
    console.error('Error creating person for company:', error);
    return createErrorResponse('Failed to create person', 'CREATE_PERSON_ERROR', 500);
  }
}
