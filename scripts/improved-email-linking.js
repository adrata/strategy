#!/usr/bin/env node

/**
 * 🎯 IMPROVED EMAIL LINKING - FIXES + STRATEGIC RECORD CREATION
 * 
 * This script:
 * 1. Fixes the email-to-person linking bug
 * 2. Creates strategic new companies and people
 * 3. Links all emails properly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Business email patterns (don't create people for these)
const SYSTEM_EMAIL_PATTERNS = [
  'updates@', 'notifications@', 'noreply@', 'no-reply@', 
  'support@', 'help@', 'info@', 'admin@', 'system@',
  'billing@', 'payments@', 'accounts@'
];

// Email categorization for sales process
const EMAIL_SALES_CONTEXT = {
  'cold_outreach': ['cold', 'outreach', 'introduction', 'first contact'],
  'qualification': ['qualify', 'discovery', 'needs', 'requirements'],
  'follow_up': ['follow up', 'follow-up', 'checking in', 'touch base'],
  'proposal': ['proposal', 'quote', 'estimate', 'pricing'],
  'demo': ['demo', 'demonstration', 'show', 'presentation'],
  'contract': ['contract', 'agreement', 'terms', 'legal'],
  'closing': ['close', 'decision', 'final', 'approval'],
  'support': ['support', 'help', 'issue', 'problem']
};

async function main() {
  console.log('🎯 IMPROVED EMAIL LINKING');
  console.log('=========================\n');

  try {
    // Step 1: Get emails to process
    console.log('📧 Step 1: Getting emails to process...');
    const emails = await prisma.email_messages.findMany({
      take: 100, // Start with 100 to test
      orderBy: { sentAt: 'desc' }
    });

    console.log(`Found ${emails.length} emails to process`);

    // Step 2: Process emails with improved linking
    console.log('\n🔗 Step 2: Improved email linking...');
    
    let processed = 0;
    let linkedToExistingPerson = 0;
    let linkedToExistingCompany = 0;
    let linkedToExistingAction = 0;
    let createdNewPerson = 0;
    let createdNewCompany = 0;
    let createdNewAction = 0;

    for (const email of emails) {
      try {
        const result = await processEmailWithImprovedLinking(email);
        
        processed++;
        if (result.linkedToExistingPerson) linkedToExistingPerson++;
        if (result.linkedToExistingCompany) linkedToExistingCompany++;
        if (result.linkedToExistingAction) linkedToExistingAction++;
        if (result.createdNewPerson) createdNewPerson++;
        if (result.createdNewCompany) createdNewCompany++;
        if (result.createdNewAction) createdNewAction++;

        if (processed % 20 === 0) {
          console.log(`  ✅ Processed ${processed}/${emails.length} emails...`);
        }

      } catch (error) {
        console.log(`  ❌ Error processing email ${email.id}: ${error.message}`);
      }
    }

    // Step 3: Results
    console.log('\n🎉 IMPROVED LINKING COMPLETE!');
    console.log('==============================');
    console.log(`✅ Total emails processed: ${processed}`);
    console.log(`✅ Linked to existing person: ${linkedToExistingPerson}`);
    console.log(`✅ Linked to existing company: ${linkedToExistingCompany}`);
    console.log(`✅ Linked to existing action: ${linkedToExistingAction}`);
    console.log(`✅ Created new person: ${createdNewPerson}`);
    console.log(`✅ Created new company: ${createdNewCompany}`);
    console.log(`✅ Created new action: ${createdNewAction}`);

    // Step 4: Final statistics
    console.log('\n📊 FINAL STATISTICS:');
    console.log('====================');
    await showFinalStatistics();

  } catch (error) {
    console.error('❌ Error in improved email linking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Process email with improved linking logic
 */
async function processEmailWithImprovedLinking(email) {
  const result = {
    linkedToExistingPerson: false,
    linkedToExistingCompany: false,
    linkedToExistingAction: false,
    createdNewPerson: false,
    createdNewCompany: false,
    createdNewAction: false
  };

  console.log(`\n📧 Processing: "${email.subject}"`);
  console.log(`   From: ${email.from}`);
  console.log(`   To: ${email.to.join(', ')}`);

  // Extract all email addresses
  const allEmailAddresses = [
    email.from,
    ...email.to,
    ...email.cc,
    ...email.bcc
  ].filter(Boolean);

  // 1. IMPROVED: Find existing people with better matching
  const existingPeople = await findExistingPeopleImproved(allEmailAddresses);
  if (existingPeople.length > 0) {
    const person = existingPeople[0];
    await createEmailToPersonLink(email.id, person.id);
    result.linkedToExistingPerson = true;
    console.log(`   👤 Linked to existing person: ${person.fullName} (${person.email})`);
  }

  // 2. IMPROVED: Find existing companies with better matching
  const existingCompanies = await findExistingCompaniesImproved(allEmailAddresses, existingPeople);
  if (existingCompanies.length > 0) {
    const company = existingCompanies[0];
    await createEmailToCompanyLink(email.id, company.id);
    result.linkedToExistingCompany = true;
    console.log(`   🏢 Linked to existing company: ${company.name}`);
  }

  // 3. Find or create action
  const action = await findOrCreateAction(email, existingPeople[0], existingCompanies[0]);
  if (action) {
    await createEmailToActionLink(email.id, action.id);
    result.linkedToExistingAction = !action.isNew;
    result.createdNewAction = action.isNew;
    console.log(`   ⚡ ${action.isNew ? 'Created new' : 'Linked to existing'} action: ${action.type}`);
  }

  // 4. STRATEGIC: Create new people for business contacts
  if (!result.linkedToExistingPerson) {
    const newPerson = await createStrategicPerson(email, allEmailAddresses);
    if (newPerson) {
      await createEmailToPersonLink(email.id, newPerson.id);
      result.createdNewPerson = true;
      console.log(`   👤 Created new person: ${newPerson.fullName}`);
    }
  }

  // 5. STRATEGIC: Create new companies for new domains
  if (!result.linkedToExistingCompany) {
    const newCompany = await createStrategicCompany(email, allEmailAddresses);
    if (newCompany) {
      await createEmailToCompanyLink(email.id, newCompany.id);
      result.createdNewCompany = true;
      console.log(`   🏢 Created new company: ${newCompany.name}`);
    }
  }

  return result;
}

/**
 * IMPROVED: Find existing people with better matching
 */
async function findExistingPeopleImproved(emailAddresses) {
  // Try multiple matching strategies
  const people = await prisma.people.findMany({
    where: {
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      OR: [
        // Direct email matches
        { email: { in: emailAddresses } },
        { workEmail: { in: emailAddresses } },
        { personalEmail: { in: emailAddresses } },
        { secondaryEmail: { in: emailAddresses } },
        // Case-insensitive matches
        { email: { in: emailAddresses.map(e => e.toLowerCase()) } },
        { workEmail: { in: emailAddresses.map(e => e.toLowerCase()) } },
        { personalEmail: { in: emailAddresses.map(e => e.toLowerCase()) } },
        { secondaryEmail: { in: emailAddresses.map(e => e.toLowerCase()) } }
      ]
    }
  });

  return people;
}

/**
 * IMPROVED: Find existing companies with better matching
 */
async function findExistingCompaniesImproved(emailAddresses, people) {
  const companies = [];
  
  // Find companies through people relationships
  for (const person of people) {
    if (person.companyId) {
      const company = await prisma.companies.findUnique({
        where: { id: person.companyId }
      });
      if (company && !companies.find(c => c.id === company.id)) {
        companies.push(company);
      }
    }
  }
  
  // Find companies by direct email domain matching
  const emailDomains = emailAddresses
    .map(addr => addr.split('@')[1])
    .filter(Boolean);

  const directCompanies = await prisma.companies.findMany({
    where: {
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      OR: [
        { email: { in: emailAddresses } },
        { website: { contains: emailDomains[0] } },
        { name: { contains: emailDomains[0].split('.')[0] } }
      ]
    }
  });

  for (const company of directCompanies) {
    if (!companies.find(c => c.id === company.id)) {
      companies.push(company);
    }
  }
  
  return companies;
}

/**
 * Find or create action for email
 */
async function findOrCreateAction(email, person, company) {
  // Try to find existing action
  const existingAction = await prisma.actions.findFirst({
    where: {
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      OR: [
        { externalId: `email_${email.id}` },
        { 
          AND: [
            { subject: { contains: email.subject?.substring(0, 20) || '' } },
            { type: 'email_conversation' }
          ]
        }
      ]
    }
  });

  if (existingAction) {
    return { ...existingAction, isNew: false };
  }

  // Create new action
  const actionType = determineEmailActionType(email);
  const salesStage = determineSalesStage(email);
  
  const newAction = await prisma.actions.create({
    data: {
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
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
        bcc: email.bcc,
        salesStage: salesStage,
        direction: email.from.includes('dano@retail-products.com') ? 'outbound' : 'inbound'
      },
      externalId: `email_${email.id}`,
      personId: person?.id || null,
      companyId: company?.id || null,
      createdAt: email.sentAt,
      updatedAt: email.sentAt
    }
  });

  return { ...newAction, isNew: true };
}

/**
 * STRATEGIC: Create new person for business contacts only
 */
async function createStrategicPerson(email, emailAddresses) {
  // Don't create people for system emails
  const businessEmails = emailAddresses.filter(email => 
    !SYSTEM_EMAIL_PATTERNS.some(pattern => email.toLowerCase().includes(pattern))
  );

  if (businessEmails.length === 0) return null;

  const emailToCreate = businessEmails[0];
  const [localPart, domain] = emailToCreate.split('@');
  
  // Extract name from email
  const nameParts = localPart.split(/[._-]/);
  const firstName = nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1) || 'Unknown';
  const lastName = nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1) || 'Contact';

  try {
    const newPerson = await prisma.people.create({
      data: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        email: emailToCreate,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return newPerson;
  } catch (error) {
    console.log(`     ❌ Failed to create person: ${error.message}`);
    return null;
  }
}

/**
 * STRATEGIC: Create new company for new domains
 */
async function createStrategicCompany(email, emailAddresses) {
  const domains = [...new Set(emailAddresses.map(addr => addr.split('@')[1]))];
  const newDomain = domains.find(domain => 
    !['retail-products.com', 'zohocorp.com', 'zohostore.com'].includes(domain)
  );

  if (!newDomain) return null;

  const companyName = newDomain.split('.')[0]
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  try {
    const newCompany = await prisma.companies.create({
      data: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        name: companyName,
        website: `https://${newDomain}`,
        state: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return newCompany;
  } catch (error) {
    console.log(`     ❌ Failed to create company: ${error.message}`);
    return null;
  }
}

/**
 * Determine email action type
 */
function determineEmailActionType(email) {
  const subject = email.subject?.toLowerCase() || '';
  const body = email.body?.toLowerCase() || '';
  const from = email.from?.toLowerCase() || '';
  
  const isDanoInitiated = from.includes('dano@retail-products.com');
  
  // Check for specific sales context
  for (const [context, keywords] of Object.entries(EMAIL_SALES_CONTEXT)) {
    if (keywords.some(keyword => subject.includes(keyword) || body.includes(keyword))) {
      return isDanoInitiated ? context : `received_${context}`;
    }
  }
  
  // Default email types
  if (subject.includes('re:') || body.includes('re:')) {
    return isDanoInitiated ? 'email_reply_sent' : 'email_reply_received';
  } else if (subject.includes('fw:') || body.includes('fw:')) {
    return isDanoInitiated ? 'email_forwarded' : 'email_forwarded_received';
  } else {
    return isDanoInitiated ? 'email_sent' : 'email_received';
  }
}

/**
 * Determine sales stage
 */
function determineSalesStage(email) {
  const subject = email.subject?.toLowerCase() || '';
  const body = email.body?.toLowerCase() || '';
  
  if (subject.includes('proposal') || subject.includes('quote')) return 'opportunity';
  if (subject.includes('demo') || subject.includes('meeting')) return 'prospect';
  if (subject.includes('contract') || subject.includes('agreement')) return 'customer';
  
  return 'lead';
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

  console.log(`📧 Total emails: ${totalEmails}`);
  console.log(`👤 Emails linked to person: ${emailsLinkedToPerson} (${Math.round((emailsLinkedToPerson/totalEmails)*100)}%)`);
  console.log(`🏢 Emails linked to company: ${emailsLinkedToCompany} (${Math.round((emailsLinkedToCompany/totalEmails)*100)}%)`);
  console.log(`⚡ Emails linked to action: ${emailsLinkedToAction} (${Math.round((emailsLinkedToAction/totalEmails)*100)}%)`);
}

main().catch(console.error);
