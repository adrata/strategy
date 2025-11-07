/**
 * Script to move all "deep-backlog" items to "backlog" for adrata workspace
 * 
 * This script moves items from deep-backlog to backlog status so they appear
 * in the regular backlog section (below the line) instead of deep backlog.
 * 
 * Usage: npx tsx scripts/move-deep-backlog-to-backlog.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Adrata workspace ID
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DEEP_BACKLOG_STATUS = 'deep-backlog';
const BACKLOG_STATUS = 'backlog';

async function moveDeepBacklogToBacklog() {
  console.log('🚀 Starting migration: Moving deep-backlog items to backlog for adrata workspace...\n');

  try {
    // Find all stories with "deep-backlog" status in adrata workspace
    const deepBacklogStories = await prisma.stacksStory.findMany({
      where: {
        status: DEEP_BACKLOG_STATUS,
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

    // Find all tasks with "deep-backlog" status in adrata workspace
    const deepBacklogTasks = await prisma.stacksTask.findMany({
      where: {
        status: DEEP_BACKLOG_STATUS,
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

    console.log(`📊 Found ${deepBacklogStories.length} stories and ${deepBacklogTasks.length} tasks with "deep-backlog" status\n`);

    // Update stories
    if (deepBacklogStories.length > 0) {
      console.log('📝 Updating stories...');
      const storyUpdateResult = await prisma.stacksStory.updateMany({
        where: {
          id: {
            in: deepBacklogStories.map(s => s.id)
          }
        },
        data: {
          status: BACKLOG_STATUS,
          statusChangedAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated ${storyUpdateResult.count} stories to "backlog" status\n`);
      
      // Log details
      deepBacklogStories.forEach(story => {
        console.log(`   - Story: "${story.title}" (${story.id})`);
      });
    }

    // Update tasks
    if (deepBacklogTasks.length > 0) {
      console.log('\n📝 Updating tasks...');
      const taskUpdateResult = await prisma.stacksTask.updateMany({
        where: {
          id: {
            in: deepBacklogTasks.map(t => t.id)
          }
        },
        data: {
          status: BACKLOG_STATUS,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated ${taskUpdateResult.count} tasks to "backlog" status\n`);
      
      // Log details
      deepBacklogTasks.forEach(task => {
        console.log(`   - Task: "${task.title}" (${task.id})`);
      });
    }

    const totalUpdated = deepBacklogStories.length + deepBacklogTasks.length;
    
    if (totalUpdated === 0) {
      console.log('ℹ️  No items found with "deep-backlog" status. Nothing to update.');
    } else {
      console.log(`\n✅ Migration complete! Updated ${totalUpdated} items total:`);
      console.log(`   - ${deepBacklogStories.length} stories`);
      console.log(`   - ${deepBacklogTasks.length} tasks`);
      console.log(`\nAll items have been moved to "backlog" status and will appear in the backlog below the line.`);
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
moveDeepBacklogToBacklog()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

