#!/usr/bin/env node

/**
 * 🔍 INVESTIGATE OWEN & DIGITAL TITLE RELATIONSHIP
 * 
 * Find out:
 * 1. Is Owen a contact at Digital Title account?
 * 2. Are they separate entities?
 * 3. What phone numbers do we have?
 * 4. Who exactly did Dano call?
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function investigateOwenAndDigitalTitle() {
  console.log('🔍 INVESTIGATING OWEN & DIGITAL TITLE RELATIONSHIP');
  console.log('==================================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    // 1. Search for contacts named Owen
    console.log('1️⃣ SEARCHING FOR CONTACTS NAMED OWEN');
    console.log('-------------------------------------');
    
    const owenContacts = await prisma.$queryRaw`
      SELECT 
        c.id,
        c."firstName",
        c."lastName",
        c.email,
        c.phone,
        c."mobilePhone",
        c."workPhone",
        c."accountId",
        c."assignedUserId",
        c."createdAt",
        c."updatedAt",
        acc.name as account_name,
        acc.id as account_id
      FROM contacts c
      LEFT JOIN accounts acc ON c."accountId" = acc.id
      WHERE (
        c."firstName" ILIKE '%Owen%' 
        OR c."lastName" ILIKE '%Owen%'
        OR c.email ILIKE '%owen%'
      )
      ORDER BY c."updatedAt" DESC
    `;

    if (owenContacts.length > 0) {
      console.log(`✅ Found ${owenContacts.length} contacts named Owen:`);
      owenContacts.forEach((contact, index) => {
        console.log(`\n   ${index + 1}. ${contact.firstName} ${contact.lastName}`);
        console.log(`      Email: ${contact.email || 'N/A'}`);
        console.log(`      Phone: ${contact.phone || 'N/A'}`);
        console.log(`      Mobile: ${contact.mobilePhone || 'N/A'}`);
        console.log(`      Work Phone: ${contact.workPhone || 'N/A'}`);
        if (contact.account_name) {
          console.log(`      Account: ${contact.account_name} (ID: ${contact.account_id})`);
        }
        console.log(`      Created: ${contact.createdAt}`);
      });
    } else {
      console.log('❌ No contacts named Owen found');
    }

    // 2. Search for Digital Title account
    console.log('\n2️⃣ SEARCHING FOR DIGITAL TITLE ACCOUNT');
    console.log('----------------------------------------');
    
    const digitalTitleAccounts = await prisma.$queryRaw`
      SELECT 
        acc.id,
        acc.name,
        acc."companyType",
        acc.phone,
        acc."mobilePhone",
        acc.email,
        acc.website,
        acc."createdAt",
        acc."updatedAt"
      FROM accounts acc
      WHERE acc.name ILIKE '%Digital Title%'
      ORDER BY acc."updatedAt" DESC
    `;

    if (digitalTitleAccounts.length > 0) {
      console.log(`✅ Found ${digitalTitleAccounts.length} Digital Title accounts:`);
      digitalTitleAccounts.forEach((account, index) => {
        console.log(`\n   ${index + 1}. ${account.name}`);
        console.log(`      Company Type: ${account.companyType || 'N/A'}`);
        console.log(`      Phone: ${account.phone || 'N/A'}`);
        console.log(`      Mobile: ${account.mobilePhone || 'N/A'}`);
        console.log(`      Email: ${account.email || 'N/A'}`);
        console.log(`      Website: ${account.website || 'N/A'}`);
        console.log(`      Created: ${account.createdAt}`);
      });
    } else {
      console.log('❌ No Digital Title accounts found');
    }

    // 3. Check if Owen is associated with Digital Title
    console.log('\n3️⃣ CHECKING OWEN + DIGITAL TITLE RELATIONSHIP');
    console.log('-----------------------------------------------');
    
    if (owenContacts.length > 0 && digitalTitleAccounts.length > 0) {
      const owenAtDigitalTitle = owenContacts.filter(contact => 
        contact.account_id && digitalTitleAccounts.some(acc => acc.id === contact.account_id)
      );
      
      if (owenAtDigitalTitle.length > 0) {
        console.log('✅ Owen IS associated with Digital Title account:');
        owenAtDigitalTitle.forEach((contact, index) => {
          const account = digitalTitleAccounts.find(acc => acc.id === contact.account_id);
          console.log(`\n   ${index + 1}. ${contact.firstName} ${contact.lastName} at ${account.name}`);
          console.log(`      Contact ID: ${contact.id}`);
          console.log(`      Account ID: ${contact.account_id}`);
          console.log(`      Phone: ${contact.phone || contact.mobilePhone || contact.workPhone || 'N/A'}`);
        });
      } else {
        console.log('❌ Owen is NOT associated with Digital Title account');
        console.log('   They appear to be separate entities');
      }
    }

    // 4. Search for any leads related to Digital Title
    console.log('\n4️⃣ SEARCHING FOR DIGITAL TITLE LEADS');
    console.log('--------------------------------------');
    
    const digitalTitleLeads = await prisma.$queryRaw`
      SELECT 
        l.id,
        l.company,
        l."companyType",
        l.phone,
        l.email,
        l.website,
        l."createdAt",
        l."updatedAt"
      FROM leads l
      WHERE l.company ILIKE '%Digital Title%'
      ORDER BY l."updatedAt" DESC
    `;

    if (digitalTitleLeads.length > 0) {
      console.log(`✅ Found ${digitalTitleLeads.length} Digital Title leads:`);
      digitalTitleLeads.forEach((lead, index) => {
        console.log(`\n   ${index + 1}. ${lead.company}`);
        console.log(`      Company Type: ${lead.companyType || 'N/A'}`);
        console.log(`      Phone: ${lead.phone || 'N/A'}`);
        console.log(`      Email: ${lead.email || 'N/A'}`);
        console.log(`      Website: ${lead.website || 'N/A'}`);
        console.log(`      Created: ${lead.createdAt}`);
      });
    } else {
      console.log('❌ No Digital Title leads found');
    }

    // 5. Check for any recent activities involving these entities
    console.log('\n5️⃣ CHECKING RECENT ACTIVITIES INVOLVING OWEN/DIGITAL TITLE');
    console.log('----------------------------------------------------------------');
    
    const recentActivities = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.type,
        a.subject,
        a.description,
        a."createdAt",
        a."userId",
        a."accountId",
        a."contactId",
        a."leadId",
        u."firstName" as user_first_name,
        u."lastName" as user_last_name
      FROM activities a
      LEFT JOIN users u ON a."userId" = u.id
      WHERE (
        a."accountId" IN (SELECT id FROM accounts WHERE name ILIKE '%Digital Title%')
        OR a."contactId" IN (SELECT id FROM contacts WHERE "firstName" ILIKE '%Owen%' OR "lastName" ILIKE '%Owen%')
        OR a."leadId" IN (SELECT id FROM leads WHERE company ILIKE '%Digital Title%')
      )
      ORDER BY a."createdAt" DESC
      LIMIT 10
    `;

    if (recentActivities.length > 0) {
      console.log(`✅ Found ${recentActivities.length} recent activities involving Owen/Digital Title:`);
      recentActivities.forEach((activity, index) => {
        console.log(`\n   ${index + 1}. ${activity.type} - ${activity.subject}`);
        console.log(`      User: ${activity.user_first_name} ${activity.user_last_name}`);
        console.log(`      Date: ${activity.createdAt}`);
        if (activity.description) console.log(`      Description: ${activity.description}`);
      });
    } else {
      console.log('❌ No recent activities found involving Owen/Digital Title');
    }

    console.log('\n🔍 SUMMARY & RECOMMENDATIONS');
    console.log('=============================');
    console.log(`• Owen contacts found: ${owenContacts.length}`);
    console.log(`• Digital Title accounts found: ${digitalTitleAccounts.length}`);
    console.log(`• Digital Title leads found: ${digitalTitleLeads.length}`);
    console.log(`• Recent activities found: ${recentActivities.length}`);
    
    if (owenContacts.length === 0) {
      console.log('\n⚠️  RECOMMENDATION: Owen contact not found - may need to create');
    }
    if (digitalTitleAccounts.length === 0) {
      console.log('\n⚠️  RECOMMENDATION: Digital Title account not found - may need to create');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database connection closed');
  }
}

investigateOwenAndDigitalTitle();
