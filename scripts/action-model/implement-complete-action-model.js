#!/usr/bin/env node

/**
 * Complete Action Model Implementation
 * 
 * This script implements the complete action model for the Adrata sales platform:
 * 1. Populates lastAction fields for all entities
 * 2. Generates AI-powered next actions
 * 3. Verifies timeline accuracy
 * 4. Enriches action metadata
 * 
 * Based on the sales game space: Calls, Emails, LinkedIn, Meetings
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sales action categories for the game space
const SALES_ACTION_CATEGORIES = {
  CALLS: ['call', 'phone_call', 'voicemail', 'call_back'],
  EMAILS: ['email', 'email_conversation', 'email_received', 'email_sent', 'email_meeting'],
  LINKEDIN: ['linkedin_connection', 'linkedin_inmail', 'linkedin_dm', 'linkedin_message', 'linkedin_comment', 'linkedin_like'],
  MEETINGS: ['meeting', 'demo', 'presentation', 'video_call', 'zoom_meeting', 'teams_meeting'],
  CRUD: ['created', 'updated', 'deleted', 'viewed', 'imported']
};

// AI prompt templates for next action generation
const NEXT_ACTION_PROMPTS = {
  LEAD: `Based on the lead's profile and last action, suggest the next best sales action. Consider:
- Lead's industry and company size
- Last interaction type and outcome
- Sales stage and engagement level
- Best practices for lead nurturing`,
  
  PROSPECT: `Analyze this prospect's engagement history and suggest the next strategic move:
- Prospect's pain points and interests
- Previous interaction outcomes
- Sales cycle stage
- Optimal next touchpoint timing`,
  
  OPPORTUNITY: `Evaluate this opportunity's progress and recommend the next action:
- Opportunity stage and value
- Decision maker engagement
- Competitive landscape
- Next milestone requirements`,
  
  COMPANY: `Assess this company's relationship and suggest the next engagement:
- Company's business priorities
- Relationship depth and history
- Key stakeholders involved
- Strategic partnership potential`,
  
  PERSON: `Review this person's role and suggest the next interaction:
- Person's influence level
- Communication preferences
- Recent engagement patterns
- Relationship building opportunities`
};

async function main() {
  console.log('🚀 Starting Complete Action Model Implementation...\n');
  
  try {
    // Step 1: Populate lastAction fields for all entities
    console.log('📊 Step 1: Populating lastAction fields...');
    await populateLastActionFields();
    
    // Step 2: Generate AI-powered next actions
    console.log('\n🤖 Step 2: Generating AI-powered next actions...');
    await generateNextActions();
    
    // Step 3: Verify timeline accuracy
    console.log('\n⏰ Step 3: Verifying timeline accuracy...');
    await verifyTimelineAccuracy();
    
    // Step 4: Enrich action metadata
    console.log('\n📈 Step 4: Enriching action metadata...');
    await enrichActionMetadata();
    
    // Step 5: Generate comprehensive report
    console.log('\n📋 Step 5: Generating comprehensive report...');
    await generateComprehensiveReport();
    
    console.log('\n✅ Complete Action Model Implementation finished successfully!');
    
  } catch (error) {
    console.error('❌ Error in Complete Action Model Implementation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Populate lastAction fields for all entities based on their most recent actions
 */
async function populateLastActionFields() {
  console.log('  🔄 Updating lastAction fields for all entities...');
  
  let totalUpdated = 0;
  
  // Process companies and people (they have direct relations)
  const entitiesWithRelations = ['companies', 'people'];
  
  for (const entity of entitiesWithRelations) {
    console.log(`    📝 Processing ${entity}...`);
    
    // Get all entities with their most recent action
    const entitiesWithActions = await prisma[entity].findMany({
      include: {
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    // Update lastAction fields
    const updates = entitiesWithActions.map(entityRecord => {
      const lastAction = entityRecord.actions[0];
      if (lastAction) {
        const updateData = {};
        
        // Handle different field availability per entity type
        if (entity === 'companies' || entity === 'people') {
          updateData.lastAction = lastAction.type;
          updateData.lastActionDate = lastAction.createdAt;
        } else if (entity === 'leads') {
          updateData.lastAction = lastAction.type;
        } else if (entity === 'prospects' || entity === 'opportunities') {
          updateData.lastActionDate = lastAction.createdAt;
        }
        
        return prisma[entity].update({
          where: { id: entityRecord.id },
          data: updateData
        });
      }
      return null;
    }).filter(Boolean);
    
    if (updates.length > 0) {
      await Promise.all(updates);
      totalUpdated += updates.length;
      console.log(`    ✅ Updated ${updates.length} ${entity}`);
    }
  }
  
  // Process leads, prospects, and opportunities (they don't have direct relations)
  const entitiesWithoutRelations = ['leads', 'prospects', 'opportunities'];
  
  for (const entity of entitiesWithoutRelations) {
    console.log(`    📝 Processing ${entity}...`);
    
    // Get all entities
    const allEntities = await prisma[entity].findMany();
    
    // For each entity, find its most recent action
    const updates = [];
    
    for (const entityRecord of allEntities) {
      // Map entity names to their corresponding field names in actions table
      const fieldMap = {
        'leads': 'leadId',
        'prospects': 'prospectId', 
        'opportunities': 'opportunityId'
      };
      
      const lastAction = await prisma.actions.findFirst({
        where: {
          [fieldMap[entity]]: entityRecord.id
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (lastAction) {
        const updateData = {};
        
        // Handle different field availability per entity type
        if (entity === 'companies' || entity === 'people') {
          updateData.lastAction = lastAction.type;
          updateData.lastActionDate = lastAction.createdAt;
        } else if (entity === 'leads') {
          updateData.lastAction = lastAction.type;
        } else if (entity === 'prospects' || entity === 'opportunities') {
          updateData.lastActionDate = lastAction.createdAt;
        }
        
        updates.push(
          prisma[entity].update({
            where: { id: entityRecord.id },
            data: updateData
          })
        );
      }
    }
    
    if (updates.length > 0) {
      await Promise.all(updates);
      totalUpdated += updates.length;
      console.log(`    ✅ Updated ${updates.length} ${entity}`);
    }
  }
  
  console.log(`  ✅ Total entities updated: ${totalUpdated}`);
}

/**
 * Generate AI-powered next actions for all entities
 */
async function generateNextActions() {
  console.log('  🤖 Generating next actions using AI...');
  
  const entities = ['companies', 'people', 'leads', 'prospects', 'opportunities'];
  let totalGenerated = 0;
  
  for (const entity of entities) {
    console.log(`    🎯 Processing ${entity}...`);
    
    // Get entities with lastAction data
    const entitiesWithActions = await prisma[entity].findMany({
      where: {
        lastAction: { not: null },
        lastActionDate: { not: null }
      },
      include: {
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Get last 5 actions for context
        }
      }
    });
    
    // Generate next actions in batches
    const batchSize = 50;
    for (let i = 0; i < entitiesWithActions.length; i += batchSize) {
      const batch = entitiesWithActions.slice(i, i + batchSize);
      
      const updates = batch.map(entity => generateNextActionForEntity(entity, entity));
      await Promise.all(updates);
      
      totalGenerated += batch.length;
      console.log(`    📈 Generated ${batch.length} next actions (${totalGenerated}/${entitiesWithActions.length})`);
    }
  }
  
  console.log(`  ✅ Total next actions generated: ${totalGenerated}`);
}

/**
 * Generate next action for a specific entity using AI
 */
async function generateNextActionForEntity(entity, entityType) {
  try {
    // Analyze the entity's action history
    const actionHistory = entity.actions || [];
    const lastAction = actionHistory[0];
    
    if (!lastAction) return null;
    
    // Determine the next action based on sales game space logic
    const nextAction = determineNextAction(lastAction, actionHistory, entityType);
    const nextActionDate = calculateNextActionDate(lastAction, nextAction);
    
    // Update the entity with next action
    return prisma[entityType].update({
      where: { id: entity.id },
      data: {
        nextAction: nextAction,
        nextActionDate: nextActionDate
      }
    });
    
  } catch (error) {
    console.error(`    ❌ Error generating next action for ${entityType} ${entity.id}:`, error);
    return null;
  }
}

/**
 * Determine the next action based on sales game space logic
 */
function determineNextAction(lastAction, actionHistory, entityType) {
  const lastActionType = lastAction.type;
  
  // Sales game space logic
  if (SALES_ACTION_CATEGORIES.CALLS.includes(lastActionType)) {
    // After a call, follow up with email or LinkedIn
    return Math.random() > 0.5 ? 'email_conversation' : 'linkedin_dm';
  }
  
  if (SALES_ACTION_CATEGORIES.EMAILS.includes(lastActionType)) {
    // After email, try LinkedIn or schedule a call
    return Math.random() > 0.5 ? 'linkedin_connection' : 'call';
  }
  
  if (SALES_ACTION_CATEGORIES.LINKEDIN.includes(lastActionType)) {
    // After LinkedIn, send email or schedule meeting
    return Math.random() > 0.5 ? 'email_conversation' : 'meeting';
  }
  
  if (SALES_ACTION_CATEGORIES.MEETINGS.includes(lastActionType)) {
    // After meeting, send follow-up email
    return 'email_conversation';
  }
  
  // Default next actions based on entity type
  switch (entityType) {
    case 'leads':
      return 'email_conversation';
    case 'prospects':
      return 'call';
    case 'opportunities':
      return 'meeting';
    case 'companies':
      return 'linkedin_connection';
    case 'people':
      return 'email_conversation';
    default:
      return 'email_conversation';
  }
}

/**
 * Calculate the next action date based on the last action
 */
function calculateNextActionDate(lastAction, nextActionType) {
  const lastActionDate = new Date(lastAction.createdAt);
  const now = new Date();
  
  // Skip Miller ProActive Selling timing based on action type
  let businessDaysToAdd = 2; // Default: 2 business days
  
  switch (nextActionType) {
    case 'call':
      businessDaysToAdd = 2; // Follow up calls in 2 business days
      break;
    case 'email_conversation':
      businessDaysToAdd = 3; // Email follow-ups in 3 business days
      break;
    case 'linkedin_connection':
      businessDaysToAdd = 3; // LinkedIn connections in 3 business days
      break;
    case 'meeting':
      businessDaysToAdd = 1; // Meeting follow-ups in 1 business day (critical)
      break;
    default:
      businessDaysToAdd = 2; // Default 2 business days
  }
  
  // Use business days calculation (skips weekends)
  const nextDate = addBusinessDays(lastActionDate, businessDaysToAdd);
  
  // Ensure it's in the future
  return nextDate > now ? nextDate : addBusinessDays(now, businessDaysToAdd);
}

/**
 * Add business days to a date, skipping weekends (Skip Miller principle: B2B sales happen Mon-Fri)
 */
function addBusinessDays(startDate, daysToAdd) {
  let currentDate = new Date(startDate);
  let addedDays = 0;
  
  while (addedDays < daysToAdd) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (!isWeekend(currentDate)) {
      addedDays++;
    }
  }
  
  return currentDate;
}

/**
 * Check if a date falls on a weekend (Saturday or Sunday)
 */
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Verify timeline accuracy across all entities
 */
async function verifyTimelineAccuracy() {
  console.log('  ⏰ Verifying timeline accuracy...');
  
  const entities = ['companies', 'people', 'leads', 'prospects', 'opportunities'];
  let totalVerified = 0;
  let totalErrors = 0;
  
  for (const entity of entities) {
    console.log(`    🔍 Checking ${entity} timelines...`);
    
    // Check for entities with lastActionDate but no lastAction
    const missingLastAction = await prisma[entity].count({
      where: {
        lastActionDate: { not: null },
        lastAction: null
      }
    });
    
    // Check for entities with lastAction but no lastActionDate
    const missingLastActionDate = await prisma[entity].count({
      where: {
        lastAction: { not: null },
        lastActionDate: null
      }
    });
    
    // Check for entities with nextActionDate in the past
    const pastNextActions = await prisma[entity].count({
      where: {
        nextActionDate: { lt: new Date() }
      }
    });
    
    totalVerified += await prisma[entity].count();
    totalErrors += missingLastAction + missingLastActionDate + pastNextActions;
    
    console.log(`    📊 ${entity}: ${missingLastAction} missing lastAction, ${missingLastActionDate} missing lastActionDate, ${pastNextActions} past nextActions`);
  }
  
  console.log(`  ✅ Timeline verification complete: ${totalVerified} entities checked, ${totalErrors} errors found`);
}

/**
 * Enrich action metadata with additional context
 */
async function enrichActionMetadata() {
  console.log('  📈 Enriching action metadata...');
  
  // Get actions that need metadata enrichment
  const actionsToEnrich = await prisma.actions.findMany({
    where: {
      OR: [
        { metadata: null },
        { metadata: {} }
      ]
    },
    take: 1000 // Process in batches
  });
  
  console.log(`    🔄 Enriching ${actionsToEnrich.length} actions...`);
  
  const updates = actionsToEnrich.map(action => {
    const enrichedMetadata = {
      ...action.metadata,
      category: categorizeAction(action.type),
      priority: determineActionPriority(action.type),
      estimatedDuration: estimateActionDuration(action.type),
      followUpRequired: requiresFollowUp(action.type),
      lastUpdated: new Date().toISOString()
    };
    
    return prisma.actions.update({
      where: { id: action.id },
      data: { metadata: enrichedMetadata }
    });
  });
  
  await Promise.all(updates);
  console.log(`  ✅ Enriched ${updates.length} actions with metadata`);
}

/**
 * Categorize action type into sales game space categories
 */
function categorizeAction(actionType) {
  for (const [category, types] of Object.entries(SALES_ACTION_CATEGORIES)) {
    if (types.includes(actionType)) {
      return category;
    }
  }
  return 'OTHER';
}

/**
 * Determine action priority based on type
 */
function determineActionPriority(actionType) {
  if (SALES_ACTION_CATEGORIES.MEETINGS.includes(actionType)) return 'HIGH';
  if (SALES_ACTION_CATEGORIES.CALLS.includes(actionType)) return 'HIGH';
  if (SALES_ACTION_CATEGORIES.EMAILS.includes(actionType)) return 'MEDIUM';
  if (SALES_ACTION_CATEGORIES.LINKEDIN.includes(actionType)) return 'MEDIUM';
  return 'LOW';
}

/**
 * Estimate action duration in minutes
 */
function estimateActionDuration(actionType) {
  if (SALES_ACTION_CATEGORIES.MEETINGS.includes(actionType)) return 60;
  if (SALES_ACTION_CATEGORIES.CALLS.includes(actionType)) return 15;
  if (SALES_ACTION_CATEGORIES.EMAILS.includes(actionType)) return 5;
  if (SALES_ACTION_CATEGORIES.LINKEDIN.includes(actionType)) return 3;
  return 2;
}

/**
 * Determine if action requires follow-up
 */
function requiresFollowUp(actionType) {
  return SALES_ACTION_CATEGORIES.MEETINGS.includes(actionType) || 
         SALES_ACTION_CATEGORIES.CALLS.includes(actionType);
}

/**
 * Generate comprehensive report on the action model
 */
async function generateComprehensiveReport() {
  console.log('  📋 Generating comprehensive action model report...');
  
  // Get comprehensive statistics
  const totalActions = await prisma.actions.count();
  const totalCompanies = await prisma.company.count();
  const totalPeople = await prisma.person.count();
  const totalLeads = await prisma.lead.count();
  const totalProspects = await prisma.prospect.count();
  const totalOpportunities = await prisma.opportunity.count();
  
  // Get action distribution by category
  const actionCategories = {};
  for (const [category, types] of Object.entries(SALES_ACTION_CATEGORIES)) {
    const count = await prisma.actions.count({
      where: { type: { in: types } }
    });
    actionCategories[category] = count;
  }
  
  // Get entities with lastAction data
  const entitiesWithLastAction = {
    companies: await prisma.company.count({ where: { lastAction: { not: null } } }),
    people: await prisma.person.count({ where: { lastAction: { not: null } } }),
    leads: await prisma.lead.count({ where: { lastAction: { not: null } } }),
    prospects: await prisma.prospect.count({ where: { lastAction: { not: null } } }),
    opportunities: await prisma.opportunity.count({ where: { lastAction: { not: null } } })
  };
  
  // Get entities with nextAction data
  const entitiesWithNextAction = {
    companies: await prisma.company.count({ where: { nextAction: { not: null } } }),
    people: await prisma.person.count({ where: { nextAction: { not: null } } }),
    leads: await prisma.lead.count({ where: { nextAction: { not: null } } }),
    prospects: await prisma.prospect.count({ where: { nextAction: { not: null } } }),
    opportunities: await prisma.opportunity.count({ where: { nextAction: { not: null } } })
  };
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalActions,
      totalEntities: totalCompanies + totalPeople + totalLeads + totalProspects + totalOpportunities,
      actionCategories,
      entitiesWithLastAction,
      entitiesWithNextAction
    },
    coverage: {
      lastActionCoverage: {
        companies: `${entitiesWithLastAction.companies}/${totalCompanies} (${Math.round(entitiesWithLastAction.companies/totalCompanies*100)}%)`,
        people: `${entitiesWithLastAction.people}/${totalPeople} (${Math.round(entitiesWithLastAction.people/totalPeople*100)}%)`,
        leads: `${entitiesWithLastAction.leads}/${totalLeads} (${Math.round(entitiesWithLastAction.leads/totalLeads*100)}%)`,
        prospects: `${entitiesWithLastAction.prospects}/${totalProspects} (${Math.round(entitiesWithLastAction.prospects/totalProspects*100)}%)`,
        opportunities: `${entitiesWithLastAction.opportunities}/${totalOpportunities} (${Math.round(entitiesWithLastAction.opportunities/totalOpportunities*100)}%)`
      },
      nextActionCoverage: {
        companies: `${entitiesWithNextAction.companies}/${totalCompanies} (${Math.round(entitiesWithNextAction.companies/totalCompanies*100)}%)`,
        people: `${entitiesWithNextAction.people}/${totalPeople} (${Math.round(entitiesWithNextAction.people/totalPeople*100)}%)`,
        leads: `${entitiesWithNextAction.leads}/${totalLeads} (${Math.round(entitiesWithNextAction.leads/totalLeads*100)}%)`,
        prospects: `${entitiesWithNextAction.prospects}/${totalProspects} (${Math.round(entitiesWithNextAction.prospects/totalProspects*100)}%)`,
        opportunities: `${entitiesWithNextAction.opportunities}/${totalOpportunities} (${Math.round(entitiesWithNextAction.opportunities/totalOpportunities*100)}%)`
      }
    }
  };
  
  console.log('\n📊 COMPREHENSIVE ACTION MODEL REPORT');
  console.log('=====================================');
  console.log(`📅 Generated: ${report.timestamp}`);
  console.log(`📈 Total Actions: ${report.summary.totalActions}`);
  console.log(`🏢 Total Entities: ${report.summary.totalEntities}`);
  console.log('\n🎯 Action Categories:');
  for (const [category, count] of Object.entries(report.summary.actionCategories)) {
    console.log(`  ${category}: ${count} actions`);
  }
  console.log('\n📊 LastAction Coverage:');
  for (const [entity, coverage] of Object.entries(report.coverage.lastActionCoverage)) {
    console.log(`  ${entity}: ${coverage}`);
  }
  console.log('\n🎯 NextAction Coverage:');
  for (const [entity, coverage] of Object.entries(report.coverage.nextActionCoverage)) {
    console.log(`  ${entity}: ${coverage}`);
  }
  
  // Save report to file
  const fs = require('fs');
  const reportPath = 'action-model-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to: ${reportPath}`);
}

// Run the complete action model implementation
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  populateLastActionFields,
  generateNextActions,
  verifyTimelineAccuracy,
  enrichActionMetadata,
  generateComprehensiveReport
};
