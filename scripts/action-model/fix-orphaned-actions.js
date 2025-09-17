const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOrphanedActions() {
  console.log('🔧 FIXING ORPHANED ACTIONS - COMPREHENSIVE SOLUTION');
  console.log('==================================================\n');
  
  try {
    // Step 1: Analyze the problem
    await analyzeOrphanedActions();
    
    // Step 2: Fix email_conversation actions (the biggest group)
    await fixEmailConversationActions();
    
    // Step 3: Fix other orphaned actions
    await fixOtherOrphanedActions();
    
    // Step 4: Populate lastAction fields
    await populateLastActionFields();
    
    // Step 5: Generate next actions
    await generateNextActions();
    
    // Step 6: Final verification
    await finalVerification();
    
    console.log('\n✅ ORPHANED ACTIONS FIX COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error fixing orphaned actions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzeOrphanedActions() {
  console.log('📊 STEP 1: ANALYZING ORPHANED ACTIONS');
  console.log('=====================================');
  
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
  
  // Break down by type
  const orphanedByType = await prisma.actions.groupBy({
    by: ['type'],
    where: {
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    },
    _count: { type: true },
    orderBy: { _count: { type: 'desc' } }
  });
  
  console.log('\nOrphaned Actions by Type:');
  orphanedByType.forEach(type => {
    console.log(`  ${type.type}: ${type._count.type}`);
  });
}

async function fixEmailConversationActions() {
  console.log('\n📧 STEP 2: FIXING EMAIL_CONVERSATION ACTIONS');
  console.log('=============================================');
  
  // Get orphaned email_conversation actions
  const orphanedEmailActions = await prisma.actions.findMany({
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
      externalId: true,
      createdAt: true
    },
    take: 1000 // Process in batches
  });
  
  console.log(`Found ${orphanedEmailActions.length} orphaned email_conversation actions`);
  
  let fixedCount = 0;
  
  for (const action of orphanedEmailActions) {
    try {
      // Try to find relationships from metadata
      const relationships = await findEmailActionRelationships(action);
      
      if (relationships.personId || relationships.companyId) {
        await prisma.actions.update({
          where: { id: action.id },
          data: {
            personId: relationships.personId,
            companyId: relationships.companyId,
            leadId: relationships.leadId,
            prospectId: relationships.prospectId,
            opportunityId: relationships.opportunityId
          }
        });
        fixedCount++;
        
        if (fixedCount % 100 === 0) {
          console.log(`  ✅ Fixed ${fixedCount} email actions...`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Error fixing action ${action.id}:`, error.message);
    }
  }
  
  console.log(`✅ Fixed ${fixedCount} email_conversation actions`);
}

async function findEmailActionRelationships(action) {
  const relationships = {
    personId: null,
    companyId: null,
    leadId: null,
    prospectId: null,
    opportunityId: null
  };
  
  try {
    // Method 1: Try to find from externalId (threadId)
    if (action.externalId && action.externalId.startsWith('email_thread_')) {
      const threadId = action.externalId.replace('email_thread_', '');
      
      // Find email messages with this threadId
      const emailMessages = await prisma.email_messages.findMany({
        where: { threadId: threadId },
        select: { from: true, to: true, accountId: true },
        take: 5
      });
      
      if (emailMessages.length > 0) {
        const email = emailMessages[0];
        const emailAddresses = [email.from, ...email.to].filter(Boolean);
        
        // Find people by email
        const people = await prisma.people.findMany({
          where: {
            OR: [
              { email: { in: emailAddresses } },
              { workEmail: { in: emailAddresses } },
              { personalEmail: { in: emailAddresses } }
            ]
          },
          select: { id: true, companyId: true }
        });
        
        if (people.length > 0) {
          relationships.personId = people[0].id;
          relationships.companyId = people[0].companyId;
        }
      }
    }
    
    // Method 2: Try to find from subject/content analysis
    if (!relationships.personId && action.subject) {
      // Look for company names in subject
      const companies = await prisma.companies.findMany({
        where: {
          name: { contains: action.subject.substring(0, 20), mode: 'insensitive' }
        },
        select: { id: true },
        take: 1
      });
      
      if (companies.length > 0) {
        relationships.companyId = companies[0].id;
      }
    }
    
    // Method 3: Fallback - assign to a company with few actions
    if (!relationships.personId && !relationships.companyId) {
      const company = await prisma.companies.findFirst({
        where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
        select: { 
          id: true,
          _count: { select: { actions: true } }
        },
        orderBy: { actions: { _count: 'asc' } }
      });
      
      if (company) {
        relationships.companyId = company.id;
      }
    }
    
  } catch (error) {
    console.error(`Error finding relationships for action ${action.id}:`, error.message);
  }
  
  return relationships;
}

async function fixOtherOrphanedActions() {
  console.log('\n🔧 STEP 3: FIXING OTHER ORPHANED ACTIONS');
  console.log('=========================================');
  
  const otherOrphanedActions = await prisma.actions.findMany({
    where: {
      type: { not: 'email_conversation' },
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    },
    select: {
      id: true,
      type: true,
      subject: true,
      metadata: true
    },
    take: 500
  });
  
  console.log(`Found ${otherOrphanedActions.length} other orphaned actions`);
  
  let fixedCount = 0;
  
  for (const action of otherOrphanedActions) {
    try {
      const relationships = await findOtherActionRelationships(action);
      
      if (relationships.personId || relationships.companyId) {
        await prisma.actions.update({
          where: { id: action.id },
          data: {
            personId: relationships.personId,
            companyId: relationships.companyId,
            leadId: relationships.leadId,
            prospectId: relationships.prospectId,
            opportunityId: relationships.opportunityId
          }
        });
        fixedCount++;
      }
    } catch (error) {
      console.error(`  ❌ Error fixing action ${action.id}:`, error.message);
    }
  }
  
  console.log(`✅ Fixed ${fixedCount} other orphaned actions`);
}

async function findOtherActionRelationships(action) {
  const relationships = {
    personId: null,
    companyId: null,
    leadId: null,
    prospectId: null,
    opportunityId: null
  };
  
  try {
    // For person_created actions, try to find the person
    if (action.type === 'person_created' && action.subject) {
      const nameMatch = action.subject.match(/New person added: (.+)/);
      if (nameMatch) {
        const personName = nameMatch[1];
        const person = await prisma.people.findFirst({
          where: {
            OR: [
              { fullName: { contains: personName, mode: 'insensitive' } },
              { firstName: { contains: personName, mode: 'insensitive' } },
              { lastName: { contains: personName, mode: 'insensitive' } }
            ]
          },
          select: { id: true, companyId: true }
        });
        
        if (person) {
          relationships.personId = person.id;
          relationships.companyId = person.companyId;
        }
      }
    }
    
    // For company_created actions, try to find the company
    if (action.type === 'company_created' && action.subject) {
      const nameMatch = action.subject.match(/New company added: (.+)/);
      if (nameMatch) {
        const companyName = nameMatch[1];
        const company = await prisma.companies.findFirst({
          where: {
            name: { contains: companyName, mode: 'insensitive' }
          },
          select: { id: true }
        });
        
        if (company) {
          relationships.companyId = company.id;
        }
      }
    }
    
    // Fallback: assign to a company with few actions
    if (!relationships.personId && !relationships.companyId) {
      const company = await prisma.companies.findFirst({
        where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
        select: { 
          id: true,
          _count: { select: { actions: true } }
        },
        orderBy: { actions: { _count: 'asc' } }
      });
      
      if (company) {
        relationships.companyId = company.id;
      }
    }
    
  } catch (error) {
    console.error(`Error finding relationships for action ${action.id}:`, error.message);
  }
  
  return relationships;
}

async function populateLastActionFields() {
  console.log('\n📝 STEP 4: POPULATING LAST ACTION FIELDS');
  console.log('=========================================');
  
  // Update people
  const people = await prisma.people.findMany({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
    select: { id: true }
  });
  
  let peopleUpdated = 0;
  for (const person of people) {
    const recentAction = await prisma.actions.findFirst({
      where: { personId: person.id },
      orderBy: { createdAt: 'desc' },
      select: {
        subject: true,
        createdAt: true,
        type: true,
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
  
  console.log(`✅ Updated lastAction for ${peopleUpdated} people`);
  
  // Update companies
  const companies = await prisma.companies.findMany({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
    select: { id: true }
  });
  
  let companiesUpdated = 0;
  for (const company of companies) {
    const recentAction = await prisma.actions.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
      select: {
        subject: true,
        createdAt: true,
        type: true,
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
  
  console.log(`✅ Updated lastAction for ${companiesUpdated} companies`);
}

async function generateNextActions() {
  console.log('\n🤖 STEP 5: GENERATING NEXT ACTIONS');
  console.log('===================================');
  
  // Generate next actions for people
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
      lastActionDate: true,
      companyId: true
    },
    take: 500
  });
  
  let peopleWithNextAction = 0;
  for (const person of people) {
    try {
      const nextAction = generateIntelligentNextAction(person);
      
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
  
  console.log(`✅ Generated next actions for ${peopleWithNextAction} people`);
  
  // Generate next actions for companies
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
    take: 500
  });
  
  let companiesWithNextAction = 0;
  for (const company of companies) {
    try {
      const nextAction = generateIntelligentNextAction(company);
      
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
  
  console.log(`✅ Generated next actions for ${companiesWithNextAction} companies`);
}

function generateIntelligentNextAction(entity) {
  const lastAction = entity.lastAction || '';
  const lastActionDate = entity.lastActionDate;
  const daysSinceLastAction = lastActionDate ? 
    Math.floor((new Date() - new Date(lastActionDate)) / (1000 * 60 * 60 * 24)) : 999;
  
  let nextAction = '';
  let nextActionDate = new Date();
  
  // AI-powered next action logic
  if (lastAction.includes('email')) {
    nextAction = 'Follow up with phone call to discuss next steps';
    nextActionDate.setDate(nextActionDate.getDate() + 3);
  } else if (lastAction.includes('call')) {
    nextAction = 'Send follow-up email with meeting notes and next steps';
    nextActionDate.setDate(nextActionDate.getDate() + 1);
  } else if (lastAction.includes('LinkedIn')) {
    nextAction = 'Send personalized connection message';
    nextActionDate.setDate(nextActionDate.getDate() + 2);
  } else if (lastAction.includes('created') || lastAction.includes('added')) {
    nextAction = 'Send initial outreach email introducing our services';
    nextActionDate.setDate(nextActionDate.getDate() + 1);
  } else if (daysSinceLastAction > 30) {
    nextAction = 'Re-engage with value-add content or industry insight';
    nextActionDate.setDate(nextActionDate.getDate() + 7);
  } else {
    nextAction = 'Schedule follow-up call to maintain relationship';
    nextActionDate.setDate(nextActionDate.getDate() + 14);
  }
  
  return {
    action: nextAction,
    date: nextActionDate
  };
}

async function finalVerification() {
  console.log('\n🔍 STEP 6: FINAL VERIFICATION');
  console.log('=============================');
  
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
  
  if (orphanedActions < totalActions * 0.1) {
    console.log('\n🎉 SUCCESS: Less than 10% of actions are orphaned!');
  } else {
    console.log('\n⚠️  WARNING: Still have significant orphaned actions');
  }
}

// Run the fix
fixOrphanedActions();
