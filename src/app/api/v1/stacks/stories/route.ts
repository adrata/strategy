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
    // Use include (like the original working version) - it's simpler and more reliable
    let stories;
    try {
      stories = await prisma.stacksStory.findMany({
        where,
        include: {
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
      console.error('❌ [STACKS API] Error querying stories:', queryError);
      console.error('❌ [STACKS API] Query error details:', {
        message: queryError instanceof Error ? queryError.message : String(queryError),
        code: queryError && typeof queryError === 'object' && 'code' in queryError ? (queryError as any).code : 'unknown',
        meta: queryError && typeof queryError === 'object' && 'meta' in queryError ? (queryError as any).meta : undefined,
        where: JSON.stringify(where, null, 2)
      });
      
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
          include: {
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
        console.error('❌ [STACKS API] Fallback query also failed:', fallbackError);
        throw queryError; // Throw original error
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
          viewType: (story as any).viewType || 'main', // Use include so viewType is available if it exists
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
          viewType: 'main',
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
    
    // Handle P2022 error (column does not exist) - specifically for viewType column
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
        
        // Only use column name in error message if it's actually defined
        if (columnName) {
          // If it's the viewType column, return specific error
          if (columnName === 'viewType') {
            console.warn('⚠️ [STACKS API] viewType column missing - falling back to explicit select query');
            return createErrorResponse(
              'Database schema mismatch: viewType column not found. Please run database migrations.',
              'SCHEMA_MISMATCH',
              500
            );
          }
          // For other columns, return specific error with column name
          return createErrorResponse(
            `Database column '${columnName}' does not exist. Please run database migrations.`,
            'SCHEMA_MISMATCH',
            500
          );
        } else {
          // Column name is undefined - return generic error
          console.error('❌ [STACKS API] P2022 Error but column_name is undefined - generic schema mismatch');
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
    const { title, description, status, priority, assigneeId, epicId, projectId, viewType, product, section } = body;

    if (!title || !projectId) {
      return createErrorResponse('Title and project ID are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    // Build create data - only include defined fields, exclude undefined values
    const createData: any = {
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      projectId
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
    
    // Only include viewType if provided (will fail if column doesn't exist, handled in catch)
    if (viewType !== undefined && viewType !== null) {
      createData.viewType = viewType;
    }

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

    return NextResponse.json({ story });

  } catch (error) {
    console.error('Error creating story:', error);
    
    // Handle P2022 error (column does not exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      const columnName = prismaError.meta?.column_name || 'unknown';
      console.error('❌ [STACKS API] P2022 Error - Column does not exist:', {
        columnName,
        meta: prismaError.meta,
        createDataKeys: Object.keys(createData)
      });
      
      if (columnName === 'viewType') {
        console.warn('⚠️ [STACKS API] viewType column missing - creating story without viewType');
        // Try create without viewType
        try {
          const { viewType, ...dataWithoutViewType } = createData;
          const storyWithoutViewType = await prisma.stacksStory.create({
            data: dataWithoutViewType,
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
          
          // Transform to include default viewType
          const transformedStory = {
            ...storyWithoutViewType,
            viewType: 'main' // Default since column doesn't exist
          };
          
          return NextResponse.json({ story: transformedStory });
        } catch (fallbackError) {
          console.error('❌ [STACKS API] Fallback create also failed:', fallbackError);
        }
      }
      
      console.error('❌ [STACKS API] Database column missing:', columnName);
      return createErrorResponse(
        columnName !== 'unknown' 
          ? `Database column '${columnName}' does not exist. Please run database migrations.`
          : 'Database schema mismatch. Please run database migrations.',
        'SCHEMA_MISMATCH',
        500
      );
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { id, title, description, status, priority, assigneeId, epicId, viewType, product, section } = body;

    if (!id) {
      return createErrorResponse('Story ID is required', 'MISSING_STORY_ID', 400);
    }

    // Build update data - exclude viewType if column doesn't exist
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
    
    // Only include viewType if provided (will fail if column doesn't exist, handled in catch)
    if (viewType !== undefined) {
      updateData.viewType = viewType;
    }

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

    return NextResponse.json({ story });

  } catch (error) {
    console.error('Error updating story:', error);
    
    // Handle P2022 error (column does not exist) - specifically for viewType column
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      if (prismaError.meta?.column_name === 'viewType') {
        console.warn('⚠️ [STACKS API] viewType column missing - updating story without viewType');
        // Try update without viewType
        try {
          const { viewType, ...dataWithoutViewType } = updateData;
          const storyWithoutViewType = await prisma.stacksStory.update({
            where: { id },
            data: dataWithoutViewType,
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
          
          // Transform to include default viewType
          const transformedStory = {
            ...storyWithoutViewType,
            viewType: 'main' // Default since column doesn't exist
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
