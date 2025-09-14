#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function getDigitalTitlePhone() {
  try {
    await prisma.$connect();
    console.log('🔍 GETTING DIGITAL TITLE SOLUTIONS PHONE NUMBER\n');
    
    // Get Digital Title Solutions account details
    const digitalTitle = await prisma.$queryRaw`
      SELECT 
        acc.id,
        acc.name,
        acc.phone,
        acc.email,
        acc.website,
        acc."createdAt"
      FROM accounts acc
      WHERE acc.name = 'Digital Title Solutions'
    `;

    if (digitalTitle.length > 0) {
      const account = digitalTitle[0];
      console.log(`✅ Found: ${account.name}`);
      console.log(`   Account ID: ${account.id}`);
      console.log(`   Phone: ${account.phone || 'N/A'}`);
      console.log(`   Email: ${account.email || 'N/A'}`);
      console.log(`   Website: ${account.website || 'N/A'}`);
      console.log(`   Created: ${account.createdAt}`);
      
      if (account.phone) {
        console.log(`\n📞 Phone number available: ${account.phone}`);
        console.log('   This is who Dano called yesterday');
      } else {
        console.log(`\n❌ No phone number available`);
        console.log('   Need to find or add phone number to log the call');
      }
    } else {
      console.log('❌ Digital Title Solutions not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getDigitalTitlePhone();
