import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';
import { extractIdFromSlug } from '@/platform/utils/url-utils';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params (Next.js 15+ compatibility)
    const resolvedParams = await params;
    const paramValue = resolvedParams.id;
    
    // Extract ID from slug (handles both slug format "name-id" and raw ID)
    const storyId = extractIdFromSlug(paramValue);
    
    console.log('🔍 [STACKS API] GET single story request received');
    console.log('🔍 [STACKS API] Param value:', paramValue);
    console.log('🔍 [STACKS API] Extracted story ID:', storyId);
    
    // Use platform's unified authentication system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      console.log('❌ [STACKS API] Authentication failed');
      return response; // Return error response if authentication failed
    }

    if (!context) {
      console.log('❌ [STACKS API] No context after authentication');
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Get workspace ID from authenticated context
    const workspaceId = context.workspaceId;
    const userId = context.userId;
    
    console.log('✅ [STACKS API] Authenticated user:', userId, 'workspace:', workspaceId, 'storyId:', storyId);

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    if (!storyId) {
      return createErrorResponse('Story ID required', 'STORY_ID_REQUIRED', 400);
    }

    // Fetch the story with workspace validation
    // Use explicit select to avoid selecting viewType column that may not exist in database
    const story = await prisma.stacksStory.findFirst({
      where: {
        id: storyId,
        project: {
          workspaceId: workspaceId
        }
      },
      select: {
        id: true,
        epicId: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assigneeId: true,
        product: true,
        section: true,
        createdAt: true,
        updatedAt: true,
        epic: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!story) {
      console.log('❌ [STACKS API] Story not found:', storyId);
      return createErrorResponse('Story not found', 'STORY_NOT_FOUND', 404);
    }

    // Transform the data to match the expected format
    const transformedStory = {
      id: story.id,
      title: story.title,
      description: story.description,
      status: story.status,
      priority: story.priority,
      viewType: story.viewType || 'main',
      product: story.product || null,
      section: story.section || null,
      assignee: story.assignee ? {
        id: story.assignee.id,
        name: `${story.assignee.firstName} ${story.assignee.lastName}`,
        email: story.assignee.email
      } : null,
      epic: story.epic ? {
        id: story.epic.id,
        title: story.epic.title,
        description: story.epic.description
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name
      } : null,
      dueDate: null, // dueDate field doesn't exist in schema yet
      tags: [], // tags field doesn't exist in schema yet
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      // Calculate time in current status (in days)
      timeInStatus: story.updatedAt ? Math.floor((Date.now() - new Date(story.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
    };

    console.log('✅ [STACKS API] Story found and transformed');
    return NextResponse.json({ story: transformedStory });

  } catch (error) {
    console.error('❌ [STACKS API] Error fetching story:', error);
    
    // Handle P2022 error (column does not exist) - specifically for viewType column
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      console.error('❌ [STACKS API] P2022 Error - Column does not exist:', {
        columnName: prismaError.meta?.column_name,
        tableName: prismaError.meta?.table_name,
        modelName: prismaError.meta?.modelName
      });
      
      return createErrorResponse(
        'Database schema mismatch: viewType column not found. Please run database migrations.',
        'SCHEMA_MISMATCH',
        500
      );
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params (Next.js 15+ compatibility)
    const resolvedParams = await params;
    const paramValue = resolvedParams.id;
    
    // Extract ID from slug (handles both slug format "name-id" and raw ID)
    const storyId = extractIdFromSlug(paramValue);
    
    // Use platform's unified authentication system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const workspaceId = context.workspaceId;
    
    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    if (!storyId) {
      return createErrorResponse('Story ID required', 'STORY_ID_REQUIRED', 400);
    }

    const body = await request.json();
    const { status, viewType, product, section } = body;

    // Verify story belongs to workspace
    const existingStory = await prisma.stacksStory.findFirst({
      where: {
        id: storyId,
        project: {
          workspaceId: workspaceId
        }
      }
    });

    if (!existingStory) {
      return createErrorResponse('Story not found', 'STORY_NOT_FOUND', 404);
    }

    // Update story
    // Build update data, excluding viewType if column doesn't exist
    const updateData: any = {
      ...(status && { status }),
      ...(product !== undefined && { product }),
      ...(section !== undefined && { section }),
      updatedAt: new Date()
    };
    
    // Only include viewType if we're actually updating it (will fail if column doesn't exist, but that's handled in catch)
    if (viewType !== undefined) {
      updateData.viewType = viewType;
    }

    const story = await prisma.stacksStory.update({
      where: { id: storyId },
      data: updateData,
      select: {
        id: true,
        epicId: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assigneeId: true,
        product: true,
        section: true,
        createdAt: true,
        updatedAt: true,
        epic: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Transform the data to match the expected format
    const transformedStory = {
      id: story.id,
      title: story.title,
      description: story.description,
      status: story.status,
      priority: story.priority,
      viewType: story.viewType || 'main',
      product: story.product || null,
      section: story.section || null,
      assignee: story.assignee ? {
        id: story.assignee.id,
        name: `${story.assignee.firstName} ${story.assignee.lastName}`,
        email: story.assignee.email
      } : null,
      epic: story.epic ? {
        id: story.epic.id,
        title: story.epic.title,
        description: story.epic.description
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name
      } : null,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt
    };

    return NextResponse.json({ story: transformedStory });

  } catch (error) {
    console.error('❌ [STACKS API] Error updating story:', error);
    
    // Handle P2022 error (column does not exist) - specifically for viewType column
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      if (prismaError.meta?.column_name === 'viewType') {
        console.warn('⚠️ [STACKS API] viewType column missing - update attempted without viewType');
        // Try update without viewType
        try {
          const { viewType, ...dataWithoutViewType } = JSON.parse(JSON.stringify(updateData || {}));
          const storyWithoutViewType = await prisma.stacksStory.update({
            where: { id: storyId },
            data: {
              ...(status && { status }),
              ...(product !== undefined && { product }),
              ...(section !== undefined && { section }),
              updatedAt: new Date()
            },
            select: {
              id: true,
              epicId: true,
              projectId: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              assigneeId: true,
              product: true,
              section: true,
              createdAt: true,
              updatedAt: true,
              epic: {
                select: {
                  id: true,
                  title: true,
                  description: true
                }
              },
              assignee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              project: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          
          const transformedStory = {
            id: storyWithoutViewType.id,
            title: storyWithoutViewType.title,
            description: storyWithoutViewType.description,
            status: storyWithoutViewType.status,
            priority: storyWithoutViewType.priority,
            viewType: 'main', // Default since column doesn't exist
            product: storyWithoutViewType.product || null,
            section: storyWithoutViewType.section || null,
            assignee: storyWithoutViewType.assignee ? {
              id: storyWithoutViewType.assignee.id,
              name: `${storyWithoutViewType.assignee.firstName} ${storyWithoutViewType.assignee.lastName}`,
              email: storyWithoutViewType.assignee.email
            } : null,
            epic: storyWithoutViewType.epic ? {
              id: storyWithoutViewType.epic.id,
              title: storyWithoutViewType.epic.title,
              description: storyWithoutViewType.epic.description
            } : null,
            project: storyWithoutViewType.project ? {
              id: storyWithoutViewType.project.id,
              name: storyWithoutViewType.project.name
            } : null,
            createdAt: storyWithoutViewType.createdAt,
            updatedAt: storyWithoutViewType.updatedAt
          };
          
          return NextResponse.json({ story: transformedStory });
        } catch (fallbackError) {
          console.error('❌ [STACKS API] Fallback update also failed:', fallbackError);
        }
      }
      
      return createErrorResponse(
        `Database column '${prismaError.meta?.column_name}' does not exist. Please run database migrations.`,
        'SCHEMA_MISMATCH',
        500
      );
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
