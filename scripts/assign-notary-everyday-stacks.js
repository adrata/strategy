#!/usr/bin/env node

/**
 * Assign All Notary Everyday Stacks Items
 * 
 * This script ensures all stories, epics, and epochs in the Notary Everyday
 * stacks workspace are assigned to people. For stories, it assigns them directly.
 * For epics and epochs, it ensures stories within them are assigned.
 */

require('dotenv').config();

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

// Users to exclude from assignment
const EXCLUDED_USER_IDS = [
  '01K75WEXZMG7D2GGFQZNV9KMY5', // Todd Nestor
  '01K7B327HWN9G6KGWA97S1TK43', // dan
  '01K8JQE5PKZPWPBY6MNNGXG2VH', // Adrata
  '01K7CY1M53T87RKKKRKCRY3GMH'  // Dan Darceystone (removed, but exclude just in case)
];

// Get all workspace members with validation
async function getWorkspaceMembers(workspaceId) {
  console.log('👥 Finding workspace members...');
  
  const members = await prisma.user_roles.findMany({
    where: {
      workspaceId,
      isActive: true
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });
  
  // Also try workspace_users table (different schema version)
  const membersAlt = await prisma.workspace_users.findMany({
    where: {
      workspaceId,
      isActive: true
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });
  
  // Combine and deduplicate
  const allMembers = [...members, ...membersAlt];
  const uniqueMembers = new Map();
  
  allMembers.forEach(m => {
    const userId = m.user?.id || m.userId;
    if (userId && !uniqueMembers.has(userId)) {
      uniqueMembers.set(userId, m.user || { id: userId });
    }
  });
  
  // Validate all members exist in users table and filter out excluded users
  const validatedMembers = [];
  const invalidUserIds = [];
  const excludedCount = { count: 0 };
  
  for (const member of Array.from(uniqueMembers.values())) {
    // Skip excluded users
    if (EXCLUDED_USER_IDS.includes(member.id)) {
      excludedCount.count++;
      continue;
    }
    
    try {
      const user = await prisma.users.findUnique({
        where: { id: member.id },
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });
      
      if (user) {
        validatedMembers.push(user);
      } else {
        invalidUserIds.push(member.id);
      }
    } catch (error) {
      console.warn(`   ⚠️  Warning: Could not validate user ${member.id}: ${error.message}`);
      invalidUserIds.push(member.id);
    }
  }
  
  if (excludedCount.count > 0) {
    console.log(`   ℹ️  Excluded ${excludedCount.count} user(s) from assignment (Todd Nestor, dan, Adrata, Dan Darceystone)`);
  }
  
  if (invalidUserIds.length > 0) {
    console.warn(`   ⚠️  Found ${invalidUserIds.length} invalid user IDs: ${invalidUserIds.join(', ')}`);
  }
  
  return validatedMembers;
}

// Get all projects in workspace
async function getProjects(workspaceId) {
  return await prisma.stacksProject.findMany({
    where: { workspaceId }
  });
}

// Get all unassigned stories for a project
async function getUnassignedStories(projectId) {
  return await prisma.stacksStory.findMany({
    where: {
      projectId,
      OR: [
        { assigneeId: null },
        { assigneeId: '' }
      ]
    },
    include: {
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true
        }
      },
      epic: {
        select: { id: true, title: true }
      },
      epoch: {
        select: { id: true, title: true }
      }
    }
  });
}

// Find and fix stories and tasks with invalid assigneeIds or assignees that would show "Unknown"
async function findAndFixInvalidAssignees(workspaceId, members) {
  console.log('🔍 Checking for stories and tasks with invalid assigneeIds or "Unknown" assignees...\n');
  
  const projects = await getProjects(workspaceId);
  const invalidStories = [];
  const invalidTasks = [];
  const fixedStories = [];
  const fixedTasks = [];
  let totalStoriesChecked = 0;
  let totalTasksChecked = 0;
  
  // Build a set of valid user IDs for quick lookup
  const validUserIds = new Set(members.map(m => m.id));
  
  // Filter members to only those with proper names (to avoid "Unknown")
  const membersWithNames = members.filter(m => {
    const hasName = m.firstName || m.lastName || m.name;
    return hasName && hasName.trim() !== '';
  });
  
  if (membersWithNames.length === 0) {
    console.warn('⚠️  Warning: No workspace members have proper names. Items may show "Unknown".');
    console.warn('   Consider updating user profiles with firstName, lastName, or name fields.\n');
  }
  
  for (const project of projects) {
    // Get all stories with assigneeId set (not null or empty)
    const storiesWithAssignee = await prisma.stacksStory.findMany({
      where: {
        projectId: project.id,
        AND: [
          { assigneeId: { not: null } },
          { assigneeId: { not: '' } }
        ]
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Get all tasks with assigneeId set (not null or empty)
    const tasksWithAssignee = await prisma.stacksTask.findMany({
      where: {
        projectId: project.id,
        AND: [
          { assigneeId: { not: null } },
          { assigneeId: { not: '' } }
        ]
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    totalStoriesChecked += storiesWithAssignee.length;
    totalTasksChecked += tasksWithAssignee.length;
    
    for (const story of storiesWithAssignee) {
      // Check if assigneeId is invalid
      if (!story.assigneeId || story.assigneeId.trim() === '') {
        invalidStories.push({
          story,
          reason: 'Empty assigneeId'
        });
        continue;
      }
      
      // Check if assignee doesn't exist in database
      if (!story.assignee) {
        invalidStories.push({
          story,
          reason: `AssigneeId ${story.assigneeId} points to non-existent user`
        });
        continue;
      }
      
      // Check if assignee is not in valid members list
      if (!validUserIds.has(story.assigneeId)) {
        invalidStories.push({
          story,
          reason: `AssigneeId ${story.assigneeId} is not a workspace member`
        });
        continue;
      }
      
      // Check if assignee would show "Unknown" (no firstName, lastName, or name)
      const assignee = story.assignee;
      const hasName = assignee.firstName || assignee.lastName || assignee.name;
      if (!hasName || (hasName && hasName.trim() === '')) {
        invalidStories.push({
          story,
          reason: `Assignee exists but has no name fields (would show "Unknown" or "null null")`
        });
        continue;
      }
    }
    
    for (const task of tasksWithAssignee) {
      // Check if assigneeId is invalid
      if (!task.assigneeId || task.assigneeId.trim() === '') {
        invalidTasks.push({
          task,
          reason: 'Empty assigneeId'
        });
        continue;
      }
      
      // Check if assignee doesn't exist in database
      if (!task.assignee) {
        invalidTasks.push({
          task,
          reason: `AssigneeId ${task.assigneeId} points to non-existent user`
        });
        continue;
      }
      
      // Check if assignee is not in valid members list
      if (!validUserIds.has(task.assigneeId)) {
        invalidTasks.push({
          task,
          reason: `AssigneeId ${task.assigneeId} is not a workspace member`
        });
        continue;
      }
      
      // Check if assignee would show "Unknown" (no firstName, lastName, or name)
      const assignee = task.assignee;
      const hasName = assignee.firstName || assignee.lastName || assignee.name;
      if (!hasName || (hasName && hasName.trim() === '')) {
        invalidTasks.push({
          task,
          reason: `Assignee exists but has no name fields (would show "Unknown" or "null null")`
        });
        continue;
      }
    }
  }
  
  console.log(`📊 Checked ${totalStoriesChecked} stories and ${totalTasksChecked} tasks with assigneeIds`);
  console.log(`⚠️  Found ${invalidStories.length} stories and ${invalidTasks.length} tasks with invalid/Unknown assignees\n`);
  
  // Use members with names for reassignment to avoid creating more "Unknown" issues
  const membersToUse = membersWithNames.length > 0 ? membersWithNames : members;
  
  if (membersToUse.length === 0) {
    console.error('❌ Cannot fix items: No workspace members have proper names!');
    console.error('   Please update user profiles with firstName, lastName, or name fields.\n');
    return { invalidStories, invalidTasks, fixedStories: [], fixedTasks: [], totalStoriesChecked, totalTasksChecked };
  }
  
  // Fix invalid stories
  if (invalidStories.length > 0) {
    console.log('🔧 Fixing invalid/Unknown story assignees...\n');
    
    const assignments = assignStories(invalidStories.map(is => is.story), membersToUse);
    
    for (const assignment of assignments) {
      try {
        await prisma.stacksStory.update({
          where: { id: assignment.storyId },
          data: {
            assigneeId: assignment.assigneeId,
            updatedAt: new Date()
          }
        });
        
        const originalStory = invalidStories.find(is => is.story.id === assignment.storyId);
        fixedStories.push({
          storyId: assignment.storyId,
          oldAssigneeId: originalStory?.story.assigneeId,
          newAssigneeId: assignment.assigneeId,
          assigneeName: assignment.assigneeName,
          reason: originalStory?.reason
        });
        
        console.log(`   ✅ Fixed story "${originalStory?.story.title || assignment.storyId}": ${assignment.assigneeName}`);
        if (originalStory?.reason) {
          console.log(`      Reason: ${originalStory.reason}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to fix story ${assignment.storyId}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Fixed ${fixedStories.length} stories with invalid/Unknown assignees\n`);
  }
  
  // Fix invalid tasks
  if (invalidTasks.length > 0) {
    console.log('🔧 Fixing invalid/Unknown task assignees...\n');
    
    const assignments = assignTasks(invalidTasks.map(it => it.task), membersToUse);
    
    for (const assignment of assignments) {
      try {
        await prisma.stacksTask.update({
          where: { id: assignment.taskId },
          data: {
            assigneeId: assignment.assigneeId,
            updatedAt: new Date()
          }
        });
        
        const originalTask = invalidTasks.find(it => it.task.id === assignment.taskId);
        fixedTasks.push({
          taskId: assignment.taskId,
          oldAssigneeId: originalTask?.task.assigneeId,
          newAssigneeId: assignment.assigneeId,
          assigneeName: assignment.assigneeName,
          reason: originalTask?.reason
        });
        
        console.log(`   ✅ Fixed task "${originalTask?.task.title || assignment.taskId}": ${assignment.assigneeName}`);
        if (originalTask?.reason) {
          console.log(`      Reason: ${originalTask.reason}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to fix task ${assignment.taskId}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Fixed ${fixedTasks.length} tasks with invalid/Unknown assignees\n`);
  }
  
  if (invalidStories.length === 0 && invalidTasks.length === 0) {
    console.log('✅ All assignees are valid and have proper names!\n');
  }
  
  return { invalidStories, invalidTasks, fixedStories, fixedTasks, totalStoriesChecked, totalTasksChecked };
}

// Get all stories in epics (to check if epics need assignment via their stories)
async function getEpicStories(projectId) {
  const epics = await prisma.stacksEpic.findMany({
    where: { projectId },
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
  });
  
  return epics;
}

// Get all stories in epochs (to check if epochs need assignment via their stories)
async function getEpochStories(projectId) {
  const epochs = await prisma.stacksEpoch.findMany({
    where: { projectId },
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
      },
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
      }
    }
  });
  
  return epochs;
}

// Validate user ID exists
async function validateUserId(userId) {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    return !!user;
  } catch (error) {
    return false;
  }
}

// Ownership mapping from Growth Strategy 2025
const OWNERSHIP_MATRIX = {
  // Dano's domains
  'dano': {
    userId: '01K7DP7QHQ7WATZAJAXCGANBYJ', // Dano
    keywords: [
      'cold outreach', 'new business', 'new client', 'acquisition',
      'title agency', 'settlement company', 'escrow company',
      'independent agency', 'underwriter-owned', 'underwriter-managed',
      'top 10', 'top notaries', 'notary outreach',
      'event', 'bridging excellence', 'outreach initiative'
    ],
    titleKeywords: ['cold', 'outreach', 'new business', 'acquisition', 'top 10', 'event'],
    descriptionKeywords: ['cold outreach', 'new client', 'systematic outreach', 'business development']
  },
  
  // Noel's domains
  'noel': {
    userId: '01K7F6J780Q92BDG3Z3WQE823A', // Noel Serrato
    keywords: [
      'strategic partnership', 'enterprise', 'whale', 'large-scale',
      'tech integration', 'software provider', 'holding company',
      'parent company', 'underwriter partnership', 'ceo-level',
      'executive', 'transformation', 'partnership agreement'
    ],
    titleKeywords: ['strategic', 'partnership', 'enterprise', 'whale', 'integration'],
    descriptionKeywords: ['enterprise', 'strategic partnership', 'tech integration', 'whale hunting']
  },
  
  // Expansion: Irene & Ryan (round-robin)
  'expansion': {
    userIds: [
      '01K7DP7QTRKXZGDHJ857RZFEW8', // ryan
      '01K7469230N74BVGK2PABPNNZ9'  // ross (assuming this is Irene or another expansion owner)
    ],
    keywords: [
      'expansion', 'existing client', 'current client', 'retention',
      'referral', 'cross-sell', 'upsell', 'increase share',
      'arizona', 'florida', 'market share', 'penetration',
      'relationship activation', 'expansion outreach'
    ],
    titleKeywords: ['expansion', 'existing', 'current client', 'retention', 'referral'],
    descriptionKeywords: ['expansion', 'existing client', 'increase business', 'market share', 'arizona', 'florida']
  },
  
  // Retention: All team (round-robin)
  'retention': {
    userIds: [
      '01K7DP7QTRKXZGDHJ857RZFEW8', // ryan
      '01K7F6J780Q92BDG3Z3WQE823A', // Noel Serrato
      '01K7DP7QHQ7WATZAJAXCGANBYJ', // Dano
      '01K7469230N74BVGK2PABPNNZ9'  // ross
    ],
    keywords: [
      'retention', 'maintain', 'relationship', 'engagement',
      'touchpoint', 'customer satisfaction', 'client relationship',
      'partnership value', 'consistent care'
    ],
    titleKeywords: ['retention', 'relationship', 'maintain'],
    descriptionKeywords: ['retention', 'maintain relationship', 'customer satisfaction', 'engagement']
  }
};

// Analyze story content to determine ownership category
function analyzeStoryContent(story) {
  const title = (story.title || '').toLowerCase();
  const description = (story.description || '').toLowerCase();
  const combinedText = `${title} ${description}`;
  
  // Score each ownership category
  const scores = {
    dano: 0,
    noel: 0,
    expansion: 0,
    retention: 0
  };
  
  // Check keywords for each category
  for (const [category, config] of Object.entries(OWNERSHIP_MATRIX)) {
    if (category === 'expansion' || category === 'retention') {
      // Handle multi-user categories
      for (const keyword of config.keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          scores[category] += 2;
        }
      }
      for (const keyword of config.titleKeywords || []) {
        if (title.includes(keyword.toLowerCase())) {
          scores[category] += 3; // Title matches are more important
        }
      }
      for (const keyword of config.descriptionKeywords || []) {
        if (description.includes(keyword.toLowerCase())) {
          scores[category] += 1;
        }
      }
    } else {
      // Single-user categories
      for (const keyword of config.keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          scores[category] += 2;
        }
      }
      for (const keyword of config.titleKeywords || []) {
        if (title.includes(keyword.toLowerCase())) {
          scores[category] += 3;
        }
      }
      for (const keyword of config.descriptionKeywords || []) {
        if (description.includes(keyword.toLowerCase())) {
          scores[category] += 1;
        }
      }
    }
  }
  
  // Determine winner
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    return null; // No clear match
  }
  
  // Find category with highest score
  const winningCategory = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
  
  return winningCategory;
}

// Assign to owner based on category
function assignToOwner(category, storyIndex, allUsers) {
  const config = OWNERSHIP_MATRIX[category];
  
  if (!config) {
    return null;
  }
  
  // Single owner categories
  if (config.userId) {
    return config.userId;
  }
  
  // Multi-owner categories (round-robin)
  if (config.userIds && config.userIds.length > 0) {
    // Filter to only include valid users
    const validUserIds = config.userIds.filter(userId => 
      allUsers.some(u => u.id === userId)
    );
    
    if (validUserIds.length === 0) {
      return null;
    }
    
    return validUserIds[storyIndex % validUserIds.length];
  }
  
  return null;
}

// Assign stories intelligently based on Growth Strategy
function assignStoriesIntelligently(stories, users) {
  if (users.length === 0) {
    throw new Error('No users available for assignment!');
  }
  
  const assignments = [];
  
  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    const category = analyzeStoryContent(story);
    
    let assigneeId = null;
    let assigneeName = 'Unassigned';
    
    if (category) {
      assigneeId = assignToOwner(category, i, users);
    }
    
    // Fallback to round-robin if no intelligent match
    if (!assigneeId) {
      const user = users[i % users.length];
      assigneeId = user.id;
      assigneeName = user.name || 
        (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : '') ||
        user.firstName || 
        user.lastName || 
        user.email;
    } else {
      const user = users.find(u => u.id === assigneeId);
      assigneeName = user?.name || 
        (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : '') ||
        user?.firstName || 
        user?.lastName || 
        user?.email ||
        assigneeId;
    }
    
    assignments.push({
      storyId: story.id,
      assigneeId: assigneeId,
      assigneeName: assigneeName,
      category: category || 'default'
    });
  }
  
  return assignments;
}

// Assign stories to users (round-robin distribution) - kept for backward compatibility
function assignStories(stories, users) {
  return assignStoriesIntelligently(stories, users);
}

// Assign tasks to users (round-robin distribution)
function assignTasks(tasks, users) {
  if (users.length === 0) {
    throw new Error('No users available for assignment!');
  }
  
  const assignments = [];
  let userIndex = 0;
  
  for (const task of tasks) {
    const user = users[userIndex % users.length];
    const assigneeName = user.name || 
      (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : '') ||
      user.firstName || 
      user.lastName || 
      user.email;
    assignments.push({
      taskId: task.id,
      assigneeId: user.id,
      assigneeName: assigneeName
    });
    userIndex++;
  }
  
  return assignments;
}

// Assign stories with error handling and validation
async function assignStoriesWithValidation(assignments, assignedStoryIds) {
  const errors = [];
  let successCount = 0;
  
  for (const assignment of assignments) {
    // Skip if already assigned in this run
    if (assignedStoryIds.has(assignment.storyId)) {
      continue;
    }
    
    try {
      // Validate assigneeId exists
      const isValidUser = await validateUserId(assignment.assigneeId);
      if (!isValidUser) {
        errors.push({
          storyId: assignment.storyId,
          assigneeId: assignment.assigneeId,
          error: `Invalid assigneeId: ${assignment.assigneeId} does not exist in users table`
        });
        continue;
      }
      
      // Update story
      await prisma.stacksStory.update({
        where: { id: assignment.storyId },
        data: {
          assigneeId: assignment.assigneeId,
          updatedAt: new Date()
        }
      });
      
      assignedStoryIds.add(assignment.storyId);
      successCount++;
      console.log(`   ✅ Assigned story ${assignment.storyId} to ${assignment.assigneeName}`);
    } catch (error) {
      errors.push({
        storyId: assignment.storyId,
        assigneeId: assignment.assigneeId,
        error: error.message
      });
      console.error(`   ❌ Failed to assign story ${assignment.storyId}: ${error.message}`);
    }
  }
  
  return { successCount, errors };
}

// Verify all stories are assigned and fix any remaining issues
async function verifyAssignments(workspaceId, members) {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Verification Step\n');
  
  const projects = await getProjects(workspaceId);
  let totalStories = 0;
  let unassignedStories = [];
  let storiesWithInvalidAssignees = [];
  
  // Filter members to only those with proper names (to avoid "Unknown")
  const membersWithNames = members.filter(m => {
    const hasName = m.firstName || m.lastName || m.name;
    return hasName && hasName.trim() !== '';
  });
  
  const membersToUse = membersWithNames.length > 0 ? membersWithNames : members;
  
  if (membersToUse.length === 0) {
    console.error('❌ Cannot fix stories: No workspace members have proper names!');
    console.error('   Please update user profiles with firstName, lastName, or name fields.\n');
    return { 
      totalStories: 0, 
      unassignedCount: 0, 
      unassignedStories: [],
      unknownAssigneeCount: 0,
      storiesWithInvalidAssignees: []
    };
  }
  
  for (const project of projects) {
    const stories = await prisma.stacksStory.findMany({
      where: { projectId: project.id },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        },
        epic: {
          select: { id: true, title: true }
        },
        epoch: {
          select: { id: true, title: true }
        }
      }
    });
    
    totalStories += stories.length;
    
    for (const story of stories) {
      // Check if unassigned (null, empty string, or no assignee relation)
      const assigneeIdEmpty = !story.assigneeId || story.assigneeId.trim() === '';
      if (!story.assignee || assigneeIdEmpty) {
        unassignedStories.push(story);
        continue;
      }
      
      // Check if assignee exists but would show "Unknown" (no firstName/lastName/name)
      const assignee = story.assignee;
      const hasName = assignee.firstName || assignee.lastName || assignee.name;
      if (!hasName || (hasName && hasName.trim() === '')) {
        storiesWithInvalidAssignees.push({
          story,
          reason: 'Assignee exists but has no name fields (would show "Unknown")'
        });
      }
    }
  }
  
  console.log(`📊 Total stories in workspace: ${totalStories}`);
  console.log(`📊 Unassigned stories: ${unassignedStories.length}`);
  console.log(`📊 Stories with "Unknown" assignees: ${storiesWithInvalidAssignees.length}`);
  
  // Fix unassigned stories
  if (unassignedStories.length > 0) {
    console.log('\n🔧 Fixing unassigned stories...');
    const assignments = assignStories(unassignedStories, membersToUse);
    
    for (const assignment of assignments) {
      try {
        await prisma.stacksStory.update({
          where: { id: assignment.storyId },
          data: {
            assigneeId: assignment.assigneeId,
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Assigned story ${assignment.storyId} to ${assignment.assigneeName}`);
      } catch (error) {
        console.error(`   ❌ Failed to assign story ${assignment.storyId}: ${error.message}`);
      }
    }
    
    // Clear the list since we fixed them
    unassignedStories = [];
  }
  
  // Fix stories with "Unknown" assignees
  if (storiesWithInvalidAssignees.length > 0) {
    console.log('\n🔧 Fixing stories with "Unknown" assignees...');
    const assignments = assignStories(storiesWithInvalidAssignees.map(s => s.story), membersToUse);
    
    for (const assignment of assignments) {
      try {
        await prisma.stacksStory.update({
          where: { id: assignment.storyId },
          data: {
            assigneeId: assignment.assigneeId,
            updatedAt: new Date()
          }
        });
        const originalStory = storiesWithInvalidAssignees.find(s => s.story.id === assignment.storyId);
        console.log(`   ✅ Fixed story "${originalStory?.story.title || assignment.storyId}": ${assignment.assigneeName}`);
        if (originalStory?.reason) {
          console.log(`      Reason: ${originalStory.reason}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to fix story ${assignment.storyId}: ${error.message}`);
      }
    }
    
    // Clear the list since we fixed them
    storiesWithInvalidAssignees = [];
  }
  
  if (unassignedStories.length === 0 && storiesWithInvalidAssignees.length === 0) {
    console.log('\n✅ All stories are properly assigned!');
  } else {
    console.log(`\n⚠️  ${unassignedStories.length} unassigned stories and ${storiesWithInvalidAssignees.length} stories with "Unknown" assignees remain after fixing.`);
  }
  
  return { 
    totalStories, 
    unassignedCount: unassignedStories.length, 
    unassignedStories,
    unknownAssigneeCount: storiesWithInvalidAssignees.length,
    storiesWithInvalidAssignees
  };
}

// Main assignment function
async function assignAllItems() {
  const assignedStoryIds = new Set(); // Track assigned stories to prevent duplicates
  const allErrors = [];
  
  try {
    console.log('🚀 Assigning all Notary Everyday Stacks items\n');
    console.log('='.repeat(80));
    
    // Find workspace
    const workspace = await findNotaryEverydayWorkspace();
    
    // Get workspace members with validation
    const members = await getWorkspaceMembers(workspace.id);
    
    if (members.length === 0) {
      throw new Error('No valid workspace members found! Cannot assign items.');
    }
    
    console.log(`✅ Found ${members.length} valid workspace members:`);
    members.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.name || member.email} (${member.id})`);
    });
    console.log();
    
    // Get all projects
    console.log('📋 Finding projects...');
    const projects = await getProjects(workspace.id);
    
    if (projects.length === 0) {
      console.log('⚠️  No projects found in workspace.');
      return;
    }
    
    console.log(`✅ Found ${projects.length} project(s):`);
    projects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} (${project.id})`);
    });
    console.log();
    
    // First, find and fix stories with invalid assigneeIds (causing "Unknown" to appear)
    console.log('='.repeat(80));
    const invalidAssigneeFix = await findAndFixInvalidAssignees(workspace.id, members);
    console.log('='.repeat(80));
    console.log();
    
    let totalAssigned = 0;
    let totalUnassigned = 0;
    
    // Collect all unassigned stories first to avoid duplicates
    const allUnassignedStories = [];
    
    for (const project of projects) {
      console.log('='.repeat(80));
      console.log(`📦 Processing project: ${project.name}\n`);
      
      // Get unassigned stories
      const unassignedStories = await getUnassignedStories(project.id);
      totalUnassigned += unassignedStories.length;
      allUnassignedStories.push(...unassignedStories.map(s => ({ ...s, projectName: project.name })));
      
      console.log(`📊 Found ${unassignedStories.length} unassigned stories`);
      
      // Get epics and their stories
      const epics = await getEpicStories(project.id);
      console.log(`📚 Found ${epics.length} epics`);
      
      // Get epochs and their stories
      const epochs = await getEpochStories(project.id);
      console.log(`🗓️  Found ${epochs.length} epochs`);
      
      // Collect unassigned stories from epics and epochs
      // Also check for empty string assigneeIds
      for (const epic of epics) {
        const unassignedInEpic = epic.stories.filter(s => {
          const assigneeIdEmpty = !s.assigneeId || s.assigneeId.trim() === '';
          return !s.assignee || assigneeIdEmpty;
        });
        allUnassignedStories.push(...unassignedInEpic.map(s => ({ ...s, projectName: project.name, epicTitle: epic.title })));
      }
      
      for (const epoch of epochs) {
        const unassignedInEpoch = epoch.stories.filter(s => {
          const assigneeIdEmpty = !s.assigneeId || s.assigneeId.trim() === '';
          return !s.assignee || assigneeIdEmpty;
        });
        const unassignedInEpochEpics = epoch.epics.flatMap(epic => 
          epic.stories.filter(s => {
            const assigneeIdEmpty = !s.assigneeId || s.assigneeId.trim() === '';
            return !s.assignee || assigneeIdEmpty;
          })
        );
        allUnassignedStories.push(...unassignedInEpoch.map(s => ({ ...s, projectName: project.name, epochTitle: epoch.title })));
        allUnassignedStories.push(...unassignedInEpochEpics.map(s => ({ ...s, projectName: project.name, epochTitle: epoch.title })));
      }
      
      console.log();
    }
    
    // Deduplicate stories by ID (stories might be found multiple times)
    const uniqueUnassignedStories = [];
    const seenStoryIds = new Set();
    
    for (const story of allUnassignedStories) {
      if (!seenStoryIds.has(story.id)) {
        seenStoryIds.add(story.id);
        uniqueUnassignedStories.push(story);
      }
    }
    
    console.log('='.repeat(80));
    console.log(`📝 Assigning ${uniqueUnassignedStories.length} unique unassigned stories...\n`);
    
    if (uniqueUnassignedStories.length > 0) {
      // Assign stories round-robin
      const assignments = assignStories(uniqueUnassignedStories, members);
      
      // Use transaction for batch updates
      const result = await prisma.$transaction(async (tx) => {
        const errors = [];
        let successCount = 0;
        
        for (const assignment of assignments) {
          // Skip if already assigned in this run
          if (assignedStoryIds.has(assignment.storyId)) {
            continue;
          }
          
          try {
            // Validate assigneeId exists (within transaction)
            const user = await tx.users.findUnique({
              where: { id: assignment.assigneeId },
              select: { id: true }
            });
            
            if (!user) {
              errors.push({
                storyId: assignment.storyId,
                assigneeId: assignment.assigneeId,
                error: `Invalid assigneeId: ${assignment.assigneeId} does not exist in users table`
              });
              continue;
            }
            
            // Update story
            await tx.stacksStory.update({
              where: { id: assignment.storyId },
              data: {
                assigneeId: assignment.assigneeId,
                updatedAt: new Date()
              }
            });
            
            assignedStoryIds.add(assignment.storyId);
            successCount++;
          } catch (error) {
            errors.push({
              storyId: assignment.storyId,
              assigneeId: assignment.assigneeId,
              error: error.message
            });
          }
        }
        
        return { successCount, errors };
      }, {
        timeout: 30000 // 30 second timeout
      });
      
      totalAssigned = result.successCount;
      allErrors.push(...result.errors);
      
      if (result.errors.length > 0) {
        console.log(`\n⚠️  ${result.errors.length} assignment(s) failed:`);
        result.errors.forEach(err => {
          console.log(`   - Story ${err.storyId}: ${err.error}`);
        });
      }
      
      console.log(`\n✅ Successfully assigned ${result.successCount} stories`);
    } else {
      console.log('✅ All stories are already assigned!');
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY\n');
    console.log(`   Stories with invalid assigneeIds fixed: ${invalidAssigneeFix.fixedStories.length}`);
    console.log(`   Tasks with invalid assigneeIds fixed: ${invalidAssigneeFix.fixedTasks.length}`);
    console.log(`   Total unique unassigned stories found: ${uniqueUnassignedStories.length}`);
    console.log(`   Total stories assigned: ${totalAssigned}`);
    console.log(`   Assignment errors: ${allErrors.length}`);
    
    if (totalAssigned > 0 || invalidAssigneeFix.fixedStories.length > 0 || invalidAssigneeFix.fixedTasks.length > 0) {
      console.log(`\n✅ Successfully fixed ${invalidAssigneeFix.fixedStories.length} stories and ${invalidAssigneeFix.fixedTasks.length} tasks with invalid assignees!`);
      if (totalAssigned > 0) {
        console.log(`✅ Successfully assigned ${totalAssigned} unassigned story/stories!`);
      }
    } else {
      console.log(`\n✅ All items are already assigned!`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 Note: Epics and epochs don\'t have direct assigneeId fields in the schema.');
    console.log('   Assignment is handled through stories within them.');
    console.log('   All stories and tasks within epics and epochs have been checked and assigned.');
    
    // Verification step (automatically fixes any remaining issues)
    const verification = await verifyAssignments(workspace.id, members);
    
    if (verification.unassignedCount > 0) {
      console.log(`\n⚠️  Warning: ${verification.unassignedCount} stories remain unassigned after assignment.`);
      console.log('   This may indicate stories were created after assignment or have invalid assigneeIds.');
    }
    
    if (verification.unknownAssigneeCount > 0) {
      console.log(`\n⚠️  Warning: ${verification.unknownAssigneeCount} stories have assignees that would show "Unknown".`);
      console.log('   These assignees exist but have no name fields (firstName, lastName, or name).');
      console.log('   Consider updating user profiles or reassigning these stories to users with proper names.');
    }
    
    // Final check: ensure ALL stories have assignees
    if (verification.unassignedCount === 0 && verification.unknownAssigneeCount === 0) {
      console.log('\n✅ All Stacks stories have valid assignees with proper names!');
    }
    
  } catch (error) {
    console.error('\n❌ Error assigning items:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
assignAllItems()
  .then(() => {
    console.log('\n✅ Assignment completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Assignment failed:', error);
    process.exit(1);
  });
