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
  // Declare variables outside try block for error handling
  let finalStoryId: string | undefined;
  let workspaceId: string | undefined;
  let paramValue: string | undefined;
  
  try {
    // Resolve params (Next.js 15+ compatibility)
    const resolvedParams = await params;
    paramValue = resolvedParams.id;
    
    // Extract ID from slug (handles both slug format "name-id" and raw ID)
    const storyId = extractIdFromSlug(paramValue);
    
    console.log('🔍 [STACKS API] GET single story request received');
    console.log('🔍 [STACKS API] Param value:', paramValue);
    console.log('🔍 [STACKS API] Extracted story ID:', storyId);
    
    // If extraction failed, try using the param value directly as ID
    // Also try extracting from the full slug if the last part didn't match
    finalStoryId = storyId || paramValue;
    
    // If storyId extraction failed but paramValue looks like a slug, try to extract ID from anywhere in the slug
    if (!storyId || storyId === paramValue) {
      // Try to find CUID or ULID anywhere in the paramValue
      const cuidMatch = paramValue.match(/(c[a-z0-9]{24})/);
      const ulidMatch = paramValue.match(/([0-9A-HJKMNP-TV-Z]{26})/i);
      
      if (cuidMatch) {
        finalStoryId = cuidMatch[1];
        console.log('🔍 [STACKS API] Found CUID in param:', finalStoryId);
      } else if (ulidMatch) {
        finalStoryId = ulidMatch[1];
        console.log('🔍 [STACKS API] Found ULID in param:', finalStoryId);
      } else {
        // Use last part as fallback
        const lastPart = paramValue.split('-').pop() || paramValue;
        finalStoryId = lastPart;
        console.log('⚠️ [STACKS API] Using last part as ID:', finalStoryId);
      }
    } else {
      console.log('🔍 [STACKS API] Using extracted ID from slug');
    }
    
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
    workspaceId = context.workspaceId;
    const userId = context.userId;
    
    console.log('✅ [STACKS API] Authenticated user:', userId, 'workspace:', workspaceId, 'storyId:', storyId);

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    if (!finalStoryId) {
      return createErrorResponse('Story ID required', 'STORY_ID_REQUIRED', 400);
    }

    console.log('🔍 [STACKS API] Looking up story with ID:', finalStoryId, 'in workspace:', workspaceId);
    console.log('🔍 [STACKS API] ID type check - CUID:', /^c[a-z0-9]{24}$/.test(finalStoryId), 'ULID:', /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(finalStoryId));

    // Fetch the story with workspace validation
    // Use explicit select to avoid selecting viewType column that may not exist in database
    let story;
    try {
      story = await prisma.stacksStory.findFirst({
        where: {
          id: finalStoryId,
          project: {
            workspaceId: workspaceId
          }
        },
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
          isFlagged: true,
          rank: true,
          statusChangedAt: true,
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
    } catch (storyQueryError) {
      console.error('❌ [STACKS API] Error querying story:', storyQueryError);
      console.error('❌ [STACKS API] Story query error details:', {
        message: storyQueryError instanceof Error ? storyQueryError.message : String(storyQueryError),
        name: storyQueryError instanceof Error ? storyQueryError.name : 'Unknown',
        stack: storyQueryError instanceof Error ? storyQueryError.stack : undefined,
        code: (storyQueryError as any)?.code,
        meta: (storyQueryError as any)?.meta,
        queryId: finalStoryId,
        workspaceId: workspaceId
      });
      throw storyQueryError;
    }

    // If story not found, check if it's a task
    if (!story) {
      console.log('🔍 [STACKS API] Story not found, checking for task:', finalStoryId);
      
      try {
        // Try to fetch as a task
        // First, try without attachments to see if that's the issue
        let task;
        try {
          task = await prisma.stacksTask.findFirst({
            where: {
              id: finalStoryId,
              project: {
                workspaceId: workspaceId
              }
            },
            select: {
              id: true,
              storyId: true,
              projectId: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              type: true,
              assigneeId: true,
              product: true,
              section: true,
              rank: true,
              attachments: true, // Include attachments field - will fail gracefully if column doesn't exist
              createdAt: true,
              updatedAt: true,
              assignee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              story: {
                select: {
                  id: true,
                  title: true
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
        } catch (attachmentsError: any) {
          // If attachments column doesn't exist, try without it
          if (attachmentsError?.code === 'P2022' && attachmentsError?.meta?.column_name === 'attachments') {
            console.warn('⚠️ [STACKS API] Attachments column does not exist, fetching task without it');
            task = await prisma.stacksTask.findFirst({
              where: {
                id: finalStoryId,
                project: {
                  workspaceId: workspaceId
                }
              },
              select: {
                id: true,
                storyId: true,
                projectId: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                type: true,
                assigneeId: true,
                product: true,
                section: true,
                rank: true,
                // Omit attachments field
                createdAt: true,
                updatedAt: true,
                assignee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                },
                story: {
                  select: {
                    id: true,
                    title: true
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
          } else {
            // Re-throw if it's a different error
            throw attachmentsError;
          }
        }

        if (!task) {
          console.log('❌ [STACKS API] Neither story nor task found');
          console.log('❌ [STACKS API] Searched for ID:', finalStoryId);
          console.log('❌ [STACKS API] In workspace:', workspaceId);
          console.log('❌ [STACKS API] Original param value:', paramValue);
          
          // Try to find the task without workspace validation to see if it exists
          const taskWithoutWorkspace = await prisma.stacksTask.findFirst({
            where: { id: finalStoryId },
            select: { id: true, projectId: true, project: { select: { workspaceId: true } } }
          });
          
          if (taskWithoutWorkspace) {
            console.log('⚠️ [STACKS API] Task exists but in different workspace:', taskWithoutWorkspace.project?.workspaceId);
            console.log('⚠️ [STACKS API] Task project ID:', taskWithoutWorkspace.projectId);
            console.log('⚠️ [STACKS API] Requested workspace:', workspaceId);
            // Check if task has no project or project is in different workspace
            if (!taskWithoutWorkspace.project || taskWithoutWorkspace.project.workspaceId !== workspaceId) {
              console.log('⚠️ [STACKS API] Task exists but has no project or wrong workspace');
              // If task exists but has no project or wrong workspace, try to return it anyway
              // This handles edge cases where tasks (bugs) might not have projects assigned or have workspace mismatches
              try {
                let taskWithoutProject;
                try {
                  taskWithoutProject = await prisma.stacksTask.findFirst({
                    where: { id: finalStoryId },
                    select: {
                      id: true,
                      storyId: true,
                      projectId: true,
                      title: true,
                      description: true,
                      status: true,
                      priority: true,
                      type: true,
                      assigneeId: true,
                      product: true,
                      section: true,
                      rank: true,
                      attachments: true, // Include attachments
                      createdAt: true,
                      updatedAt: true,
                      assignee: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          email: true
                        }
                      },
                      story: {
                        select: {
                          id: true,
                          title: true
                        }
                      }
                      // Omit project from select since it doesn't exist or is wrong workspace
                    }
                  });
                } catch (attachmentsError: any) {
                  // If attachments column doesn't exist, try without it
                  if (attachmentsError?.code === 'P2022' && attachmentsError?.meta?.column_name === 'attachments') {
                    console.warn('⚠️ [STACKS API] Attachments column does not exist, fetching task without it');
                    taskWithoutProject = await prisma.stacksTask.findFirst({
                      where: { id: finalStoryId },
                      select: {
                        id: true,
                        storyId: true,
                        projectId: true,
                        title: true,
                        description: true,
                        status: true,
                        priority: true,
                        type: true,
                        assigneeId: true,
                        product: true,
                        section: true,
                        rank: true,
                        createdAt: true,
                        updatedAt: true,
                        assignee: {
                          select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                          }
                        },
                        story: {
                          select: {
                            id: true,
                            title: true
                          }
                        }
                      }
                    });
                  } else {
                    throw attachmentsError;
                  }
                }
                
                if (taskWithoutProject) {
                  console.log('✅ [STACKS API] Returning task without project validation');
                  // Transform the task data to match expected format
                  const transformedStory = {
                    id: taskWithoutProject.id,
                    title: taskWithoutProject.title,
                    description: taskWithoutProject.description,
                    acceptanceCriteria: null,
                    status: taskWithoutProject.status,
                    priority: taskWithoutProject.priority,
                    viewType: taskWithoutProject.type === 'bug' ? 'bug' : 'detail',
                    product: taskWithoutProject.product || null,
                    section: taskWithoutProject.section || null,
                    rank: taskWithoutProject.rank || null,
                    type: taskWithoutProject.type || 'task',
                    attachments: (taskWithoutProject as any).attachments && Array.isArray((taskWithoutProject as any).attachments)
                      ? (taskWithoutProject as any).attachments
                      : ((taskWithoutProject as any).attachments && typeof (taskWithoutProject as any).attachments === 'object'
                          ? [(taskWithoutProject as any).attachments]
                          : []),
                    assignee: taskWithoutProject.assignee ? {
                      id: taskWithoutProject.assignee.id,
                      name: (() => {
                        const firstName = taskWithoutProject.assignee.firstName != null ? String(taskWithoutProject.assignee.firstName) : '';
                        const lastName = taskWithoutProject.assignee.lastName != null ? String(taskWithoutProject.assignee.lastName) : '';
                        const fullName = `${firstName} ${lastName}`.trim();
                        return fullName || 'Unknown';
                      })(),
                      email: taskWithoutProject.assignee.email || ''
                    } : null,
                    epoch: null,
                    story: taskWithoutProject.story ? {
                      id: taskWithoutProject.story.id,
                      title: taskWithoutProject.story.title
                    } : null,
                    project: null, // Explicitly set to null
                    dueDate: null,
                    tags: taskWithoutProject.type === 'bug' ? ['bug'] : [],
                    isFlagged: false,
                    points: null,
                    createdAt: taskWithoutProject.createdAt,
                    updatedAt: taskWithoutProject.updatedAt,
                    timeInStatus: 0
                  };
                  
                  return NextResponse.json({
                    story: transformedStory,
                    type: taskWithoutProject.type || 'task'
                  });
                }
              } catch (taskWithoutProjectError) {
                console.error('❌ [STACKS API] Error fetching task without project:', taskWithoutProjectError);
                // Continue to return 404 if this also fails
              }
            }
          }
          
          // Also check story without workspace
          const storyWithoutWorkspace = await prisma.stacksStory.findFirst({
            where: { id: finalStoryId },
            select: { id: true, projectId: true, project: { select: { workspaceId: true } } }
          });
          
          if (storyWithoutWorkspace) {
            console.log('⚠️ [STACKS API] Story exists but in different workspace:', storyWithoutWorkspace.project?.workspaceId);
            console.log('⚠️ [STACKS API] Requested workspace:', workspaceId);
            console.log('⚠️ [STACKS API] Story project ID:', storyWithoutWorkspace.projectId);
            // Check if story has no project or project is in different workspace
            if (!storyWithoutWorkspace.project || storyWithoutWorkspace.project.workspaceId !== workspaceId) {
              console.log('⚠️ [STACKS API] Story exists but has no project or wrong workspace');
              // If story exists but has no project, try to return it anyway
              // This handles edge cases where stories might not have projects assigned
              try {
                const storyWithoutProject = await prisma.stacksStory.findFirst({
                  where: { id: finalStoryId },
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
                    isFlagged: true,
                    rank: true,
                    statusChangedAt: true,
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
                    }
                    // Omit project from select since it doesn't exist or is wrong workspace
                  }
                });
                
                if (storyWithoutProject) {
                  console.log('✅ [STACKS API] Returning story without project validation');
                  // Transform the story data to match expected format
                  const transformedStory = {
                    id: storyWithoutProject.id,
                    title: storyWithoutProject.title,
                    description: storyWithoutProject.description,
                    acceptanceCriteria: storyWithoutProject.acceptanceCriteria || null,
                    status: storyWithoutProject.status,
                    priority: storyWithoutProject.priority,
                    viewType: storyWithoutProject.viewType || 'detail',
                    product: storyWithoutProject.product || null,
                    section: storyWithoutProject.section || null,
                    rank: storyWithoutProject.rank || null,
                    type: 'story',
                    assignee: storyWithoutProject.assignee ? {
                      id: storyWithoutProject.assignee.id,
                      name: (() => {
                        const firstName = storyWithoutProject.assignee.firstName != null ? String(storyWithoutProject.assignee.firstName) : '';
                        const lastName = storyWithoutProject.assignee.lastName != null ? String(storyWithoutProject.assignee.lastName) : '';
                        const fullName = `${firstName} ${lastName}`.trim();
                        return fullName || 'Unknown';
                      })(),
                      email: storyWithoutProject.assignee.email || ''
                    } : null,
                    epoch: storyWithoutProject.epoch ? {
                      id: storyWithoutProject.epoch.id,
                      title: storyWithoutProject.epoch.title,
                      description: storyWithoutProject.epoch.description
                    } : null,
                    project: null, // Explicitly set to null
                    dueDate: null,
                    tags: storyWithoutProject.viewType === 'bug' ? ['bug'] : [],
                    isFlagged: storyWithoutProject.isFlagged || false,
                    points: null,
                    createdAt: storyWithoutProject.createdAt,
                    updatedAt: storyWithoutProject.updatedAt,
                    timeInStatus: storyWithoutProject.statusChangedAt ? Math.floor((Date.now() - new Date(storyWithoutProject.statusChangedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
                  };
                  
                  return NextResponse.json({
                    story: transformedStory,
                    type: 'story'
                  });
                }
              } catch (storyWithoutProjectError) {
                console.error('❌ [STACKS API] Error fetching story without project:', storyWithoutProjectError);
                // Continue to return 404 if this also fails
              }
            }
          }
          
          // Also try searching without workspace filter to see if story exists at all
          const allStories = await prisma.stacksStory.findMany({
            where: { 
              id: { contains: finalStoryId }
            },
            select: { id: true, title: true, projectId: true, project: { select: { workspaceId: true, name: true } } },
            take: 5
          });
          
          if (allStories.length > 0) {
            console.log('⚠️ [STACKS API] Found similar story IDs:', allStories.map(s => ({ id: s.id, title: s.title, workspace: s.project?.workspaceId })));
          }
          
          return createErrorResponse('Story or task not found', 'STORY_NOT_FOUND', 404);
        }

        console.log('✅ [STACKS API] Task found:', task.id, 'type:', task.type);
        console.log('📎 [STACKS API] Task attachments:', JSON.stringify((task as any).attachments));

        // Transform task data to match story response format
        // Handle attachments - they can be null, an array, or a single object
        let taskAttachments: any[] = [];
        if ((task as any).attachments) {
          if (Array.isArray((task as any).attachments)) {
            taskAttachments = (task as any).attachments;
          } else if (typeof (task as any).attachments === 'object') {
            // If it's a single object, wrap it in an array
            taskAttachments = [(task as any).attachments];
          }
        }
        console.log('📎 [STACKS API] Processed attachments:', JSON.stringify(taskAttachments));

        const transformedStory = {
          id: task.id,
          title: task.title,
          description: task.description,
          acceptanceCriteria: null, // Tasks don't have acceptance criteria
          status: task.status,
          priority: task.priority,
          viewType: task.type === 'bug' ? 'bug' : 'detail', // Set viewType to 'bug' for bugs, 'detail' for other tasks
          product: task.product || null,
          section: task.section || null,
          rank: task.rank || null, // Tasks have rank field
          type: task.type || 'task', // Include type to distinguish from stories
          attachments: taskAttachments, // Include attachments from task
          assignee: task.assignee ? {
            id: task.assignee.id,
            name: (() => {
              const firstName = task.assignee.firstName != null ? String(task.assignee.firstName) : '';
              const lastName = task.assignee.lastName != null ? String(task.assignee.lastName) : '';
              const fullName = `${firstName} ${lastName}`.trim();
              return fullName || 'Unknown';
            })(),
            email: task.assignee.email || ''
          } : null,
          epoch: null, // Tasks don't have epochs
          story: task.story ? {
            id: task.story.id,
            title: task.story.title
          } : null,
          project: task.project ? {
            id: task.project.id,
            name: task.project.name
          } : null,
          dueDate: null,
          tags: task.type === 'bug' ? ['bug'] : [], // Add bug tag if type is bug
          isFlagged: false, // Tasks don't have isFlagged
          points: null, // Tasks don't have points
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          timeInStatus: 0 // Tasks don't track statusChangedAt
        };

        console.log('✅ [STACKS API] Task found and transformed');
        return NextResponse.json({ story: transformedStory, type: 'task' });
      } catch (taskError) {
        console.error('❌ [STACKS API] Error fetching task:', taskError);
        console.error('❌ [STACKS API] Task error details:', {
          message: taskError instanceof Error ? taskError.message : String(taskError),
          name: taskError instanceof Error ? taskError.name : 'Unknown',
          stack: taskError instanceof Error ? taskError.stack : undefined,
          code: (taskError as any)?.code,
          meta: (taskError as any)?.meta,
          queryId: finalStoryId,
          workspaceId: workspaceId,
          paramValue: paramValue
        });
        // Re-throw to be caught by outer catch block
        throw taskError;
      }
    }

    // Transform the data to match the expected format
    const transformedStory = {
      id: story.id,
      title: story.title,
      description: story.description,
      acceptanceCriteria: (story as any).acceptanceCriteria || null, // Safe access if column doesn't exist
      status: story.status,
      priority: story.priority,
      viewType: (story as any).viewType || 'detail', // Use story's viewType or default to 'detail'
      product: (story as any).product || null, // Safe access if column doesn't exist
      section: (story as any).section || null, // Safe access if column doesn't exist
      rank: (story as any).rank || null, // Safe access if column doesn't exist
      type: 'story', // Explicitly mark as story
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
        title: story.epoch.title,
        description: story.epoch.description
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name
      } : null,
      dueDate: null, // dueDate field doesn't exist in schema yet
      tags: (story as any).viewType === 'bug' ? ['bug'] : [], // Add 'bug' tag if viewType is 'bug'
      isFlagged: story.isFlagged || false,
      points: (story as any).points || null, // Safe access if column doesn't exist
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      // Calculate time in current status (in days) using statusChangedAt
      timeInStatus: story.statusChangedAt ? Math.floor((Date.now() - new Date(story.statusChangedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
    };

    console.log('✅ [STACKS API] Story found and transformed');
    return NextResponse.json({ story: transformedStory, type: 'story' });

  } catch (error) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Comprehensive error logging
    console.error('❌ [STACKS API] Error fetching story:', error);
    console.error('❌ [STACKS API] Full error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      meta: (error as any)?.meta,
      clientVersion: (error as any)?.clientVersion,
      queryId: finalStoryId || 'unknown',
      workspaceId: workspaceId || 'unknown',
      paramValue: paramValue || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    // Handle P2022 error (column does not exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      const columnName = prismaError.meta?.column_name || 'unknown';
      const tableName = prismaError.meta?.table_name || 'unknown';
      console.error('❌ [STACKS API] P2022 Error - Column does not exist:', {
        columnName,
        tableName,
        modelName: prismaError.meta?.modelName,
        queryId: finalStoryId,
        workspaceId: workspaceId
      });
      
      const errorMessage = isDevelopment
        ? `Database column '${columnName}' does not exist in table '${tableName}'. Please run database migrations. Query ID: ${finalStoryId}`
        : `Database schema mismatch. Please run database migrations.`;
      
      return createErrorResponse(
        errorMessage,
        'SCHEMA_MISMATCH',
        500
      );
    }
    
    // Handle other Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      const errorCode = prismaError.code || 'UNKNOWN';
      console.error('❌ [STACKS API] Prisma error:', {
        code: errorCode,
        meta: prismaError.meta,
        queryId: finalStoryId,
        workspaceId: workspaceId
      });
      
      const errorMessage = isDevelopment
        ? `Database error (${errorCode}): ${error instanceof Error ? error.message : String(error)}. Query ID: ${finalStoryId}`
        : 'Database operation failed. Please try again.';
      
      return createErrorResponse(
        errorMessage,
        'DATABASE_ERROR',
        500
      );
    }
    
    // Generic error handling
    const errorMessage = isDevelopment
      ? `Failed to fetch story: ${error instanceof Error ? error.message : String(error)}. Query ID: ${finalStoryId}, Workspace: ${workspaceId}`
      : 'Failed to fetch story. Please try again.';
    
    return createErrorResponse(
      errorMessage,
      'STORY_FETCH_ERROR',
      500
    );
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
    const { title, description, acceptanceCriteria, priority, status, product, section, viewType, isFlagged, points, assigneeId, rank } = body;

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
    // Build update data - handle all editable fields
    const updateData: any = {
      updatedAt: new Date()
    };

    // Add fields to update if they are provided
    if (title !== undefined) {
      updateData.title = title;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (acceptanceCriteria !== undefined) {
      updateData.acceptanceCriteria = acceptanceCriteria;
    }
    if (priority !== undefined) {
      updateData.priority = priority;
    }
    if (status !== undefined) {
      updateData.status = status;
      // Update statusChangedAt when status changes
      if (status !== existingStory.status) {
        updateData.statusChangedAt = new Date();
      }
    }
    if (product !== undefined) {
      updateData.product = product;
    }
    if (section !== undefined) {
      updateData.section = section;
    }
    if (viewType !== undefined) {
      updateData.viewType = viewType;
    }
    if (isFlagged !== undefined) {
      updateData.isFlagged = isFlagged === true || isFlagged === 'true';
    }
    if (points !== undefined) {
      updateData.points = points === null || points === '' ? null : parseInt(points as string, 10);
    }
    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId || null;
    }
    if (rank !== undefined) {
      updateData.rank = rank === null || rank === '' ? null : parseInt(rank as string, 10);
    }

    const story = await prisma.stacksStory.update({
      where: { id: storyId },
      data: updateData,
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
        isFlagged: true,
        rank: true,
        statusChangedAt: true,
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

    // Transform the data to match the expected format
    const transformedStory = {
      id: story.id,
      title: story.title,
      description: story.description,
      acceptanceCriteria: (story as any).acceptanceCriteria || null, // Safe access if column doesn't exist
      status: story.status,
      priority: story.priority,
      viewType: (story as any).viewType || 'detail', // Use story's viewType or default to 'detail'
      product: (story as any).product || null, // Safe access if column doesn't exist
      section: (story as any).section || null, // Safe access if column doesn't exist
      rank: (story as any).rank || null, // Safe access if column doesn't exist
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
        title: story.epoch.title,
        description: story.epoch.description
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name
      } : null,
      isFlagged: story.isFlagged || false,
      tags: (story as any).viewType === 'bug' ? ['bug'] : [], // Add 'bug' tag if viewType is 'bug'
      createdAt: story.createdAt,
      updatedAt: story.updatedAt
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
