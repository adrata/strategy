#!/usr/bin/env node

/**
 * Verify Notary Everyday Growth Strategy Assignments
 * 
 * This script verifies that all stories, epics, and epochs
 * in the Growth Strategy 2025 project are properly assigned.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Find Notary Everyday workspace
async function findNotaryEverydayWorkspace() {
  console.log('🔍 Finding Notary Everyday workspace...');
  
  // First try to find by exact slug
  let workspace = await prisma.workspaces.findUnique({
    where: { slug: 'notary-everyday' }
  });
  
  // If not found, try by name
  if (!workspace) {
    workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } },
          { slug: { contains: 'ne', mode: 'insensitive' } }
        ],
        isActive: true
      }
    });
  }
  
  if (!workspace) {
    throw new Error('Notary Everyday workspace not found!');
  }
  
  console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
  console.log(`   Slug: ${workspace.slug}\n`);
  return workspace;
}

// Main verification function
async function verifyAssignments() {
  try {
    console.log('🚀 Verifying Notary Everyday Growth Strategy Assignments\n');
    console.log('='.repeat(80));
    
    // Find workspace
    const workspace = await findNotaryEverydayWorkspace();
    
    // Find project
    const project = await prisma.stacksProject.findFirst({
      where: {
        workspaceId: workspace.id,
        name: 'Growth Strategy 2025'
      }
    });
    
    if (!project) {
      throw new Error('Growth Strategy 2025 project not found!');
    }
    
    console.log(`✅ Found project: ${project.name} (${project.id})\n`);
    
    // Get all epochs
    const epochs = await prisma.stacksEpoch.findMany({
      where: { projectId: project.id },
      include: {
        epics: {
          include: {
            stories: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        stories: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    // Get all epics (including those not in epochs)
    const allEpics = await prisma.stacksEpic.findMany({
      where: { projectId: project.id },
      include: {
        epoch: {
          select: {
            id: true,
            title: true
          }
        },
        stories: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    // Get all stories (including those not in epics/epochs)
    const allStories = await prisma.stacksStory.findMany({
      where: { projectId: project.id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        epic: {
          select: {
            id: true,
            title: true
          }
        },
        epoch: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
    
    console.log(`📊 Summary:`);
    console.log(`   - Epochs: ${epochs.length}`);
    console.log(`   - Epics: ${allEpics.length}`);
    console.log(`   - Stories: ${allStories.length}\n`);
    
    // Analyze assignments
    console.log('='.repeat(80));
    console.log('📋 Assignment Analysis\n');
    
    // Stories by assignee
    const storiesByAssignee = {};
    const unassignedStories = [];
    
    allStories.forEach(story => {
      if (story.assignee) {
        const assigneeKey = `${story.assignee.name} (${story.assignee.email})`;
        if (!storiesByAssignee[assigneeKey]) {
          storiesByAssignee[assigneeKey] = [];
        }
        storiesByAssignee[assigneeKey].push(story);
      } else {
        unassignedStories.push(story);
      }
    });
    
    console.log('👥 Stories by Assignee:');
    Object.keys(storiesByAssignee).sort().forEach(assignee => {
      console.log(`   ${assignee}: ${storiesByAssignee[assignee].length} stories`);
    });
    
    if (unassignedStories.length > 0) {
      console.log(`\n⚠️  Unassigned Stories: ${unassignedStories.length}`);
      unassignedStories.forEach(story => {
        console.log(`   - ${story.title}`);
      });
    } else {
      console.log(`\n✅ All stories are assigned!`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📚 Detailed Breakdown by Epoch\n');
    
    epochs.forEach((epoch, index) => {
      console.log(`${index + 1}. ${epoch.title}`);
      console.log(`   Status: ${epoch.status} | Priority: ${epoch.priority}`);
      
      const epochStories = allStories.filter(s => s.epochId === epoch.id && !s.epicId);
      const epochEpics = epoch.epics || [];
      
      console.log(`   Direct Stories: ${epochStories.length}`);
      epochStories.forEach(story => {
        const assignee = story.assignee ? `${story.assignee.name}` : 'Unassigned';
        console.log(`     - ${story.title} [${assignee}]`);
      });
      
      console.log(`   Epics: ${epochEpics.length}`);
      epochEpics.forEach(epic => {
        console.log(`     - ${epic.title}`);
        const epicStories = epic.stories || [];
        console.log(`       Stories: ${epicStories.length}`);
        epicStories.forEach(story => {
          const assignee = story.assignee ? `${story.assignee.name}` : 'Unassigned';
          console.log(`         - ${story.title} [${assignee}]`);
        });
      });
      
      console.log();
    });
    
    // Check for epics not in epochs
    const epicsNotInEpochs = allEpics.filter(epic => !epic.epochId);
    if (epicsNotInEpochs.length > 0) {
      console.log('⚠️  Epics not assigned to epochs:');
      epicsNotInEpochs.forEach(epic => {
        console.log(`   - ${epic.title}`);
      });
      console.log();
    }
    
    // Check for stories not in epics or epochs
    const storiesNotInEpicsOrEpochs = allStories.filter(story => !story.epicId && !story.epochId);
    if (storiesNotInEpicsOrEpochs.length > 0) {
      console.log('⚠️  Stories not assigned to epics or epochs:');
      storiesNotInEpicsOrEpochs.forEach(story => {
        const assignee = story.assignee ? `${story.assignee.name}` : 'Unassigned';
        console.log(`   - ${story.title} [${assignee}]`);
      });
      console.log();
    }
    
    // Summary statistics
    console.log('='.repeat(80));
    console.log('📈 Statistics\n');
    
    const totalAssigned = allStories.filter(s => s.assignee).length;
    const totalUnassigned = allStories.filter(s => !s.assignee).length;
    const assignmentRate = ((totalAssigned / allStories.length) * 100).toFixed(1);
    
    console.log(`   Total Stories: ${allStories.length}`);
    console.log(`   Assigned: ${totalAssigned} (${assignmentRate}%)`);
    console.log(`   Unassigned: ${totalUnassigned}`);
    
    // User breakdown
    console.log('\n   Stories per User:');
    Object.keys(storiesByAssignee).sort().forEach(assignee => {
      const count = storiesByAssignee[assignee].length;
      const percentage = ((count / allStories.length) * 100).toFixed(1);
      console.log(`     ${assignee}: ${count} (${percentage}%)`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    if (totalUnassigned === 0) {
      console.log('✅ All stories are assigned!');
    } else {
      console.log(`⚠️  ${totalUnassigned} story/stories need assignment`);
    }
    
  } catch (error) {
    console.error('\n❌ Error verifying assignments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
verifyAssignments()
  .then(() => {
    console.log('\n✅ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });

