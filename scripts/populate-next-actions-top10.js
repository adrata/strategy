/**
 * 🚀 POPULATE NEXT ACTIONS - TOP 10 SPEEDRUN PEOPLE
 * 
 * This script populates nextAction and nextActionDate fields for the top 10 people
 * in Ross's Adrata workspace Speedrun view for demo purposes.
 * 
 * Usage: node scripts/populate-next-actions-top10.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Ross's workspace ID (Adrata)
const WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

// Ross's user ID (we need this for the mainSellerId filter)
// Let's find it by looking for a user with name containing "Ross"
let ROSS_USER_ID = null;

/**
 * Generate intelligent next action based on person's current state
 */
function generateNextAction(person) {
  const now = new Date();
  const lastActionDate = person.lastActionDate ? new Date(person.lastActionDate) : null;
  const status = person.status?.toLowerCase();
  const lastAction = person.lastAction?.toLowerCase() || '';
  
  // Calculate days since last action
  let daysSinceLastAction = 999; // Default to high number if no last action
  if (lastActionDate) {
    daysSinceLastAction = Math.floor((now.getTime() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Determine next action based on status and timing
  let nextAction = '';
  let nextActionDate = new Date();
  
  // Status-based logic
  switch (status) {
    case 'lead':
      if (daysSinceLastAction >= 999 || !lastAction) {
        // No previous action - initial outreach
        nextAction = 'Send initial outreach email';
        nextActionDate = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // Tomorrow
      } else if (daysSinceLastAction < 7) {
        // Recent action - follow up
        nextAction = 'Schedule discovery call';
        nextActionDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
      } else if (daysSinceLastAction < 14) {
        // Moderate gap - check in
        nextAction = 'Send follow-up email';
        nextActionDate = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // Tomorrow
      } else {
        // Long gap - urgent re-engagement
        nextAction = 'Urgent follow-up call required';
        nextActionDate = new Date(now.getTime() + (0.5 * 24 * 60 * 60 * 1000)); // Today
      }
      break;
      
    case 'prospect':
      if (daysSinceLastAction < 7) {
        nextAction = 'Schedule qualification call';
        nextActionDate = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days
      } else if (daysSinceLastAction < 14) {
        nextAction = 'Send proposal or demo request';
        nextActionDate = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // Tomorrow
      } else {
        nextAction = 'Re-engage with value proposition';
        nextActionDate = new Date(now.getTime() + (0.5 * 24 * 60 * 60 * 1000)); // Today
      }
      break;
      
    case 'opportunity':
      if (daysSinceLastAction < 7) {
        nextAction = 'Schedule demo or proposal meeting';
        nextActionDate = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days
      } else if (daysSinceLastAction < 14) {
        nextAction = 'Follow up on proposal';
        nextActionDate = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // Tomorrow
      } else {
        nextAction = 'Urgent opportunity follow-up';
        nextActionDate = new Date(now.getTime() + (0.5 * 24 * 60 * 60 * 1000)); // Today
      }
      break;
      
    case 'client':
      if (daysSinceLastAction < 30) {
        nextAction = 'Account check-in call';
        nextActionDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 1 week
      } else {
        nextAction = 'Client relationship review';
        nextActionDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
      }
      break;
      
    default:
      // Default logic for unknown status
      if (daysSinceLastAction >= 999 || !lastAction) {
        nextAction = 'Initial contact needed';
        nextActionDate = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // Tomorrow
      } else if (daysSinceLastAction < 7) {
        nextAction = 'Continue nurturing relationship';
        nextActionDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
      } else {
        nextAction = 'Follow up required';
        nextActionDate = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // Tomorrow
      }
  }
  
  // Special handling for specific last actions
  if (lastAction.includes('email')) {
    nextAction = 'Schedule follow-up call';
    nextActionDate = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days
  } else if (lastAction.includes('call')) {
    nextAction = 'Send follow-up email with next steps';
    nextActionDate = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // Tomorrow
  } else if (lastAction.includes('meeting') || lastAction.includes('demo')) {
    nextAction = 'Send meeting summary and proposal';
    nextActionDate = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // Tomorrow
  }
  
  return {
    nextAction,
    nextActionDate
  };
}

/**
 * Main function to populate next actions for top 10 people
 */
async function populateNextActionsTop10() {
  console.log('🚀 Starting next action population for top 10 Speedrun people...');
  console.log(`📊 Workspace: ${WORKSPACE_ID}`);
  
  try {
    // First, find Ross's user ID
    const rossUser = await prisma.users.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Ross', mode: 'insensitive' } },
          { lastName: { contains: 'Sylvester', mode: 'insensitive' } },
          { name: { contains: 'Ross', mode: 'insensitive' } }
        ]
      },
      select: { id: true, firstName: true, lastName: true, name: true }
    });
    
    if (rossUser) {
      ROSS_USER_ID = rossUser.id;
      console.log(`👤 Found Ross's user ID: ${ROSS_USER_ID} (${rossUser.firstName} ${rossUser.lastName})`);
    } else {
      console.log('⚠️ Could not find Ross\'s user ID, will use null filter only');
    }
    
    // Get top 10 people using the same logic as Speedrun API
    const top10People = await prisma.people.findMany({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null,
        // Same filters as Speedrun API
        OR: [
          { mainSellerId: ROSS_USER_ID },
          { mainSellerId: null }
        ]
      },
      orderBy: [
        { globalRank: 'asc' }, // Ranked people first (nulls will be last)
        { createdAt: 'desc' } // Then by newest
      ],
      take: 10, // Top 10 only
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        status: true,
        lastAction: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true,
        company: {
          select: {
            name: true,
            industry: true
          }
        }
      }
    });
    
    console.log(`📋 Found ${top10People.length} people to update`);
    
    if (top10People.length === 0) {
      console.log('❌ No people found in workspace. Check workspace ID.');
      return;
    }
    
    // Process each person
    let updatedCount = 0;
    
    for (const person of top10People) {
      try {
        // Generate next action
        const { nextAction, nextActionDate } = generateNextAction(person);
        
        // Update the person record
        const updatedPerson = await prisma.people.update({
          where: { id: person.id },
          data: {
            nextAction: nextAction,
            nextActionDate: nextActionDate
          }
        });
        
        console.log(`✅ Updated ${person.fullName || `${person.firstName} ${person.lastName}`.trim()}`);
        console.log(`   Status: ${person.status}`);
        console.log(`   Last Action: ${person.lastAction || 'None'}`);
        console.log(`   Next Action: ${nextAction}`);
        console.log(`   Next Action Date: ${nextActionDate.toISOString().split('T')[0]}`);
        console.log(`   Company: ${person.company?.name || 'Unknown'}`);
        console.log('');
        
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error updating person ${person.id}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} out of ${top10People.length} people`);
    
    // Note about cache clearing
    console.log('');
    console.log('💡 Note: You may need to refresh the Speedrun view or clear cache to see changes');
    console.log('   The Speedrun API caches data for 5 minutes');
    
  } catch (error) {
    console.error('❌ Error in populateNextActionsTop10:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  populateNextActionsTop10()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateNextActionsTop10, generateNextAction };
