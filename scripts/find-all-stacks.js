#!/usr/bin/env node

/**
 * Find All Stacks - Check all workspaces for stacks data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findAllStacks() {
  try {
    console.log('🔍 Finding all stacks across all workspaces...\n');
    
    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    });
    
    console.log(`📋 Found ${workspaces.length} active workspaces:\n`);
    
    for (const workspace of workspaces) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Workspace: ${workspace.name} (${workspace.slug})`);
      console.log(`ID: ${workspace.id}`);
      console.log(`${'='.repeat(60)}`);
      
      // Check projects
      const projects = await prisma.stacksProject.findMany({
        where: { workspaceId: workspace.id }
      });
      console.log(`  Projects: ${projects.length}`);
      
      // Check stories
      const stories = await prisma.stacksStory.findMany({
        where: {
          project: {
            workspaceId: workspace.id
          }
        },
        include: {
          project: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      console.log(`  Stories: ${stories.length}`);
      if (stories.length > 0) {
        stories.slice(0, 5).forEach((story, idx) => {
          console.log(`    ${idx + 1}. "${story.title}" (${story.status}, project: ${story.project?.name})`);
          console.log(`       Created: ${story.createdAt}`);
        });
        if (stories.length > 5) {
          console.log(`    ... and ${stories.length - 5} more`);
        }
      }
      
      // Check tasks
      const tasks = await prisma.stacksTask.findMany({
        where: {
          project: {
            workspaceId: workspace.id
          }
        },
        include: {
          project: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      console.log(`  Tasks: ${tasks.length}`);
      if (tasks.length > 0) {
        tasks.slice(0, 5).forEach((task, idx) => {
          console.log(`    ${idx + 1}. "${task.title}" (${task.status}, type: ${task.type}, project: ${task.project?.name})`);
          console.log(`       Created: ${task.createdAt}`);
        });
        if (tasks.length > 5) {
          console.log(`    ... and ${tasks.length - 5} more`);
        }
      }
      
      // Check epochs
      const epochs = await prisma.stacksEpoch.findMany({
        where: {
          project: {
            workspaceId: workspace.id
          }
        },
        include: {
          project: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      console.log(`  Epics/Epochs: ${epochs.length}`);
      
      // Total count
      const total = stories.length + tasks.length;
      if (total > 0) {
        console.log(`  ✅ Total stacks: ${total}`);
      } else {
        console.log(`  ⚠️  No stacks found`);
      }
    }
    
    // Also check for orphaned stories/tasks (not associated with any workspace project)
    console.log(`\n${'='.repeat(60)}`);
    console.log('Checking for orphaned stacks (not associated with workspace)...');
    console.log(`${'='.repeat(60)}`);
    
    const allProjects = await prisma.stacksProject.findMany({
      select: { id: true, workspaceId: true }
    });
    const projectIds = new Set(allProjects.map(p => p.id));
    
    const orphanedStories = await prisma.stacksStory.findMany({
      where: {
        projectId: {
          notIn: Array.from(projectIds)
        }
      }
    });
    const orphanedTasks = await prisma.stacksTask.findMany({
      where: {
        projectId: {
          notIn: Array.from(projectIds)
        }
      }
    });
    
    if (orphanedStories.length > 0 || orphanedTasks.length > 0) {
      console.log(`⚠️  Found orphaned stacks:`);
      console.log(`  Orphaned stories: ${orphanedStories.length}`);
      console.log(`  Orphaned tasks: ${orphanedTasks.length}`);
    } else {
      console.log(`✅ No orphaned stacks found`);
    }
    
    // Check recent stacks (last 30 days) across all workspaces
    console.log(`\n${'='.repeat(60)}`);
    console.log('Recent stacks (last 30 days)...');
    console.log(`${'='.repeat(60)}`);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentStories = await prisma.stacksStory.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        project: {
          include: {
            workspace: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    console.log(`Recent stories (${recentStories.length}):`);
    recentStories.forEach((story, idx) => {
      console.log(`  ${idx + 1}. "${story.title}"`);
      console.log(`     Workspace: ${story.project?.workspace?.name || 'unknown'} (${story.project?.workspace?.slug || 'unknown'})`);
      console.log(`     Created: ${story.createdAt}`);
    });
    
    const recentTasks = await prisma.stacksTask.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        project: {
          include: {
            workspace: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    console.log(`\nRecent tasks (${recentTasks.length}):`);
    recentTasks.forEach((task, idx) => {
      console.log(`  ${idx + 1}. "${task.title}"`);
      console.log(`     Workspace: ${task.project?.workspace?.name || 'unknown'} (${task.project?.workspace?.slug || 'unknown'})`);
      console.log(`     Created: ${task.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAllStacks();
