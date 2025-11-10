#!/usr/bin/env node

/**
 * Audit and Cleanup Duplicate Stacks Stories
 * 
 * This script finds duplicate stories by title and cleans them up,
 * prioritizing stories assigned to ross@adrata.com
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const ROSS_EMAIL = 'ross@adrata.com';

async function auditAndCleanupDuplicates() {
  try {
    console.log('🔍 Auditing stacks for duplicate stories...\n');
    
    // Find ross user
    const rossUser = await prisma.users.findFirst({
      where: { email: ROSS_EMAIL },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    if (!rossUser) {
      console.log(`❌ User ${ROSS_EMAIL} not found!`);
      return;
    }
    
    console.log(`✅ Found user: ${rossUser.firstName} ${rossUser.lastName} (${rossUser.email})`);
    console.log(`   ID: ${rossUser.id}\n`);
    
    // Get all stories for Adrata workspace
    const allStories = await prisma.stacksStory.findMany({
      where: {
        project: {
          workspaceId: ADRATA_WORKSPACE_ID
        }
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        tasks: {
          select: {
            id: true
          }
        },
        comments: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`📋 Total stories found: ${allStories.length}\n`);
    
    // Group stories by title (case-insensitive, trimmed)
    const storiesByTitle = {};
    
    allStories.forEach(story => {
      const normalizedTitle = story.title.trim().toLowerCase();
      if (!storiesByTitle[normalizedTitle]) {
        storiesByTitle[normalizedTitle] = [];
      }
      storiesByTitle[normalizedTitle].push(story);
    });
    
    // Find duplicates
    const duplicates = Object.entries(storiesByTitle).filter(([title, stories]) => stories.length > 1);
    
    console.log(`🔍 Found ${duplicates.length} duplicate title groups:\n`);
    
    let totalDuplicatesToDelete = 0;
    const duplicatesToDelete = [];
    
    for (const [title, stories] of duplicates) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Title: "${stories[0].title}"`);
      console.log(`Count: ${stories.length} duplicates`);
      console.log(`${'='.repeat(80)}`);
      
      // Sort by priority: ross-assigned first, then by data richness, then by creation date
      const sortedStories = stories.sort((a, b) => {
        // Priority 1: Ross-assigned stories first
        const aIsRoss = a.assigneeId === rossUser.id;
        const bIsRoss = b.assigneeId === rossUser.id;
        if (aIsRoss && !bIsRoss) return -1;
        if (!aIsRoss && bIsRoss) return 1;
        
        // Priority 2: More data (tasks, comments, description)
        const aDataScore = (a.tasks?.length || 0) + (a.comments?.length || 0) + (a.description ? 1 : 0);
        const bDataScore = (b.tasks?.length || 0) + (b.comments?.length || 0) + (b.description ? 1 : 0);
        if (aDataScore !== bDataScore) return bDataScore - aDataScore;
        
        // Priority 3: Older creation date (keep the original)
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      
      const keepStory = sortedStories[0];
      const deleteStories = sortedStories.slice(1);
      
      console.log(`\n✅ KEEPING:`);
      console.log(`   ID: ${keepStory.id}`);
      console.log(`   Assignee: ${keepStory.assignee ? `${keepStory.assignee.firstName} ${keepStory.assignee.lastName} (${keepStory.assignee.email})` : 'None'}`);
      console.log(`   Status: ${keepStory.status}`);
      console.log(`   Tasks: ${keepStory.tasks.length}`);
      console.log(`   Comments: ${keepStory.comments.length}`);
      console.log(`   Description: ${keepStory.description ? 'Yes' : 'No'}`);
      console.log(`   Created: ${keepStory.createdAt}`);
      
      for (const deleteStory of deleteStories) {
        console.log(`\n🗑️  TO DELETE:`);
        console.log(`   ID: ${deleteStory.id}`);
        console.log(`   Assignee: ${deleteStory.assignee ? `${deleteStory.assignee.firstName} ${deleteStory.assignee.lastName} (${deleteStory.assignee.email})` : 'None'}`);
        console.log(`   Status: ${deleteStory.status}`);
        console.log(`   Tasks: ${deleteStory.tasks.length}`);
        console.log(`   Comments: ${deleteStory.comments.length}`);
        console.log(`   Description: ${deleteStory.description ? 'Yes' : 'No'}`);
        console.log(`   Created: ${deleteStory.createdAt}`);
        
        duplicatesToDelete.push(deleteStory);
        totalDuplicatesToDelete++;
      }
    }
    
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Total stories: ${allStories.length}`);
    console.log(`Duplicate groups: ${duplicates.length}`);
    console.log(`Stories to delete: ${totalDuplicatesToDelete}`);
    console.log(`Stories to keep: ${allStories.length - totalDuplicatesToDelete}`);
    
    if (totalDuplicatesToDelete === 0) {
      console.log(`\n✅ No duplicates found!`);
      return;
    }
    
    // Ask for confirmation (in a real script, you might want to add a prompt)
    console.log(`\n⚠️  Ready to delete ${totalDuplicatesToDelete} duplicate stories.`);
    console.log(`   This will delete the stories and their associated tasks and comments.`);
    console.log(`   Run with --execute flag to actually delete, otherwise this is a dry run.\n`);
    
    // Check if --execute flag is provided
    const shouldExecute = process.argv.includes('--execute');
    
    if (!shouldExecute) {
      console.log('🔍 DRY RUN MODE - No deletions performed');
      console.log('   Add --execute flag to perform actual deletions');
      return;
    }
    
    // Perform deletions
    console.log(`\n🗑️  Deleting ${totalDuplicatesToDelete} duplicate stories...\n`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const story of duplicatesToDelete) {
      try {
        // Delete associated tasks first (if any)
        if (story.tasks.length > 0) {
          await prisma.stacksTask.deleteMany({
            where: { storyId: story.id }
          });
        }
        
        // Delete associated comments first (if any)
        if (story.comments.length > 0) {
          await prisma.stacksComment.deleteMany({
            where: { storyId: story.id }
          });
        }
        
        // Delete the story
        await prisma.stacksStory.delete({
          where: { id: story.id }
        });
        
        deletedCount++;
        console.log(`✅ Deleted story: ${story.title} (${story.id})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error deleting story ${story.id}:`, error.message);
      }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ CLEANUP COMPLETE`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Stories deleted: ${deletedCount}`);
    if (errorCount > 0) {
      console.log(`Errors: ${errorCount}`);
    }
    
    // Verify cleanup
    const remainingStories = await prisma.stacksStory.findMany({
      where: {
        project: {
          workspaceId: ADRATA_WORKSPACE_ID
        }
      }
    });
    
    console.log(`Remaining stories: ${remainingStories.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
auditAndCleanupDuplicates()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

