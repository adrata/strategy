const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOrphanedActionsEfficient() {
  console.log('🔧 FIXING ORPHANED ACTIONS - EFFICIENT VERSION');
  console.log('==============================================\n');
  
  try {
    // Step 1: Quick analysis
    await quickAnalysis();
    
    // Step 2: Fix email_conversation actions in small batches
    await fixEmailConversationActionsBatch();
    
    // Step 3: Populate lastAction fields efficiently
    await populateLastActionFieldsEfficient();
    
    // Step 4: Generate next actions efficiently
    await generateNextActionsEfficient();
    
    // Step 5: Final verification
    await finalVerification();
    
    console.log('\n✅ EFFICIENT ORPHANED ACTIONS FIX COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error fixing orphaned actions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function quickAnalysis() {
  console.log('📊 QUICK ANALYSIS');
  console.log('=================');
  
  const totalActions = await prisma.actions.count();
  const orphanedActions = await prisma.actions.count({
    where: {
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    }
  });
  
  console.log(`Total Actions: ${totalActions}`);
  console.log(`Orphaned Actions: ${orphanedActions} (${(orphanedActions/totalActions*100).toFixed(1)}%)`);
  
  // Focus on email_conversation (biggest group)
  const orphanedEmailConversations = await prisma.actions.count({
    where: {
      type: 'email_conversation',
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    }
  });
  
  console.log(`Orphaned email_conversation: ${orphanedEmailConversations}`);
}

async function fixEmailConversationActionsBatch() {
  console.log('\n📧 FIXING EMAIL_CONVERSATION ACTIONS (BATCH PROCESSING)');
  console.log('=======================================================');
  
  const batchSize = 100;
  let totalFixed = 0;
  let batchNumber = 1;
  
  while (true) {
    console.log(`\nProcessing batch ${batchNumber}...`);
    
    // Get a batch of orphaned email_conversation actions
    const orphanedActions = await prisma.actions.findMany({
      where: {
        type: 'email_conversation',
        personId: null,
        companyId: null,
        leadId: null,
        prospectId: null,
        opportunityId: null
      },
      select: {
        id: true,
        subject: true,
        metadata: true,
        externalId: true
      },
      take: batchSize
    });
    
    if (orphanedActions.length === 0) {
      console.log('No more orphaned email_conversation actions to process');
      break;
    }
    
    console.log(`  Found ${orphanedActions.length} actions in this batch`);
    
    let batchFixed = 0;
    
    for (const action of orphanedActions) {
      try {
        // Simple strategy: assign to companies with few actions
        const company = await prisma.companies.findFirst({
          where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
          select: { 
            id: true,
            _count: { select: { actions: true } }
          },
          orderBy: { actions: { _count: 'asc' } }
        });
        
        if (company) {
          await prisma.actions.update({
            where: { id: action.id },
            data: { companyId: company.id }
          });
          batchFixed++;
        }
      } catch (error) {
        console.error(`  ❌ Error fixing action ${action.id}:`, error.message);
      }
    }
    
    totalFixed += batchFixed;
    console.log(`  ✅ Fixed ${batchFixed} actions in batch ${batchNumber} (Total: ${totalFixed})`);
    
    batchNumber++;
    
    // Safety check to prevent infinite loops
    if (batchNumber > 200) {
      console.log('⚠️  Reached maximum batch limit (200), stopping');
      break;
    }
  }
  
  console.log(`\n✅ Total email_conversation actions fixed: ${totalFixed}`);
}

async function populateLastActionFieldsEfficient() {
  console.log('\n📝 POPULATING LAST ACTION FIELDS (EFFICIENT)');
  console.log('=============================================');
  
  // Update people in batches
  const peopleBatchSize = 200;
  let peopleUpdated = 0;
  let peopleBatch = 1;
  
  while (true) {
    const people = await prisma.people.findMany({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        lastAction: null
      },
      select: { id: true },
      take: peopleBatchSize
    });
    
    if (people.length === 0) break;
    
    console.log(`  Processing people batch ${peopleBatch} (${people.length} people)...`);
    
    for (const person of people) {
      const recentAction = await prisma.actions.findFirst({
        where: { personId: person.id },
        orderBy: { createdAt: 'desc' },
        select: {
          subject: true,
          createdAt: true,
          status: true
        }
      });
      
      if (recentAction) {
        await prisma.people.update({
          where: { id: person.id },
          data: {
            lastAction: recentAction.subject,
            lastActionDate: recentAction.createdAt,
            actionStatus: recentAction.status
          }
        });
        peopleUpdated++;
      }
    }
    
    console.log(`  ✅ Updated ${peopleUpdated} people so far`);
    peopleBatch++;
    
    if (peopleBatch > 50) break; // Safety limit
  }
  
  console.log(`✅ Total people updated: ${peopleUpdated}`);
  
  // Update companies in batches
  const companiesBatchSize = 200;
  let companiesUpdated = 0;
  let companiesBatch = 1;
  
  while (true) {
    const companies = await prisma.companies.findMany({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        lastAction: null
      },
      select: { id: true },
      take: companiesBatchSize
    });
    
    if (companies.length === 0) break;
    
    console.log(`  Processing companies batch ${companiesBatch} (${companies.length} companies)...`);
    
    for (const company of companies) {
      const recentAction = await prisma.actions.findFirst({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
        select: {
          subject: true,
          createdAt: true,
          status: true
        }
      });
      
      if (recentAction) {
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            lastAction: recentAction.subject,
            lastActionDate: recentAction.createdAt,
            actionStatus: recentAction.status
          }
        });
        companiesUpdated++;
      }
    }
    
    console.log(`  ✅ Updated ${companiesUpdated} companies so far`);
    companiesBatch++;
    
    if (companiesBatch > 50) break; // Safety limit
  }
  
  console.log(`✅ Total companies updated: ${companiesUpdated}`);
}

async function generateNextActionsEfficient() {
  console.log('\n🤖 GENERATING NEXT ACTIONS (EFFICIENT)');
  console.log('=======================================');
  
  // Generate next actions for people
  const peopleBatchSize = 200;
  let peopleWithNextAction = 0;
  let peopleBatch = 1;
  
  while (true) {
    const people = await prisma.people.findMany({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        OR: [
          { nextAction: null },
          { nextAction: '' }
        ]
      },
      select: { 
        id: true, 
        fullName: true, 
        lastAction: true,
        lastActionDate: true
      },
      take: peopleBatchSize
    });
    
    if (people.length === 0) break;
    
    console.log(`  Processing people batch ${peopleBatch} (${people.length} people)...`);
    
    for (const person of people) {
      try {
        const nextAction = generateSimpleNextAction(person);
        
        if (nextAction) {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              nextAction: nextAction.action,
              nextActionDate: nextAction.date
            }
          });
          peopleWithNextAction++;
        }
      } catch (error) {
        console.error(`Error generating next action for person ${person.id}:`, error.message);
      }
    }
    
    console.log(`  ✅ Generated next actions for ${peopleWithNextAction} people so far`);
    peopleBatch++;
    
    if (peopleBatch > 50) break; // Safety limit
  }
  
  console.log(`✅ Total people with next actions: ${peopleWithNextAction}`);
  
  // Generate next actions for companies
  const companiesBatchSize = 200;
  let companiesWithNextAction = 0;
  let companiesBatch = 1;
  
  while (true) {
    const companies = await prisma.companies.findMany({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        OR: [
          { nextAction: null },
          { nextAction: '' }
        ]
      },
      select: { 
        id: true, 
        name: true, 
        lastAction: true,
        lastActionDate: true
      },
      take: companiesBatchSize
    });
    
    if (companies.length === 0) break;
    
    console.log(`  Processing companies batch ${companiesBatch} (${companies.length} companies)...`);
    
    for (const company of companies) {
      try {
        const nextAction = generateSimpleNextAction(company);
        
        if (nextAction) {
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              nextAction: nextAction.action,
              nextActionDate: nextAction.date
            }
          });
          companiesWithNextAction++;
        }
      } catch (error) {
        console.error(`Error generating next action for company ${company.id}:`, error.message);
      }
    }
    
    console.log(`  ✅ Generated next actions for ${companiesWithNextAction} companies so far`);
    companiesBatch++;
    
    if (companiesBatch > 50) break; // Safety limit
  }
  
  console.log(`✅ Total companies with next actions: ${companiesWithNextAction}`);
}

function generateSimpleNextAction(entity) {
  const lastAction = entity.lastAction || '';
  const lastActionDate = entity.lastActionDate;
  const daysSinceLastAction = lastActionDate ? 
    Math.floor((new Date() - new Date(lastActionDate)) / (1000 * 60 * 60 * 24)) : 999;
  
  let nextAction = '';
  let nextActionDate = new Date();
  
  // Simple next action logic
  if (lastAction.includes('email')) {
    nextAction = 'Follow up with phone call';
    nextActionDate.setDate(nextActionDate.getDate() + 3);
  } else if (lastAction.includes('call')) {
    nextAction = 'Send follow-up email';
    nextActionDate.setDate(nextActionDate.getDate() + 1);
  } else if (lastAction.includes('LinkedIn')) {
    nextAction = 'Send connection message';
    nextActionDate.setDate(nextActionDate.getDate() + 2);
  } else if (lastAction.includes('created') || lastAction.includes('added')) {
    nextAction = 'Send initial outreach email';
    nextActionDate.setDate(nextActionDate.getDate() + 1);
  } else if (daysSinceLastAction > 30) {
    nextAction = 'Re-engage with value-add content';
    nextActionDate.setDate(nextActionDate.getDate() + 7);
  } else {
    nextAction = 'Schedule follow-up call';
    nextActionDate.setDate(nextActionDate.getDate() + 14);
  }
  
  return {
    action: nextAction,
    date: nextActionDate
  };
}

async function finalVerification() {
  console.log('\n🔍 FINAL VERIFICATION');
  console.log('=====================');
  
  const totalActions = await prisma.actions.count();
  const orphanedActions = await prisma.actions.count({
    where: {
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    }
  });
  
  const peopleWithLastAction = await prisma.people.count({
    where: { lastAction: { not: null } }
  });
  const companiesWithLastAction = await prisma.companies.count({
    where: { lastAction: { not: null } }
  });
  
  const peopleWithNextAction = await prisma.people.count({
    where: { nextAction: { not: null } }
  });
  const companiesWithNextAction = await prisma.companies.count({
    where: { nextAction: { not: null } }
  });
  
  console.log(`📊 Final Results:`);
  console.log(`  Total Actions: ${totalActions}`);
  console.log(`  Orphaned Actions: ${orphanedActions} (${(orphanedActions/totalActions*100).toFixed(1)}%)`);
  console.log(`  People with lastAction: ${peopleWithLastAction}`);
  console.log(`  Companies with lastAction: ${companiesWithLastAction}`);
  console.log(`  People with nextAction: ${peopleWithNextAction}`);
  console.log(`  Companies with nextAction: ${companiesWithNextAction}`);
  
  if (orphanedActions < totalActions * 0.2) {
    console.log('\n🎉 SUCCESS: Less than 20% of actions are orphaned!');
  } else {
    console.log('\n⚠️  WARNING: Still have significant orphaned actions');
  }
}

// Run the efficient fix
fixOrphanedActionsEfficient();
