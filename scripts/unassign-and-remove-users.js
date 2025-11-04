#!/usr/bin/env node

/**
 * Unassign Users and Remove Dan Darceystone
 * 
 * This script:
 * 1. Unassigns specified users from all stories and tasks in Notary Everyday workspace
 * 2. Removes Dan Darceystone from the system completely
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Users to unassign (but not remove)
const USERS_TO_UNASSIGN = [
  '01K75WEXZMG7D2GGFQZNV9KMY5', // Todd Nestor
  '01K7B327HWN9G6KGWA97S1TK43', // dan
  '01K8JQE5PKZPWPBY6MNNGXG2VH'  // Adrata
];

// User to remove completely
const USER_TO_REMOVE = '01K7CY1M53T87RKKKRKCRY3GMH'; // Dan Darceystone

async function findNotaryEverydayWorkspace() {
  console.log('🔍 Finding Notary Everyday workspace...');
  
  let workspace = await prisma.workspaces.findUnique({
    where: { slug: 'notary-everyday' }
  });
  
  if (!workspace) {
    workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
        ],
        isActive: true
      }
    });
  }
  
  if (!workspace) {
    throw new Error('Notary Everyday workspace not found!');
  }
  
  console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
  return workspace;
}

async function unassignUsersFromStories(workspaceId, userIds) {
  console.log('📝 Unassigning users from stories...\n');
  
  const projects = await prisma.stacksProject.findMany({
    where: { workspaceId }
  });
  
  let totalUnassigned = 0;
  
  for (const project of projects) {
    for (const userId of userIds) {
      const stories = await prisma.stacksStory.findMany({
        where: {
          projectId: project.id,
          assigneeId: userId
        },
        select: {
          id: true,
          title: true,
          assigneeId: true
        }
      });
      
      if (stories.length > 0) {
        console.log(`   Found ${stories.length} stories assigned to user ${userId} in project ${project.name}`);
        
        for (const story of stories) {
          try {
            await prisma.stacksStory.update({
              where: { id: story.id },
              data: {
                assigneeId: null,
                updatedAt: new Date()
              }
            });
            totalUnassigned++;
            console.log(`   ✅ Unassigned story "${story.title}" (${story.id})`);
          } catch (error) {
            console.error(`   ❌ Failed to unassign story ${story.id}: ${error.message}`);
          }
        }
      }
    }
  }
  
  console.log(`\n✅ Unassigned ${totalUnassigned} stories\n`);
  return totalUnassigned;
}

async function unassignUsersFromTasks(workspaceId, userIds) {
  console.log('📝 Unassigning users from tasks...\n');
  
  const projects = await prisma.stacksProject.findMany({
    where: { workspaceId }
  });
  
  let totalUnassigned = 0;
  
  for (const project of projects) {
    for (const userId of userIds) {
      const tasks = await prisma.stacksTask.findMany({
        where: {
          projectId: project.id,
          assigneeId: userId
        },
        select: {
          id: true,
          title: true,
          assigneeId: true
        }
      });
      
      if (tasks.length > 0) {
        console.log(`   Found ${tasks.length} tasks assigned to user ${userId} in project ${project.name}`);
        
        for (const task of tasks) {
          try {
            await prisma.stacksTask.update({
              where: { id: task.id },
              data: {
                assigneeId: null,
                updatedAt: new Date()
              }
            });
            totalUnassigned++;
            console.log(`   ✅ Unassigned task "${task.title}" (${task.id})`);
          } catch (error) {
            console.error(`   ❌ Failed to unassign task ${task.id}: ${error.message}`);
          }
        }
      }
    }
  }
  
  console.log(`\n✅ Unassigned ${totalUnassigned} tasks\n`);
  return totalUnassigned;
}

async function removeUserFromSystem(userId) {
  console.log(`🗑️  Removing user ${userId} from system...\n`);
  
  try {
    // First, get user info for logging
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    if (!user) {
      console.log(`   ⚠️  User ${userId} not found in database`);
      return;
    }
    
    console.log(`   User to remove: ${user.name || user.email || `${user.firstName} ${user.lastName}`.trim()}`);
    
    // Check for user_roles entries
    const userRoles = await prisma.user_roles.findMany({
      where: { userId: userId }
    });
    console.log(`   Found ${userRoles.length} user_roles entries`);
    
    // Check for workspace_users entries
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: { userId: userId }
    });
    console.log(`   Found ${workspaceUsers.length} workspace_users entries`);
    
    // Check for stacks assignments
    const storiesWithAssignee = await prisma.stacksStory.findMany({
      where: { assigneeId: userId },
      select: { id: true, title: true }
    });
    console.log(`   Found ${storiesWithAssignee.length} stories with this assignee`);
    
    const tasksWithAssignee = await prisma.stacksTask.findMany({
      where: { assigneeId: userId },
      select: { id: true, title: true }
    });
    console.log(`   Found ${tasksWithAssignee.length} tasks with this assignee`);
    
    // Unassign from stories first
    if (storiesWithAssignee.length > 0) {
      console.log(`   Unassigning from ${storiesWithAssignee.length} stories...`);
      await prisma.stacksStory.updateMany({
        where: { assigneeId: userId },
        data: {
          assigneeId: null,
          updatedAt: new Date()
        }
      });
    }
    
    // Unassign from tasks first
    if (tasksWithAssignee.length > 0) {
      console.log(`   Unassigning from ${tasksWithAssignee.length} tasks...`);
      await prisma.stacksTask.updateMany({
        where: { assigneeId: userId },
        data: {
          assigneeId: null,
          updatedAt: new Date()
        }
      });
    }
    
    // Delete user_roles entries
    if (userRoles.length > 0) {
      console.log(`   Deleting ${userRoles.length} user_roles entries...`);
      await prisma.user_roles.deleteMany({
        where: { userId: userId }
      });
    }
    
    // Delete workspace_users entries
    if (workspaceUsers.length > 0) {
      console.log(`   Deleting ${workspaceUsers.length} workspace_users entries...`);
      await prisma.workspace_users.deleteMany({
        where: { userId: userId }
      });
    }
    
    // Finally, delete the user
    console.log(`   Deleting user from users table...`);
    await prisma.users.delete({
      where: { id: userId }
    });
    
    console.log(`\n✅ Successfully removed user ${userId} from system\n`);
    
  } catch (error) {
    console.error(`❌ Error removing user ${userId}: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting user unassignment and removal\n');
    console.log('='.repeat(80));
    
    // Find workspace
    const workspace = await findNotaryEverydayWorkspace();
    
    // Step 1: Unassign users from stories and tasks
    console.log('='.repeat(80));
    console.log('STEP 1: Unassigning users from stories and tasks\n');
    console.log('Users to unassign:');
    for (const userId of USERS_TO_UNASSIGN) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { name: true, email: true, firstName: true, lastName: true }
      });
      const userName = user?.name || user?.email || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || userId;
      console.log(`   - ${userName} (${userId})`);
    }
    console.log();
    
    const storiesUnassigned = await unassignUsersFromStories(workspace.id, USERS_TO_UNASSIGN);
    const tasksUnassigned = await unassignUsersFromTasks(workspace.id, USERS_TO_UNASSIGN);
    
    // Step 2: Remove Dan Darceystone from system
    console.log('='.repeat(80));
    console.log('STEP 2: Removing Dan Darceystone from system\n');
    await removeUserFromSystem(USER_TO_REMOVE);
    
    // Summary
    console.log('='.repeat(80));
    console.log('📊 SUMMARY\n');
    console.log(`   Stories unassigned: ${storiesUnassigned}`);
    console.log(`   Tasks unassigned: ${tasksUnassigned}`);
    console.log(`   Users unassigned: ${USERS_TO_UNASSIGN.length}`);
    console.log(`   User removed from system: 1 (Dan Darceystone)\n`);
    console.log('✅ Process completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

