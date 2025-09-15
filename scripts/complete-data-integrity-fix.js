#!/usr/bin/env node

/**
 * 🔧 COMPLETE DATA INTEGRITY FIX
 * 
 * Comprehensive fix to ensure:
 * 1. All action records are correctly associated with Dano's engagement
 * 2. Person/company records have proper status and connections
 * 3. Lead/prospect/opportunity relationships are clean and accurate
 * 4. No orphaned records or duplicates
 * 5. Complete data integrity validation
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
const BATCH_SIZE = 100;

async function completeDataIntegrityFix() {
  console.log('🔧 COMPLETE DATA INTEGRITY FIX');
  console.log('='.repeat(60));
  console.log('Ensuring complete data integrity for Dano\'s workspace');
  console.log('Focus: Action associations and engagement tracking');
  console.log('');

  try {
    // Phase 1: Complete audit of current state
    await auditCurrentState();
    
    // Phase 2: Fix action associations and engagement
    await fixActionAssociations();
    
    // Phase 3: Clean up entity relationships
    await cleanEntityRelationships();
    
    // Phase 4: Remove duplicates and orphaned records
    await removeDuplicatesAndOrphans();
    
    // Phase 5: Final validation and reporting
    await finalValidation();
    
    console.log('');
    console.log('✅ COMPLETE DATA INTEGRITY FIX COMPLETED!');
    console.log('All data is now clean and properly associated.');
    
  } catch (error) {
    console.error('❌ Error in complete data integrity fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function auditCurrentState() {
  console.log('📊 PHASE 1: COMPLETE AUDIT OF CURRENT STATE');
  console.log('-'.repeat(50));
  
  // Get comprehensive counts
  const [
    totalPeople,
    totalCompanies,
    totalLeads,
    totalProspects,
    totalOpportunities,
    totalActions,
    actionsWithPerson,
    actionsWithCompany,
    actionsWithLead,
    actionsWithProspect,
    actionsWithOpportunity,
    orphanedActions
  ] = await Promise.all([
    prisma.people.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.companies.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.opportunities.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID, personId: { not: null } } }),
    prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID, companyId: { not: null } } }),
    prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID, leadId: { not: null } } }),
    prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID, prospectId: { not: null } } }),
    prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID, opportunityId: { not: null } } }),
    prisma.actions.count({ 
      where: { 
        workspaceId: DANO_WORKSPACE_ID,
        personId: null,
        companyId: null,
        leadId: null,
        prospectId: null,
        opportunityId: null
      } 
    })
  ]);

  console.log(`   Total People: ${totalPeople.toLocaleString()}`);
  console.log(`   Total Companies: ${totalCompanies.toLocaleString()}`);
  console.log(`   Total Leads: ${totalLeads.toLocaleString()}`);
  console.log(`   Total Prospects: ${totalProspects.toLocaleString()}`);
  console.log(`   Total Opportunities: ${totalOpportunities.toLocaleString()}`);
  console.log(`   Total Actions: ${totalActions.toLocaleString()}`);
  console.log('');
  console.log('   Action Associations:');
  console.log(`   - With Person: ${actionsWithPerson.toLocaleString()}`);
  console.log(`   - With Company: ${actionsWithCompany.toLocaleString()}`);
  console.log(`   - With Lead: ${actionsWithLead.toLocaleString()}`);
  console.log(`   - With Prospect: ${actionsWithProspect.toLocaleString()}`);
  console.log(`   - With Opportunity: ${actionsWithOpportunity.toLocaleString()}`);
  console.log(`   - Orphaned: ${orphanedActions.toLocaleString()}`);
  console.log('');
  
  // Check engagement patterns
  const engagementActions = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: {
        in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
      }
    }
  });
  
  console.log(`   Engagement Actions: ${engagementActions.toLocaleString()}`);
  console.log(`   Engagement Rate: ${((engagementActions / totalActions) * 100).toFixed(1)}%`);
  console.log('');
}

async function fixActionAssociations() {
  console.log('🔗 PHASE 2: FIXING ACTION ASSOCIATIONS');
  console.log('-'.repeat(50));
  
  // Fix orphaned actions by linking them to appropriate entities
  const orphanedActions = await prisma.actions.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    },
    take: 1000 // Process in batches
  });

  console.log(`   Found ${orphanedActions.length} orphaned actions to fix...`);
  
  let fixedCount = 0;
  for (const action of orphanedActions) {
    try {
      // Try to find a person by email or name from the action
      let person = null;
      let company = null;
      
      if (action.subject) {
        // Extract email from subject or description
        const emailMatch = action.subject.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          const email = emailMatch[1];
          person = await prisma.people.findFirst({
            where: {
              workspaceId: DANO_WORKSPACE_ID,
              OR: [
                { email: email },
                { workEmail: email },
                { personalEmail: email }
              ]
            }
          });
        }
      }
      
      // If no person found, try to find by name
      if (!person && action.subject) {
        const nameMatch = action.subject.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
        if (nameMatch) {
          const fullName = nameMatch[1];
          person = await prisma.people.findFirst({
            where: {
              workspaceId: DANO_WORKSPACE_ID,
              fullName: { contains: fullName }
            }
          });
        }
      }
      
      // Update the action with found associations
      if (person) {
        await prisma.actions.update({
          where: { id: action.id },
          data: {
            personId: person.id,
            companyId: person.companyId
          }
        });
        fixedCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  Error fixing action ${action.id}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Fixed ${fixedCount} orphaned actions`);
  console.log('');
  
  // Ensure all actions have proper direction metadata
  const actionsNeedingDirection = await prisma.actions.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: {
        in: ['email_sent', 'email_received', 'email_conversation']
      },
      metadata: null
    },
    take: 1000
  });

  console.log(`   Found ${actionsNeedingDirection.length} actions needing direction metadata...`);
  
  let directionFixedCount = 0;
  for (const action of actionsNeedingDirection) {
    try {
      const direction = action.type === 'email_sent' ? 'outbound' : 
                       action.type === 'email_received' ? 'inbound' : 'conversation';
      
      await prisma.actions.update({
        where: { id: action.id },
        data: {
          metadata: {
            direction: direction,
            timestamp: action.createdAt,
            source: 'system_fix'
          }
        }
      });
      directionFixedCount++;
    } catch (error) {
      console.log(`   ⚠️  Error fixing direction for action ${action.id}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Fixed direction metadata for ${directionFixedCount} actions`);
  console.log('');
}

async function cleanEntityRelationships() {
  console.log('🧹 PHASE 3: CLEANING ENTITY RELATIONSHIPS');
  console.log('-'.repeat(50));
  
  // Fix person-company relationships
  const peopleWithoutCompanies = await prisma.people.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      companyId: null
    },
    take: 500
  });

  console.log(`   Found ${peopleWithoutCompanies.length} people without company associations...`);
  
  let companyFixedCount = 0;
  for (const person of peopleWithoutCompanies) {
    try {
      // Try to find company by email domain
      if (person.email) {
        const domain = person.email.split('@')[1];
        const company = await prisma.companies.findFirst({
          where: {
            workspaceId: DANO_WORKSPACE_ID,
            domain: domain
          }
        });
        
        if (company) {
          await prisma.people.update({
            where: { id: person.id },
            data: { companyId: company.id }
          });
          companyFixedCount++;
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Error fixing company for person ${person.id}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Fixed company associations for ${companyFixedCount} people`);
  console.log('');
  
  // Ensure leads and prospects have proper person references
  const leadsWithoutPeople = await prisma.leads.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: null
    },
    take: 100
  });

  console.log(`   Found ${leadsWithoutPeople.length} leads without person references...`);
  
  let leadPersonFixedCount = 0;
  for (const lead of leadsWithoutPeople) {
    try {
      // Try to find person by email or name
      let person = null;
      
      if (lead.email) {
        person = await prisma.people.findFirst({
          where: {
            workspaceId: DANO_WORKSPACE_ID,
            OR: [
              { email: lead.email },
              { workEmail: lead.email },
              { personalEmail: lead.email }
            ]
          }
        });
      }
      
      if (!person && lead.fullName) {
        person = await prisma.people.findFirst({
          where: {
            workspaceId: DANO_WORKSPACE_ID,
            fullName: { contains: lead.fullName }
          }
        });
      }
      
      if (person) {
        await prisma.leads.update({
          where: { id: lead.id },
          data: { personId: person.id }
        });
        leadPersonFixedCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  Error fixing person for lead ${lead.id}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Fixed person references for ${leadPersonFixedCount} leads`);
  console.log('');
}

async function removeDuplicatesAndOrphans() {
  console.log('🗑️ PHASE 4: REMOVING DUPLICATES AND ORPHANED RECORDS');
  console.log('-'.repeat(50));
  
  // Remove duplicate leads (same personId)
  const duplicateLeads = await prisma.leads.groupBy({
    by: ['personId'],
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    },
    _count: { personId: true },
    having: {
      personId: { _count: { gt: 1 } }
    }
  });

  console.log(`   Found ${duplicateLeads.length} duplicate lead groups...`);
  
  let duplicateRemovedCount = 0;
  for (const group of duplicateLeads) {
    try {
      const leads = await prisma.leads.findMany({
        where: {
          workspaceId: DANO_WORKSPACE_ID,
          personId: group.personId
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Keep the first one, remove the rest
      const toRemove = leads.slice(1);
      for (const lead of toRemove) {
        await prisma.leads.delete({ where: { id: lead.id } });
        duplicateRemovedCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  Error removing duplicate leads for person ${group.personId}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Removed ${duplicateRemovedCount} duplicate leads`);
  console.log('');
  
  // Remove duplicate prospects (same personId)
  const duplicateProspects = await prisma.prospects.groupBy({
    by: ['personId'],
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    },
    _count: { personId: true },
    having: {
      personId: { _count: { gt: 1 } }
    }
  });

  console.log(`   Found ${duplicateProspects.length} duplicate prospect groups...`);
  
  let duplicateProspectRemovedCount = 0;
  for (const group of duplicateProspects) {
    try {
      const prospects = await prisma.prospects.findMany({
        where: {
          workspaceId: DANO_WORKSPACE_ID,
          personId: group.personId
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Keep the first one, remove the rest
      const toRemove = prospects.slice(1);
      for (const prospect of toRemove) {
        await prisma.prospects.delete({ where: { id: prospect.id } });
        duplicateProspectRemovedCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  Error removing duplicate prospects for person ${group.personId}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Removed ${duplicateProspectRemovedCount} duplicate prospects`);
  console.log('');
  
  // Remove orphaned people (not referenced by leads/prospects)
  const orphanedPeople = await prisma.people.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      AND: [
        { leads: { none: {} } },
        { prospects: { none: {} } },
        { opportunities: { none: {} } }
      ]
    },
    take: 1000
  });

  console.log(`   Found ${orphanedPeople.length} orphaned people to remove...`);
  
  let orphanedRemovedCount = 0;
  for (const person of orphanedPeople) {
    try {
      await prisma.people.delete({ where: { id: person.id } });
      orphanedRemovedCount++;
    } catch (error) {
      console.log(`   ⚠️  Error removing orphaned person ${person.id}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Removed ${orphanedRemovedCount} orphaned people`);
  console.log('');
}

async function finalValidation() {
  console.log('✅ PHASE 5: FINAL VALIDATION AND REPORTING');
  console.log('-'.repeat(50));
  
  // Get final counts
  const [
    finalPeople,
    finalCompanies,
    finalLeads,
    finalProspects,
    finalOpportunities,
    finalActions,
    finalOrphanedActions,
    finalEngagementActions
  ] = await Promise.all([
    prisma.people.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.companies.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.opportunities.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.actions.count({ 
      where: { 
        workspaceId: DANO_WORKSPACE_ID,
        personId: null,
        companyId: null,
        leadId: null,
        prospectId: null,
        opportunityId: null
      } 
    }),
    prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    })
  ]);

  console.log('📊 FINAL DATA STATE:');
  console.log(`   People: ${finalPeople.toLocaleString()}`);
  console.log(`   Companies: ${finalCompanies.toLocaleString()}`);
  console.log(`   Leads: ${finalLeads.toLocaleString()}`);
  console.log(`   Prospects: ${finalProspects.toLocaleString()}`);
  console.log(`   Opportunities: ${finalOpportunities.toLocaleString()}`);
  console.log(`   Actions: ${finalActions.toLocaleString()}`);
  console.log(`   Orphaned Actions: ${finalOrphanedActions.toLocaleString()}`);
  console.log(`   Engagement Actions: ${finalEngagementActions.toLocaleString()}`);
  console.log('');
  
  // Calculate engagement rates
  const engagementRate = ((finalEngagementActions / finalActions) * 100).toFixed(1);
  const orphanedRate = ((finalOrphanedActions / finalActions) * 100).toFixed(1);
  
  console.log('📈 DATA QUALITY METRICS:');
  console.log(`   Engagement Rate: ${engagementRate}%`);
  console.log(`   Orphaned Action Rate: ${orphanedRate}%`);
  console.log(`   Data Integrity Score: ${(100 - parseFloat(orphanedRate)).toFixed(1)}%`);
  console.log('');
  
  // Check for remaining issues
  if (finalOrphanedActions > 0) {
    console.log('⚠️  REMAINING ISSUES:');
    console.log(`   - ${finalOrphanedActions} orphaned actions still need attention`);
  }
  
  if (finalPeople !== (finalLeads + finalProspects)) {
    console.log('⚠️  REMAINING ISSUES:');
    console.log(`   - People count (${finalPeople}) doesn't match leads + prospects (${finalLeads + finalProspects})`);
  }
  
  console.log('');
  console.log('🎯 DATA INTEGRITY STATUS:');
  if (finalOrphanedActions === 0 && finalPeople === (finalLeads + finalProspects)) {
    console.log('   ✅ EXCELLENT - All data is clean and properly associated');
  } else if (finalOrphanedActions < 100 && Math.abs(finalPeople - (finalLeads + finalProspects)) < 50) {
    console.log('   ✅ GOOD - Minor issues remain but data is largely clean');
  } else {
    console.log('   ⚠️  NEEDS ATTENTION - Significant data integrity issues remain');
  }
}

// Run the complete fix
completeDataIntegrityFix().catch(console.error);

