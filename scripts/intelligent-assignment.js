#!/usr/bin/env node

/**
 * Intelligent Assignment System for Notary Everyday Growth Strategy
 * 
 * Assigns stories and tasks based on the Growth Strategy 2025 ownership matrix:
 * - Acquisition (Cold): Dano
 * - Acquisition (Strategic): Noel
 * - Expansion: Irene & Ryan (round-robin)
 * - Retention: All team (round-robin)
 * - Events/Top 10: Dano
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Ownership mapping from Growth Strategy
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
  
  // Irene & Ryan's domains (Expansion)
  'expansion': {
    userIds: [
      '01K7469230N74BVGK2PABPNNZ9', // ross (assuming this is Ryan or Irene - need to verify)
      // Note: Need to find Irene's user ID
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
  
  // All team (Retention)
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

// Users to exclude from assignment
const EXCLUDED_USER_IDS = [
  '01K75WEXZMG7D2GGFQZNV9KMY5', // Todd Nestor
  '01K7B327HWN9G6KGWA97S1TK43', // dan
  '01K8JQE5PKZPWPBY6MNNGXG2VH', // Adrata
  '01K7CY1M53T87RKKKRKCRY3GMH'  // Dan Darceystone
];

async function findNotaryEverydayWorkspace() {
  const workspace = await prisma.workspaces.findUnique({
    where: { slug: 'notary-everyday' }
  });
  
  if (!workspace) {
    throw new Error('Notary Everyday workspace not found!');
  }
  
  return workspace;
}

async function getValidUsers(workspaceId) {
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
  
  const workspaceUsers = await prisma.workspace_users.findMany({
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
  
  const allMembers = [...members, ...workspaceUsers];
  const uniqueMembers = new Map();
  
  allMembers.forEach(m => {
    const userId = m.user?.id || m.userId;
    if (userId && !uniqueMembers.has(userId) && !EXCLUDED_USER_IDS.includes(userId)) {
      uniqueMembers.set(userId, m.user || { id: userId });
    }
  });
  
  const validatedUsers = [];
  for (const member of Array.from(uniqueMembers.values())) {
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
      validatedUsers.push(user);
    }
  }
  
  return validatedUsers;
}

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

async function intelligentlyAssignStories(workspaceId, allUsers) {
  console.log('🧠 Intelligently assigning stories based on Growth Strategy...\n');
  
  const projects = await prisma.stacksProject.findMany({
    where: { workspaceId }
  });
  
  let totalAssigned = 0;
  let totalUnassigned = 0;
  const assignments = {
    dano: 0,
    noel: 0,
    expansion: 0,
    retention: 0,
    unassigned: 0
  };
  
  for (const project of projects) {
    const stories = await prisma.stacksStory.findMany({
      where: {
        projectId: project.id,
        OR: [
          { assigneeId: null },
          { assigneeId: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        assigneeId: true
      }
    });
    
    console.log(`📦 Processing ${stories.length} unassigned stories in project: ${project.name}\n`);
    
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      const category = analyzeStoryContent(story);
      
      if (!category) {
        console.log(`   ⚠️  No clear category for story "${story.title}" - assigning to default (round-robin)`);
        // Default to round-robin across all valid users
        const defaultUser = allUsers[i % allUsers.length];
        try {
          await prisma.stacksStory.update({
            where: { id: story.id },
            data: {
              assigneeId: defaultUser.id,
              updatedAt: new Date()
            }
          });
          totalAssigned++;
          assignments.unassigned++;
          console.log(`   ✅ Assigned "${story.title}" to ${defaultUser.name || defaultUser.email} (default)`);
        } catch (error) {
          console.error(`   ❌ Failed to assign story ${story.id}: ${error.message}`);
          totalUnassigned++;
        }
        continue;
      }
      
      const assigneeId = assignToOwner(category, i, allUsers);
      
      if (!assigneeId) {
        console.log(`   ⚠️  No valid user for category "${category}" - story "${story.title}"`);
        totalUnassigned++;
        assignments.unassigned++;
        continue;
      }
      
      const assignee = allUsers.find(u => u.id === assigneeId);
      const assigneeName = assignee?.name || assignee?.email || assigneeId;
      
      try {
        await prisma.stacksStory.update({
          where: { id: story.id },
          data: {
            assigneeId: assigneeId,
            updatedAt: new Date()
          }
        });
        
        totalAssigned++;
        assignments[category]++;
        console.log(`   ✅ Assigned "${story.title}" to ${assigneeName} (${category})`);
      } catch (error) {
        console.error(`   ❌ Failed to assign story ${story.id}: ${error.message}`);
        totalUnassigned++;
        assignments.unassigned++;
      }
    }
  }
  
  console.log('\n📊 Assignment Summary:');
  console.log(`   Dano (Acquisition - Cold): ${assignments.dano}`);
  console.log(`   Noel (Acquisition - Strategic): ${assignments.noel}`);
  console.log(`   Expansion (Irene & Ryan): ${assignments.expansion}`);
  console.log(`   Retention (All team): ${assignments.retention}`);
  console.log(`   Default/Unassigned: ${assignments.unassigned}`);
  console.log(`   Total assigned: ${totalAssigned}`);
  console.log(`   Total unassigned: ${totalUnassigned}\n`);
  
  return { totalAssigned, totalUnassigned, assignments };
}

async function main() {
  try {
    console.log('🚀 Starting Intelligent Assignment System\n');
    console.log('='.repeat(80));
    
    const workspace = await findNotaryEverydayWorkspace();
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
    
    const allUsers = await getValidUsers(workspace.id);
    console.log(`✅ Found ${allUsers.length} valid users for assignment:\n`);
    allUsers.forEach((user, index) => {
      const name = user.name || user.email || `${user.firstName} ${user.lastName}`.trim();
      console.log(`   ${index + 1}. ${name} (${user.id})`);
    });
    console.log();
    
    console.log('='.repeat(80));
    const result = await intelligentlyAssignStories(workspace.id, allUsers);
    
    console.log('='.repeat(80));
    console.log('✅ Intelligent assignment completed!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

