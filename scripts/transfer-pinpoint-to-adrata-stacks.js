#!/usr/bin/env node

/**
 * Transfer all Pinpoint stacks to Adrata workspace
 * 
 * This script moves all stories and tasks from Pinpoint workspace to Adrata workspace
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PINPOINT_WORKSPACE_ID = '01K90EQWJCCN2JDMRQF12F49GN';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function transferStacks() {
  try {
    console.log('Transferring Pinpoint stacks to Adrata workspace...\n');
    
    // Verify workspaces exist
    const pinpointWorkspace = await prisma.workspaces.findUnique({
      where: { id: PINPOINT_WORKSPACE_ID }
    });
    
    const adrataWorkspace = await prisma.workspaces.findUnique({
      where: { id: ADRATA_WORKSPACE_ID }
    });
    
    if (!pinpointWorkspace) {
      console.error(`Pinpoint workspace not found: ${PINPOINT_WORKSPACE_ID}`);
      return;
    }
    
    if (!adratWorkspace) {
      console.error(`Adrata workspace not found: ${ADRATA_WORKSPACE_ID}`);
      return;
    }
    
    console.log(`Found Pinpoint workspace: ${pinpointWorkspace.name} (${pinpointWorkspace.slug})`);
    console.log(`Found Adrata workspace: ${adratWorkspace.name} (${adratWorkspace.slug})\n`);
    
    // Get or create Adrata project
    let adrataProject = await prisma.stacksProject.findFirst({
      where: { workspaceId: ADRATA_WORKSPACE_ID }
    });
    
    if (!adratProject) {
      console.log('Creating default project for Adrata workspace...');
      adrataProject = await prisma.stacksProject.create({
        data: {
          workspaceId: ADRATA_WORKSPACE_ID,
          name: 'Default Project',
          description: 'Default project for stacks'
        }
      });
      console.log(`Created project: ${adratProject.name} (${adratProject.id})\n`);
    } else {
      console.log(`Using existing Adrata project: ${adratProject.name} (${adratProject.id})\n`);
    }
    
    // Find all Pinpoint projects
    const pinpointProjects = await prisma.stacksProject.findMany({
      where: { workspaceId: PINPOINT_WORKSPACE_ID }
    });
    
    console.log(`Found ${pinpointProjects.length} Pinpoint project(s)`);
    
    if (pinpointProjects.length === 0) {
      console.log('No Pinpoint projects found, nothing to transfer');
      return;
    }
    
    const pinpointProjectIds = pinpointProjects.map(p => p.id);
    
    // Find all Pinpoint stories
    const pinpointStories = await prisma.stacksStory.findMany({
      where: {
        projectId: {
          in: pinpointProjectIds
        }
      }
    });
    
    console.log(`Found ${pinpointStories.length} Pinpoint stories`);
    
    // Find all Pinpoint tasks
    const pinpointTasks = await prisma.stacksTask.findMany({
      where: {
        projectId: {
          in: pinpointProjectIds
        }
      }
    });
    
    console.log(`Found ${pinpointTasks.length} Pinpoint tasks\n`);
    
    if (pinpointStories.length === 0 && pinpointTasks.length === 0) {
      console.log('No stacks found to transfer');
      return;
    }
    
    // Transfer stories using batch update (much more efficient)
    if (pinpointStories.length > 0) {
      console.log(`Transferring ${pinpointStories.length} stories...`);
      
      const storyIds = pinpointStories.map(s => s.id);
      
      // Process in batches to avoid overwhelming the database
      const BATCH_SIZE = 100;
      let transferredStories = 0;
      
      for (let i = 0; i < storyIds.length; i += BATCH_SIZE) {
        const batch = storyIds.slice(i, i + BATCH_SIZE);
        
        try {
          await prisma.$transaction(async (tx) => {
            await tx.stacksStory.updateMany({
              where: {
                id: { in: batch }
              },
              data: {
                projectId: adrataProject.id
              }
            });
          }, {
            timeout: 30000 // 30 second timeout per batch
          });
          
          transferredStories += batch.length;
          console.log(`  Transferred ${transferredStories}/${pinpointStories.length} stories...`);
        } catch (error) {
          console.error(`  Error transferring story batch (${i + 1}-${Math.min(i + BATCH_SIZE, storyIds.length)}):`, error.message);
          // Continue with next batch instead of failing completely
        }
        
        // Small delay between batches to prevent connection pool exhaustion
        if (i + BATCH_SIZE < storyIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Successfully transferred ${transferredStories} stories\n`);
    }
    
    // Transfer tasks using batch update
    if (pinpointTasks.length > 0) {
      console.log(`Transferring ${pinpointTasks.length} tasks...`);
      
      const taskIds = pinpointTasks.map(t => t.id);
      
      // Process in batches to avoid overwhelming the database
      const BATCH_SIZE = 100;
      let transferredTasks = 0;
      
      for (let i = 0; i < taskIds.length; i += BATCH_SIZE) {
        const batch = taskIds.slice(i, i + BATCH_SIZE);
        
        try {
          await prisma.$transaction(async (tx) => {
            await tx.stacksTask.updateMany({
              where: {
                id: { in: batch }
              },
              data: {
                projectId: adrataProject.id
              }
            });
          }, {
            timeout: 30000 // 30 second timeout per batch
          });
          
          transferredTasks += batch.length;
          console.log(`  Transferred ${transferredTasks}/${pinpointTasks.length} tasks...`);
        } catch (error) {
          console.error(`  Error transferring task batch (${i + 1}-${Math.min(i + BATCH_SIZE, taskIds.length)}):`, error.message);
          // Continue with next batch instead of failing completely
        }
        
        // Small delay between batches to prevent connection pool exhaustion
        if (i + BATCH_SIZE < taskIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Successfully transferred ${transferredTasks} tasks\n`);
    }
    
    // Verify transfer - use join query instead of nested relation
    const adrataStories = await prisma.stacksStory.findMany({
      where: {
        projectId: adrataProject.id
      }
    });
    
    const adrataTasks = await prisma.stacksTask.findMany({
      where: {
        projectId: adrataProject.id
      }
    });
    
    console.log(`Adrata workspace now has:`);
    console.log(`   ${adratStories.length} stories`);
    console.log(`   ${adratTasks.length} tasks`);
    console.log(`   Total: ${adratStories.length + adrataTasks.length} stacks\n`);
    
    // Check if Pinpoint is now empty
    const remainingPinpointStories = await prisma.stacksStory.findMany({
      where: {
        projectId: {
          in: pinpointProjectIds
        }
      }
    });
    
    const remainingPinpointTasks = await prisma.stacksTask.findMany({
      where: {
        projectId: {
          in: pinpointProjectIds
        }
      }
    });
    
    console.log(`Pinpoint workspace now has:`);
    console.log(`   ${remainingPinpointStories.length} stories`);
    console.log(`   ${remainingPinpointTasks.length} tasks`);
    
    if (remainingPinpointStories.length === 0 && remainingPinpointTasks.length === 0) {
      console.log(`\nAll stacks successfully transferred from Pinpoint to Adrata!`);
    } else {
      console.log(`\nWarning: Some stacks still remain in Pinpoint`);
    }
    
  } catch (error) {
    console.error('Error transferring stacks:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

transferStacks()
  .then(() => {
    console.log('\nTransfer completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTransfer failed:', error);
    process.exit(1);
  });
