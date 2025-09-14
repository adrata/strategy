#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function checkOwenPhoneNumbers() {
  try {
    await prisma.$connect();
    console.log('🔍 CHECKING OWEN CONTACTS FOR PHONE NUMBERS\n');
    
    const owenContacts = await prisma.$queryRaw`
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
        acc.name as account_name
      FROM contacts c
      LEFT JOIN accounts acc ON c."accountId" = acc.id
      WHERE (
        c."firstName" ILIKE '%Owen%' 
        OR c."lastName" ILIKE '%Owen%'
        OR c.email ILIKE '%owen%'
      )
      ORDER BY c."firstName", c."lastName"
    `;

    if (owenContacts.length > 0) {
      console.log(`Found ${owenContacts.length} Owen contacts:\n`);
      owenContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.firstName} ${contact.lastName}`);
        console.log(`   Email: ${contact.email || 'N/A'}`);
        console.log(`   Phone: ${contact.phone || 'N/A'}`);
        console.log(`   Mobile: ${contact.mobilePhone || 'N/A'}`);
        console.log(`   Work Phone: ${contact.workPhone || 'N/A'}`);
        console.log(`   Phone 1: ${contact.phone1 || 'N/A'}`);
        console.log(`   Phone 2: ${contact.phone2 || 'N/A'}`);
        console.log(`   Direct Dial: ${contact.directDialPhone || 'N/A'}`);
        console.log(`   Account: ${contact.account_name || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No Owen contacts found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOwenPhoneNumbers();
