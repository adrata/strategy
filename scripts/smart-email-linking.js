#!/usr/bin/env node

/**
 * Smart Email Linking Strategy
 * Based on actual data analysis - links emails to Person, Company, and Action
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧠 SMART EMAIL LINKING STRATEGY');
  console.log('================================\n');

  try {
    // Step 1: Get all emails (ignore accountId mismatch)
    console.log('📧 Step 1: Getting all emails...');
    const allEmails = await prisma.email_messages.findMany({
      take: 100, // Process in batches
      orderBy: { sentAt: 'desc' }
    });

    console.log(`Found ${allEmails.length} emails to process`);

    // Step 2: Get all people and companies for matching
    console.log('\n👥 Step 2: Getting people and companies...');
    const allPeople = await prisma.people.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        secondaryEmail: true,
        companyId: true
      }
    });

    const allCompanies = await prisma.companies.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        website: true
      }
    });

    console.log(`Found ${allPeople.length} people and ${allCompanies.length} companies`);

    // Step 3: Process emails
    console.log('\n🔗 Step 3: Linking emails...');
    
    let processed = 0;
    let linkedToPerson = 0;
    let linkedToCompany = 0;
    let linkedToAction = 0;
    let fullyLinked = 0;

    for (const email of allEmails) {
      try {
        const result = await linkEmailToEntities(email, allPeople, allCompanies);
        
        processed++;
        if (result.linkedToPerson) linkedToPerson++;
        if (result.linkedToCompany) linkedToCompany++;
        if (result.linkedToAction) linkedToAction++;
        if (result.linkedToPerson && result.linkedToCompany && result.linkedToAction) {
          fullyLinked++;
        }

        // Show progress every 20 emails
        if (processed % 20 === 0) {
          console.log(`  ✅ Processed ${processed}/${allEmails.length} emails...`);
        }

      } catch (error) {
        console.log(`  ❌ Error processing email ${email.id}: ${error.message}`);
      }
    }

    // Step 4: Results
    console.log('\n🎉 LINKING COMPLETE!');
    console.log('====================');
    console.log(`✅ Total emails processed: ${processed}`);
    console.log(`✅ Linked to person: ${linkedToPerson} (${Math.round((linkedToPerson/processed)*100)}%)`);
    console.log(`✅ Linked to company: ${linkedToCompany} (${Math.round((linkedToCompany/processed)*100)}%)`);
    console.log(`✅ Linked to action: ${linkedToAction} (${Math.round((linkedToAction/processed)*100)}%)`);
    console.log(`✅ Fully linked (all 3): ${fullyLinked} (${Math.round((fullyLinked/processed)*100)}%)`);

    // Step 5: Final statistics
    console.log('\n📊 FINAL STATISTICS:');
    console.log('====================');
    await showFinalStatistics();

  } catch (error) {
    console.error('❌ Error in smart email linking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Link a single email to entities
 */
async function linkEmailToEntities(email, allPeople, allCompanies) {
  const result = {
    linkedToPerson: false,
    linkedToCompany: false,
    linkedToAction: false,
    personId: null,
    companyId: null,
    actionId: null
  };

  // Extract all email addresses from the email
  const allEmailAddresses = [
    email.from,
    ...email.to,
    ...email.cc,
    ...email.bcc
  ].filter(Boolean);

  console.log(`\n📧 Processing: "${email.subject}"`);
  console.log(`   From: ${email.from}`);
  console.log(`   To: ${email.to.join(', ')}`);

  // 1. Find matching people
  const matchingPeople = allPeople.filter(person => {
    const personEmails = [
      person.email,
      person.workEmail,
      person.personalEmail,
      person.secondaryEmail
    ].filter(Boolean);

    return personEmails.some(personEmail => 
      allEmailAddresses.some(emailAddr => 
        emailAddr.toLowerCase() === personEmail.toLowerCase()
      )
    );
  });

  if (matchingPeople.length > 0) {
    const person = matchingPeople[0]; // Take the first match
    result.linkedToPerson = true;
    result.personId = person.id;
    
    console.log(`   👤 Linked to person: ${person.fullName} (${person.email})`);
    
    // Link to person
    await createEmailToPersonLink(email.id, person.id);

    // 2. Link to company through person
    if (person.companyId) {
      const company = allCompanies.find(c => c.id === person.companyId);
      if (company) {
        result.linkedToCompany = true;
        result.companyId = company.id;
        console.log(`   🏢 Linked to company: ${company.name}`);
        
        // Link to company
        await createEmailToCompanyLink(email.id, company.id);
      }
    }
  }

  // 3. Try direct company matching by email domain
  if (!result.linkedToCompany) {
    const emailDomains = allEmailAddresses
      .map(addr => addr.split('@')[1])
      .filter(Boolean);

    for (const domain of emailDomains) {
      const matchingCompany = allCompanies.find(company => {
        if (company.email && company.email.includes(domain)) return true;
        if (company.website && company.website.includes(domain)) return true;
        return false;
      });

      if (matchingCompany) {
        result.linkedToCompany = true;
        result.companyId = matchingCompany.id;
        console.log(`   🏢 Linked to company by domain: ${matchingCompany.name}`);
        
        // Link to company
        await createEmailToCompanyLink(email.id, matchingCompany.id);
        break;
      }
    }
  }

  // 4. Find or create action
  let action = await prisma.actions.findFirst({
    where: {
      externalId: `email_${email.id}`
    }
  });

  if (!action) {
    action = await createActionForEmail(email, result.personId, result.companyId);
  }

  if (action) {
    result.linkedToAction = true;
    result.actionId = action.id;
    console.log(`   ⚡ Linked to action: ${action.type}`);
    
    // Link to action
    await createEmailToActionLink(email.id, action.id);
  }

  return result;
}

/**
 * Create action for email
 */
async function createActionForEmail(email, personId, companyId) {
  try {
    const actionType = determineEmailActionType(email);
    
    const actionData = {
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's workspace
      userId: 'system',
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
      companyId: companyId || null,
      createdAt: email.sentAt,
      updatedAt: email.sentAt
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
 * Determine email action type based on content
 */
function determineEmailActionType(email) {
  const subject = email.subject?.toLowerCase() || '';
  const body = email.body?.toLowerCase() || '';
  
  if (subject.includes('meeting') || subject.includes('calendar') || body.includes('meeting')) {
    return 'meeting';
  } else if (subject.includes('call') || subject.includes('phone') || body.includes('call')) {
    return 'call';
  } else if (subject.includes('proposal') || subject.includes('quote') || subject.includes('contract')) {
    return 'proposal';
  } else if (subject.includes('demo') || subject.includes('presentation')) {
    return 'demo';
  } else if (subject.includes('follow up') || subject.includes('follow-up')) {
    return 'follow_up';
  } else if (subject.includes('re:') || body.includes('re:')) {
    return 'email_reply';
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
 * Show final statistics
 */
async function showFinalStatistics() {
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
