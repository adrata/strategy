#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function checkNotaryEveryday() {
  try {
    await prisma.$connect();
    console.log('🔍 CHECKING FOR NOTARY EVERYDAY\n');
    
    // Search accounts
    const notaryAccounts = await prisma.$queryRaw`
      SELECT 
        acc.id,
        acc.name,
        acc.phone,
        acc.email,
        acc.website,
        acc."createdAt"
      FROM accounts acc
      WHERE acc.name ILIKE '%Notary%'
      ORDER BY acc.name
    `;

    console.log(`Found ${notaryAccounts.length} accounts with "Notary" in name:\n`);
    notaryAccounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.name}`);
      console.log(`   Phone: ${account.phone || 'N/A'}`);
      console.log(`   Email: ${account.email || 'N/A'}`);
      console.log(`   Website: ${account.website || 'N/A'}`);
      console.log('');
    });

    // Search leads
    const notaryLeads = await prisma.$queryRaw`
      SELECT 
        l.id,
        l.company,
        l.phone,
        l.email,
        l."createdAt"
      FROM leads l
      WHERE l.company ILIKE '%Notary%'
      ORDER BY l.company
    `;

    console.log(`Found ${notaryLeads.length} leads with "Notary" in name:\n`);
    notaryLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.company}`);
      console.log(`   Phone: ${lead.phone || 'N/A'}`);
      console.log(`   Email: ${lead.email || 'N/A'}`);
      console.log(`   Created: ${lead.createdAt}`);
      console.log('');
    });

    // Search contacts with "Notary" in name
    const notaryContacts = await prisma.$queryRaw`
      SELECT 
        c.id,
        c."firstName",
        c."lastName",
        c.email,
        c.phone,
        c."mobilePhone",
        c."workPhone",
        acc.name as account_name
      FROM contacts c
      LEFT JOIN accounts acc ON c."accountId" = acc.id
      WHERE (
        c."firstName" ILIKE '%Notary%' 
        OR c."lastName" ILIKE '%Notary%'
        OR c.email ILIKE '%notary%'
      )
      ORDER BY c."firstName", c."lastName"
    `;

    console.log(`Found ${notaryContacts.length} contacts with "Notary" in name:\n`);
    notaryContacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.firstName} ${contact.lastName}`);
      console.log(`   Email: ${contact.email || 'N/A'}`);
      console.log(`   Phone: ${contact.phone || 'N/A'}`);
      console.log(`   Mobile: ${contact.mobilePhone || 'N/A'}`);
      console.log(`   Work Phone: ${contact.workPhone || 'N/A'}`);
      console.log(`   Account: ${contact.account_name || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotaryEveryday();
