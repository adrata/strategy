#!/usr/bin/env node

/**
 * 🔍 BROADER ACTIVITY SEARCH
 * 
 * Search for:
 * 1. All activities from the last few days
 * 2. Any mentions of Owen or Digital Title
 * 3. Check different date formats and timezones
 * 4. Look for any call-related activities
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function broaderActivitySearch() {
  console.log('🔍 BROADER ACTIVITY SEARCH');
  console.log('==========================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Check what workspaces we have
    console.log('1️⃣ CHECKING WORKSPACES');
    console.log('----------------------');
    
    const workspaces = await prisma.$queryRaw`
      SELECT id, name, "createdAt" 
      FROM workspaces 
      ORDER BY "createdAt" DESC
    `;
    
    console.log(`Found ${workspaces.length} workspaces:`);
    workspaces.forEach((ws, index) => {
      console.log(`   ${index + 1}. ${ws.name} (ID: ${ws.id}) - Created: ${ws.createdAt}`);
    });

    // Check for any users with "Dano" in their name
    console.log('\n2️⃣ CHECKING FOR USERS NAMED "DANO"');
    console.log('-----------------------------------');
    
    const danoUsers = await prisma.$queryRaw`
      SELECT id, email, "firstName", "lastName", "createdAt"
      FROM users 
      WHERE "firstName" ILIKE '%dano%' 
         OR "lastName" ILIKE '%dano%'
         OR email ILIKE '%dano%'
      ORDER BY "createdAt" DESC
    `;
    
    if (danoUsers.length > 0) {
      console.log(`✅ Found ${danoUsers.length} users with "Dano" in their name:`);
      danoUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user.id}`);
      });
    } else {
      console.log('❌ No users found with "Dano" in their name');
    }

    // Check for contacts named "Owen"
    console.log('\n3️⃣ CHECKING FOR CONTACTS NAMED "OWEN"');
    console.log('--------------------------------------');
    
    const owenContacts = await prisma.$queryRaw`
      SELECT id, "firstName", "lastName", email, phone, "createdAt", "workspaceId"
      FROM contacts 
      WHERE "firstName" ILIKE '%owen%' 
         OR "lastName" ILIKE '%owen%'
         OR email ILIKE '%owen%'
      ORDER BY "createdAt" DESC
    `;
    
    if (owenContacts.length > 0) {
      console.log(`✅ Found ${owenContacts.length} contacts with "Owen" in their name:`);
      owenContacts.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.firstName} ${contact.lastName}`);
        console.log(`      Email: ${contact.email || 'N/A'}`);
        console.log(`      Phone: ${contact.phone || 'N/A'}`);
        console.log(`      Workspace: ${contact.workspaceId}`);
        console.log(`      Created: ${contact.createdAt}`);
      });
    } else {
      console.log('❌ No contacts found with "Owen" in their name');
    }

    // Check for accounts named "Digital Title"
    console.log('\n4️⃣ CHECKING FOR ACCOUNT "DIGITAL TITLE"');
    console.log('----------------------------------------');
    
    const digitalTitleAccounts = await prisma.$queryRaw`
      SELECT id, name, website, "createdAt", "workspaceId"
      FROM accounts 
      WHERE name ILIKE '%digital title%'
         OR name ILIKE '%digitaltitle%'
      ORDER BY "createdAt" DESC
    `;
    
    if (digitalTitleAccounts.length > 0) {
      console.log(`✅ Found ${digitalTitleAccounts.length} accounts with "Digital Title" in their name:`);
      digitalTitleAccounts.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name}`);
        console.log(`      Website: ${account.website || 'N/A'}`);
        console.log(`      Workspace: ${account.workspaceId}`);
        console.log(`      Created: ${account.createdAt}`);
      });
    } else {
      console.log('❌ No accounts found with "Digital Title" in their name');
    }

    // Check all activities from the last 3 days
    console.log('\n5️⃣ CHECKING ALL ACTIVITIES FROM LAST 3 DAYS');
    console.log('--------------------------------------------');
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
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
        u."firstName" as user_first_name,
        u."lastName" as user_last_name,
        c."firstName" as contact_first_name,
        c."lastName" as contact_last_name,
        acc.name as account_name
      FROM activities a
      LEFT JOIN users u ON a."userId" = u.id
      LEFT JOIN contacts c ON a."contactId" = c.id
      LEFT JOIN accounts acc ON a."accountId" = acc.id
      WHERE a."createdAt" >= ${threeDaysAgo}
      ORDER BY a."createdAt" DESC
      LIMIT 50
    `;
    
    if (recentActivities.length > 0) {
      console.log(`✅ Found ${recentActivities.length} activities from the last 3 days:`);
      recentActivities.forEach((activity, index) => {
        console.log(`\n   ${index + 1}. ${activity.type} - ${activity.subject}`);
        console.log(`      User: ${activity.user_first_name} ${activity.user_last_name}`);
        if (activity.contact_first_name) {
          console.log(`      Contact: ${activity.contact_first_name} ${activity.user_last_name}`);
        }
        if (activity.account_name) {
          console.log(`      Account: ${activity.account_name}`);
        }
        console.log(`      Date: ${activity.createdAt}`);
        if (activity.description) {
          console.log(`      Description: ${activity.description}`);
        }
      });
    } else {
      console.log('❌ No activities found from the last 3 days');
    }

    // Check for any activities with "call" in the type, subject, or description
    console.log('\n6️⃣ CHECKING FOR ANY CALL-RELATED ACTIVITIES');
    console.log('---------------------------------------------');
    
    const callRelatedActivities = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.type,
        a.subject,
        a.description,
        a."createdAt",
        a."userId",
        u."firstName" as user_first_name,
        u."lastName" as user_last_name
      FROM activities a
      LEFT JOIN users u ON a."userId" = u.id
      WHERE LOWER(a.type) LIKE '%call%' 
         OR LOWER(a.subject) LIKE '%call%'
         OR LOWER(a.description) LIKE '%call%'
      ORDER BY a."createdAt" DESC
      LIMIT 20
    `;
    
    if (callRelatedActivities.length > 0) {
      console.log(`✅ Found ${callRelatedActivities.length} call-related activities:`);
      callRelatedActivities.forEach((activity, index) => {
        console.log(`\n   ${index + 1}. ${activity.type} - ${activity.subject}`);
        console.log(`      User: ${activity.user_first_name} ${activity.user_last_name}`);
        console.log(`      Date: ${activity.createdAt}`);
        if (activity.description) {
          console.log(`      Description: ${activity.description}`);
        }
      });
    } else {
      console.log('❌ No call-related activities found');
    }

    console.log('\n🔍 SEARCH SUMMARY');
    console.log('==================');
    console.log(`• Workspaces found: ${workspaces.length}`);
    console.log(`• Users with "Dano": ${danoUsers.length}`);
    console.log(`• Contacts with "Owen": ${owenContacts.length}`);
    console.log(`• Accounts with "Digital Title": ${digitalTitleAccounts.length}`);
    console.log(`• Recent activities (3 days): ${recentActivities.length}`);
    console.log(`• Call-related activities: ${callRelatedActivities.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database connection closed');
  }
}

broaderActivitySearch();
