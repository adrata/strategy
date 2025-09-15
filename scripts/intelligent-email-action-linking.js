#!/usr/bin/env node

/**
 * 🎯 INTELLIGENT EMAIL-ACTION LINKING
 * 
 * This script creates the RIGHT kind of email linking for your sales process:
 * 1. Links emails to existing sales actions (not creates new ones)
 * 2. Categorizes emails by their sales context
 * 3. Creates timeline-appropriate connections
 * 4. Integrates with your existing action model
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Email categorization for sales process with stage context
const EMAIL_SALES_CONTEXT = {
  // Lead Stage
  'cold_outreach': ['cold', 'outreach', 'introduction', 'first contact'],
  'qualification': ['qualify', 'discovery', 'needs', 'requirements'],
  'follow_up': ['follow up', 'follow-up', 'checking in', 'touch base'],
  
  // Prospect Stage  
  'proposal': ['proposal', 'quote', 'estimate', 'pricing'],
  'demo': ['demo', 'demonstration', 'show', 'presentation'],
  'objection_handling': ['objection', 'concern', 'question', 'hesitation'],
  
  // Opportunity Stage
  'contract': ['contract', 'agreement', 'terms', 'legal'],
  'closing': ['close', 'decision', 'final', 'approval'],
  'implementation': ['implementation', 'setup', 'onboarding', 'kickoff'],
  
  // Customer Stage
  'support': ['support', 'help', 'issue', 'problem'],
  'upsell': ['upgrade', 'additional', 'more', 'expand'],
  'renewal': ['renewal', 'renew', 'extend', 'continue']
};

// Sales stage indicators to help categorize emails
const SALES_STAGE_INDICATORS = {
  'lead': ['new', 'uncontacted', 'cold', 'first', 'introduction'],
  'prospect': ['qualified', 'interested', 'engaged', 'considering'],
  'opportunity': ['proposal', 'demo', 'negotiation', 'decision'],
  'customer': ['closed', 'won', 'implementation', 'onboarding']
};

async function main() {
  console.log('🎯 INTELLIGENT EMAIL-ACTION LINKING');
  console.log('===================================\n');

  try {
    // Step 1: Get emails and existing actions
    console.log('📧 Step 1: Getting emails and existing actions...');
    const emails = await prisma.email_messages.findMany({
      take: 50, // Start with smaller batch
      orderBy: { sentAt: 'desc' }
    });

    const existingActions = await prisma.actions.findMany({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      include: {
        person: true,
        company: true
      }
    });

    console.log(`Found ${emails.length} emails and ${existingActions.length} existing actions`);

    // Step 2: Process emails intelligently
    console.log('\n🔗 Step 2: Intelligent email-action linking...');
    
    let processed = 0;
    let linkedToExistingAction = 0;
    let linkedToPerson = 0;
    let linkedToCompany = 0;
    let createdNewAction = 0;

    for (const email of emails) {
      try {
        const result = await linkEmailIntelligently(email, existingActions);
        
        processed++;
        if (result.linkedToExistingAction) linkedToExistingAction++;
        if (result.linkedToPerson) linkedToPerson++;
        if (result.linkedToCompany) linkedToCompany++;
        if (result.createdNewAction) createdNewAction++;

        // Show progress
        if (processed % 10 === 0) {
          console.log(`  ✅ Processed ${processed}/${emails.length} emails...`);
        }

      } catch (error) {
        console.log(`  ❌ Error processing email ${email.id}: ${error.message}`);
      }
    }

    // Step 3: Results
    console.log('\n🎉 INTELLIGENT LINKING COMPLETE!');
    console.log('=================================');
    console.log(`✅ Total emails processed: ${processed}`);
    console.log(`✅ Linked to existing actions: ${linkedToExistingAction}`);
    console.log(`✅ Linked to person: ${linkedToPerson}`);
    console.log(`✅ Linked to company: ${linkedToCompany}`);
    console.log(`✅ Created new actions: ${createdNewAction}`);

    // Step 4: Final statistics
    console.log('\n📊 FINAL STATISTICS:');
    console.log('====================');
    await showFinalStatistics();

  } catch (error) {
    console.error('❌ Error in intelligent email linking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Intelligently link email to existing actions or create appropriate new ones
 */
async function linkEmailIntelligently(email, existingActions) {
  const result = {
    linkedToExistingAction: false,
    linkedToPerson: false,
    linkedToCompany: false,
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

  // 1. Try to find existing action for this email thread/conversation
  const existingAction = await findExistingActionForEmail(email, existingActions);
  
  if (existingAction) {
    // Link to existing action
    await createEmailToActionLink(email.id, existingAction.id);
    result.linkedToExistingAction = true;
    console.log(`   ⚡ Linked to existing action: ${existingAction.type} - ${existingAction.subject}`);
  }

  // 2. Find and link to people
  const matchingPeople = await findMatchingPeople(allEmailAddresses);
  if (matchingPeople.length > 0) {
    const person = matchingPeople[0];
    await createEmailToPersonLink(email.id, person.id);
    result.linkedToPerson = true;
    console.log(`   👤 Linked to person: ${person.fullName}`);
  }

  // 3. Find and link to companies
  const matchingCompanies = await findMatchingCompanies(allEmailAddresses, matchingPeople);
  if (matchingCompanies.length > 0) {
    const company = matchingCompanies[0];
    await createEmailToCompanyLink(email.id, company.id);
    result.linkedToCompany = true;
    console.log(`   🏢 Linked to company: ${company.name}`);
  }

  // 4. If no existing action found, create a new one only if it's a significant email
  if (!existingAction && isSignificantEmail(email)) {
    const newAction = await createSignificantEmailAction(email, matchingPeople[0], matchingCompanies[0]);
    if (newAction) {
      await createEmailToActionLink(email.id, newAction.id);
      result.createdNewAction = true;
      console.log(`   ⚡ Created new action: ${newAction.type}`);
    }
  }

  return result;
}

/**
 * Find existing action for this email thread/conversation
 */
async function findExistingActionForEmail(email, existingActions) {
  // Look for actions with similar subject or involving the same people
  const subjectKeywords = email.subject.toLowerCase().split(' ').filter(word => word.length > 3);
  
  for (const action of existingActions) {
    // Check if action subject contains similar keywords
    const actionSubject = action.subject.toLowerCase();
    const matchingKeywords = subjectKeywords.filter(keyword => 
      actionSubject.includes(keyword)
    );
    
    // If 2+ keywords match, likely the same conversation
    if (matchingKeywords.length >= 2) {
      return action;
    }
    
    // Check if action involves the same people
    if (action.person) {
      const personEmails = [
        action.person.email, 
        action.person.workEmail, 
        action.person.personalEmail, 
        action.person.secondaryEmail
      ].filter(Boolean);
      
      if (email.to.some(toEmail => personEmails.includes(toEmail))) {
        return action;
      }
    }
    
    // Check if action involves the same company
    if (action.company) {
      if (email.to.some(toEmail => 
        toEmail.includes(action.company.name.toLowerCase().replace(/\s+/g, '')) ||
        (action.company.email && toEmail === action.company.email)
      )) {
        return action;
      }
    }
  }
  
  return null;
}

/**
 * Find matching people by email addresses
 */
async function findMatchingPeople(emailAddresses) {
  return await prisma.people.findMany({
    where: {
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
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
 * Find matching companies by email addresses or through people
 */
async function findMatchingCompanies(emailAddresses, people) {
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
        { website: { contains: emailDomains[0] } }
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
 * Determine if email is significant enough to create a new action
 */
function isSignificantEmail(email) {
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  
  // Significant email indicators
  const significantKeywords = [
    'proposal', 'quote', 'contract', 'meeting', 'demo', 'call',
    'follow up', 'follow-up', 'next steps', 'decision', 'approval',
    'pricing', 'budget', 'timeline', 'implementation', 'onboarding'
  ];
  
  return significantKeywords.some(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  );
}

/**
 * Create action for significant emails
 */
async function createSignificantEmailAction(email, person, company) {
  try {
    const actionType = determineEmailActionType(email);
    const salesStage = determineSalesStage(email);
    
    const actionData = {
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
        emailContext: 'significant_email',
        salesStage: salesStage,
        direction: email.from.includes('dano@retail-products.com') ? 'outbound' : 'inbound'
      },
      externalId: `email_${email.id}`,
      personId: person?.id || null,
      companyId: company?.id || null,
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
 * Determine email action type based on content, context, and direction
 */
function determineEmailActionType(email) {
  const subject = email.subject?.toLowerCase() || '';
  const body = email.body?.toLowerCase() || '';
  const from = email.from?.toLowerCase() || '';
  
  // Determine if Dano initiated the action or received it
  const isDanoInitiated = from.includes('dano@retail-products.com');
  
  // Check for specific sales context
  for (const [context, keywords] of Object.entries(EMAIL_SALES_CONTEXT)) {
    if (keywords.some(keyword => subject.includes(keyword) || body.includes(keyword))) {
      return isDanoInitiated ? context : `received_${context}`;
    }
  }
  
  // Default email types with direction
  if (subject.includes('re:') || body.includes('re:')) {
    return isDanoInitiated ? 'email_reply_sent' : 'email_reply_received';
  } else if (subject.includes('fw:') || body.includes('fw:')) {
    return isDanoInitiated ? 'email_forwarded' : 'email_forwarded_received';
  } else {
    return isDanoInitiated ? 'email_sent' : 'email_received';
  }
}

/**
 * Determine sales stage based on email content
 */
function determineSalesStage(email) {
  const subject = email.subject?.toLowerCase() || '';
  const body = email.body?.toLowerCase() || '';
  
  // Check for stage indicators
  for (const [stage, indicators] of Object.entries(SALES_STAGE_INDICATORS)) {
    if (indicators.some(indicator => 
      subject.includes(indicator) || body.includes(indicator)
    )) {
      return stage;
    }
  }
  
  // Default to lead stage if no clear indicators
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
