#!/usr/bin/env node

/**
 * Migrate Emails to Simplified Linking
 * Links emails to Person, Company, and Action only
 * Leverages existing relationships: Person → Company, Person → Lead/Prospect/Opportunity
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📧 MIGRATING EMAILS TO SIMPLIFIED LINKING');
  console.log('==========================================\n');

  try {
    // Step 1: Get all email accounts
    console.log('🔍 Step 1: Getting email accounts...');
    
    const emailAccounts = await prisma.email_accounts.findMany({
      select: {
        id: true,
        workspaceId: true,
        email: true
      }
    });

    console.log(`Found ${emailAccounts.length} email accounts`);

    // Step 2: Process emails in batches
    console.log('\n📨 Step 2: Processing emails...');
    
    let totalProcessed = 0;
    let linkedToPerson = 0;
    let linkedToCompany = 0;
    let linkedToAction = 0;
    let fullyLinked = 0;
    const batchSize = 100;

    for (const account of emailAccounts) {
      console.log(`\nProcessing account: ${account.email}`);
      
      // Get emails for this account
      const emails = await prisma.email_messages.findMany({
        where: { accountId: account.id },
        take: batchSize,
        orderBy: { sentAt: 'desc' }
      });

      // If no emails found, try without accountId filter to see if emails exist
      if (emails.length === 0) {
        const allEmails = await prisma.email_messages.findMany({
          take: 5,
          orderBy: { sentAt: 'desc' }
        });
        console.log(`   No emails found for account ${account.email}, but found ${allEmails.length} total emails in database`);
      }

      console.log(`Found ${emails.length} emails to process`);

      for (const email of emails) {
        try {
          const result = await linkEmailToEntities(email, account.workspaceId);
          
          totalProcessed++;
          if (result.linkedToPerson) linkedToPerson++;
          if (result.linkedToCompany) linkedToCompany++;
          if (result.linkedToAction) linkedToAction++;
          if (result.linkedToPerson && result.linkedToCompany && result.linkedToAction) {
            fullyLinked++;
          }

          // Update progress every 50 emails
          if (totalProcessed % 50 === 0) {
            console.log(`  ✅ Processed ${totalProcessed} emails...`);
          }

        } catch (error) {
          console.log(`❌ Error processing email ${email.id}: ${error.message}`);
        }
      }

      console.log(`✅ Processed ${emails.length} emails for ${account.email}`);
    }

    // Step 3: Summary
    console.log('\n🎉 EMAIL LINKING COMPLETE!');
    console.log('===========================');
    console.log(`✅ Total emails processed: ${totalProcessed}`);
    console.log(`✅ Linked to person: ${linkedToPerson} (${Math.round((linkedToPerson/totalProcessed)*100)}%)`);
    console.log(`✅ Linked to company: ${linkedToCompany} (${Math.round((linkedToCompany/totalProcessed)*100)}%)`);
    console.log(`✅ Linked to action: ${linkedToAction} (${Math.round((linkedToAction/totalProcessed)*100)}%)`);
    console.log(`✅ Fully linked (all 3): ${fullyLinked} (${Math.round((fullyLinked/totalProcessed)*100)}%)`);

    // Step 4: Show final statistics
    console.log('\n📊 FINAL STATISTICS:');
    console.log('====================');
    await showLinkingStatistics();

  } catch (error) {
    console.error('❌ Error in email linking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Link a single email to person, company, and action
 */
async function linkEmailToEntities(email, workspaceId) {
  const result = {
    linkedToPerson: false,
    linkedToCompany: false,
    linkedToAction: false,
    personId: null,
    companyId: null,
    actionId: null
  };

  // Extract email addresses
  const allEmails = [
    email.from,
    ...email.to,
    ...email.cc,
    ...email.bcc
  ].filter(Boolean);

  // 1. Find and link to person
  const person = await findPersonByEmails(allEmails, workspaceId);
  if (person) {
    await createEmailToPersonLink(email.id, person.id);
    result.linkedToPerson = true;
    result.personId = person.id;

    // 2. Link to company through person
    if (person.companyId) {
      await createEmailToCompanyLink(email.id, person.companyId);
      result.linkedToCompany = true;
      result.companyId = person.companyId;
    }
  }

  // 3. Find or create action
  let action = await findExistingActionForEmail(email.id);
  if (!action) {
    action = await createActionForEmail(email, workspaceId, result.personId, result.companyId);
  }

  if (action) {
    await createEmailToActionLink(email.id, action.id);
    result.linkedToAction = true;
    result.actionId = action.id;
  }

  return result;
}

/**
 * Find person by email addresses
 */
async function findPersonByEmails(emailAddresses, workspaceId) {
  return await prisma.people.findFirst({
    where: {
      workspaceId,
      OR: [
        { email: { in: emailAddresses } },
        { workEmail: { in: emailAddresses } },
        { personalEmail: { in: emailAddresses } },
        { secondaryEmail: { in: emailAddresses } }
      ]
    }
  });
}

/**
 * Find existing action for email
 */
async function findExistingActionForEmail(emailId) {
  return await prisma.actions.findFirst({
    where: {
      externalId: `email_${emailId}`
    }
  });
}

/**
 * Create action for email
 */
async function createActionForEmail(email, workspaceId, personId, companyId) {
  try {
    const actionType = determineEmailActionType(email);
    
    const actionData = {
      workspaceId,
      userId: 'system', // You might want to determine this differently
      type: actionType,
      subject: email.subject || 'Email',
      description: `Email: ${email.subject}`,
      outcome: null,
      scheduledAt: email.sentAt,
      completedAt: email.sentAt,
      status: 'completed',
      priority: 'normal',
      attachments: email.attachments || null,
      metadata: {
        emailId: email.id,
        messageId: email.messageId,
        threadId: email.threadId,
        from: email.from,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc
      },
      externalId: `email_${email.id}`,
      personId: personId || null,
      companyId: companyId || null
    };

    return await prisma.actions.create({
      data: actionData
    });

  } catch (error) {
    console.error(`❌ Error creating action for email ${email.id}:`, error);
    return null;
  }
}

/**
 * Determine email action type
 */
function determineEmailActionType(email) {
  const subject = email.subject?.toLowerCase() || '';
  
  if (subject.includes('meeting') || subject.includes('calendar')) {
    return 'meeting';
  } else if (subject.includes('call') || subject.includes('phone')) {
    return 'call';
  } else if (subject.includes('proposal') || subject.includes('quote') || subject.includes('contract')) {
    return 'proposal';
  } else if (subject.includes('demo') || subject.includes('presentation')) {
    return 'demo';
  } else if (subject.includes('follow up') || subject.includes('follow-up')) {
    return 'follow_up';
  } else {
    return 'email';
  }
}

/**
 * Create email-to-person link
 */
async function createEmailToPersonLink(emailId, personId) {
  try {
    await prisma.emailToPerson.create({
      data: { A: emailId, B: personId }
    });
  } catch (error) {
    // Ignore duplicate key errors
    if (!error.message.includes('Unique constraint')) {
      throw error;
    }
  }
}

/**
 * Create email-to-company link
 */
async function createEmailToCompanyLink(emailId, companyId) {
  try {
    await prisma.emailToCompany.create({
      data: { A: emailId, B: companyId }
    });
  } catch (error) {
    // Ignore duplicate key errors
    if (!error.message.includes('Unique constraint')) {
      throw error;
    }
  }
}

/**
 * Create email-to-action link
 */
async function createEmailToActionLink(emailId, actionId) {
  try {
    await prisma.emailToAction.create({
      data: { A: emailId, B: actionId }
    });
  } catch (error) {
    // Ignore duplicate key errors
    if (!error.message.includes('Unique constraint')) {
      throw error;
    }
  }
}

/**
 * Show linking statistics
 */
async function showLinkingStatistics() {
  const totalEmails = await prisma.email_messages.count();
  const emailsLinkedToPerson = await prisma.emailToPerson.count();
  const emailsLinkedToCompany = await prisma.emailToCompany.count();
  const emailsLinkedToAction = await prisma.emailToAction.count();

  // Count emails that are linked to all three entities
  const fullyLinkedEmails = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM email_messages e
    WHERE EXISTS (SELECT 1 FROM "_EmailToPerson" etp WHERE etp."A" = e.id)
      AND EXISTS (SELECT 1 FROM "_EmailToCompany" etc WHERE etc."A" = e.id)
      AND EXISTS (SELECT 1 FROM "_EmailToAction" eta WHERE eta."A" = e.id)
  `;

  console.log(`📧 Total emails: ${totalEmails}`);
  console.log(`👤 Emails linked to person: ${emailsLinkedToPerson} (${Math.round((emailsLinkedToPerson/totalEmails)*100)}%)`);
  console.log(`🏢 Emails linked to company: ${emailsLinkedToCompany} (${Math.round((emailsLinkedToCompany/totalEmails)*100)}%)`);
  console.log(`⚡ Emails linked to action: ${emailsLinkedToAction} (${Math.round((emailsLinkedToAction/totalEmails)*100)}%)`);
  console.log(`🎯 Fully linked emails: ${fullyLinkedEmails[0]?.count || 0} (${Math.round(((fullyLinkedEmails[0]?.count || 0)/totalEmails)*100)}%)`);
}

main().catch(console.error);
