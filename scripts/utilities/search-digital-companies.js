#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function searchDigitalCompanies() {
  try {
    await prisma.$connect();
    console.log('🔍 SEARCHING FOR COMPANIES WITH "DIGITAL" IN NAME\n');
    
    // Search accounts
    const digitalAccounts = await prisma.$queryRaw`
      SELECT 
        acc.id,
        acc.name,
        acc.phone,
        acc.email,
        acc.website,
        acc."createdAt"
      FROM accounts acc
      WHERE acc.name ILIKE '%Digital%'
      ORDER BY acc.name
    `;

    console.log(`Found ${digitalAccounts.length} accounts with "Digital" in name:\n`);
    digitalAccounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.name}`);
      console.log(`   Phone: ${account.phone || 'N/A'}`);
      console.log(`   Email: ${account.email || 'N/A'}`);
      console.log(`   Website: ${account.website || 'N/A'}`);
      console.log('');
    });

    // Search leads
    const digitalLeads = await prisma.$queryRaw`
      SELECT 
        l.id,
        l.company,
        l.phone,
        l.email,
        l.website,
        l."createdAt"
      FROM leads l
      WHERE l.company ILIKE '%Digital%'
      ORDER BY l.company
    `;

    console.log(`Found ${digitalLeads.length} leads with "Digital" in name:\n`);
    digitalLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.company}`);
      console.log(`   Phone: ${lead.phone || 'N/A'}`);
      console.log(`   Email: ${lead.email || 'N/A'}`);
      console.log(`   Website: ${lead.website || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

searchDigitalCompanies();
