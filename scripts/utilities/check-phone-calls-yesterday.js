#!/usr/bin/env node

/**
 * 📞 CHECK PHONE CALL ACTIVITIES FROM YESTERDAY
 * 
 * Search for:
 * 1. All phone call activities from yesterday
 * 2. Calls made by Dano specifically
 * 3. Calls involving Owen and Digital Title
 * 4. Any call_activities table entries
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function checkPhoneCallsYesterday() {
  console.log('📞 CHECKING PHONE CALL ACTIVITIES FROM YESTERDAY');
  console.log('================================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    console.log(`🔍 Searching for activities from: ${yesterdayStart.toISOString()} to ${yesterdayEnd.toISOString()}\n`);

    // 1. Check activities table for phone calls from yesterday
    console.log('1️⃣ CHECKING ACTIVITIES TABLE FOR PHONE CALLS');
    console.log('-------------------------------------------');
    
    const phoneActivities = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.type,
        a.subject,
        a.description,
        a.outcome,
        a.status,
        a."scheduledAt",
        a."completedAt",
        a."createdAt",
        a."userId",
        a."accountId",
        a."contactId",
        a."leadId",
        u.email as user_email,
        u."firstName" as user_first_name,
        u."lastName" as user_last_name
      FROM activities a
      LEFT JOIN users u ON a."userId" = u.id
      WHERE a."createdAt" >= ${yesterdayStart}
        AND a."createdAt" <= ${yesterdayEnd}
        AND (
          LOWER(a.type) LIKE '%call%' 
          OR LOWER(a.subject) LIKE '%call%'
          OR LOWER(a.description) LIKE '%call%'
        )
      ORDER BY a."createdAt" DESC
    `;

    if (phoneActivities.length > 0) {
      console.log(`✅ Found ${phoneActivities.length} phone call activities from yesterday:`);
      phoneActivities.forEach((activity, index) => {
        console.log(`\n   ${index + 1}. ${activity.type} - ${activity.subject}`);
        console.log(`      User: ${activity.user_first_name} ${activity.user_last_name} (${activity.user_email})`);
        console.log(`      Status: ${activity.status}`);
        console.log(`      Created: ${activity.createdAt}`);
        if (activity.completedAt) console.log(`      Completed: ${activity.completedAt}`);
        if (activity.description) console.log(`      Description: ${activity.description}`);
        if (activity.outcome) console.log(`      Outcome: ${activity.outcome}`);
      });
    } else {
      console.log('❌ No phone call activities found in activities table from yesterday');
    }

    // 2. Check for any call_activities table (if it exists)
    console.log('\n2️⃣ CHECKING FOR CALL_ACTIVITIES TABLE');
    console.log('--------------------------------------');
    
    try {
      const callActivitiesTable = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'call_activities'
      `;
      
      if (callActivitiesTable.length > 0) {
        console.log('✅ call_activities table exists, checking for yesterday\'s calls');
        
        const yesterdayCalls = await prisma.$queryRaw`
          SELECT * FROM call_activities 
          WHERE "createdAt" >= ${yesterdayStart} 
            AND "createdAt" <= ${yesterdayEnd}
          ORDER BY "createdAt" DESC
        `;
        
        if (yesterdayCalls.length > 0) {
          console.log(`✅ Found ${yesterdayCalls.length} call activities from yesterday:`);
          yesterdayCalls.forEach((call, index) => {
            console.log(`\n   ${index + 1}. Call ID: ${call.id}`);
            console.log(`      Lead ID: ${call.leadId}`);
            console.log(`      User ID: ${call.userId}`);
            console.log(`      Created: ${call.createdAt}`);
            if (call.call_data) {
              console.log(`      Call Data: ${JSON.stringify(call.call_data, null, 2)}`);
            }
          });
        } else {
          console.log('❌ No call activities found in call_activities table from yesterday');
        }
      } else {
        console.log('❌ call_activities table does not exist');
      }
    } catch (error) {
      console.log('❌ Error checking call_activities table:', error.message);
    }

    // 3. Check for any activities with Owen or Digital Title from yesterday
    console.log('\n3️⃣ CHECKING FOR OWEN & DIGITAL TITLE ACTIVITIES FROM YESTERDAY');
    console.log('----------------------------------------------------------------');
    
    const owenDigitalTitleActivities = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.type,
        a.subject,
        a.description,
        a.outcome,
        a.status,
        a."createdAt",
        a."userId",
        a."accountId",
        a."contactId",
        u.email as user_email,
        u."firstName" as user_first_name,
        u."lastName" as user_last_name,
        c."firstName" as contact_first_name,
        c."lastName" as contact_last_name,
        acc.name as account_name
      FROM activities a
      LEFT JOIN users u ON a."userId" = u.id
      LEFT JOIN contacts c ON a."contactId" = c.id
      LEFT JOIN accounts acc ON a."accountId" = acc.id
      WHERE a."createdAt" >= ${yesterdayStart}
        AND a."createdAt" <= ${yesterdayEnd}
        AND (
          (c."firstName" ILIKE '%Owen%' OR c."lastName" ILIKE '%Owen%')
          OR (acc.name ILIKE '%Digital Title%')
        )
      ORDER BY a."createdAt" DESC
    `;

    if (owenDigitalTitleActivities.length > 0) {
      console.log(`✅ Found ${owenDigitalTitleActivities.length} activities involving Owen or Digital Title from yesterday:`);
      owenDigitalTitleActivities.forEach((activity, index) => {
        console.log(`\n   ${index + 1}. ${activity.type} - ${activity.subject}`);
        console.log(`      User: ${activity.user_first_name} ${activity.user_last_name} (${activity.user_email})`);
        if (activity.contact_first_name) {
          console.log(`      Contact: ${activity.contact_first_name} ${activity.contact_last_name}`);
        }
        if (activity.account_name) {
          console.log(`      Account: ${activity.account_name}`);
        }
        console.log(`      Status: ${activity.status}`);
        console.log(`      Created: ${activity.createdAt}`);
        if (activity.description) console.log(`      Description: ${activity.description}`);
      });
    } else {
      console.log('❌ No activities found involving Owen or Digital Title from yesterday');
    }

    // 4. Check for any phone-related activities in the last 7 days to see patterns
    console.log('\n4️⃣ CHECKING FOR RECENT PHONE ACTIVITIES (LAST 7 DAYS)');
    console.log('------------------------------------------------------');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentPhoneActivities = await prisma.$queryRaw`
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
      WHERE a."createdAt" >= ${sevenDaysAgo}
        AND (
          LOWER(a.type) LIKE '%call%' 
          OR LOWER(a.subject) LIKE '%call%'
          OR LOWER(a.description) LIKE '%call%'
        )
      ORDER BY a."createdAt" DESC
      LIMIT 20
    `;

    if (recentPhoneActivities.length > 0) {
      console.log(`✅ Found ${recentPhoneActivities.length} recent phone-related activities:`);
      recentPhoneActivities.forEach((activity, index) => {
        console.log(`\n   ${index + 1}. ${activity.type} - ${activity.subject}`);
        console.log(`      User: ${activity.user_first_name} ${activity.user_last_name}`);
        console.log(`      Date: ${activity.createdAt}`);
        if (activity.description) console.log(`      Description: ${activity.description}`);
      });
    } else {
      console.log('❌ No recent phone-related activities found');
    }

    console.log('\n🔍 SUMMARY');
    console.log('==========');
    console.log(`• Searched for activities from: ${yesterdayStart.toLocaleDateString()}`);
    console.log(`• Phone call activities found: ${phoneActivities.length}`);
    console.log(`• Owen/Digital Title activities found: ${owenDigitalTitleActivities.length}`);
    console.log(`• Recent phone activities (7 days): ${recentPhoneActivities.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database connection closed');
  }
}

checkPhoneCallsYesterday();
