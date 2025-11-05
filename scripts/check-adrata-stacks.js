#!/usr/bin/env node

/**
 * Check Adrata Workspace Stacks Data
 * 
 * This script checks if there are stacks (stories, tasks, projects) for the Adrata workspace
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const ADRATA_SLUG = 'adrata';

async function checkAdrataStacks() {
  try {
    console.log('🔍 Checking Adrata workspace stacks data...\n');
    
    // First, verify the workspace exists
    const workspace = await prisma.workspaces.findUnique({
      where: { id: ADRATA_WORKSPACE_ID }
    });
    
    if (!workspace) {
      console.log(`❌ Workspace with ID ${ADRATA_WORKSPACE_ID} not found!`);
      console.log('\n🔍 Searching for workspaces with "adrata" in name or slug...');
      const similarWorkspaces = await prisma.workspaces.findMany({
        where: {
          OR: [
            { name: { contains: 'adrata', mode: 'insensitive' } },
            { slug: { contains: 'adrata', mode: 'insensitive' } }
          ]
        },
        select: { id: true, name: true, slug: true }
      });
      
      if (similarWorkspaces.length > 0) {
        console.log('Found workspaces:');
        similarWorkspaces.forEach(ws => {
          console.log(`  - ${ws.name} (slug: ${ws.slug}, id: ${ws.id})`);
        });
      } else {
        console.log('No workspaces found with "adrata" in name or slug');
      }
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (slug: ${workspace.slug})`);
    console.log(`   ID: ${workspace.id}\n`);
    
    // Check projects
    const projects = await prisma.stacksProject.findMany({
      where: { workspaceId: ADRATA_WORKSPACE_ID },
      select: {
        id: true,
        name: true,
        description: true,
        workspaceId: true,
        createdAt: true
      }
    });
    
    console.log(`📋 Projects for Adrata workspace: ${projects.length}`);
    projects.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.name}`);
      console.log(`     Description: ${project.description || 'none'}`);
      console.log(`     ID: ${project.id}`);
      console.log(`     Created: ${project.createdAt}`);
    });
    console.log('');
    
    if (projects.length === 0) {
      console.log('⚠️  No projects found! This is why no stacks are showing.');
      console.log('   The API auto-creates a default project, but stories need to be associated with a project.\n');
    }
    
    // Check stories
    const stories = await prisma.stacksStory.findMany({
      where: {
        project: {
          workspaceId: ADRATA_WORKSPACE_ID
        }
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        epoch: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📝 Stories for Adrata workspace: ${stories.length}`);
    if (stories.length > 0) {
      stories.slice(0, 10).forEach((story, index) => {
        console.log(`  ${index + 1}. ${story.title || 'Untitled'}`);
        console.log(`     Status: ${story.status}`);
        console.log(`     Priority: ${story.priority || 'none'}`);
        console.log(`     Project: ${story.project?.name || 'none'}`);
        console.log(`     Epoch: ${story.epoch?.title || 'none'}`);
        console.log(`     Assignee: ${story.assignee ? `${story.assignee.firstName} ${story.assignee.lastName}` : 'unassigned'}`);
        console.log(`     ID: ${story.id}`);
        console.log('');
      });
      
      if (stories.length > 10) {
        console.log(`  ... and ${stories.length - 10} more stories\n`);
      }
    } else {
      console.log('⚠️  No stories found for Adrata workspace!\n');
    }
    
    // Check tasks
    const tasks = await prisma.stacksTask.findMany({
      where: {
        project: {
          workspaceId: ADRATA_WORKSPACE_ID
        }
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        story: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🔧 Tasks for Adrata workspace: ${tasks.length}`);
    if (tasks.length > 0) {
      tasks.slice(0, 10).forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.title || 'Untitled'}`);
        console.log(`     Status: ${task.status}`);
        console.log(`     Type: ${task.type || 'none'}`);
        console.log(`     Project: ${task.project?.name || 'none'}`);
        console.log(`     Story: ${task.story?.title || 'none'}`);
        console.log(`     Assignee: ${task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'unassigned'}`);
        console.log(`     ID: ${task.id}`);
        console.log('');
      });
      
      if (tasks.length > 10) {
        console.log(`  ... and ${tasks.length - 10} more tasks\n`);
      }
    } else {
      console.log('⚠️  No tasks found for Adrata workspace!\n');
    }
    
    // Check epics/epochs
    const epochs = await prisma.stacksEpoch.findMany({
      where: {
        project: {
          workspaceId: ADRATA_WORKSPACE_ID
        }
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🎯 Epics/Epochs for Adrata workspace: ${epochs.length}`);
    if (epochs.length > 0) {
      epochs.forEach((epoch, index) => {
        console.log(`  ${index + 1}. ${epoch.title || 'Untitled'}`);
        console.log(`     Project: ${epoch.project?.name || 'none'}`);
        console.log(`     ID: ${epoch.id}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No epics/epochs found for Adrata workspace!\n');
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`   Projects: ${projects.length}`);
    console.log(`   Stories: ${stories.length}`);
    console.log(`   Tasks: ${tasks.length}`);
    console.log(`   Epics: ${epochs.length}`);
    
    if (stories.length === 0 && tasks.length === 0) {
      console.log('\n⚠️  ISSUE: No stacks data found for Adrata workspace!');
      console.log('   This is why the UI shows 0 items.');
      if (projects.length === 0) {
        console.log('   The API will auto-create a default project, but you need to create stories/tasks.');
      }
    } else {
      console.log('\n✅ Data exists! The issue might be with workspace ID resolution in the frontend.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdrataStacks();
