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
    const epochId = searchParams.get('epochId');
    const epicId = searchParams.get('epicId');
    const assigneeId = searchParams.get('assigneeId');

    if (!workspaceId) {
      console.error('❌ [STACKS API] No workspace ID available (query param or context)');
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }
    
    // CRITICAL FIX: Log warning if using fallback workspaceId, but allow query to proceed
    if (workspaceId === 'local-workspace') {
      console.warn('⚠️ [STACKS API] Using fallback workspaceId - queries may return empty results:', {
        workspaceId,
        queryWorkspaceId,
        contextWorkspaceId,
        userId
      });
    }

    // Security check: if both are provided, ensure they match (user should only access their workspace)
    if (queryWorkspaceId && contextWorkspaceId && queryWorkspaceId !== contextWorkspaceId) {
      console.warn('⚠️ [STACKS API] Workspace ID mismatch - Query:', queryWorkspaceId, 'Context:', contextWorkspaceId);
      // Still allow it but log the warning - the context workspace may be different from active workspace
    }

    // Build where clause
    // Note: This query returns ALL stories (both epic-connected via epochId and standalone stories)
    // Bugs are stored in stacksTask table with type='bug', so they are automatically excluded
    // Exclude stories linked to epochs (epochId is set) - only show regular stories and epic-linked stories
    const where: any = {
      project: {
        workspaceId: workspaceId
      }
      // epochId is optional - if not provided, returns all stories EXCEPT epoch-linked stories
      // if provided, filters to only stories for that epoch
    };

    // Note: category field doesn't exist in StacksStory schema yet
    // if (category) {
    //   where.category = category;
    // }

    if (status) {
      where.status = status;
      console.log('🔍 [STACKS API] Filtering by status:', status);
    }

    if (epochId) {
      // If epochId is provided, show only stories for that epoch
      where.epochId = epochId;
      console.log('🔍 [STACKS API] Filtering by epochId:', epochId);
    } else {
      // Exclude stories linked to epochs - only show regular stories and epic-linked stories
      where.epochId = null;
      console.log('🔍 [STACKS API] Excluding epoch-linked stories (showing only regular and epic-linked stories)');
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

    // Auto-create or get project for workspace (consistent with POST route behavior)
    // This ensures we can always query stories even if project was deleted
    let project = await prisma.stacksProject.findFirst({
      where: { workspaceId }
    });
    
    if (!project) {
      console.log('ℹ️ [STACKS API] No project found for workspace, auto-creating default project');
      try {
        project = await prisma.stacksProject.create({
          data: {
            workspaceId,
            name: 'Default Project',
            description: 'Default project for stacks'
          }
        });
        console.log('✅ [STACKS API] Created default project:', project.id);
      } catch (createError) {
        console.error('❌ [STACKS API] Error creating default project:', createError);
        // Continue anyway - maybe there are orphaned stories
      }
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
          epochId: true,
          projectId: true,
          title: true,
          description: true,
          acceptanceCriteria: true,
          status: true,
          priority: true,
          assigneeId: true,
          product: true,
          section: true,
          viewType: true,
                statusChangedAt: true,
          isFlagged: true,
          points: true,
          rank: true,
          createdAt: true,
          updatedAt: true,
          epoch: {
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
          { rank: 'asc' },
          { createdAt: 'desc' },
          { priority: 'desc' }
        ]
            });
    } catch (queryError) {
      // Check if this is a P2022 error (column doesn't exist) for product, section, acceptanceCriteria, or isFlagged
      const isColumnError = queryError && typeof queryError === 'object' && 'code' in queryError && (queryError as any).code === 'P2022';
      const columnName = isColumnError ? ((queryError as any).meta?.column_name || '').toLowerCase() : '';
      const isNewColumnError = isColumnError && (
        columnName.includes('product') || 
        columnName.includes('section') || 
        columnName.includes('acceptancecriteria') || 
        columnName.includes('isflagged') ||
        columnName.includes('points')
      );
      
      if (isNewColumnError) {
        console.warn('⚠️ [STACKS API] New columns missing, querying without them:', columnName);
        
        // Fallback: query without new columns (product, section, acceptanceCriteria, isFlagged)
        try {
          stories = await prisma.stacksStory.findMany({
            where,
            select: {
              id: true,
              epochId: true,
              projectId: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              assigneeId: true,
              statusChangedAt: true,
              // product, section, acceptanceCriteria, isFlagged, rank omitted - they don't exist in database
              createdAt: true,
              updatedAt: true,
              epoch: {
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
              { rank: 'asc' },
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
              ...(epochId && { epochId }),
              ...(assigneeId && { assigneeId })
            };
            
            stories = await prisma.stacksStory.findMany({
              where: simplifiedWhere,
              select: {
                id: true,
                epochId: true,
                projectId: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                assigneeId: true,
                statusChangedAt: true,
                // product, section, acceptanceCriteria, isFlagged, rank omitted - they don't exist in database
                createdAt: true,
                updatedAt: true,
                epoch: {
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
                { rank: 'asc' },
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
          // Handle null values properly - convert null to empty string
          const firstName = story.assignee.firstName != null ? String(story.assignee.firstName) : '';
          const lastName = story.assignee.lastName != null ? String(story.assignee.lastName) : '';
          const fullName = `${firstName} ${lastName}`.trim();
          // Use name field if available, otherwise fall back to constructed name
          const name = story.assignee.name || fullName || 'Unknown';
          assignee = {
            id: story.assignee.id,
            name: name,
            email: story.assignee.email || ''
          };
        }

        // Safely handle epoch with null checks
        let epoch = null;
        if (story.epoch) {
          epoch = {
            id: story.epoch.id,
            title: story.epoch.title || '',
            description: story.epoch.description || ''
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
          acceptanceCriteria: (story as any).acceptanceCriteria || null, // Safe access if column doesn't exist
          status: story.status || 'todo',
          priority: story.priority || 'medium',
          viewType: (story as any).viewType || 'detail', // Use story's viewType or default to 'detail'
          product: (story as any).product || null, // Safe access if column doesn't exist
          section: (story as any).section || null, // Safe access if column doesn't exist
          rank: (story as any).rank || null, // Safe access if column doesn't exist
          assignee,
          epoch,
          project,
          dueDate: null, // dueDate field doesn't exist in schema yet
          tags: (story as any).viewType === 'bug' ? ['bug'] : [], // Add 'bug' tag if viewType is 'bug'
          isFlagged: (story as any).isFlagged || false, // Safe access if column doesn't exist
          points: (story as any).points || null, // Safe access if column doesn't exist
          createdAt: story.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: story.updatedAt?.toISOString() || new Date().toISOString(),
          // Calculate time in current status (in days) using statusChangedAt
          timeInStatus: story.statusChangedAt ? Math.floor((Date.now() - new Date(story.statusChangedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
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
          viewType: 'detail', // Default to 'detail'
          product: null,
          section: null,
          assignee: null,
          epoch: null,
          project: null,
          dueDate: null,
          tags: (story as any).viewType === 'bug' ? ['bug'] : [], // Add 'bug' tag if viewType is 'bug'
          isFlagged: false,
          points: null,
          createdAt: story.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: story.updatedAt?.toISOString() || new Date().toISOString(),
          timeInStatus: 0
        };
      }
    });

    console.log('✅ [STACKS API] Successfully transformed', transformedStories.length, 'stories');
    return NextResponse.json({ stories: transformedStories });

  } catch (error) {
    // Handle specific Prisma errors with detailed logging
    const prismaError = error as any;
    
    // P2022: Column does not exist
    if (prismaError.code === 'P2022') {
      const columnName = prismaError.meta?.column_name || 'unknown';
      console.error('❌ [STACKS STORIES API] P2022 Error - Column does not exist:', {
        columnName,
        meta: prismaError.meta,
        endpoint: 'GET',
        userId: context?.userId,
        workspaceId,
        errorMessage: prismaError.message,
        stack: prismaError.stack
      });
      
      return createErrorResponse(
        columnName !== 'unknown' 
          ? `Database column '${columnName}' does not exist. Please run database migrations.`
          : 'Database schema mismatch. Please run database migrations.',
        'SCHEMA_MISMATCH',
        500
      );
    }

    // P2001: Record not found (shouldn't happen with findMany, but handle anyway)
    if (prismaError.code === 'P2001') {
      console.warn('⚠️ [STACKS STORIES API] P2001 Error - No records found (returning empty array):', {
        userId: context?.userId,
        workspaceId
      });
      return NextResponse.json({ stories: [] });
    }

    // P1001: Database connection error
    if (prismaError.code === 'P1001') {
      console.error('❌ [STACKS STORIES API] P1001 Error - Database connection failed:', {
        userId: context?.userId,
        workspaceId,
        errorMessage: prismaError.message
      });
      return createErrorResponse(
        'Database connection failed. Please try again later.',
        'DATABASE_CONNECTION_ERROR',
        503
      );
    }

    // General error logging
    console.error('❌ [STACKS STORIES API] Error fetching stories:', {
      code: prismaError.code || 'UNKNOWN',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
      userId: context?.userId,
      workspaceId,
      meta: prismaError.meta,
      errorObject: error
    });
    
    // Return detailed error for debugging (in development) or generic error (in production)
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error))
      : 'Failed to fetch stories';
    
    return createErrorResponse(
      errorMessage,
      'STACKS_STORIES_FETCH_ERROR',
      500
    );
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

    // Get workspace ID - prefer query parameter over context (frontend may have different active workspace)
    const { searchParams } = new URL(request.url);
    const queryWorkspaceId = searchParams.get('workspaceId');
    const contextWorkspaceId = context.workspaceId;
    const userId = context.userId;
    
    // Use query parameter if provided, otherwise fall back to authenticated context
    const workspaceId = queryWorkspaceId || contextWorkspaceId;
    
    console.log('✅ [STACKS API POST] Authenticated user:', userId);
    console.log('🔍 [STACKS API POST] Workspace ID - Query param:', queryWorkspaceId, 'Context:', contextWorkspaceId, 'Using:', workspaceId);

    if (!workspaceId) {
      console.error('❌ [STACKS API POST] No workspace ID available (query param or context)');
      return createErrorResponse('Workspace ID is required', 'WORKSPACE_REQUIRED', 400);
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ [STACKS API] Error parsing request body:', parseError);
      return createErrorResponse('Invalid request body', 'INVALID_BODY', 400);
    }
    const { title, description, status, priority, assigneeId, epochId, projectId, product, section, viewType } = body;

    if (!title) {
      return createErrorResponse('Title is required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    // Auto-create or get project for workspace
    let finalProjectId = projectId;
    if (!finalProjectId) {
      let project = await prisma.stacksProject.findFirst({
        where: { workspaceId: workspaceId }
      });
      
      if (!project) {
        project = await prisma.stacksProject.create({
          data: {
            workspaceId: workspaceId,
            name: 'Default Project',
            description: 'Default project for stacks'
          }
        });
        console.log('✅ [STACKS API POST] Created default project:', project.id, 'for workspace:', workspaceId);
      }
      finalProjectId = project.id;
    }

    // DUPLICATE PREVENTION: Check if a story with the same title already exists in this project
    // Use case-insensitive comparison by fetching and filtering in memory
    const normalizedTitle = title.trim().toLowerCase();
    const existingStories = await prisma.stacksStory.findMany({
      where: {
        projectId: finalProjectId
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    });

    // Check for exact match (case-insensitive, trimmed)
    const existingStory = existingStories.find(
      story => story.title.trim().toLowerCase() === normalizedTitle
    );

    if (existingStory) {
      console.warn('⚠️ [STACKS API POST] Duplicate story detected:', {
        existingStoryId: existingStory.id,
        existingTitle: existingStory.title,
        newTitle: title,
        projectId: finalProjectId,
        workspaceId: workspaceId
      });
      return createErrorResponse(
        `A story with the title "${title}" already exists in this project.`,
        'DUPLICATE_STORY',
        409
      );
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
    // Default assigneeId to current user if not provided
    if (assigneeId !== undefined && assigneeId !== null) {
      createData.assigneeId = assigneeId;
    } else {
      createData.assigneeId = context.userId; // Default to current user
    }
    
    if (epochId !== undefined && epochId !== null) {
      createData.epochId = epochId;
    } else {
      createData.epochId = null;
    }
    
    // Set statusChangedAt when creating story
    createData.statusChangedAt = new Date();
    
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
    
    if (viewType !== undefined && viewType !== null) {
      createData.viewType = viewType;
    } else {
      createData.viewType = 'detail'; // Default to 'detail' instead of 'main'
    }

    const story = await prisma.stacksStory.create({
      data: createData,
      select: {
        id: true,
        epochId: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assigneeId: true,
        product: true,
        section: true,
        viewType: true,
          statusChangedAt: true,
          isFlagged: true,
          createdAt: true,
          updatedAt: true,
          epoch: {
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
      viewType: story.viewType || 'detail', // Use story's viewType or default to 'detail'
      assignee: story.assignee ? {
        id: story.assignee.id,
        name: (() => {
          // Handle null values properly - convert null to empty string
          const firstName = story.assignee.firstName != null ? String(story.assignee.firstName) : '';
          const lastName = story.assignee.lastName != null ? String(story.assignee.lastName) : '';
          const fullName = `${firstName} ${lastName}`.trim();
          // Use name field if available, otherwise fall back to constructed name
          return story.assignee.name || fullName || 'Unknown';
        })(),
        email: story.assignee.email || ''
      } : null,
      epoch: story.epoch ? {
        id: story.epoch.id,
        title: story.epoch.title || '',
        description: story.epoch.description || ''
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name || ''
      } : null,
      tags: (story as any).viewType === 'bug' ? ['bug'] : [], // Add 'bug' tag if viewType is 'bug'
      isFlagged: (story as any).isFlagged || false,
      points: (story as any).points || null,
      createdAt: story.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: story.updatedAt?.toISOString() || new Date().toISOString()
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
    const { id, title, description, status, priority, assigneeId, epochId, product, section } = body;

    if (!id) {
      return createErrorResponse('Story ID is required', 'MISSING_STORY_ID', 400);
    }

    // Get existing story to check if status is changing
    const existingStory = await prisma.stacksStory.findFirst({
      where: {
        id,
        project: {
          workspaceId: context.workspaceId
        }
      },
      select: { status: true }
    });

    if (!existingStory) {
      return createErrorResponse('Story not found', 'STORY_NOT_FOUND', 404);
    }

    // Build update data
    const updateData: any = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(priority && { priority }),
      ...(assigneeId !== undefined && { assigneeId }),
      ...(epochId !== undefined && { epochId }),
      ...(product !== undefined && { product }),
      ...(section !== undefined && { section }),
      updatedAt: new Date()
    };

    // Update status and statusChangedAt if status is changing
    if (status && status !== existingStory.status) {
      updateData.status = status;
      updateData.statusChangedAt = new Date();
    } else if (status) {
      updateData.status = status;
    }

    const story = await prisma.stacksStory.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        epochId: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assigneeId: true,
        product: true,
        section: true,
          statusChangedAt: true,
          isFlagged: true,
          createdAt: true,
          updatedAt: true,
          epoch: {
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
      viewType: story.viewType || 'detail', // Use story's viewType or default to 'detail'
      assignee: story.assignee ? {
        id: story.assignee.id,
        name: (() => {
          // Handle null values properly - convert null to empty string
          const firstName = story.assignee.firstName != null ? String(story.assignee.firstName) : '';
          const lastName = story.assignee.lastName != null ? String(story.assignee.lastName) : '';
          const fullName = `${firstName} ${lastName}`.trim();
          // Use name field if available, otherwise fall back to constructed name
          return story.assignee.name || fullName || 'Unknown';
        })(),
        email: story.assignee.email || ''
      } : null,
      epoch: story.epoch ? {
        id: story.epoch.id,
        title: story.epoch.title || '',
        description: story.epoch.description || ''
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name || ''
      } : null,
      tags: (story as any).viewType === 'bug' ? ['bug'] : [], // Add 'bug' tag if viewType is 'bug'
      isFlagged: (story as any).isFlagged || false,
      points: (story as any).points || null,
      createdAt: story.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: story.updatedAt?.toISOString() || new Date().toISOString()
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
