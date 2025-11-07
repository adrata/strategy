/**
 * Script to move all "in-progress" items to backlog for adrata workspace
 * 
 * This script:
 * 1. Finds all stories and tasks with status "in-progress" in the adrata workspace
 * 2. Updates them to "deep-backlog" status (which puts them in backlog below the line)
 * 
 * Usage: npx tsx scripts/move-in-progress-to-backlog.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Adrata workspace ID
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const IN_PROGRESS_STATUS = 'in-progress';
const DEEP_BACKLOG_STATUS = 'deep-backlog';

async function moveInProgressToBacklog() {
  console.log('🚀 Starting migration: Moving in-progress items to backlog for adrata workspace...\n');

  try {
    // Find all stories with "in-progress" status in adrata workspace
    const inProgressStories = await prisma.stacksStory.findMany({
      where: {
        status: IN_PROGRESS_STATUS,
        project: {
          workspaceId: ADRATA_WORKSPACE_ID
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        project: {
          select: {
            name: true
          }
        }
      }
    });

    // Find all tasks with "in-progress" status in adrata workspace
    const inProgressTasks = await prisma.stacksTask.findMany({
      where: {
        status: IN_PROGRESS_STATUS,
        project: {
          workspaceId: ADRATA_WORKSPACE_ID
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        project: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`📊 Found ${inProgressStories.length} stories and ${inProgressTasks.length} tasks with "in-progress" status\n`);

    // Update stories
    if (inProgressStories.length > 0) {
      console.log('📝 Updating stories...');
      const storyUpdateResult = await prisma.stacksStory.updateMany({
        where: {
          id: {
            in: inProgressStories.map(s => s.id)
          }
        },
        data: {
          status: DEEP_BACKLOG_STATUS,
          statusChangedAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated ${storyUpdateResult.count} stories to "deep-backlog" status\n`);
      
      // Log details
      inProgressStories.forEach(story => {
        console.log(`   - Story: "${story.title}" (${story.id})`);
      });
    }

    // Update tasks
    if (inProgressTasks.length > 0) {
      console.log('\n📝 Updating tasks...');
      const taskUpdateResult = await prisma.stacksTask.updateMany({
        where: {
          id: {
            in: inProgressTasks.map(t => t.id)
          }
        },
        data: {
          status: DEEP_BACKLOG_STATUS,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated ${taskUpdateResult.count} tasks to "deep-backlog" status\n`);
      
      // Log details
      inProgressTasks.forEach(task => {
        console.log(`   - Task: "${task.title}" (${task.id})`);
      });
    }

    const totalUpdated = inProgressStories.length + inProgressTasks.length;
    
    if (totalUpdated === 0) {
      console.log('ℹ️  No items found with "in-progress" status. Nothing to update.');
    } else {
      console.log(`\n✅ Migration complete! Updated ${totalUpdated} items total:`);
      console.log(`   - ${inProgressStories.length} stories`);
      console.log(`   - ${inProgressTasks.length} tasks`);
      console.log(`\nAll items have been moved to "deep-backlog" status and will appear in the backlog below the line.`);
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
moveInProgressToBacklog()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

