#!/usr/bin/env node

/**
 * Transfer all Pinpoint stacks to Adrata workspace and reassign to Ross
 * 
 * This script:
 * 1. Transfers all projects, stories, tasks, epochs, and epics from Pinpoint to Adrata workspace
 * 2. Reassigns all stories and tasks from Leonardo to Ross
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PINPOINT_WORKSPACE_ID = '01K90EQWJCCN2JDMRQF12F49GN';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const LEONARDO_EMAIL = 'leonardo@pinpoint-adrata.com';
const ROSS_EMAIL = 'ross@adrata.com';

async function transferAndReassignStacks() {
  try {
    console.log('Transferring Pinpoint stacks to Adrata workspace and reassigning to Ross...\n');
    
    // Step 1: Find users
    console.log('👤 Step 1: Finding users...');
    const leonardo = await prisma.users.findUnique({
      where: { email: LEONARDO_EMAIL }
    });
    
    const ross = await prisma.users.findUnique({
      where: { email: ROSS_EMAIL }
    });
    
    if (!leonardo) {
      console.error(`❌ Leonardo user not found: ${LEONARDO_EMAIL}`);
      return;
    }
    
    if (!ross) {
      console.error(`❌ Ross user not found: ${ROSS_EMAIL}`);
      return;
    }
    
    console.log(`✅ Found Leonardo: ${leonardo.name} (${leonardo.id})`);
    console.log(`✅ Found Ross: ${ross.name} (${ross.id})\n`);
    
    // Step 2: Verify workspaces exist
    console.log('🏢 Step 2: Verifying workspaces...');
    const pinpointWorkspace = await prisma.workspaces.findUnique({
      where: { id: PINPOINT_WORKSPACE_ID }
    });
    
    const adrataWorkspace = await prisma.workspaces.findUnique({
      where: { id: ADRATA_WORKSPACE_ID }
    });
    
    if (!pinpointWorkspace) {
      console.error(`❌ Pinpoint workspace not found: ${PINPOINT_WORKSPACE_ID}`);
      return;
    }
    
    if (!adrataWorkspace) {
      console.error(`❌ Adrata workspace not found: ${ADRATA_WORKSPACE_ID}`);
      return;
    }
    
    console.log(`✅ Found Pinpoint workspace: ${pinpointWorkspace.name} (${pinpointWorkspace.slug})`);
    console.log(`✅ Found Adrata workspace: ${adrataWorkspace.name} (${adrataWorkspace.slug})\n`);
    
    // Step 3: Find all Pinpoint projects
    console.log('📦 Step 3: Finding Pinpoint projects...');
    const pinpointProjects = await prisma.stacksProject.findMany({
      where: { workspaceId: PINPOINT_WORKSPACE_ID }
    });
    
    console.log(`✅ Found ${pinpointProjects.length} Pinpoint project(s)`);
    
    if (pinpointProjects.length === 0) {
      console.log('No Pinpoint projects found, nothing to transfer');
      return;
    }
    
    // Display project names
    pinpointProjects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} (${project.id})`);
    });
    console.log();
    
    // Step 4: Transfer projects to Adrata workspace
    console.log('📦 Step 4: Transferring projects to Adrata workspace...');
    const projectMapping = new Map(); // Map old project ID to new project ID
    
    for (const project of pinpointProjects) {
      // Check if a project with the same name already exists in Adrata
      let adrataProject = await prisma.stacksProject.findFirst({
        where: {
          workspaceId: ADRATA_WORKSPACE_ID,
          name: project.name
        }
      });
      
      if (!adrataProject) {
        // Create new project in Adrata workspace
        adrataProject = await prisma.stacksProject.create({
          data: {
            workspaceId: ADRATA_WORKSPACE_ID,
            name: project.name,
            description: project.description
          }
        });
        console.log(`   ✅ Created project: ${project.name} (${adrataProject.id})`);
      } else {
        console.log(`   ✅ Using existing project: ${project.name} (${adrataProject.id})`);
      }
      
      projectMapping.set(project.id, adrataProject.id);
    }
    console.log();
    
    // Step 5: Transfer epochs, epics, stories, and tasks
    const pinpointProjectIds = pinpointProjects.map(p => p.id);
    
    // Find all epochs
    console.log('📚 Step 5a: Finding and transferring epochs...');
    const epochs = await prisma.stacksEpoch.findMany({
      where: {
        projectId: { in: pinpointProjectIds }
      }
    });
    console.log(`   Found ${epochs.length} epochs`);
    
    if (epochs.length > 0) {
      const BATCH_SIZE = 50;
      let transferredEpochs = 0;
      
      for (let i = 0; i < epochs.length; i += BATCH_SIZE) {
        const batch = epochs.slice(i, i + BATCH_SIZE);
        
        await prisma.$transaction(async (tx) => {
          for (const epoch of batch) {
            const newProjectId = projectMapping.get(epoch.projectId);
            if (newProjectId) {
              await tx.stacksEpoch.update({
                where: { id: epoch.id },
                data: { projectId: newProjectId }
              });
            }
          }
        });
        
        transferredEpochs += batch.length;
        console.log(`   Transferred ${transferredEpochs}/${epochs.length} epochs...`);
      }
      console.log(`   ✅ Successfully transferred ${transferredEpochs} epochs\n`);
    } else {
      console.log();
    }
    
    // Find all epics
    console.log('📚 Step 5b: Finding and transferring epics...');
    const epics = await prisma.stacksEpic.findMany({
      where: {
        projectId: { in: pinpointProjectIds }
      }
    });
    console.log(`   Found ${epics.length} epics`);
    
    if (epics.length > 0) {
      const BATCH_SIZE = 50;
      let transferredEpics = 0;
      
      for (let i = 0; i < epics.length; i += BATCH_SIZE) {
        const batch = epics.slice(i, i + BATCH_SIZE);
        
        await prisma.$transaction(async (tx) => {
          for (const epic of batch) {
            const newProjectId = projectMapping.get(epic.projectId);
            if (newProjectId) {
              await tx.stacksEpic.update({
                where: { id: epic.id },
                data: { projectId: newProjectId }
              });
            }
          }
        });
        
        transferredEpics += batch.length;
        console.log(`   Transferred ${transferredEpics}/${epics.length} epics...`);
      }
      console.log(`   ✅ Successfully transferred ${transferredEpics} epics\n`);
    } else {
      console.log();
    }
    
    // Find all stories
    console.log('📚 Step 5c: Finding and transferring stories...');
    const stories = await prisma.stacksStory.findMany({
      where: {
        projectId: { in: pinpointProjectIds }
      }
    });
    console.log(`   Found ${stories.length} stories`);
    
    if (stories.length > 0) {
      const BATCH_SIZE = 100;
      let transferredStories = 0;
      let reassignedStories = 0;
      
      for (let i = 0; i < stories.length; i += BATCH_SIZE) {
        const batch = stories.slice(i, i + BATCH_SIZE);
        
        await prisma.$transaction(async (tx) => {
          for (const story of batch) {
            const newProjectId = projectMapping.get(story.projectId);
            if (newProjectId) {
              const updateData = { projectId: newProjectId };
              
              // Reassign from Leonardo to Ross
              if (story.assigneeId === leonardo.id) {
                updateData.assigneeId = ross.id;
                reassignedStories++;
              }
              
              await tx.stacksStory.update({
                where: { id: story.id },
                data: updateData
              });
            }
          }
        });
        
        transferredStories += batch.length;
        console.log(`   Transferred ${transferredStories}/${stories.length} stories...`);
      }
      console.log(`   ✅ Successfully transferred ${transferredStories} stories`);
      console.log(`   ✅ Reassigned ${reassignedStories} stories from Leonardo to Ross\n`);
    } else {
      console.log();
    }
    
    // Find all tasks
    console.log('📋 Step 5d: Finding and transferring tasks...');
    const tasks = await prisma.stacksTask.findMany({
      where: {
        projectId: { in: pinpointProjectIds }
      }
    });
    console.log(`   Found ${tasks.length} tasks`);
    
    if (tasks.length > 0) {
      const BATCH_SIZE = 100;
      let transferredTasks = 0;
      let reassignedTasks = 0;
      
      for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        const batch = tasks.slice(i, i + BATCH_SIZE);
        
        await prisma.$transaction(async (tx) => {
          for (const task of batch) {
            const newProjectId = projectMapping.get(task.projectId);
            if (newProjectId) {
              const updateData = { projectId: newProjectId };
              
              // Reassign from Leonardo to Ross
              if (task.assigneeId === leonardo.id) {
                updateData.assigneeId = ross.id;
                reassignedTasks++;
              }
              
              await tx.stacksTask.update({
                where: { id: task.id },
                data: updateData
              });
            }
          }
        });
        
        transferredTasks += batch.length;
        console.log(`   Transferred ${transferredTasks}/${tasks.length} tasks...`);
      }
      console.log(`   ✅ Successfully transferred ${transferredTasks} tasks`);
      console.log(`   ✅ Reassigned ${reassignedTasks} tasks from Leonardo to Ross\n`);
    } else {
      console.log();
    }
    
    // Step 6: Verify transfer
    console.log('✅ Step 6: Verifying transfer...');
    
    // Count stacks in Adrata workspace
    const adrataProjects = await prisma.stacksProject.findMany({
      where: { workspaceId: ADRATA_WORKSPACE_ID }
    });
    const adrataProjectIds = adrataProjects.map(p => p.id);
    
    const adrataEpochs = await prisma.stacksEpoch.findMany({
      where: { projectId: { in: adrataProjectIds } }
    });
    
    const adrataEpics = await prisma.stacksEpic.findMany({
      where: { projectId: { in: adrataProjectIds } }
    });
    
    const adrataStories = await prisma.stacksStory.findMany({
      where: { projectId: { in: adrataProjectIds } }
    });
    
    const adrataTasks = await prisma.stacksTask.findMany({
      where: { projectId: { in: adrataProjectIds } }
    });
    
    const rossStories = adrataStories.filter(s => s.assigneeId === ross.id);
    const rossTasks = adrataTasks.filter(t => t.assigneeId === ross.id);
    
    console.log(`\n📊 Adrata workspace now has:`);
    console.log(`   Projects: ${adrataProjects.length}`);
    console.log(`   Epochs: ${adrataEpochs.length}`);
    console.log(`   Epics: ${adrataEpics.length}`);
    console.log(`   Stories: ${adrataStories.length}`);
    console.log(`   Tasks: ${adrataTasks.length}`);
    console.log(`   Total: ${adrataEpochs.length + adrataEpics.length + adrataStories.length + adrataTasks.length} stacks`);
    console.log(`\n👤 Ross is assigned to:`);
    console.log(`   Stories: ${rossStories.length}`);
    console.log(`   Tasks: ${rossTasks.length}`);
    console.log(`   Total: ${rossStories.length + rossTasks.length} items`);
    
    // Check if Pinpoint is now empty
    const remainingPinpointStories = await prisma.stacksStory.findMany({
      where: {
        projectId: { in: pinpointProjectIds }
      }
    });
    
    const remainingPinpointTasks = await prisma.stacksTask.findMany({
      where: {
        projectId: { in: pinpointProjectIds }
      }
    });
    
    console.log(`\n📊 Pinpoint workspace now has:`);
    console.log(`   Stories: ${remainingPinpointStories.length}`);
    console.log(`   Tasks: ${remainingPinpointTasks.length}`);
    
    if (remainingPinpointStories.length === 0 && remainingPinpointTasks.length === 0) {
      console.log(`\n✅ All stacks successfully transferred from Pinpoint to Adrata!`);
      console.log(`✅ All stacks reassigned from Leonardo to Ross!`);
    } else {
      console.log(`\n⚠️  Warning: Some stacks still remain in Pinpoint`);
    }
    
  } catch (error) {
    console.error('❌ Error transferring stacks:', error);
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

transferAndReassignStacks()
  .then(() => {
    console.log('\n✅ Transfer completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Transfer failed:', error);
    process.exit(1);
  });

