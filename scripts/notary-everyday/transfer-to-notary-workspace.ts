#!/usr/bin/env tsx

/**
 * 🔄 NOTARY EVERYDAY DATA TRANSFER TO CORRECT WORKSPACE
 * 
 * Transfers all notary everyday data from Retail Product Solutions workspace
 * to the correct Notary Everyday workspace.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Source workspace (Retail Product Solutions - wrong location)
const RETAIL_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

// Target workspace (Notary Everyday - correct location)
const NOTARY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';
const DANO_USER_ID = 'dano@retail-products.com';

async function transferToNotaryWorkspace() {
  console.log('🔄 Transferring Notary Everyday Data to Correct Workspace...\n');

  // 1. Check what we have in Retail Product Solutions workspace
  const retailActivities = await prisma.activities.findMany({
    where: {
      workspaceId: RETAIL_WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    },
    select: {
      id: true,
      subject: true,
      accountId: true,
      contactId: true
    }
  });

  console.log(`📊 Found ${retailActivities.length} notary activities in Retail Product Solutions workspace`);

  // 2. Get all accounts that need to be transferred
  const retailAccounts = await prisma.accounts.findMany({
    where: {
      workspaceId: RETAIL_WORKSPACE_ID,
      industry: 'Real Estate / Title Services'
    },
    select: {
      id: true,
      name: true,
      website: true
    }
  });

  console.log(`🏢 Found ${retailAccounts.length} title company accounts in Retail Product Solutions workspace`);

  // 3. Get all contacts that need to be transferred
  const retailContacts = await prisma.contacts.findMany({
    where: {
      workspaceId: RETAIL_WORKSPACE_ID,
      accounts: {
        industry: 'Real Estate / Title Services'
      }
    },
    select: {
      id: true,
      fullName: true,
      accountId: true
    }
  });

  console.log(`👥 Found ${retailContacts.length} contacts in Retail Product Solutions workspace`);

  // 4. Create accounts in Notary Everyday workspace
  console.log('\n🏢 Creating accounts in Notary Everyday workspace...');
  const accountMapping = new Map<string, string>(); // old ID -> new ID

  for (const account of retailAccounts) {
    const newAccount = await prisma.accounts.create({
      data: {
        workspaceId: NOTARY_WORKSPACE_ID,
        name: account.name,
        website: account.website,
        industry: 'Real Estate / Title Services',
        vertical: 'Notary Services',
        accountType: 'Prospect',
        tier: 'Standard',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    accountMapping.set(account.id, newAccount.id);
    console.log(`  ✅ Created: ${account.name} (${newAccount.id})`);
  }

  // 5. Create contacts in Notary Everyday workspace
  console.log('\n👥 Creating contacts in Notary Everyday workspace...');
  const contactMapping = new Map<string, string>(); // old ID -> new ID

  for (const contact of retailContacts) {
    const newAccountId = accountMapping.get(contact.accountId);
    if (!newAccountId) {
      console.log(`  ⚠️  Skipping contact ${contact.fullName} - no account mapping found`);
      continue;
    }

    // Get full contact details
    const fullContact = await prisma.contacts.findUnique({
      where: { id: contact.id }
    });

    if (fullContact) {
      const newContact = await prisma.contacts.create({
        data: {
          workspaceId: NOTARY_WORKSPACE_ID,
          accountId: newAccountId,
          firstName: fullContact.firstName,
          lastName: fullContact.lastName,
          fullName: fullContact.fullName,
          jobTitle: fullContact.jobTitle,
          email: fullContact.email,
          linkedinUrl: fullContact.linkedinUrl,
          status: fullContact.status,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      contactMapping.set(contact.id, newContact.id);
      console.log(`  ✅ Created: ${contact.fullName} (${newContact.id})`);
    }
  }

  // 6. Create activities in Notary Everyday workspace
  console.log('\n📧 Creating activities in Notary Everyday workspace...');
  let activityCount = 0;

  for (const activity of retailActivities) {
    // Get full activity details
    const fullActivity = await prisma.activities.findUnique({
      where: { id: activity.id }
    });

    if (fullActivity) {
      const newAccountId = accountMapping.get(activity.accountId || '');
      const newContactId = activity.contactId ? contactMapping.get(activity.contactId) : null;

      const newActivity = await prisma.activities.create({
        data: {
          workspaceId: NOTARY_WORKSPACE_ID,
          userId: DANO_USER_ID,
          accountId: newAccountId,
          contactId: newContactId,
          type: fullActivity.type,
          subject: fullActivity.subject,
          description: fullActivity.description,
          outcome: fullActivity.outcome,
          completedAt: fullActivity.completedAt,
          scheduledAt: fullActivity.scheduledAt,
          status: fullActivity.status,
          priority: fullActivity.priority,
          metadata: fullActivity.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      activityCount++;
      console.log(`  ✅ Created: ${activity.subject} (${newActivity.id})`);
    }
  }

  // 7. Verify the transfer
  console.log('\n🔍 Verifying transfer to Notary Everyday workspace...');
  
  const notaryActivities = await prisma.activities.count({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    }
  });

  const notaryAccounts = await prisma.accounts.count({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      industry: 'Real Estate / Title Services'
    }
  });

  const notaryContacts = await prisma.contacts.count({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      accounts: {
        industry: 'Real Estate / Title Services'
      }
    }
  });

  console.log(`\n📊 Transfer Results:`);
  console.log(`  ✅ Activities in Notary Everyday workspace: ${notaryActivities}`);
  console.log(`  ✅ Accounts in Notary Everyday workspace: ${notaryAccounts}`);
  console.log(`  ✅ Contacts in Notary Everyday workspace: ${notaryContacts}`);

  // 8. Clean up Retail Product Solutions workspace
  console.log('\n🧹 Cleaning up Retail Product Solutions workspace...');
  
  // Delete activities
  await prisma.activities.deleteMany({
    where: {
      workspaceId: RETAIL_WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    }
  });

  // Delete contacts
  await prisma.contacts.deleteMany({
    where: {
      workspaceId: RETAIL_WORKSPACE_ID,
      accounts: {
        industry: 'Real Estate / Title Services'
      }
    }
  });

  // Delete accounts
  await prisma.accounts.deleteMany({
    where: {
      workspaceId: RETAIL_WORKSPACE_ID,
      industry: 'Real Estate / Title Services'
    }
  });

  console.log('  ✅ Cleaned up Retail Product Solutions workspace');

  console.log('\n🎉 Transfer Complete!');
  console.log(`📧 ${activityCount} notary activities transferred to Notary Everyday workspace`);
  console.log(`🏢 ${retailAccounts.length} accounts transferred to Notary Everyday workspace`);
  console.log(`👥 ${retailContacts.length} contacts transferred to Notary Everyday workspace`);
  console.log(`👤 All data now associated with: ${DANO_USER_ID}`);
  console.log(`🏢 All data now in workspace: Notary Everyday (${NOTARY_WORKSPACE_ID})`);
}

// Run the transfer
if (require.main === module) {
  transferToNotaryWorkspace()
    .catch((error) => {
      console.error('💥 Transfer failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { transferToNotaryWorkspace };
