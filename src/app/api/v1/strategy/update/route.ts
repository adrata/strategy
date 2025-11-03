import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * PATCH /api/v1/strategy/update
 * Update individual strategy field for a person
 */
export async function PATCH(request: NextRequest) {
  let context: SecureApiContext | null = null;
  
  try {
    // Authenticate and authorize user
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    const { context: authContext, response } = authResult;
    context = authContext;

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Parse request body
    const body = await request.json();
    const { personId, field, content } = body;

    if (!personId || !field || content === undefined) {
      return createErrorResponse('Person ID, field, and content are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    // Validate field name
    const validFields = ['situation', 'complication', 'futureState', 'strategySummary'];
    if (!validFields.includes(field)) {
      return createErrorResponse('Invalid field name', 'INVALID_FIELD', 400);
    }

    console.log(`📝 [STRATEGY UPDATE API] Updating ${field} for person ${personId} in workspace ${context.workspaceId}`);

    // Fetch current person data
    const person = await prisma.people.findFirst({
      where: {
        id: personId,
        workspaceId: context.workspaceId
      },
      select: {
        id: true,
        customFields: true
      }
    });

    if (!person) {
      return createErrorResponse('Person not found', 'PERSON_NOT_FOUND', 404);
    }

    // Update the specific field in customFields
    const customFields = person.customFields || {};
    const updatedCustomFields = {
      ...customFields,
      [`strategy${field.charAt(0).toUpperCase() + field.slice(1)}`]: content
    };

    // Update the person record
    await prisma.people.update({
      where: { id: personId },
      data: {
        customFields: updatedCustomFields
      }
    });

    console.log(`✅ [STRATEGY UPDATE API] Successfully updated ${field} for person ${personId}`);

    return NextResponse.json({
      success: true,
      data: {
        field,
        content,
        updatedAt: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        message: `${field} updated successfully`,
        userId: context.userId,
        workspaceId: context.workspaceId
      }
    });

  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 STRATEGY UPDATE API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to update strategy field',
      500
    );
  }
}
