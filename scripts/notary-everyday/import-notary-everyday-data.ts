#!/usr/bin/env tsx

/**
 * 📧 NOTARY EVERYDAY DATA IMPORT SCRIPT
 * 
 * Imports notary everyday email activities into the activities table
 * with proper linking to accounts, contacts, and prospects.
 * 
 * This script ensures all email outreach activities are properly tracked
 * and associated with the correct records for accurate reporting.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dan's workspace ID for notary everyday data
const WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
const USER_ID = 'dan@adrata.com'; // Dan's user ID

interface NotaryEverydayRecord {
  company: string;
  website?: string;
  contactName?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactLinkedIn?: string;
  action: string;
  source: string;
  notes?: string;
  date: string;
}

// Parsed notary everyday data
const notaryEverydayData: NotaryEverydayRecord[] = [
  // 9/3 Email activities
  {
    company: "AMS Title Agency & Escrow, LLC",
    website: "https://amstitleagency.com",
    contactName: "Bruce",
    contactTitle: "CEO",
    contactLinkedIn: "AMS Title Agency & Escrow LLC | Sales Navigator",
    action: "9/3 Email 1 Bruce",
    source: "Sales Navigator",
    date: "2024-09-03"
  },
  {
    company: "ACES Title Agency",
    website: "https://aces.com",
    contactName: "Kosta Ligris",
    contactTitle: "CEO",
    contactEmail: "kligris@ligris.com",
    contactLinkedIn: "ACES Title Agency | Sales Navigator",
    action: "9/3 Email 1 Kosta (CEO)",
    source: "Sales Navigator",
    date: "2024-09-03"
  },
  {
    company: "Sky Title, LLC",
    website: "https://skytitle.com",
    contactName: "Rob",
    contactTitle: "CEO",
    contactEmail: "rob@skytitle.com",
    contactLinkedIn: "Sky Title, LLC | Sales Navigator",
    action: "9/3 Email 1 Rob (CEO)",
    source: "Sales Navigator",
    date: "2024-09-03"
  },
  {
    company: "Florida Title, LLC",
    website: "https://floridatitle.com",
    contactName: "Joseph Bowen",
    contactTitle: "CEO",
    contactEmail: "jbowen@yourfloridatitle.com",
    contactLinkedIn: "Joseph Bowen | Sales Navigator",
    action: "9/3 Email 1 Joseph",
    source: "Sales Navigator",
    date: "2024-09-03"
  },
  {
    company: "Propy Inc.",
    website: "https://propytitle.com",
    contactName: "Ashley",
    contactTitle: "CEO",
    contactEmail: "ashley@propytitle.com",
    contactLinkedIn: "Propy Inc. | Sales Navigator",
    action: "9/3 Email 1 Ashley",
    source: "Sales Navigator",
    date: "2024-09-03"
  },
  
  // 9/4 Email activities
  {
    company: "BHHS Florida Realty",
    website: "https://bhhsfloridarealty.com",
    contactLinkedIn: "BHHS Florida Realty | Sales Navigator",
    action: "9/4 Email 1",
    source: "Adrata",
    notes: "Using Florida Title & Guarantee Agency",
    date: "2024-09-04"
  },
  {
    company: "Florida Title & Guarantee Agency",
    website: "https://ftgagency.com",
    contactName: "Shari Roll",
    contactTitle: "Director of Operations",
    contactEmail: "shariroll@ftgagency.com",
    contactLinkedIn: "Shari Roll | Sales Navigator",
    action: "9/4 Email 1 Shari",
    source: "Was on BHHS website",
    date: "2024-09-04"
  },
  {
    company: "Brightline Title, LLC",
    website: "https://brightlinetitle.com",
    contactName: "Alison Nazarowski",
    contactTitle: "Owner",
    contactEmail: "alison@brightlinetitle.com",
    contactLinkedIn: "Alison Nazarowski | Sales Navigator",
    action: "9/4 Email 1 Alison",
    source: "Adrata",
    date: "2024-09-04"
  },
  {
    company: "BrokerNation Real Estate",
    website: "https://brokernation.net",
    contactName: "Armando Romero",
    contactTitle: "President CEO",
    contactEmail: "armando@brokernation.net",
    contactLinkedIn: "Armando Romero | Sales Navigator",
    action: "9/4 Email 1 Armondo",
    source: "Adrata",
    notes: "Website says Title handled in house",
    date: "2024-09-04"
  },
  {
    company: "TitleWave Real Estate Solutions",
    website: "https://titlewave.com",
    contactName: "Leanne Zinn",
    contactTitle: "President",
    contactLinkedIn: "Leanne Zinn | Sales Navigator",
    action: "9/4 Email 1",
    source: "Adrata",
    notes: "Need to Navigator as email not present",
    date: "2024-09-04"
  },
  {
    company: "Professional Title Agency",
    website: "https://professionaltitle.com",
    contactName: "Tami Sturdevant",
    contactTitle: "Director of Operations",
    contactEmail: "tsturdevant@professionaltitle.com",
    contactLinkedIn: "Tami Sturdevant | Sales Navigator",
    action: "9/4 Email 1 Tami",
    source: "Adrata",
    date: "2024-09-04"
  },
  {
    company: "reQuire Real Estate Solutions, LLC",
    website: "https://gorequire.com",
    contactName: "Randy Cruz",
    contactTitle: "Business Service Manager",
    contactEmail: "rcruz@gorequire.com",
    contactLinkedIn: "Randy Cruz | Sales Navigator",
    action: "9/4 Email 1 Randy",
    source: "Adrata",
    date: "2024-09-04"
  },
  {
    company: "Robert Slack LLC",
    website: "https://robertslack.com",
    action: "9/4 Email 1",
    source: "Adrata",
    notes: "Says they use Florida Title LLC on website",
    date: "2024-09-04"
  },
  {
    company: "Sun National Title Company",
    website: "https://closewithsun.com",
    contactName: "Dennis Egan",
    contactTitle: "President",
    contactEmail: "dennis@closewithsun.com",
    contactLinkedIn: "Dennis Egan | Sales Navigator",
    action: "9/4 Email 1 Dennis",
    source: "Adrata",
    date: "2024-09-04"
  },
  {
    company: "The Closing Agent, Inc.",
    website: "https://theclosingagent.com",
    contactName: "Barry Miller",
    contactTitle: "President",
    contactEmail: "barry@theclosingagent.com",
    contactLinkedIn: "Barry Miller | Sales Navigator",
    action: "9/4 Email 1 Barry",
    source: "Adrata",
    date: "2024-09-04"
  },
  {
    company: "Magnolia Title - Florida",
    website: "https://magnoliatitle.com",
    contactName: "Niccole Sprague",
    contactTitle: "Owner",
    contactLinkedIn: "Niccole Sprague | Sales Navigator",
    action: "9/4 Email 1",
    source: "Adrata",
    notes: "Need to use Navigator",
    date: "2024-09-04"
  },
  {
    company: "Somers Title Company",
    website: "https://somerstitle.com",
    contactName: "Edina McGuire",
    contactTitle: "Title Processor",
    contactEmail: "edina@somerstitle.com",
    contactLinkedIn: "Edina McGuire | Sales Navigator",
    action: "9/4 Email 1 Edina",
    source: "Adrata",
    notes: "Had a Notary business",
    date: "2024-09-04"
  },
  {
    company: "The Closing Team",
    website: "https://closingteamfl.com",
    contactName: "Nicole Montgomery",
    contactTitle: "Senior Title Processor",
    contactEmail: "nicole@closingteamfl.com",
    contactLinkedIn: "Nicole Montgomery | Sales Navigator",
    action: "9/4 Email 1 Nicole",
    source: "Adrata",
    date: "2024-09-04"
  },
  {
    company: "The TRES Group",
    website: "https://thetresgroup.com",
    contactName: "Adam Lohmann",
    contactTitle: "CEO",
    contactEmail: "adam@thetresgroup.com",
    contactLinkedIn: "Adam Lohmann, Esq. | Sales Navigator",
    action: "9/4 Email 1 Adam",
    source: "Adrata",
    date: "2024-09-04"
  }
];

async function findOrCreateAccount(companyName: string, website?: string) {
  // First try to find existing account
  let account = await prisma.accounts.findFirst({
    where: {
      workspaceId: WORKSPACE_ID,
      name: {
        contains: companyName,
        mode: 'insensitive'
      }
    }
  });

  // If not found, create new account
  if (!account) {
    account = await prisma.accounts.create({
      data: {
        workspaceId: WORKSPACE_ID,
        name: companyName,
        website: website,
        industry: 'Real Estate / Title Services',
        vertical: 'Notary Services',
        accountType: 'Prospect',
        tier: 'Standard',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Created new account: ${companyName}`);
  } else {
    console.log(`📋 Found existing account: ${companyName}`);
  }

  return account;
}

async function findOrCreateContact(
  contactName: string,
  contactTitle?: string,
  contactEmail?: string,
  contactLinkedIn?: string,
  accountId: string
) {
  if (!contactName) return null;

  // First try to find existing contact
  let contact = await prisma.contacts.findFirst({
    where: {
      workspaceId: WORKSPACE_ID,
      fullName: {
        contains: contactName,
        mode: 'insensitive'
      }
    }
  });

  // If not found, create new contact
  if (!contact) {
    contact = await prisma.contacts.create({
      data: {
        workspaceId: WORKSPACE_ID,
        accountId: accountId,
        firstName: contactName.split(' ')[0] || contactName,
        lastName: contactName.split(' ').slice(1).join(' ') || '',
        fullName: contactName,
        jobTitle: contactTitle || 'Unknown Title',
        email: contactEmail,
        linkedinUrl: contactLinkedIn,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Created new contact: ${contactName}`);
  } else {
    console.log(`📋 Found existing contact: ${contactName}`);
  }

  return contact;
}

async function createActivity(record: NotaryEverydayRecord, accountId: string, contactId?: string) {
  const activityDate = new Date(record.date);
  
  // Determine activity type based on action
  let activityType = 'notary_email_outreach';
  if (record.action.includes('Email 1')) {
    activityType = 'notary_email_initial';
  }

  const activity = await prisma.activities.create({
    data: {
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      accountId: accountId,
      contactId: contactId,
      type: activityType,
      subject: `${record.action} - ${record.company}`,
      description: [
        `Company: ${record.company}`,
        record.contactName ? `Contact: ${record.contactName}` : '',
        record.contactTitle ? `Title: ${record.contactTitle}` : '',
        record.contactEmail ? `Email: ${record.contactEmail}` : '',
        record.website ? `Website: ${record.website}` : '',
        record.contactLinkedIn ? `LinkedIn: ${record.contactLinkedIn}` : '',
        `Source: ${record.source}`,
        record.notes ? `Notes: ${record.notes}` : ''
      ].filter(Boolean).join('\n'),
      outcome: 'completed',
      completedAt: activityDate,
      scheduledAt: activityDate,
      status: 'completed',
      priority: 'normal',
      metadata: {
        source: record.source,
        action: record.action,
        website: record.website,
        linkedin: record.contactLinkedIn,
        notes: record.notes
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log(`📧 Created activity: ${record.action} for ${record.company}`);
  return activity;
}

async function importNotaryEverydayData() {
  console.log('🚀 Starting Notary Everyday Data Import...');
  console.log(`📊 Processing ${notaryEverydayData.length} records`);

  let successCount = 0;
  let errorCount = 0;

  for (const record of notaryEverydayData) {
    try {
      console.log(`\n🔄 Processing: ${record.company}`);
      
      // Find or create account
      const account = await findOrCreateAccount(record.company, record.website);
      
      // Find or create contact if contact name exists
      let contact = null;
      if (record.contactName) {
        contact = await findOrCreateContact(
          record.contactName,
          record.contactTitle,
          record.contactEmail,
          record.contactLinkedIn,
          account.id
        );
      }
      
      // Create activity
      await createActivity(record, account.id, contact?.id);
      
      successCount++;
    } catch (error) {
      console.error(`❌ Error processing ${record.company}:`, error);
      errorCount++;
    }
  }

  console.log('\n🎉 Import Complete!');
  console.log(`✅ Successfully processed: ${successCount} records`);
  console.log(`❌ Errors: ${errorCount} records`);
  
  // Show summary
  const totalActivities = await prisma.activities.count({
    where: {
      workspaceId: WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    }
  });
  
  console.log(`📊 Total notary activities in database: ${totalActivities}`);
}

// Run the import
if (require.main === module) {
  importNotaryEverydayData()
    .catch((error) => {
      console.error('💥 Import failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { importNotaryEverydayData };
