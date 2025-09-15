const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createComprehensiveActionRecords() {
  console.log('🚀 CREATING COMPREHENSIVE ACTION RECORDS');
  console.log('========================================');
  
  try {
    // 1. CREATE EMAIL CONVERSATION ACTIONS
    console.log('\n📧 STEP 1: CREATING EMAIL CONVERSATION ACTIONS');
    console.log('===============================================');
    
    // Get unique email threads
    const emailThreads = await prisma.$queryRaw`
      SELECT 
        "threadId",
        "accountId",
        subject,
        COUNT(*) as message_count,
        MIN("sentAt") as first_message,
        MAX("sentAt") as last_message,
        MAX("buyingSignal") as buying_signal,
        MAX("buyingSignalScore") as buying_signal_score
      FROM email_messages 
      WHERE "threadId" IS NOT NULL
      GROUP BY "threadId", "accountId", subject
      ORDER BY last_message DESC;
    `;
    
    console.log(`📊 Found ${emailThreads.length} unique email threads`);
    
    let emailActionsCreated = 0;
    
    for (const thread of emailThreads) {
      // Get sample emails from this thread to find recipients
      const sampleEmails = await prisma.$queryRaw`
        SELECT "from", "to"
        FROM email_messages 
        WHERE "threadId" = $1
        LIMIT 3;
      `, [thread.threadId];
      
      // Get the primary recipient (first non-dano email)
      const primaryRecipient = getPrimaryRecipientFromSamples(sampleEmails);
      
      // Find or create person for the primary recipient
      let personId = null;
      if (primaryRecipient) {
        personId = await findOrCreatePersonFromEmail(primaryRecipient, thread.accountId);
      }
      
      // Create action record for this email conversation
      const actionId = `email_thread_${thread.threadId.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      try {
        await prisma.actions.create({
          data: {
            id: actionId,
            type: 'email_conversation',
            subject: thread.subject,
            description: `Email conversation with ${messageCountText(thread.message_count)}`,
            status: 'completed',
            priority: 'medium',
            personId: personId,
            companyId: thread.accountId,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's user ID
            completedAt: thread.last_message,
            createdAt: thread.first_message,
            updatedAt: thread.last_message,
            externalId: thread.threadId,
            metadata: {
              emailThreadId: thread.threadId,
              messageCount: thread.message_count,
              firstMessageAt: thread.first_message,
              lastMessageAt: thread.last_message,
              buyingSignal: thread.buying_signal,
              buyingSignalScore: thread.buying_signal_score,
              actionSource: 'email_messages'
            }
          }
        });
        
        emailActionsCreated++;
        if (emailActionsCreated % 100 === 0) {
          console.log(`  ✅ Created ${emailActionsCreated} email conversation actions...`);
        }
      } catch (error) {
        if (error.code === 'P2002') {
          // Action already exists, skip
          continue;
        } else {
          console.error(`  ❌ Error creating action for thread ${thread.threadId}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Created ${emailActionsCreated} email conversation actions`);
    
    // 2. CREATE ACTIONS FOR SINGLE EMAILS (NO THREAD)
    console.log('\n📧 STEP 2: CREATING ACTIONS FOR SINGLE EMAILS');
    console.log('==============================================');
    
    const singleEmails = await prisma.$queryRaw`
      SELECT 
        id,
        "messageId",
        "accountId",
        subject,
        "from",
        "to",
        "sentAt",
        "buyingSignal",
        "buyingSignalScore"
      FROM email_messages 
      WHERE "threadId" IS NULL
      ORDER BY "sentAt" DESC;
    `;
    
    console.log(`📊 Found ${singleEmails.length} single emails (no thread)`);
    
    let singleEmailActionsCreated = 0;
    
    for (const email of singleEmails) {
      // Get the primary recipient
      const primaryRecipient = getPrimaryRecipient(email.to, [email.from]);
      
      // Find or create person for the primary recipient
      let personId = null;
      if (primaryRecipient) {
        personId = await findOrCreatePersonFromEmail(primaryRecipient, email.accountId);
      }
      
      // Create action record for this single email
      const actionId = `email_single_${email.id}`;
      
      try {
        await prisma.actions.create({
          data: {
            id: actionId,
            type: 'email_conversation',
            subject: email.subject,
            description: `Single email sent`,
            status: 'completed',
            priority: 'medium',
            personId: personId,
            companyId: email.accountId,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            completedAt: email.sentAt,
            createdAt: email.sentAt,
            updatedAt: email.sentAt,
            externalId: email.messageId,
            metadata: {
              emailMessageId: email.id,
              messageId: email.messageId,
              buyingSignal: email.buyingSignal,
              buyingSignalScore: email.buyingSignalScore,
              from: email.from,
              to: email.to,
              actionSource: 'email_messages'
            }
          }
        });
        
        singleEmailActionsCreated++;
        if (singleEmailActionsCreated % 100 === 0) {
          console.log(`  ✅ Created ${singleEmailActionsCreated} single email actions...`);
        }
      } catch (error) {
        if (error.code === 'P2002') {
          continue;
        } else {
          console.error(`  ❌ Error creating action for email ${email.id}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Created ${singleEmailActionsCreated} single email actions`);
    
    // 3. CREATE ACTIONS FOR SYSTEM ACTIVITIES (LEADS, PROSPECTS, OPPORTUNITIES)
    console.log('\n📋 STEP 3: CREATING ACTIONS FOR SYSTEM ACTIVITIES');
    console.log('=================================================');
    
    // Create actions for lead creation
    const leads = await prisma.leads.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { id: true, personId: true, companyId: true, createdAt: true, updatedAt: true }
    });
    
    let leadActionsCreated = 0;
    for (const lead of leads) {
      const actionId = `lead_created_${lead.id}`;
      
      try {
        await prisma.actions.create({
          data: {
            id: actionId,
            type: 'lead_created',
            subject: 'Lead Created',
            description: 'New lead added to the system',
            status: 'completed',
            priority: 'high',
            personId: lead.personId,
            companyId: lead.companyId,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            leadId: lead.id,
            completedAt: lead.createdAt,
            createdAt: lead.createdAt,
            updatedAt: lead.updatedAt,
            metadata: {
              actionSource: 'system',
              activityType: 'lead_creation'
            }
          }
        });
        leadActionsCreated++;
      } catch (error) {
        if (error.code !== 'P2002') {
          console.error(`  ❌ Error creating lead action:`, error.message);
        }
      }
    }
    
    console.log(`✅ Created ${leadActionsCreated} lead creation actions`);
    
    // Create actions for prospect creation
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { id: true, personId: true, companyId: true, createdAt: true, updatedAt: true }
    });
    
    let prospectActionsCreated = 0;
    for (const prospect of prospects) {
      const actionId = `prospect_created_${prospect.id}`;
      
      try {
        await prisma.actions.create({
          data: {
            id: actionId,
            type: 'prospect_created',
            subject: 'Prospect Created',
            description: 'New prospect added to the system',
            status: 'completed',
            priority: 'high',
            personId: prospect.personId,
            companyId: prospect.companyId,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            prospectId: prospect.id,
            completedAt: prospect.createdAt,
            createdAt: prospect.createdAt,
            updatedAt: prospect.updatedAt,
            metadata: {
              actionSource: 'system',
              activityType: 'prospect_creation'
            }
          }
        });
        prospectActionsCreated++;
      } catch (error) {
        if (error.code !== 'P2002') {
          console.error(`  ❌ Error creating prospect action:`, error.message);
        }
      }
    }
    
    console.log(`✅ Created ${prospectActionsCreated} prospect creation actions`);
    
    // Create actions for opportunity creation
    const opportunities = await prisma.opportunities.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { id: true, personId: true, companyId: true, createdAt: true, updatedAt: true }
    });
    
    let opportunityActionsCreated = 0;
    for (const opportunity of opportunities) {
      const actionId = `opportunity_created_${opportunity.id}`;
      
      try {
        await prisma.actions.create({
          data: {
            id: actionId,
            type: 'opportunity_created',
            subject: 'Opportunity Created',
            description: 'New opportunity added to the system',
            status: 'completed',
            priority: 'high',
            personId: opportunity.personId,
            companyId: opportunity.companyId,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            opportunityId: opportunity.id,
            completedAt: opportunity.createdAt,
            createdAt: opportunity.createdAt,
            updatedAt: opportunity.updatedAt,
            metadata: {
              actionSource: 'system',
              activityType: 'opportunity_creation'
            }
          }
        });
        opportunityActionsCreated++;
      } catch (error) {
        if (error.code !== 'P2002') {
          console.error(`  ❌ Error creating opportunity action:`, error.message);
        }
      }
    }
    
    console.log(`✅ Created ${opportunityActionsCreated} opportunity creation actions`);
    
    // 4. CREATE ACTIONS FOR NOTES
    console.log('\n📝 STEP 4: CREATING ACTIONS FOR NOTES');
    console.log('=====================================');
    
    const notes = await prisma.notes.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { id: true, personId: true, companyId: true, content: true, createdAt: true, updatedAt: true }
    });
    
    let noteActionsCreated = 0;
    for (const note of notes) {
      const actionId = `note_created_${note.id}`;
      
      try {
        await prisma.actions.create({
          data: {
            id: actionId,
            type: 'note_added',
            subject: 'Note Added',
            description: note.content?.substring(0, 100) + (note.content?.length > 100 ? '...' : ''),
            status: 'completed',
            priority: 'medium',
            personId: note.personId,
            companyId: note.companyId,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            completedAt: note.createdAt,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            metadata: {
              actionSource: 'system',
              activityType: 'note_creation',
              noteId: note.id
            }
          }
        });
        noteActionsCreated++;
      } catch (error) {
        if (error.code !== 'P2002') {
          console.error(`  ❌ Error creating note action:`, error.message);
        }
      }
    }
    
    console.log(`✅ Created ${noteActionsCreated} note actions`);
    
    // 5. FINAL VERIFICATION
    console.log('\n🔍 STEP 5: FINAL VERIFICATION');
    console.log('=============================');
    
    const finalActionCounts = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count
      FROM actions 
      WHERE "workspaceId" = '01K1VBYV8ETM2RCQA4GNN9EG72'
      GROUP BY type
      ORDER BY count DESC;
    `;
    
    console.log('📊 FINAL ACTION TYPE DISTRIBUTION:');
    finalActionCounts.forEach(row => {
      console.log(`  ${row.type}: ${row.count} actions`);
    });
    
    const totalActions = await prisma.actions.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    
    const linkedToPeople = await prisma.actions.count({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        personId: { not: null }
      }
    });
    
    const linkedToCompanies = await prisma.actions.count({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        companyId: { not: null }
      }
    });
    
    const linkedToBoth = await prisma.actions.count({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        personId: { not: null },
        companyId: { not: null }
      }
    });
    
    const peoplePercent = ((linkedToPeople / totalActions) * 100).toFixed(1);
    const companiesPercent = ((linkedToCompanies / totalActions) * 100).toFixed(1);
    const bothPercent = ((linkedToBoth / totalActions) * 100).toFixed(1);
    
    console.log('\n🔗 FINAL LINKING STATUS:');
    console.log(`  Total actions: ${totalActions}`);
    console.log(`  Linked to people: ${linkedToPeople} (${peoplePercent}%)`);
    console.log(`  Linked to companies: ${linkedToCompanies} (${companiesPercent}%)`);
    console.log(`  Linked to both: ${linkedToBoth} (${bothPercent}%)`);
    
    console.log('\n📊 SUMMARY:');
    console.log(`  📧 Email conversation actions: ${emailActionsCreated + singleEmailActionsCreated}`);
    console.log(`  📋 Lead creation actions: ${leadActionsCreated}`);
    console.log(`  🎯 Prospect creation actions: ${prospectActionsCreated}`);
    console.log(`  💰 Opportunity creation actions: ${opportunityActionsCreated}`);
    console.log(`  📝 Note actions: ${noteActionsCreated}`);
    console.log(`  📞 Existing call actions: 477`);
    console.log(`  🔗 Existing LinkedIn actions: 1,214`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

function getPrimaryRecipientFromSamples(sampleEmails) {
  const danoEmails = ['dano@retail-products.com'];
  
  for (const email of sampleEmails) {
    // Check recipients
    if (email.to && Array.isArray(email.to)) {
      for (const recipient of email.to) {
        if (recipient && !danoEmails.includes(recipient.toLowerCase())) {
          return recipient;
        }
      }
    }
    
    // Check sender if no good recipient found
    if (email.from && !danoEmails.includes(email.from.toLowerCase())) {
      return email.from;
    }
  }
  
  return null;
}

async function findOrCreatePersonFromEmail(email, companyId) {
  if (!email) return null;
  
  // Try to find existing person by email
  const existingPerson = await prisma.people.findFirst({
    where: {
      OR: [
        { email: email },
        { fullName: { contains: email.split('@')[0], mode: 'insensitive' } }
      ],
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
    }
  });
  
  if (existingPerson) {
    return existingPerson.id;
  }
  
  // Create new person from email
  const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ');
  const nameParts = nameFromEmail.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  try {
    const newPerson = await prisma.people.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        fullName: nameFromEmail,
        email: email,
        companyId: companyId,
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return newPerson.id;
  } catch (error) {
    console.error(`  ❌ Error creating person for email ${email}:`, error.message);
    return null;
  }
}

function messageCountText(count) {
  if (count === 1) return '1 message';
  return `${count} messages`;
}

createComprehensiveActionRecords();
