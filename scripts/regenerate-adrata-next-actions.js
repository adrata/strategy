const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Adrata workspace ID
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

/**
 * Regenerate smart next actions for all Adrata companies and people
 * Based on AcquisitionOS Acquisition Factor Model
 */
async function regenerateAdrataNextActions() {
  console.log('🚀 REGENERATING ADRATA NEXT ACTIONS');
  console.log('=====================================');
  console.log('Using AcquisitionOS Acquisition Factor Model');
  console.log('');

  try {
    // Get all companies in Adrata workspace
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        status: true,
        globalRank: true,
        lastActionDate: true,
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullName: true,
            email: true,
            linkedinUrl: true,
            globalRank: true,
            lastActionDate: true
          }
        }
      },
      orderBy: { globalRank: 'asc' }
    });

    console.log(`📊 Found ${companies.length} companies to process`);
    console.log('');

    let companiesProcessed = 0;
    let peopleProcessed = 0;

    for (const company of companies) {
      try {
        console.log(`🏢 Processing: ${company.name} (Rank: ${company.globalRank}, Status: ${company.status})`);
        
        // Calculate people count and contact info availability
        const peopleCount = company.people.length;
        const hasEmail = company.people.some(p => !!p.email);
        const hasLinkedIn = company.people.some(p => !!p.linkedinUrl);

        // Generate company next action
        const companyNextAction = generateCompanyNextAction(
          company.name,
          company.status,
          peopleCount,
          hasEmail,
          hasLinkedIn,
          company.globalRank,
          company.lastActionDate
        );

        // Update company
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            nextAction: companyNextAction.action,
            nextActionDate: companyNextAction.date,
            nextActionReasoning: companyNextAction.reasoning,
            nextActionPriority: companyNextAction.priority,
            nextActionType: companyNextAction.type,
            nextActionUpdatedAt: new Date()
          }
        });

        companiesProcessed++;
        console.log(`   ✅ Company: ${companyNextAction.action} (${companyNextAction.date.toDateString()})`);

        // Process people at this company
        for (const person of company.people) {
          try {
            const personNextAction = generatePersonNextAction(
              person.fullName,
              person.email,
              person.linkedinUrl,
              company.status,
              peopleCount,
              hasEmail,
              hasLinkedIn,
              person.globalRank,
              person.lastActionDate
            );

            // Update person
            await prisma.people.update({
              where: { id: person.id },
              data: {
                nextAction: personNextAction.action,
                nextActionDate: personNextAction.date,
                nextActionReasoning: personNextAction.reasoning,
                nextActionPriority: personNextAction.priority,
                nextActionType: personNextAction.type,
                nextActionUpdatedAt: new Date()
              }
            });

            peopleProcessed++;
            console.log(`   👤 ${person.fullName}: ${personNextAction.action}`);

          } catch (error) {
            console.error(`   ❌ Error processing person ${person.fullName}:`, error.message);
          }
        }

        console.log('');

      } catch (error) {
        console.error(`❌ Error processing company ${company.name}:`, error.message);
      }
    }

    console.log('🎉 REGENERATION COMPLETE');
    console.log('========================');
    console.log(`✅ Companies processed: ${companiesProcessed}`);
    console.log(`✅ People processed: ${peopleProcessed}`);
    console.log('');
    console.log('📋 Next Action Summary:');
    console.log('- Speedrun companies (rank 1-50): TODAY priority');
    console.log('- LEAD status: Research/contact identification actions');
    console.log('- PROSPECT status: Discovery/validation actions');
    console.log('- OPPORTUNITY status: Business case/alignment actions');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Generate company next action based on AcquisitionOS framework
 */
function generateCompanyNextAction(name, status, peopleCount, hasEmail, hasLinkedIn, globalRank, lastActionDate) {
  const nextDate = calculateRankBasedDate(globalRank, lastActionDate);
  
  // GENERATE PIPELINE (LEAD Status)
  if (status === 'LEAD') {
    if (peopleCount === 0) {
      return {
        action: 'Research company and identify key contacts',
        type: 'research',
        reasoning: 'LEAD stage: Company has no people - need to research and identify key decision makers',
        priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
        date: nextDate
      };
    }
    
    if (hasLinkedIn && !hasEmail) {
      return {
        action: 'Send LinkedIn connection request to key contacts',
        type: 'linkedin_connection_request',
        reasoning: 'LEAD stage: Has LinkedIn but no email - LinkedIn connection is the best first touch',
        priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
        date: nextDate
      };
    }
    
    if (hasEmail) {
      return {
        action: 'Send introduction email to key contacts',
        type: 'email_conversation',
        reasoning: 'LEAD stage: Has email contact - send personalized introduction email',
        priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
        date: nextDate
      };
    }
    
    return {
      action: 'Find contact information on LinkedIn',
      type: 'research',
      reasoning: 'LEAD stage: No contact info available - research LinkedIn for contact details',
      priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
      date: nextDate
    };
  }

  // BUILD SALE (PROSPECT Status)
  if (status === 'PROSPECT') {
    return {
      action: 'Schedule discovery call to validate pain and build credibility',
      type: 'discovery_call',
      reasoning: 'PROSPECT stage: Need to validate pain and build credibility through discovery',
      priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
      date: nextDate
    };
  }

  // JUSTIFY/NEGOTIATE (OPPORTUNITY Status)
  if (status === 'OPPORTUNITY') {
    return {
      action: 'Send business case and ROI proposal',
      type: 'proposal_sent',
      reasoning: 'OPPORTUNITY stage: Present business case with quantified ROI and strategic fit',
      priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
      date: nextDate
    };
  }

  // Default fallback
  return {
    action: 'Research company and identify key contacts',
    type: 'research',
    reasoning: 'Initial research to identify key decision makers',
    priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
    date: nextDate
  };
}

/**
 * Generate person next action based on AcquisitionOS framework
 */
function generatePersonNextAction(fullName, email, linkedinUrl, companyStatus, peopleCount, hasEmail, hasLinkedIn, globalRank, lastActionDate) {
  const nextDate = calculateRankBasedDate(globalRank, lastActionDate);
  
  // GENERATE PIPELINE (LEAD Status)
  if (companyStatus === 'LEAD') {
    if (linkedinUrl && !email) {
      return {
        action: 'Send LinkedIn connection request',
        type: 'linkedin_connection_request',
        reasoning: 'LEAD stage: Has LinkedIn but no email - LinkedIn connection is the best first touch',
        priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
        date: nextDate
      };
    }
    
    if (email) {
      return {
        action: 'Send introduction email',
        type: 'email_conversation',
        reasoning: 'LEAD stage: Has email contact - send personalized introduction email',
        priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
        date: nextDate
      };
    }
    
    return {
      action: 'Find contact information on LinkedIn',
      type: 'research',
      reasoning: 'LEAD stage: No contact info available - research LinkedIn for contact details',
      priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
      date: nextDate
    };
  }

  // BUILD SALE (PROSPECT Status)
  if (companyStatus === 'PROSPECT') {
    return {
      action: 'Schedule discovery call to validate pain',
      type: 'discovery_call',
      reasoning: 'PROSPECT stage: Need to validate pain and build credibility through discovery',
      priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
      date: nextDate
    };
  }

  // JUSTIFY/NEGOTIATE (OPPORTUNITY Status)
  if (companyStatus === 'OPPORTUNITY') {
    return {
      action: 'Send business case and ROI proposal',
      type: 'proposal_sent',
      reasoning: 'OPPORTUNITY stage: Present business case with quantified ROI and strategic fit',
      priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
      date: nextDate
    };
  }

  // Default fallback
  return {
    action: 'Send LinkedIn connection request',
    type: 'linkedin_connection_request',
    reasoning: 'Initial outreach - LinkedIn connection request is the best starting point',
    priority: globalRank && globalRank <= 50 ? 'high' : 'medium',
    date: nextDate
  };
}

/**
 * Calculate next action date based on global rank and last action
 */
function calculateRankBasedDate(globalRank, lastActionDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Check if last action was today - if so, push to tomorrow minimum
  const lastActionToday = lastActionDate && 
    lastActionDate.getFullYear() === now.getFullYear() &&
    lastActionDate.getMonth() === now.getMonth() &&
    lastActionDate.getDate() === now.getDate();
  
  let targetDate;
  
  // Rank-based date calculation
  if (!globalRank || globalRank <= 50) {
    // Top 50: TODAY (or tomorrow if action already today)
    targetDate = lastActionToday ? new Date(today.getTime() + 24 * 60 * 60 * 1000) : today;
  } else if (globalRank <= 200) {
    // High priority (51-200): THIS WEEK (2-3 days)
    const daysOut = lastActionToday ? 3 : 2;
    targetDate = new Date(today.getTime() + daysOut * 24 * 60 * 60 * 1000);
  } else if (globalRank <= 500) {
    // Medium priority (201-500): NEXT WEEK (7 days)
    targetDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    // Lower priority (500+): THIS MONTH (14 days)
    targetDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  
  // Push weekend dates to Monday
  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek === 0) { // Sunday
    targetDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000); // Move to Monday
  } else if (dayOfWeek === 6) { // Saturday
    targetDate = new Date(targetDate.getTime() + 2 * 24 * 60 * 60 * 1000); // Move to Monday
  }
  
  return targetDate;
}

// Run the script
if (require.main === module) {
  regenerateAdrataNextActions()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { regenerateAdrataNextActions };
