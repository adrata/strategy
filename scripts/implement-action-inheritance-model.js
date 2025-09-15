const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function implementActionInheritanceModel() {
  console.log('🎯 IMPLEMENTING ACTION INHERITANCE MODEL');
  console.log('========================================');
  
  const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
  
  try {
    // STEP 1: Fix orphaned actions by linking them to core records
    console.log('\n🔗 STEP 1: Fixing orphaned actions...');
    await fixOrphanedActions(workspaceId);
    
    // STEP 2: Link emails to actions via externalId
    console.log('\n📧 STEP 2: Linking emails to actions...');
    await linkEmailsToActions(workspaceId);
    
    // STEP 3: Link notes to actions via externalId
    console.log('\n📝 STEP 3: Linking notes to actions...');
    await linkNotesToActions(workspaceId);
    
    // STEP 4: Update lastAction/nextAction on core records only
    console.log('\n🔄 STEP 4: Updating lastAction/nextAction on core records...');
    await updateCoreRecordActions(workspaceId);
    
    // STEP 5: Standardize action types
    console.log('\n🏷️ STEP 5: Standardizing action types...');
    await standardizeActionTypes(workspaceId);
    
    console.log('\n🎉 ACTION INHERITANCE MODEL IMPLEMENTATION COMPLETE!');
    
  } catch (error) {
    console.error('❌ Implementation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixOrphanedActions(workspaceId) {
  console.log('  Fixing orphaned actions by linking to core records...');
  
  const orphanedActions = await prisma.actions.findMany({
    where: {
      workspaceId,
      personId: null,
      companyId: null,
      leadId: null,
      opportunityId: null,
      prospectId: null
    },
    take: 100 // Process in batches
  });
  
  console.log(`  Found ${orphanedActions.length} orphaned actions to fix`);
  
  let fixedCount = 0;
  for (const action of orphanedActions) {
    try {
      // Try to find relationships based on action content
      const relationships = await findActionRelationships(action);
      
      if (relationships.personId || relationships.companyId) {
        await prisma.actions.update({
          where: { id: action.id },
          data: {
            personId: relationships.personId,
            companyId: relationships.companyId,
            leadId: relationships.leadId,
            opportunityId: relationships.opportunityId,
            prospectId: relationships.prospectId
          }
        });
        fixedCount++;
      }
    } catch (error) {
      console.error(`    ❌ Failed to fix action ${action.id}:`, error.message);
    }
  }
  
  console.log(`  ✅ Fixed ${fixedCount} orphaned actions`);
}

async function findActionRelationships(action) {
  const relationships = {};
  
  // Try to extract names/emails from action subject/description
  const text = `${action.subject} ${action.description || ''}`.toLowerCase();
  
  // Look for email addresses
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emails = text.match(emailRegex) || [];
  
  for (const email of emails) {
    const person = await prisma.people.findFirst({
      where: {
        OR: [
          { email: email },
          { workEmail: email },
          { personalEmail: email }
        ]
      }
    });
    
    if (person) {
      relationships.personId = person.id;
      relationships.companyId = person.companyId;
      break;
    }
  }
  
  // Look for company names in action text
  if (!relationships.companyId) {
    const companies = await prisma.companies.findMany({
      where: { workspaceId: action.workspaceId },
      select: { id: true, name: true }
    });
    
    for (const company of companies) {
      if (text.includes(company.name.toLowerCase())) {
        relationships.companyId = company.id;
        break;
      }
    }
  }
  
  return relationships;
}

async function linkEmailsToActions(workspaceId) {
  console.log('  Linking email messages to actions...');
  
  // Get email accounts for workspace
  const emailAccounts = await prisma.email_accounts.findMany({
    where: { workspaceId },
    select: { id: true }
  });
  
  const accountIds = emailAccounts.map(account => account.id);
  
  if (accountIds.length === 0) {
    console.log('  No email accounts found');
    return;
  }
  
  const emails = await prisma.email_messages.findMany({
    where: { accountId: { in: accountIds } },
    take: 1000 // Process in batches
  });
  
  console.log(`  Found ${emails.length} emails to link`);
  
  let linkedCount = 0;
  for (const email of emails) {
    try {
      // Check if action already exists
      const existingAction = await prisma.actions.findFirst({
        where: { externalId: `email_${email.id}` }
      });
      
      if (!existingAction) {
        // Find relationships
        const relationships = await findEmailRelationships(email);
        
        if (relationships.personId || relationships.companyId) {
          await prisma.actions.create({
            data: {
              workspaceId,
              userId: 'system', // Will be updated from email account
              type: 'email_conversation',
              subject: email.subject || 'Email Communication',
              description: email.body?.substring(0, 500) || '',
              status: 'completed',
              priority: 'medium',
              completedAt: email.sentAt || email.receivedAt || email.createdAt,
              personId: relationships.personId,
              companyId: relationships.companyId,
              externalId: `email_${email.id}`,
              metadata: {
                originalEmailId: email.id,
                messageId: email.messageId,
                threadId: email.threadId,
                from: email.from,
                to: email.to
              },
              createdAt: email.createdAt,
              updatedAt: new Date()
            }
          });
          linkedCount++;
        }
      }
    } catch (error) {
      console.error(`    ❌ Failed to link email ${email.id}:`, error.message);
    }
  }
  
  console.log(`  ✅ Linked ${linkedCount} emails to actions`);
}

async function findEmailRelationships(email) {
  const relationships = {};
  
  // Get workspaceId from email account
  const emailAccount = await prisma.email_accounts.findFirst({
    where: { id: email.accountId },
    select: { workspaceId: true }
  });
  
  if (!emailAccount) return relationships;
  
  // Try to find person by email addresses
  const emailAddresses = [
    ...(email.to || []),
    ...(email.cc || []),
    email.from
  ].filter(Boolean);
  
  for (const emailAddr of emailAddresses) {
    const person = await prisma.people.findFirst({
      where: {
        OR: [
          { email: emailAddr },
          { workEmail: emailAddr },
          { personalEmail: emailAddr }
        ],
        workspaceId: emailAccount.workspaceId
      }
    });
    
    if (person) {
      relationships.personId = person.id;
      relationships.companyId = person.companyId;
      break;
    }
  }
  
  return relationships;
}

async function linkNotesToActions(workspaceId) {
  console.log('  Linking notes to actions...');
  
  const notes = await prisma.notes.findMany({
    where: { workspaceId },
    take: 200
  });
  
  console.log(`  Found ${notes.length} notes to link`);
  
  let linkedCount = 0;
  for (const note of notes) {
    try {
      // Check if action already exists
      const existingAction = await prisma.actions.findFirst({
        where: { externalId: `note_${note.id}` }
      });
      
      if (!existingAction) {
        const relationships = {
          personId: note.personId,
          companyId: note.companyId,
          leadId: note.leadId,
          opportunityId: note.opportunityId,
          prospectId: note.prospectId
        };
        
        if (relationships.personId || relationships.companyId || 
            relationships.leadId || relationships.opportunityId || relationships.prospectId) {
          
          await prisma.actions.create({
            data: {
              workspaceId,
              userId: note.authorId || 'system',
              type: 'note_added',
              subject: note.title || 'Note Added',
              description: note.content?.substring(0, 500) || '',
              status: 'completed',
              priority: 'low',
              completedAt: note.createdAt,
              personId: relationships.personId,
              companyId: relationships.companyId,
              leadId: relationships.leadId,
              opportunityId: relationships.opportunityId,
              prospectId: relationships.prospectId,
              externalId: `note_${note.id}`,
              metadata: {
                originalNoteId: note.id,
                noteType: note.type
              },
              createdAt: note.createdAt,
              updatedAt: new Date()
            }
          });
          linkedCount++;
        }
      }
    } catch (error) {
      console.error(`    ❌ Failed to link note ${note.id}:`, error.message);
    }
  }
  
  console.log(`  ✅ Linked ${linkedCount} notes to actions`);
}

async function updateCoreRecordActions(workspaceId) {
  console.log('  Updating lastAction/nextAction on core records...');
  
  // Update people
  const people = await prisma.people.findMany({
    where: { workspaceId },
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
  
  console.log(`  ✅ Updated lastAction for ${peopleUpdated} people`);
  
  // Update companies
  const companies = await prisma.companies.findMany({
    where: { workspaceId },
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
  
  console.log(`  ✅ Updated lastAction for ${companiesUpdated} companies`);
}

async function standardizeActionTypes(workspaceId) {
  console.log('  Standardizing action types...');
  
  const typeMapping = {
    'email': 'email_conversation',
    'Email Sent': 'email_sent',
    'email_sent': 'email_sent',
    'email_conversation': 'email_conversation',
    'call': 'phone_call',
    'Phone Call': 'phone_call',
    'phone_call': 'phone_call',
    'Meeting': 'meeting_scheduled',
    'meeting': 'meeting_scheduled',
    'linkedin_inmail': 'linkedin_inmail',
    'linkedin_connection_request': 'linkedin_connection_request'
  };
  
  let standardizedCount = 0;
  for (const [oldType, newType] of Object.entries(typeMapping)) {
    const result = await prisma.actions.updateMany({
      where: {
        workspaceId,
        type: oldType
      },
      data: {
        type: newType
      }
    });
    
    if (result.count > 0) {
      console.log(`    ✅ Standardized ${result.count} actions: ${oldType} → ${newType}`);
      standardizedCount += result.count;
    }
  }
  
  console.log(`  ✅ Standardized ${standardizedCount} action types total`);
}

// Run the implementation
implementActionInheritanceModel();
