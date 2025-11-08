#!/usr/bin/env node

/**
 * 🔄 CONVERT STACKS CUID TO ULID
 * 
 * Converts all CUID records in Stacks tables to ULID format
 * Handles foreign key relationships properly
 * 
 * Tables converted:
 * - StacksProject (must be first - no dependencies)
 * - StacksEpic (depends on StacksProject)
 * - StacksEpoch (depends on StacksProject)
 * - StacksStory (depends on StacksProject, StacksEpic, StacksEpoch)
 * - StacksTask (depends on StacksProject, StacksStory)
 * - StacksComment (depends on StacksStory)
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const prisma = new PrismaClient();

// CUID pattern: 25 characters starting with 'c' followed by 24 lowercase alphanumeric
const CUID_PATTERN = /^c[a-z0-9]{24}$/;

// ULID pattern: 26 characters using Base32 uppercase
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// Track all ID mappings for foreign key updates
const idMappings = {
  StacksProject: new Map(),
  StacksEpic: new Map(),
  StacksEpoch: new Map(),
  StacksStory: new Map(),
  StacksTask: new Map(),
};

async function convertStacksProject() {
  console.log('\n🔄 Converting StacksProject...');
  
  try {
    const projects = await prisma.stacksProject.findMany({
      select: { id: true, name: true }
    });
    
    const cuidProjects = projects.filter(p => CUID_PATTERN.test(p.id));
    console.log(`   📊 Found ${cuidProjects.length} projects with CUID IDs (out of ${projects.length} total)`);
    
    if (cuidProjects.length === 0) {
      console.log('   ✅ All projects already use ULIDs');
      return 0;
    }
    
    let converted = 0;
    
    for (const project of cuidProjects) {
      const oldId = project.id;
      const newId = ulid();
      
      try {
        await prisma.stacksProject.update({
          where: { id: oldId },
          data: { id: newId }
        });
        
        idMappings.StacksProject.set(oldId, newId);
        console.log(`   🔄 ${oldId} → ${newId} (${project.name})`);
        converted++;
      } catch (error) {
        console.error(`   ❌ Failed to convert project ${project.name}:`, error.message);
      }
    }
    
    console.log(`   ✅ Converted ${converted} projects`);
    return converted;
  } catch (error) {
    console.error(`   ❌ Error converting StacksProject:`, error.message);
    return 0;
  }
}

async function convertStacksEpic() {
  console.log('\n🔄 Converting StacksEpic...');
  
  try {
    const epics = await prisma.stacksEpic.findMany({
      select: { id: true, title: true, projectId: true }
    });
    
    const cuidEpics = epics.filter(e => CUID_PATTERN.test(e.id));
    console.log(`   📊 Found ${cuidEpics.length} epics with CUID IDs (out of ${epics.length} total)`);
    
    if (cuidEpics.length === 0) {
      console.log('   ✅ All epics already use ULIDs');
      return 0;
    }
    
    let converted = 0;
    
    for (const epic of cuidEpics) {
      const oldId = epic.id;
      const newId = ulid();
      
      // Update projectId if it was converted
      const newProjectId = idMappings.StacksProject.get(epic.projectId) || epic.projectId;
      
      try {
        await prisma.stacksEpic.update({
          where: { id: oldId },
          data: { 
            id: newId,
            projectId: newProjectId
          }
        });
        
        idMappings.StacksEpic.set(oldId, newId);
        console.log(`   🔄 ${oldId} → ${newId} (${epic.title})`);
        converted++;
      } catch (error) {
        console.error(`   ❌ Failed to convert epic ${epic.title}:`, error.message);
      }
    }
    
    console.log(`   ✅ Converted ${converted} epics`);
    return converted;
  } catch (error) {
    console.error(`   ❌ Error converting StacksEpic:`, error.message);
    return 0;
  }
}

async function convertStacksEpoch() {
  console.log('\n🔄 Converting StacksEpoch...');
  
  try {
    const epochs = await prisma.stacksEpoch.findMany({
      select: { id: true, title: true, projectId: true }
    });
    
    const cuidEpochs = epochs.filter(e => CUID_PATTERN.test(e.id));
    console.log(`   📊 Found ${cuidEpochs.length} epochs with CUID IDs (out of ${epochs.length} total)`);
    
    if (cuidEpochs.length === 0) {
      console.log('   ✅ All epochs already use ULIDs');
      return 0;
    }
    
    let converted = 0;
    
    for (const epoch of cuidEpochs) {
      const oldId = epoch.id;
      const newId = ulid();
      
      // Update projectId if it was converted
      const newProjectId = idMappings.StacksProject.get(epoch.projectId) || epoch.projectId;
      
      try {
        await prisma.stacksEpoch.update({
          where: { id: oldId },
          data: { 
            id: newId,
            projectId: newProjectId
          }
        });
        
        idMappings.StacksEpoch.set(oldId, newId);
        console.log(`   🔄 ${oldId} → ${newId} (${epoch.title})`);
        converted++;
      } catch (error) {
        console.error(`   ❌ Failed to convert epoch ${epoch.title}:`, error.message);
      }
    }
    
    console.log(`   ✅ Converted ${converted} epochs`);
    return converted;
  } catch (error) {
    console.error(`   ❌ Error converting StacksEpoch:`, error.message);
    return 0;
  }
}

async function convertStacksStory() {
  console.log('\n🔄 Converting StacksStory...');
  
  try {
    const stories = await prisma.stacksStory.findMany({
      select: { id: true, title: true, projectId: true, epicId: true, epochId: true }
    });
    
    const cuidStories = stories.filter(s => CUID_PATTERN.test(s.id));
    console.log(`   📊 Found ${cuidStories.length} stories with CUID IDs (out of ${stories.length} total)`);
    
    if (cuidStories.length === 0) {
      console.log('   ✅ All stories already use ULIDs');
      return 0;
    }
    
    let converted = 0;
    
    for (const story of cuidStories) {
      const oldId = story.id;
      const newId = ulid();
      
      // Update foreign keys if they were converted
      const newProjectId = idMappings.StacksProject.get(story.projectId) || story.projectId;
      const newEpicId = story.epicId ? (idMappings.StacksEpic.get(story.epicId) || story.epicId) : null;
      const newEpochId = story.epochId ? (idMappings.StacksEpoch.get(story.epochId) || story.epochId) : null;
      
      try {
        await prisma.stacksStory.update({
          where: { id: oldId },
          data: { 
            id: newId,
            projectId: newProjectId,
            ...(newEpicId && { epicId: newEpicId }),
            ...(newEpochId && { epochId: newEpochId })
          }
        });
        
        idMappings.StacksStory.set(oldId, newId);
        console.log(`   🔄 ${oldId} → ${newId} (${story.title})`);
        converted++;
      } catch (error) {
        console.error(`   ❌ Failed to convert story ${story.title}:`, error.message);
      }
    }
    
    console.log(`   ✅ Converted ${converted} stories`);
    return converted;
  } catch (error) {
    console.error(`   ❌ Error converting StacksStory:`, error.message);
    return 0;
  }
}

async function convertStacksTask() {
  console.log('\n🔄 Converting StacksTask...');
  
  try {
    const tasks = await prisma.stacksTask.findMany({
      select: { id: true, title: true, projectId: true, storyId: true }
    });
    
    const cuidTasks = tasks.filter(t => CUID_PATTERN.test(t.id));
    console.log(`   📊 Found ${cuidTasks.length} tasks with CUID IDs (out of ${tasks.length} total)`);
    
    if (cuidTasks.length === 0) {
      console.log('   ✅ All tasks already use ULIDs');
      return 0;
    }
    
    let converted = 0;
    
    for (const task of cuidTasks) {
      const oldId = task.id;
      const newId = ulid();
      
      // Update foreign keys if they were converted
      const newProjectId = idMappings.StacksProject.get(task.projectId) || task.projectId;
      const newStoryId = task.storyId ? (idMappings.StacksStory.get(task.storyId) || task.storyId) : null;
      
      try {
        await prisma.stacksTask.update({
          where: { id: oldId },
          data: { 
            id: newId,
            projectId: newProjectId,
            ...(newStoryId && { storyId: newStoryId })
          }
        });
        
        idMappings.StacksTask.set(oldId, newId);
        console.log(`   🔄 ${oldId} → ${newId} (${task.title})`);
        converted++;
      } catch (error) {
        console.error(`   ❌ Failed to convert task ${task.title}:`, error.message);
      }
    }
    
    console.log(`   ✅ Converted ${converted} tasks`);
    return converted;
  } catch (error) {
    console.error(`   ❌ Error converting StacksTask:`, error.message);
    return 0;
  }
}

async function convertStacksComment() {
  console.log('\n🔄 Converting StacksComment...');
  
  try {
    const comments = await prisma.stacksComment.findMany({
      select: { id: true, storyId: true, content: true }
    });
    
    const cuidComments = comments.filter(c => CUID_PATTERN.test(c.id));
    console.log(`   📊 Found ${cuidComments.length} comments with CUID IDs (out of ${comments.length} total)`);
    
    if (cuidComments.length === 0) {
      console.log('   ✅ All comments already use ULIDs');
      return 0;
    }
    
    let converted = 0;
    
    for (const comment of cuidComments) {
      const oldId = comment.id;
      const newId = ulid();
      
      // Update storyId if it was converted
      const newStoryId = idMappings.StacksStory.get(comment.storyId) || comment.storyId;
      
      try {
        await prisma.stacksComment.update({
          where: { id: oldId },
          data: { 
            id: newId,
            storyId: newStoryId
          }
        });
        
        console.log(`   🔄 ${oldId} → ${newId}`);
        converted++;
      } catch (error) {
        console.error(`   ❌ Failed to convert comment:`, error.message);
      }
    }
    
    console.log(`   ✅ Converted ${converted} comments`);
    return converted;
  } catch (error) {
    console.error(`   ❌ Error converting StacksComment:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 CONVERTING STACKS CUID TO ULID');
  console.log('='.repeat(50));
  console.log('');
  console.log('This script will convert all CUID records in Stacks tables to ULID format.');
  console.log('Foreign key relationships will be preserved.');
  console.log('');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    // Convert in dependency order
    const results = {
      projects: await convertStacksProject(),
      epics: await convertStacksEpic(),
      epochs: await convertStacksEpoch(),
      stories: await convertStacksStory(),
      tasks: await convertStacksTask(),
      comments: await convertStacksComment(),
    };
    
    const total = Object.values(results).reduce((sum, count) => sum + count, 0);
    
    console.log('\n📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Projects converted: ${results.projects}`);
    console.log(`Epics converted: ${results.epics}`);
    console.log(`Epochs converted: ${results.epochs}`);
    console.log(`Stories converted: ${results.stories}`);
    console.log(`Tasks converted: ${results.tasks}`);
    console.log(`Comments converted: ${results.comments}`);
    console.log(`Total converted: ${total}`);
    
    if (total === 0) {
      console.log('\n✅ All Stacks records already use ULIDs!');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

