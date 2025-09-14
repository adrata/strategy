#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function checkNotaryEverydayContacts() {
  try {
    await prisma.$connect();
    console.log('🔍 CHECKING NOTARY EVERYDAY INC. CONTACTS\n');
    
    // Get the Notary Everyday Inc. account
    const notaryEverydayAccount = await prisma.$queryRaw`
      SELECT 
        acc.id,
        acc.name,
        acc.phone,
        acc.email,
        acc.website,
        acc."createdAt"
      FROM accounts acc
      WHERE acc.name = 'Notary Everyday Inc.'
    `;

    if (notaryEverydayAccount.length > 0) {
      const account = notaryEverydayAccount[0];
      console.log(`✅ Found account: ${account.name}`);
      console.log(`   Account ID: ${account.id}`);
      console.log(`   Phone: ${account.phone || 'N/A'}`);
      console.log(`   Email: ${account.email || 'N/A'}`);
      console.log(`   Website: ${account.website || 'N/A'}`);
      console.log(`   Created: ${account.createdAt}\n`);
      
      // Get contacts associated with this account
      const contacts = await prisma.$queryRaw`
        SELECT 
          c.id,
          c."firstName",
          c."lastName",
          c.email,
          c.phone,
          c."mobilePhone",
          c."workPhone",
          c."phone1",
          c."phone2",
          c."directDialPhone",
          c."jobTitle",
          c.department,
          c."createdAt"
        FROM contacts c
        WHERE c."accountId" = ${account.id}
        ORDER BY c."firstName", c."lastName"
      `;

      if (contacts.length > 0) {
        console.log(`Found ${contacts.length} contacts at Notary Everyday Inc.:\n`);
        contacts.forEach((contact, index) => {
          console.log(`${index + 1}. ${contact.firstName} ${contact.lastName}`);
          console.log(`   Job Title: ${contact.jobTitle || 'N/A'}`);
          console.log(`   Department: ${contact.department || 'N/A'}`);
          console.log(`   Email: ${contact.email || 'N/A'}`);
          console.log(`   Phone: ${contact.phone || 'N/A'}`);
          console.log(`   Mobile: ${contact.mobilePhone || 'N/A'}`);
          console.log(`   Work Phone: ${contact.workPhone || 'N/A'}`);
          console.log(`   Phone 1: ${contact.phone1 || 'N/A'}`);
          console.log(`   Phone 2: ${contact.phone2 || 'N/A'}`);
          console.log(`   Direct Dial: ${contact.directDialPhone || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('❌ No contacts found at Notary Everyday Inc.');
      }
    } else {
      console.log('❌ Notary Everyday Inc. account not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotaryEverydayContacts();
