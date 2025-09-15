const { PrismaClient } = require('@prisma/client');

/**
 * 🔍 COMPREHENSIVE ACTION SYSTEM AUDIT
 * 
 * This script audits the entire system to ensure complete action coverage:
 * 1. All data sources and their action coverage
 * 2. Missing action types and gaps
 * 3. Data integrity and relationships
 * 4. Action completeness across all entities
 */

async function comprehensiveActionAudit() {
  console.log('🔍 COMPREHENSIVE ACTION SYSTEM AUDIT');
  console.log('====================================');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. AUDIT ALL DATA SOURCES
    console.log('\n📊 STEP 1: AUDITING ALL DATA SOURCES');
    console.log('=====================================');
    await auditDataSources(prisma);
    
    // 2. AUDIT ACTION COVERAGE BY TYPE
    console.log('\n📋 STEP 2: AUDITING ACTION COVERAGE BY TYPE');
    console.log('===========================================');
    await auditActionCoverage(prisma);
    
    // 3. AUDIT MISSING ACTIONS
    console.log('\n❌ STEP 3: IDENTIFYING MISSING ACTIONS');
    console.log('=====================================');
    await auditMissingActions(prisma);
    
    // 4. AUDIT ACTION RELATIONSHIPS
    console.log('\n🔗 STEP 4: AUDITING ACTION RELATIONSHIPS');
    console.log('=======================================');
    await auditActionRelationships(prisma);
    
    // 5. AUDIT ACTION COMPLETENESS
    console.log('\n✅ STEP 5: AUDITING ACTION COMPLETENESS');
    console.log('=====================================');
    await auditActionCompleteness(prisma);
    
    // 6. GENERATE RECOMMENDATIONS
    console.log('\n💡 STEP 6: GENERATING RECOMMENDATIONS');
    console.log('====================================');
    await generateRecommendations(prisma);
    
  } catch (error) {
    console.error('❌ Comprehensive audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function auditDataSources(prisma) {
  console.log('Auditing all data sources in Dano\'s workspace...');
  
  // Core entities
  const peopleCount = await prisma.people.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  const companiesCount = await prisma.companies.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  const leadsCount = await prisma.leads.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  const prospectsCount = await prisma.prospects.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  const opportunitiesCount = await prisma.opportunities.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  
  // Communication data
  const emailMessagesCount = await prisma.email_messages.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  const notesCount = await prisma.notes.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  
  // Check for calendar events (if table exists)
  let calendarEventsCount = 0;
  try {
    calendarEventsCount = await prisma.calendar_events.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
  } catch (error) {
    console.log('  📅 Calendar events table not found or accessible');
  }
  
  // Check for other potential data sources
  let tasksCount = 0;
  try {
    tasksCount = await prisma.tasks.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
  } catch (error) {
    console.log('  📝 Tasks table not found or accessible');
  }
  
  console.log('\n📊 DATA SOURCE INVENTORY:');
  console.log(`  👥 People: ${peopleCount}`);
  console.log(`  🏢 Companies: ${companiesCount}`);
  console.log(`  📋 Leads: ${leadsCount}`);
  console.log(`  🎯 Prospects: ${prospectsCount}`);
  console.log(`  💰 Opportunities: ${opportunitiesCount}`);
  console.log(`  📧 Email Messages: ${emailMessagesCount}`);
  console.log(`  📝 Notes: ${notesCount}`);
  console.log(`  📅 Calendar Events: ${calendarEventsCount}`);
  console.log(`  ✅ Tasks: ${tasksCount}`);
  
  const totalRecords = peopleCount + companiesCount + leadsCount + prospectsCount + 
                      opportunitiesCount + emailMessagesCount + notesCount + 
                      calendarEventsCount + tasksCount;
  console.log(`\n📈 Total records to potentially track: ${totalRecords}`);
}

async function auditActionCoverage(prisma) {
  console.log('Auditing action coverage by type...');
  
  // Get all action types and their counts
  const actionTypes = await prisma.actions.groupBy({
    by: ['type'],
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
    _count: { type: true },
    orderBy: { _count: { type: 'desc' } }
  });
  
  console.log('\n📋 ACTION TYPE COVERAGE:');
  actionTypes.forEach(type => {
    console.log(`  ${type.type}: ${type._count.type}`);
  });
  
  const totalActions = await prisma.actions.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  console.log(`\n📊 Total actions: ${totalActions}`);
  
  // Categorize action types
  const systemActions = actionTypes.filter(t => 
    t.type.includes('created') || t.type.includes('updated') || t.type.includes('deleted')
  );
  const communicationActions = actionTypes.filter(t => 
    t.type.includes('email') || t.type.includes('call') || t.type.includes('linkedin') || t.type.includes('meeting')
  );
  const salesActions = actionTypes.filter(t => 
    t.type.includes('lead') || t.type.includes('prospect') || t.type.includes('opportunity')
  );
  
  console.log('\n📊 ACTION CATEGORIES:');
  console.log(`  🏗️ System Actions: ${systemActions.reduce((sum, t) => sum + t._count.type, 0)}`);
  console.log(`  💬 Communication Actions: ${communicationActions.reduce((sum, t) => sum + t._count.type, 0)}`);
  console.log(`  🎯 Sales Actions: ${salesActions.reduce((sum, t) => sum + t._count.type, 0)}`);
}

async function auditMissingActions(prisma) {
  console.log('Identifying missing actions...');
  
  // Check for records without corresponding actions
  const peopleWithoutActions = await prisma.people.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      NOT: {
        actions: {
          some: {
            type: 'person_created'
          }
        }
      }
    }
  });
  
  const companiesWithoutActions = await prisma.companies.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      NOT: {
        actions: {
          some: {
            type: 'company_created'
          }
        }
      }
    }
  });
  
  const leadsWithoutActions = await prisma.leads.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      NOT: {
        actions: {
          some: {
            type: 'lead_created'
          }
        }
      }
    }
  });
  
  const prospectsWithoutActions = await prisma.prospects.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      NOT: {
        actions: {
          some: {
            type: 'prospect_created'
          }
        }
      }
    }
  });
  
  const opportunitiesWithoutActions = await prisma.opportunities.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      NOT: {
        actions: {
          some: {
            type: 'opportunity_created'
          }
        }
      }
    }
  });
  
  console.log('\n❌ RECORDS WITHOUT ACTIONS:');
  console.log(`  👥 People without person_created actions: ${peopleWithoutActions}`);
  console.log(`  🏢 Companies without company_created actions: ${companiesWithoutActions}`);
  console.log(`  📋 Leads without lead_created actions: ${leadsWithoutActions}`);
  console.log(`  🎯 Prospects without prospect_created actions: ${prospectsWithoutActions}`);
  console.log(`  💰 Opportunities without opportunity_created actions: ${opportunitiesWithoutActions}`);
  
  // Check for email messages without actions
  const emailsWithoutActions = await prisma.email_messages.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      NOT: {
        actions: {
          some: {
            type: { contains: 'email' }
          }
        }
      }
    }
  });
  
  // Check for notes without actions
  const notesWithoutActions = await prisma.notes.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      NOT: {
        actions: {
          some: {
            type: 'note_added'
          }
        }
      }
    }
  });
  
  console.log(`  📧 Email messages without email actions: ${emailsWithoutActions}`);
  console.log(`  📝 Notes without note_added actions: ${notesWithoutActions}`);
  
  const totalMissing = peopleWithoutActions + companiesWithoutActions + leadsWithoutActions + 
                      prospectsWithoutActions + opportunitiesWithoutActions + 
                      emailsWithoutActions + notesWithoutActions;
  console.log(`\n📊 Total records missing actions: ${totalMissing}`);
}

async function auditActionRelationships(prisma) {
  console.log('Auditing action relationships...');
  
  // Check actions linked to people
  const actionsWithPeople = await prisma.actions.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      personId: { not: null }
    }
  });
  
  // Check actions linked to companies
  const actionsWithCompanies = await prisma.actions.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      companyId: { not: null }
    }
  });
  
  // Check actions linked to leads
  const actionsWithLeads = await prisma.actions.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      leadId: { not: null }
    }
  });
  
  // Check actions linked to prospects
  const actionsWithProspects = await prisma.actions.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      prospectId: { not: null }
    }
  });
  
  // Check actions linked to opportunities
  const actionsWithOpportunities = await prisma.actions.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      opportunityId: { not: null }
    }
  });
  
  // Check for orphaned actions (no relationships)
  const orphanedActions = await prisma.actions.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    }
  });
  
  console.log('\n🔗 ACTION RELATIONSHIP BREAKDOWN:');
  console.log(`  👥 Actions linked to people: ${actionsWithPeople}`);
  console.log(`  🏢 Actions linked to companies: ${actionsWithCompanies}`);
  console.log(`  📋 Actions linked to leads: ${actionsWithLeads}`);
  console.log(`  🎯 Actions linked to prospects: ${actionsWithProspects}`);
  console.log(`  💰 Actions linked to opportunities: ${actionsWithOpportunities}`);
  console.log(`  🚫 Orphaned actions (no relationships): ${orphanedActions}`);
  
  const totalActions = await prisma.actions.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  
  const linkedActions = actionsWithPeople + actionsWithCompanies + actionsWithLeads + 
                       actionsWithProspects + actionsWithOpportunities;
  
  console.log(`\n📊 Relationship Coverage: ${linkedActions}/${totalActions} (${Math.round(linkedActions/totalActions*100)}%)`);
}

async function auditActionCompleteness(prisma) {
  console.log('Auditing action completeness...');
  
  // Check for actions with missing required fields
  const actionsWithoutSubject = await prisma.actions.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      OR: [
        { subject: null },
        { subject: '' }
      ]
    }
  });
  
  const actionsWithoutType = await prisma.actions.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      OR: [
        { type: null },
        { type: '' }
      ]
    }
  });
  
  const actionsWithoutStatus = await prisma.actions.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      OR: [
        { status: null },
        { status: '' }
      ]
    }
  });
  
  // Check for actions with missing timestamps
  const actionsWithoutCreatedAt = await prisma.actions.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      createdAt: null
    }
  });
  
  // Check for actions with missing workspace
  const actionsWithoutWorkspace = await prisma.actions.count({
    where: { 
      workspaceId: null
    }
  });
  
  console.log('\n✅ ACTION COMPLETENESS CHECK:');
  console.log(`  📝 Actions without subject: ${actionsWithoutSubject}`);
  console.log(`  🏷️ Actions without type: ${actionsWithoutType}`);
  console.log(`  📊 Actions without status: ${actionsWithoutStatus}`);
  console.log(`  📅 Actions without createdAt: ${actionsWithoutCreatedAt}`);
  console.log(`  🏢 Actions without workspace: ${actionsWithoutWorkspace}`);
  
  const totalActions = await prisma.actions.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  
  const incompleteActions = actionsWithoutSubject + actionsWithoutType + actionsWithoutStatus + 
                           actionsWithoutCreatedAt + actionsWithoutWorkspace;
  
  console.log(`\n📊 Completeness: ${totalActions - incompleteActions}/${totalActions} (${Math.round((totalActions - incompleteActions)/totalActions*100)}%)`);
}

async function generateRecommendations(prisma) {
  console.log('Generating recommendations...');
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('===================');
  
  // Check what we found in the audit
  const peopleWithoutActions = await prisma.people.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      NOT: {
        actions: {
          some: {
            type: 'person_created'
          }
        }
      }
    }
  });
  
  const emailsWithoutActions = await prisma.email_messages.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      NOT: {
        actions: {
          some: {
            type: { contains: 'email' }
          }
        }
      }
    }
  });
  
  const notesWithoutActions = await prisma.notes.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      NOT: {
        actions: {
          some: {
            type: 'note_added'
          }
        }
      }
    }
  });
  
  if (peopleWithoutActions > 0) {
    console.log(`  🔧 Create missing person_created actions for ${peopleWithoutActions} people`);
  }
  
  if (emailsWithoutActions > 0) {
    console.log(`  📧 Create missing email actions for ${emailsWithoutActions} email messages`);
  }
  
  if (notesWithoutActions > 0) {
    console.log(`  📝 Create missing note_added actions for ${notesWithoutActions} notes`);
  }
  
  // Check for calendar events
  try {
    const calendarEventsCount = await prisma.calendar_events.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    
    if (calendarEventsCount > 0) {
      const calendarEventsWithoutActions = await prisma.calendar_events.count({
        where: { 
          workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
          NOT: {
            actions: {
              some: {
                type: { contains: 'meeting' }
              }
            }
          }
        }
      });
      
      if (calendarEventsWithoutActions > 0) {
        console.log(`  📅 Create missing meeting actions for ${calendarEventsWithoutActions} calendar events`);
      }
    }
  } catch (error) {
    console.log('  📅 Calendar events table not accessible for audit');
  }
  
  console.log('\n🎯 PRIORITY ACTIONS:');
  console.log('===================');
  console.log('  1. Complete email action coverage (highest impact)');
  console.log('  2. Add note_added actions for all notes');
  console.log('  3. Add meeting actions for calendar events');
  console.log('  4. Implement field_updated actions for record changes');
  console.log('  5. Add nextAction generation using LLM strategy context');
  
  console.log('\n✅ AUDIT COMPLETE!');
}

// Run the comprehensive audit
comprehensiveActionAudit();
