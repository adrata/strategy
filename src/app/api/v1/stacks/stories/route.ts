import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let workspaceId: string | null = null;
  
  try {
    console.log('🔍 [STACKS API] GET request received');
    console.log('🔍 [STACKS API] Request URL:', request.url);
    
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

    // Get workspace ID - prefer query parameter over context (frontend may have different active workspace)
    const { searchParams } = new URL(request.url);
    const queryWorkspaceId = searchParams.get('workspaceId');
    const contextWorkspaceId = context.workspaceId;
    const userId = context.userId;
    
    // Use query parameter if provided, otherwise fall back to authenticated context
    workspaceId = queryWorkspaceId || contextWorkspaceId;
    
    console.log('✅ [STACKS API] Authenticated user:', userId);
    console.log('🔍 [STACKS API] Workspace ID - Query param:', queryWorkspaceId, 'Context:', contextWorkspaceId, 'Using:', workspaceId);

    const category = searchParams.get('category'); // 'build' or 'sell'
    const status = searchParams.get('status');
    const epicId = searchParams.get('epicId');
    const assigneeId = searchParams.get('assigneeId');

    if (!workspaceId) {
      console.error('❌ [STACKS API] No workspace ID available (query param or context)');
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    // Security check: if both are provided, ensure they match (user should only access their workspace)
    if (queryWorkspaceId && contextWorkspaceId && queryWorkspaceId !== contextWorkspaceId) {
      console.warn('⚠️ [STACKS API] Workspace ID mismatch - Query:', queryWorkspaceId, 'Context:', contextWorkspaceId);
      // Still allow it but log the warning - the context workspace may be different from active workspace
    }

    // Build where clause
    const where: any = {
      project: {
        workspaceId: workspaceId
      }
    };

    // Note: category field doesn't exist in StacksStory schema yet
    // if (category) {
    //   where.category = category;
    // }

    if (status) {
      where.status = status;
      console.log('🔍 [STACKS API] Filtering by status:', status);
    }

    if (epicId) {
      where.epicId = epicId;
      console.log('🔍 [STACKS API] Filtering by epicId:', epicId);
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
      console.log('🔍 [STACKS API] Filtering by assigneeId:', assigneeId);
    }

    console.log('🔍 [STACKS API] Query where clause:', JSON.stringify(where, null, 2));

    // First check if there are any projects for this workspace
    // If no projects exist, return empty array (can't have stories without projects)
    let projectCount = 0;
    try {
      projectCount = await prisma.stacksProject.count({
        where: { workspaceId }
      });
    } catch (countError) {
      console.error('❌ [STACKS API] Error counting projects:', countError);
      // If counting fails, still try to query stories (maybe there are orphaned stories)
    }

    if (projectCount === 0) {
      console.log('ℹ️ [STACKS API] No projects found for workspace, returning empty stories array');
      return NextResponse.json({ stories: [] });
    }

    // Fetch stories with epic and assignee information
    // Use defensive select - try with optional columns first, fallback without them if they don't exist
    let stories;
    try {
      // First attempt: try with product and section columns (may not exist in production)
      stories = await prisma.stacksStory.findMany({
        where,
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
          // Don't select viewType - handle it separately if it exists
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
        },
        orderBy: [
          { createdAt: 'desc' },
          { priority: 'desc' }
        ]
      });
    } catch (queryError) {
      // Check if this is a P2022 error (column doesn't exist) for product or section
      const isColumnError = queryError && typeof queryError === 'object' && 'code' in queryError && (queryError as any).code === 'P2022';
      const columnName = isColumnError ? ((queryError as any).meta?.column_name || '').toLowerCase() : '';
      const isProductOrSectionError = isColumnError && (columnName.includes('product') || columnName.includes('section'));
      
      if (isProductOrSectionError) {
        console.warn('⚠️ [STACKS API] product/section columns missing, querying without them:', columnName);
        
        // Fallback: query without product and section columns
        try {
          stories = await prisma.stacksStory.findMany({
            where,
            select: {
              id: true,
              epicId: true,
              projectId: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              assigneeId: true,
              // product and section omitted - they don't exist in database
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
            },
            orderBy: [
              { createdAt: 'desc' },
              { priority: 'desc' }
            ]
          });
        } catch (fallbackError) {
          console.error('❌ [STACKS API] Fallback query without product/section also failed:', fallbackError);
          
          // If the nested project query fails, try a simpler query first to get project IDs
          try {
            const projects = await prisma.stacksProject.findMany({
              where: { workspaceId },
              select: { id: true }
            });
            
            if (projects.length === 0) {
              return NextResponse.json({ stories: [] });
            }
            
            const projectIds = projects.map(p => p.id);
            const simplifiedWhere = {
              projectId: { in: projectIds },
              ...(status && { status }),
              ...(epicId && { epicId }),
              ...(assigneeId && { assigneeId })
            };
            
            stories = await prisma.stacksStory.findMany({
              where: simplifiedWhere,
              select: {
                id: true,
                epicId: true,
                projectId: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                assigneeId: true,
                // product and section omitted - they don't exist in database
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
              },
              orderBy: [
                { createdAt: 'desc' },
                { priority: 'desc' }
              ]
            });
          } catch (simplifiedError) {
            console.error('❌ [STACKS API] Simplified query also failed:', simplifiedError);
            throw queryError; // Throw original error
          }
        }
      } else {
        // Not a product/section error - log and rethrow
        console.error('❌ [STACKS API] Error querying stories:', queryError);
        console.error('❌ [STACKS API] Query error details:', {
          message: queryError instanceof Error ? queryError.message : String(queryError),
          code: queryError && typeof queryError === 'object' && 'code' in queryError ? (queryError as any).code : 'unknown',
          meta: queryError && typeof queryError === 'object' && 'meta' in queryError ? (queryError as any).meta : undefined,
          where: JSON.stringify(where, null, 2)
        });
        throw queryError;
      }
    }

    console.log('📊 [STACKS API] Found', stories.length, 'stories for workspace', workspaceId);

    // Transform the data to match the expected format
    const transformedStories = stories.map(story => {
      try {
        // Safely handle assignee with null checks
        let assignee = null;
        if (story.assignee) {
          const firstName = story.assignee.firstName || '';
          const lastName = story.assignee.lastName || '';
          assignee = {
            id: story.assignee.id,
            name: `${firstName} ${lastName}`.trim() || 'Unknown',
            email: story.assignee.email || ''
          };
        }

        // Safely handle epic with null checks
        let epic = null;
        if (story.epic) {
          epic = {
            id: story.epic.id,
            title: story.epic.title || '',
            description: story.epic.description || ''
          };
        }

        // Safely handle project with null checks
        let project = null;
        if (story.project) {
          project = {
            id: story.project.id,
            name: story.project.name || ''
          };
        }

        return {
          id: story.id,
          title: story.title || '',
          description: story.description || '',
          status: story.status || 'todo',
          priority: story.priority || 'medium',
          viewType: 'main', // Always use 'main' as default - viewType column removed from queries
          product: story.product || null,
          section: story.section || null,
          assignee,
          epic,
          project,
          dueDate: null, // dueDate field doesn't exist in schema yet
          tags: [], // tags field doesn't exist in schema yet
          createdAt: story.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: story.updatedAt?.toISOString() || new Date().toISOString(),
          // Calculate time in current status (in days)
          timeInStatus: story.updatedAt ? Math.floor((Date.now() - new Date(story.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
        };
      } catch (transformError) {
        console.error(`❌ [STACKS API] Error transforming story ${story.id}:`, transformError);
        // Return a safe fallback story object
        return {
          id: story.id,
          title: story.title || 'Unknown',
          description: story.description || '',
          status: story.status || 'todo',
          priority: story.priority || 'medium',
          viewType: 'main', // Always use 'main' as default
          product: null,
          section: null,
          assignee: null,
          epic: null,
          project: null,
          dueDate: null,
          tags: [],
          createdAt: story.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: story.updatedAt?.toISOString() || new Date().toISOString(),
          timeInStatus: 0
        };
      }
    });

    console.log('✅ [STACKS API] Successfully transformed', transformedStories.length, 'stories');
    return NextResponse.json({ stories: transformedStories });

  } catch (error) {
    console.error('❌ [STACKS API] Error fetching stories:', error);
    console.error('❌ [STACKS API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
      workspaceId,
      errorObject: error
    });
    
    // Handle P2022 error (column does not exist)
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      
      if (prismaError.code === 'P2022') {
        const columnName = prismaError.meta?.column_name;
        console.error('❌ [STACKS API] P2022 Error - Column does not exist:', {
          columnName,
          tableName: prismaError.meta?.table_name,
          modelName: prismaError.meta?.modelName,
          fullMeta: prismaError.meta
        });
        
        // Return specific error with column name if available
        if (columnName) {
          return createErrorResponse(
            `Database column '${columnName}' does not exist. Please run database migrations.`,
            'SCHEMA_MISMATCH',
            500
          );
        } else {
          return createErrorResponse(
            'Database schema mismatch detected. Please run database migrations.',
            'SCHEMA_MISMATCH',
            500
          );
        }
      }
      
      // Log other Prisma errors
      console.error('❌ [STACKS API] Prisma error code:', prismaError.code);
      if (prismaError.meta) {
        console.error('❌ [STACKS API] Prisma error meta:', prismaError.meta);
      }
    }
    
    // Return detailed error for debugging (in development) or generic error (in production)
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error))
      : 'Internal server error';
    
    return NextResponse.json({ 
      error: errorMessage,
      code: error && typeof error === 'object' && 'code' in error ? (error as any).code : 'UNKNOWN_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let createData: any = {};
  
  try {
    // Use platform's unified authentication system
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

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ [STACKS API] Error parsing request body:', parseError);
      return createErrorResponse('Invalid request body', 'INVALID_BODY', 400);
    }
    const { title, description, status, priority, assigneeId, epicId, projectId, product, section } = body;

    if (!title) {
      return createErrorResponse('Title is required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    // Auto-create or get project for workspace
    let finalProjectId = projectId;
    if (!finalProjectId) {
      let project = await prisma.stacksProject.findFirst({
        where: { workspaceId: context.workspaceId }
      });
      
      if (!project) {
        project = await prisma.stacksProject.create({
          data: {
            workspaceId: context.workspaceId,
            name: 'Default Project',
            description: 'Default project for stacks'
          }
        });
      }
      finalProjectId = project.id;
    }

    // Build create data - only include defined fields, exclude undefined values
    const createData: any = {
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      projectId: finalProjectId
    };
    
    // Only include optional fields if they are provided and not undefined
    if (assigneeId !== undefined && assigneeId !== null) {
      createData.assigneeId = assigneeId;
    } else {
      createData.assigneeId = null;
    }
    
    if (epicId !== undefined && epicId !== null) {
      createData.epicId = epicId;
    } else {
      createData.epicId = null;
    }
    
    if (product !== undefined && product !== null) {
      createData.product = product;
    } else {
      createData.product = null;
    }
    
    if (section !== undefined && section !== null) {
      createData.section = section;
    } else {
      createData.section = null;
    }
    
    // viewType is not included - always defaults to 'main' in response

    const story = await prisma.stacksStory.create({
      data: createData,
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

    // Transform the story to include viewType and ensure consistent format
    const transformedStory = {
      ...story,
      viewType: 'main', // Always use 'main' as default - viewType column removed from queries
      assignee: story.assignee ? {
        id: story.assignee.id,
        name: `${story.assignee.firstName || ''} ${story.assignee.lastName || ''}`.trim() || 'Unknown',
        email: story.assignee.email || ''
      } : null,
      epic: story.epic ? {
        id: story.epic.id,
        title: story.epic.title || '',
        description: story.epic.description || ''
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name || ''
      } : null
    };

    return NextResponse.json({ story: transformedStory });

  } catch (error) {
    console.error('❌ [STACKS API] Error creating story:', error);
    
    // Handle P2022 error (column does not exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      const columnName = prismaError.meta?.column_name || 'unknown';
      console.error('❌ [STACKS API] P2022 Error - Column does not exist:', {
        columnName,
        meta: prismaError.meta,
        createDataKeys: Object.keys(createData)
      });
      
      return createErrorResponse(
        columnName !== 'unknown' 
          ? `Database column '${columnName}' does not exist. Please run database migrations.`
          : 'Database schema mismatch. Please run database migrations.',
        'SCHEMA_MISMATCH',
        500
      );
    }
    
    // Handle other errors - ensure we always return a response
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ [STACKS API] Error creating story (non-P2022):', {
      error: errorMessage,
      createDataKeys: Object.keys(createData),
      errorObject: error
    });
    
    return createErrorResponse(
      'Failed to create story. Please try again.',
      'STORY_CREATE_ERROR',
      500
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Use platform's unified authentication system
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

    const body = await request.json();
    const { id, title, description, status, priority, assigneeId, epicId, product, section } = body;

    if (!id) {
      return createErrorResponse('Story ID is required', 'MISSING_STORY_ID', 400);
    }

    // Build update data
    const updateData: any = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId !== undefined && { assigneeId }),
      ...(epicId !== undefined && { epicId }),
      ...(product !== undefined && { product }),
      ...(section !== undefined && { section }),
      updatedAt: new Date()
    };

    const story = await prisma.stacksStory.update({
      where: { id },
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

    // Transform the story to include viewType and ensure consistent format
    const transformedStory = {
      ...story,
      viewType: 'main', // Always use 'main' as default - viewType column removed from queries
      assignee: story.assignee ? {
        id: story.assignee.id,
        name: `${story.assignee.firstName || ''} ${story.assignee.lastName || ''}`.trim() || 'Unknown',
        email: story.assignee.email || ''
      } : null,
      epic: story.epic ? {
        id: story.epic.id,
        title: story.epic.title || '',
        description: story.epic.description || ''
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name || ''
      } : null
    };

    return NextResponse.json({ story: transformedStory });

  } catch (error) {
    console.error('❌ [STACKS API] Error updating story:', error);
    
    // Handle P2022 error (column does not exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      const columnName = prismaError.meta?.column_name || 'unknown';
      
      return createErrorResponse(
        columnName !== 'unknown'
          ? `Database column '${columnName}' does not exist. Please run database migrations.`
          : 'Database schema mismatch. Please run database migrations.',
        'SCHEMA_MISMATCH',
        500
      );
    }
    
    return createErrorResponse(
      'Failed to update story. Please try again.',
      'STORY_UPDATE_ERROR',
      500
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Use platform's unified authentication system
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return createErrorResponse('Story ID is required', 'MISSING_STORY_ID', 400);
    }

    await prisma.stacksStory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
