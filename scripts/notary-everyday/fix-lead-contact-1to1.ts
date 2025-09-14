#!/usr/bin/env tsx

/**
 * 🔗 FIX LEAD-CONTACT 1:1 RELATIONSHIP
 * 
 * Ensures every lead has a corresponding contact and vice versa
 * in the Notary Everyday workspace for Dano.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NOTARY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB'; // Dano's user ID

async function fixLeadContactRelationship() {
  console.log('🔗 Fixing Lead-Contact 1:1 Relationship for Dano...\n');

  // 1. Get all leads without contacts
  const leadsWithoutContacts = await prisma.leads.findMany({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      assignedUserId: DANO_USER_ID,
      personId: null
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      workEmail: true,
      personalEmail: true,
      phone: true,
      mobilePhone: true,
      workPhone: true,
      jobTitle: true,
      title: true,
      company: true,
      linkedinUrl: true
    }
  });

  console.log(`📊 Found ${leadsWithoutContacts.length} leads without contacts`);

  // 2. Get all contacts without leads
  const contactsWithoutLeads = await prisma.contacts.findMany({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      assignedUserId: DANO_USER_ID,
      personId: null
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      workEmail: true,
      personalEmail: true,
      phone: true,
      mobilePhone: true,
      workPhone: true,
      jobTitle: true,
      linkedinUrl: true,
      accountId: true
    }
  });

  console.log(`📊 Found ${contactsWithoutLeads.length} contacts without leads`);

  // 3. Create contacts for leads that don't have them
  console.log('\n👥 Creating contacts for leads without contacts...');
  let contactsCreated = 0;

  for (const lead of leadsWithoutContacts) {
    // Find the account for this lead's company
    let accountId = null;
    if (lead.company) {
      const account = await prisma.accounts.findFirst({
        where: {
          workspaceId: NOTARY_WORKSPACE_ID,
          assignedUserId: DANO_USER_ID,
          name: {
            contains: lead.company,
            mode: 'insensitive'
          }
        },
        select: { id: true }
      });
      accountId = account?.id || null;
    }

    // Create contact
    const contact = await prisma.contacts.create({
      data: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        accountId: accountId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        fullName: lead.fullName,
        email: lead.email || lead.workEmail || lead.personalEmail,
        workEmail: lead.workEmail,
        personalEmail: lead.personalEmail,
        phone: lead.phone,
        mobilePhone: lead.mobilePhone,
        workPhone: lead.workPhone,
        jobTitle: lead.jobTitle || lead.title,
        linkedinUrl: lead.linkedinUrl,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update lead to connect to the contact
    await prisma.leads.update({
      where: { id: lead.id },
      data: { 
        personId: contact.id,
        updatedAt: new Date()
      }
    });

    contactsCreated++;
    console.log(`  ✅ Created contact for lead: ${lead.fullName}`);
  }

  // 4. Create leads for contacts that don't have them
  console.log('\n📋 Creating leads for contacts without leads...');
  let leadsCreated = 0;

  for (const contact of contactsWithoutLeads) {
    // Get the account name for this contact
    let companyName = null;
    if (contact.accountId) {
      const account = await prisma.accounts.findUnique({
        where: { id: contact.accountId },
        select: { name: true }
      });
      companyName = account?.name || null;
    }

    // Create lead
    const lead = await prisma.leads.create({
      data: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        personId: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        fullName: contact.fullName,
        email: contact.email,
        workEmail: contact.workEmail,
        personalEmail: contact.personalEmail,
        phone: contact.phone,
        mobilePhone: contact.mobilePhone,
        workPhone: contact.workPhone,
        jobTitle: contact.jobTitle,
        company: companyName,
        linkedinUrl: contact.linkedinUrl,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    leadsCreated++;
    console.log(`  ✅ Created lead for contact: ${contact.fullName}`);
  }

  // 5. Verify the 1:1 relationship
  console.log('\n🔍 Verifying 1:1 relationship...');
  
  const finalLeads = await prisma.leads.count({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      assignedUserId: DANO_USER_ID
    }
  });

  const finalContacts = await prisma.contacts.count({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      assignedUserId: DANO_USER_ID
    }
  });

  const leadsWithContacts = await prisma.leads.count({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      assignedUserId: DANO_USER_ID,
      personId: { not: null }
    }
  });

  const contactsWithLeads = await prisma.contacts.count({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      assignedUserId: DANO_USER_ID,
      personId: { not: null }
    }
  });

  console.log(`\n📊 Final Results:`);
  console.log(`  • Total Leads: ${finalLeads}`);
  console.log(`  • Total Contacts: ${finalContacts}`);
  console.log(`  • Leads with Contacts: ${leadsWithContacts} (${Math.round((leadsWithContacts/finalLeads)*100)}%)`);
  console.log(`  • Contacts with Leads: ${contactsWithLeads} (${Math.round((contactsWithLeads/finalContacts)*100)}%)`);
  console.log(`  • Contacts Created: ${contactsCreated}`);
  console.log(`  • Leads Created: ${leadsCreated}`);

  if (finalLeads === finalContacts && leadsWithContacts === finalLeads) {
    console.log('\n🎉 SUCCESS: Perfect 1:1 lead-contact relationship achieved!');
  } else {
    console.log('\n⚠️  Still some mismatches - may need manual review');
  }

  console.log('\n✅ Lead-Contact 1:1 relationship fix complete!');
}

// Run the fix
if (require.main === module) {
  fixLeadContactRelationship()
    .catch((error) => {
      console.error('💥 Fix failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { fixLeadContactRelationship };
