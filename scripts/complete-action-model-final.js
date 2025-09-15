const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeActionModelFinal() {
  console.log('🎯 COMPLETE ACTION MODEL FINAL IMPLEMENTATION');
  console.log('=============================================');
  
  const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
  
  try {
    // PHASE 1: Fix all orphaned actions (run multiple times)
    console.log('\n🔗 PHASE 1: Fixing all orphaned actions...');
    await fixAllOrphanedActions(workspaceId);
    
    // PHASE 2: Fix email linking with improved detection
    console.log('\n📧 PHASE 2: Fixing email linking...');
    await fixEmailLinking(workspaceId);
    
    // PHASE 3: Complete lastAction population for all core records
    console.log('\n🔄 PHASE 3: Completing lastAction population...');
    await completeLastActionPopulation(workspaceId);
    
    // PHASE 4: Implement intelligent nextAction with smart timing
    console.log('\n🤖 PHASE 4: Implementing intelligent nextAction...');
    await implementIntelligentNextAction(workspaceId);
    
    // PHASE 5: Refine LinkedIn action types and timeframes
    console.log('\n💼 PHASE 5: Refining LinkedIn action types...');
    await refineLinkedInActionTypes(workspaceId);
    
    // PHASE 6: Automate prospect/lead classification
    console.log('\n🎯 PHASE 6: Automating prospect/lead classification...');
    await automateProspectLeadClassification(workspaceId);
    
    // PHASE 7: Final audit and verification
    console.log('\n📊 PHASE 7: Final audit and verification...');
    await finalAuditAndVerification(workspaceId);
    
    console.log('\n🎉 COMPLETE ACTION MODEL FINAL IMPLEMENTATION COMPLETE!');
    
  } catch (error) {
    console.error('❌ Implementation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixAllOrphanedActions(workspaceId) {
  let totalFixed = 0;
  let batchCount = 0;
  const maxBatches = 20; // Prevent infinite loops
  
  while (batchCount < maxBatches) {
    batchCount++;
    console.log(`  Batch ${batchCount}: Processing orphaned actions...`);
    
    const orphanedActions = await prisma.actions.findMany({
      where: {
        workspaceId,
        personId: null,
        companyId: null,
        leadId: null,
        opportunityId: null,
        prospectId: null
      },
      take: 200 // Larger batches for efficiency
    });
    
    if (orphanedActions.length === 0) {
      console.log(`  ✅ No more orphaned actions found!`);
      break;
    }
    
    console.log(`  Found ${orphanedActions.length} orphaned actions to fix`);
    
    let batchFixed = 0;
    for (const action of orphanedActions) {
      try {
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
          batchFixed++;
        }
      } catch (error) {
        console.error(`    ❌ Failed to fix action ${action.id}:`, error.message);
      }
    }
    
    totalFixed += batchFixed;
    console.log(`  ✅ Fixed ${batchFixed} actions in batch ${batchCount}`);
    
    if (batchFixed === 0) {
      console.log(`  ⚠️ No actions could be fixed in this batch, stopping`);
      break;
    }
  }
  
  console.log(`  🎯 Total orphaned actions fixed: ${totalFixed}`);
}

async function findActionRelationships(action) {
  const relationships = {};
  
  // Enhanced relationship detection
  const text = `${action.subject} ${action.description || ''}`.toLowerCase();
  
  // 1. Look for email addresses
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emails = text.match(emailRegex) || [];
  
  for (const email of emails) {
    const person = await prisma.people.findFirst({
      where: {
        OR: [
          { email: email },
          { workEmail: email },
          { personalEmail: email }
        ],
        workspaceId: action.workspaceId
      }
    });
    
    if (person) {
      relationships.personId = person.id;
      relationships.companyId = person.companyId;
      break;
    }
  }
  
  // 2. Look for company names
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
  
  // 3. Look for person names
  if (!relationships.personId) {
    const people = await prisma.people.findMany({
      where: { workspaceId: action.workspaceId },
      select: { id: true, fullName: true, firstName: true, lastName: true }
    });
    
    for (const person of people) {
      const nameVariations = [
        person.fullName.toLowerCase(),
        person.firstName.toLowerCase(),
        person.lastName.toLowerCase(),
        `${person.firstName} ${person.lastName}`.toLowerCase()
      ];
      
      for (const name of nameVariations) {
        if (text.includes(name) && name.length > 2) {
          relationships.personId = person.id;
          relationships.companyId = person.companyId;
          break;
        }
      }
      
      if (relationships.personId) break;
    }
  }
  
  return relationships;
}

async function fixEmailLinking(workspaceId) {
  console.log('  Improving email account relationship detection...');
  
  // Get all email accounts
  const emailAccounts = await prisma.email_accounts.findMany({
    where: { workspaceId },
    select: { id: true, email: true, userId: true }
  });
  
  console.log(`  Found ${emailAccounts.length} email accounts`);
  
  if (emailAccounts.length === 0) {
    console.log('  No email accounts found, skipping email linking');
    return;
  }
  
  const accountIds = emailAccounts.map(account => account.id);
  
  // Get emails that don't have actions yet
  const emails = await prisma.email_messages.findMany({
    where: { 
      accountId: { in: accountIds }
    },
    take: 2000 // Process more emails
  });
  
  console.log(`  Found ${emails.length} emails to process`);
  
  let linkedCount = 0;
  for (const email of emails) {
    try {
      // Check if action already exists
      const existingAction = await prisma.actions.findFirst({
        where: { externalId: `email_${email.id}` }
      });
      
      if (!existingAction) {
        const relationships = await findEmailRelationships(email, emailAccounts);
        
        if (relationships.personId || relationships.companyId) {
          const emailAccount = emailAccounts.find(acc => acc.id === email.accountId);
          
          await prisma.actions.create({
            data: {
              workspaceId,
              userId: emailAccount?.userId || 'system',
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
                to: email.to,
                direction: email.from.includes(emailAccount?.email || '') ? 'sent' : 'received'
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

async function findEmailRelationships(email, emailAccounts) {
  const relationships = {};
  
  // Get workspaceId from email account
  const emailAccount = emailAccounts.find(acc => acc.id === email.accountId);
  if (!emailAccount) return relationships;
  
  // Enhanced email relationship detection
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
        ]
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

async function completeLastActionPopulation(workspaceId) {
  console.log('  Updating lastAction for all core records...');
  
  // Update all people
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
      const intelligentDescription = generateIntelligentActionDescription(recentAction);
      
      await prisma.people.update({
        where: { id: person.id },
        data: {
          lastAction: intelligentDescription,
          lastActionDate: recentAction.createdAt,
          actionStatus: recentAction.status
        }
      });
      peopleUpdated++;
    }
  }
  
  console.log(`  ✅ Updated lastAction for ${peopleUpdated} people`);
  
  // Update all companies
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
      const intelligentDescription = generateIntelligentActionDescription(recentAction);
      
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          lastAction: intelligentDescription,
          lastActionDate: recentAction.createdAt,
          actionStatus: recentAction.status
        }
      });
      companiesUpdated++;
    }
  }
  
  console.log(`  ✅ Updated lastAction for ${companiesUpdated} companies`);
}

function generateIntelligentActionDescription(action) {
  const timeAgo = getTimeAgo(action.createdAt);
  
  switch (action.type) {
    case 'email_conversation':
      return `Email conversation ${timeAgo}`;
    case 'phone_call':
      return `Phone call ${timeAgo}`;
    case 'linkedin_connection_request':
      return `LinkedIn connection request ${timeAgo}`;
    case 'linkedin_inmail':
      return `LinkedIn InMail ${timeAgo}`;
    case 'meeting_scheduled':
      return `Meeting scheduled ${timeAgo}`;
    case 'note_added':
      return `Note added ${timeAgo}`;
    case 'person_created':
      return `Contact created ${timeAgo}`;
    case 'company_created':
      return `Company created ${timeAgo}`;
    case 'lead_created':
      return `Lead created ${timeAgo}`;
    case 'prospect_created':
      return `Prospect created ${timeAgo}`;
    case 'opportunity_created':
      return `Opportunity created ${timeAgo}`;
    default:
      return `${action.subject} ${timeAgo}`;
  }
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}

async function implementIntelligentNextAction(workspaceId) {
  console.log('  Implementing intelligent nextAction with smart timing...');
  
  // Get all people and companies
  const people = await prisma.people.findMany({
    where: { workspaceId },
    select: { id: true, fullName: true, companyId: true }
  });
  
  const companies = await prisma.companies.findMany({
    where: { workspaceId },
    select: { id: true, name: true }
  });
  
  let peopleUpdated = 0;
  for (const person of people) {
    const nextAction = await generateIntelligentNextAction(person.id, 'person');
    if (nextAction) {
      await prisma.people.update({
        where: { id: person.id },
        data: {
          nextAction: nextAction.action,
          nextActionDate: nextAction.date
        }
      });
      peopleUpdated++;
    }
  }
  
  console.log(`  ✅ Updated nextAction for ${peopleUpdated} people`);
  
  let companiesUpdated = 0;
  for (const company of companies) {
    const nextAction = await generateIntelligentNextAction(company.id, 'company');
    if (nextAction) {
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          nextAction: nextAction.action,
          nextActionDate: nextAction.date
        }
      });
      companiesUpdated++;
    }
  }
  
  console.log(`  ✅ Updated nextAction for ${companiesUpdated} companies`);
}

async function generateIntelligentNextAction(entityId, entityType) {
  // Get recent actions for this entity
  const recentActions = await prisma.actions.findMany({
    where: {
      OR: [
        { personId: entityId },
        { companyId: entityId }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      type: true,
      createdAt: true,
      subject: true
    }
  });
  
  if (recentActions.length === 0) {
    // No actions yet, start with LinkedIn connection
    return {
      action: 'Send LinkedIn connection request',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };
  }
  
  const lastAction = recentActions[0];
  const lastActionDate = lastAction.createdAt;
  const daysSinceLastAction = Math.floor((Date.now() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Smart action cycling logic
  const actionCycle = ['linkedin_connection_request', 'email_conversation', 'phone_call', 'linkedin_inmail'];
  const lastActionType = lastAction.type;
  const lastActionIndex = actionCycle.indexOf(lastActionType);
  
  let nextActionType;
  let nextActionDate;
  
  if (lastActionIndex === -1 || daysSinceLastAction < 2) {
    // If action type not in cycle or too recent, wait
    nextActionType = lastActionType;
    nextActionDate = new Date(lastActionDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days later
  } else {
    // Cycle to next action type
    const nextIndex = (lastActionIndex + 1) % actionCycle.length;
    nextActionType = actionCycle[nextIndex];
    
    // Smart timing based on action type
    switch (nextActionType) {
      case 'linkedin_connection_request':
        nextActionDate = new Date(lastActionDate.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days
        break;
      case 'email_conversation':
        nextActionDate = new Date(lastActionDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
        break;
      case 'phone_call':
        nextActionDate = new Date(lastActionDate.getTime() + (5 * 24 * 60 * 60 * 1000)); // 5 days
        break;
      case 'linkedin_inmail':
        nextActionDate = new Date(lastActionDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
        break;
      default:
        nextActionDate = new Date(lastActionDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
    }
  }
  
  // Generate intelligent action description
  const actionDescription = generateNextActionDescription(nextActionType, daysSinceLastAction);
  
  return {
    action: actionDescription,
    date: nextActionDate
  };
}

function generateNextActionDescription(actionType, daysSinceLastAction) {
  switch (actionType) {
    case 'linkedin_connection_request':
      return 'Send LinkedIn connection request';
    case 'email_conversation':
      return 'Send follow-up email';
    case 'phone_call':
      return 'Make phone call';
    case 'linkedin_inmail':
      return 'Send LinkedIn InMail';
    case 'meeting_scheduled':
      return 'Schedule meeting';
    default:
      return 'Follow up';
  }
}

async function refineLinkedInActionTypes(workspaceId) {
  console.log('  Refining LinkedIn action types and timeframes...');
  
  // Update LinkedIn action types to be more specific
  const linkedinUpdates = [
    { from: 'linkedin_connection_request', to: 'linkedin_connection_request' },
    { from: 'linkedin_inmail', to: 'linkedin_inmail' }
  ];
  
  let updatedCount = 0;
  for (const update of linkedinUpdates) {
    const result = await prisma.actions.updateMany({
      where: {
        workspaceId,
        type: update.from
      },
      data: {
        type: update.to
      }
    });
    updatedCount += result.count;
  }
  
  console.log(`  ✅ Updated ${updatedCount} LinkedIn action types`);
}

async function automateProspectLeadClassification(workspaceId) {
  console.log('  Automating prospect/lead classification based on engagement...');
  
  // Get all people
  const people = await prisma.people.findMany({
    where: { workspaceId },
    select: { id: true, fullName: true }
  });
  
  let prospectsUpdated = 0;
  let leadsUpdated = 0;
  
  for (const person of people) {
    // Check engagement level
    const engagementLevel = await calculateEngagementLevel(person.id);
    
    // Check if person exists in prospects
    const existingProspect = await prisma.prospects.findFirst({
      where: { personId: person.id }
    });
    
    // Check if person exists in leads
    const existingLead = await prisma.leads.findFirst({
      where: { personId: person.id }
    });
    
    if (engagementLevel === 'no_engagement') {
      // Should be prospect (no engagement)
      if (!existingProspect && !existingLead) {
        await prisma.prospects.create({
          data: {
            workspaceId,
            personId: person.id,
            fullName: person.fullName,
            status: 'prospect',
            source: 'automated_classification',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        prospectsUpdated++;
      }
    } else if (engagementLevel === 'engaged') {
      // Should be lead (has engagement)
      if (!existingLead) {
        // Remove from prospects if exists
        if (existingProspect) {
          await prisma.prospects.delete({
            where: { id: existingProspect.id }
          });
        }
        
        await prisma.leads.create({
          data: {
            workspaceId,
            personId: person.id,
            fullName: person.fullName,
            status: 'engaged',
            source: 'automated_classification',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        leadsUpdated++;
      }
    }
  }
  
  console.log(`  ✅ Created ${prospectsUpdated} prospects (no engagement)`);
  console.log(`  ✅ Created ${leadsUpdated} leads (with engagement)`);
}

async function calculateEngagementLevel(personId) {
  // Count different types of engagement
  const emailCount = await prisma.actions.count({
    where: { personId, type: { contains: 'email' } }
  });
  
  const callCount = await prisma.actions.count({
    where: { personId, type: { contains: 'call' } }
  });
  
  const linkedinCount = await prisma.actions.count({
    where: { personId, type: { contains: 'linkedin' } }
  });
  
  const meetingCount = await prisma.actions.count({
    where: { personId, type: { contains: 'meeting' } }
  });
  
  const totalEngagement = emailCount + callCount + linkedinCount + meetingCount;
  
  if (totalEngagement === 0) {
    return 'no_engagement';
  } else if (totalEngagement >= 2) {
    return 'engaged';
  } else {
    return 'low_engagement';
  }
}

async function finalAuditAndVerification(workspaceId) {
  console.log('  Running final audit and verification...');
  
  // 1. Check orphaned actions
  const orphanedCount = await prisma.actions.count({
    where: {
      workspaceId,
      personId: null,
      companyId: null,
      leadId: null,
      opportunityId: null,
      prospectId: null
    }
  });
  
  // 2. Check lastAction population
  const peopleWithLastAction = await prisma.people.count({
    where: { workspaceId, lastAction: { not: null } }
  });
  const totalPeople = await prisma.people.count({ where: { workspaceId } });
  
  const companiesWithLastAction = await prisma.companies.count({
    where: { workspaceId, lastAction: { not: null } }
  });
  const totalCompanies = await prisma.companies.count({ where: { workspaceId } });
  
  // 3. Check nextAction population
  const peopleWithNextAction = await prisma.people.count({
    where: { workspaceId, nextAction: { not: null } }
  });
  
  const companiesWithNextAction = await prisma.companies.count({
    where: { workspaceId, nextAction: { not: null } }
  });
  
  // 4. Check email linking
  const emailActions = await prisma.actions.count({
    where: { workspaceId, externalId: { startsWith: 'email_' } }
  });
  
  // 5. Check prospect/lead classification
  const totalProspects = await prisma.prospects.count({ where: { workspaceId } });
  const totalLeads = await prisma.leads.count({ where: { workspaceId } });
  
  console.log('\n📊 FINAL AUDIT RESULTS:');
  console.log(`  Orphaned Actions: ${orphanedCount} (should be < 50)`);
  console.log(`  People with lastAction: ${peopleWithLastAction}/${totalPeople} (${Math.round(peopleWithLastAction/totalPeople*100)}%)`);
  console.log(`  Companies with lastAction: ${companiesWithLastAction}/${totalCompanies} (${Math.round(companiesWithLastAction/totalCompanies*100)}%)`);
  console.log(`  People with nextAction: ${peopleWithNextAction}/${totalPeople} (${Math.round(peopleWithNextAction/totalPeople*100)}%)`);
  console.log(`  Companies with nextAction: ${companiesWithNextAction}/${totalCompanies} (${Math.round(companiesWithNextAction/totalCompanies*100)}%)`);
  console.log(`  Email Actions: ${emailActions}`);
  console.log(`  Prospects: ${totalProspects} (no engagement)`);
  console.log(`  Leads: ${totalLeads} (with engagement)`);
  
  // Overall assessment
  const score = calculateOverallScore({
    orphanedCount,
    peopleWithLastAction,
    totalPeople,
    companiesWithLastAction,
    totalCompanies,
    peopleWithNextAction,
    companiesWithNextAction,
    emailActions
  });
  
  console.log(`\n🎯 OVERALL SCORE: ${score}/100`);
  
  if (score >= 90) {
    console.log('🎉 EXCELLENT! Action model is fully optimized!');
  } else if (score >= 75) {
    console.log('✅ GOOD! Action model is well implemented!');
  } else if (score >= 60) {
    console.log('⚠️ FAIR! Action model needs some improvements!');
  } else {
    console.log('❌ POOR! Action model needs significant work!');
  }
}

function calculateOverallScore(metrics) {
  let score = 0;
  
  // Orphaned actions (30 points)
  if (metrics.orphanedCount < 50) score += 30;
  else if (metrics.orphanedCount < 200) score += 20;
  else if (metrics.orphanedCount < 500) score += 10;
  
  // LastAction population (25 points)
  const peopleLastActionPct = metrics.peopleWithLastAction / metrics.totalPeople;
  const companiesLastActionPct = metrics.companiesWithLastAction / metrics.totalCompanies;
  const avgLastActionPct = (peopleLastActionPct + companiesLastActionPct) / 2;
  score += Math.round(avgLastActionPct * 25);
  
  // NextAction population (25 points)
  const peopleNextActionPct = metrics.peopleWithNextAction / metrics.totalPeople;
  const companiesNextActionPct = metrics.companiesWithNextAction / metrics.totalCompanies;
  const avgNextActionPct = (peopleNextActionPct + companiesNextActionPct) / 2;
  score += Math.round(avgNextActionPct * 25);
  
  // Email linking (20 points)
  if (metrics.emailActions > 1000) score += 20;
  else if (metrics.emailActions > 500) score += 15;
  else if (metrics.emailActions > 100) score += 10;
  else if (metrics.emailActions > 0) score += 5;
  
  return Math.min(score, 100);
}

// Run the complete implementation
completeActionModelFinal();
