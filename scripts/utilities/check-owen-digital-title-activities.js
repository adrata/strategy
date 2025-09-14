#!/usr/bin/env node

/**
 * 🔍 CHECK OWEN & DIGITAL TITLE ACTIVITIES
 * 
 * Search for:
 * 1. User "Owen" in the system
 * 2. Account "Digital Title" 
 * 3. Any activities from yesterday involving these entities
 * 4. Phone calls made by Dano
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function checkOwenAndDigitalTitle() {
  console.log('🔍 CHECKING OWEN & DIGITAL TITLE ACTIVITIES');
  console.log('============================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Get yesterday's date (assuming this is run today)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`📅 Checking activities from: ${yesterday.toISOString().split('T')[0]}`);
    console.log(`📅 To: ${today.toISOString().split('T')[0]}\n`);

    // STEP 1: Find user "Owen"
    console.log('1️⃣ SEARCHING FOR USER "OWEN":');
    console.log('-------------------------------');
    
    const owenUsers = await prisma.users.findMany({
      where: {
        OR: [
          { name: { contains: 'Owen', mode: 'insensitive' } },
          { firstName: { contains: 'Owen', mode: 'insensitive' } },
          { lastName: { contains: 'Owen', mode: 'insensitive' } },
          { email: { contains: 'owen', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (owenUsers.length === 0) {
      console.log('❌ No users found with name "Owen"');
    } else {
      console.log(`✅ Found ${owenUsers.length} user(s) with name "Owen":`);
      owenUsers.forEach(user => {
        console.log(`   👤 ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    }

    // STEP 2: Find account "Digital Title"
    console.log('\n2️⃣ SEARCHING FOR ACCOUNT "DIGITAL TITLE":');
    console.log('------------------------------------------');
    
    const digitalTitleAccounts = await prisma.accounts.findMany({
      where: {
        OR: [
          { name: { contains: 'Digital Title', mode: 'insensitive' } },
          { name: { contains: 'Digital', mode: 'insensitive' } },
          { name: { contains: 'Title', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        assignedUserId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (digitalTitleAccounts.length === 0) {
      console.log('❌ No accounts found with name containing "Digital Title"');
    } else {
      console.log(`✅ Found ${digitalTitleAccounts.length} account(s) with similar names:`);
      digitalTitleAccounts.forEach(account => {
        console.log(`   🏢 ${account.name} - ID: ${account.id}`);
        console.log(`      Workspace: ${account.workspaceId}`);
        console.log(`      Assigned to: ${account.assignedUserId || 'Unassigned'}`);
      });
    }

    // STEP 3: Find Dano's user ID
    console.log('\n3️⃣ FINDING DANO\'S USER ID:');
    console.log('----------------------------');
    
    const danoUsers = await prisma.users.findMany({
      where: {
        OR: [
          { name: { contains: 'Dano', mode: 'insensitive' } },
          { name: { contains: 'Dan', mode: 'insensitive' } },
          { email: { contains: 'dano', mode: 'insensitive' } },
          { email: { contains: 'dan@', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (danoUsers.length === 0) {
      console.log('❌ No users found with name "Dano"');
      return;
    } else {
      console.log(`✅ Found ${danoUsers.length} user(s) with name "Dano":`);
      danoUsers.forEach(user => {
        console.log(`   👤 ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    }

    const danoUserId = danoUsers[0].id;
    console.log(`🎯 Using Dano's ID: ${danoUserId}`);

    // STEP 4: Check all activities from yesterday
    console.log('\n4️⃣ CHECKING ALL ACTIVITIES FROM YESTERDAY:');
    console.log('-------------------------------------------');
    
    const yesterdayActivities = await prisma.activities.findMany({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        }
      },
      include: {
        contacts: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (yesterdayActivities.length === 0) {
      console.log('❌ No activities found from yesterday');
    } else {
      console.log(`✅ Found ${yesterdayActivities.length} activities from yesterday:`);
      yesterdayActivities.forEach(activity => {
        console.log(`   📝 ${activity.type.toUpperCase()}: ${activity.subject}`);
        console.log(`      Status: ${activity.status}`);
        console.log(`      Created: ${activity.createdAt.toISOString()}`);
        console.log(`      User ID: ${activity.userId}`);
        if (activity.contacts) {
          console.log(`      Contact: ${activity.contacts.fullName || 'N/A'}`);
        }
        console.log(`      Description: ${activity.description || 'N/A'}`);
        console.log('');
      });
    }

    // STEP 5: Check Dano's activities from yesterday
    console.log('\n5️⃣ CHECKING DANO\'S ACTIVITIES FROM YESTERDAY:');
    console.log('-----------------------------------------------');
    
    const danoActivities = await prisma.activities.findMany({
      where: {
        userId: danoUserId,
        createdAt: {
          gte: yesterday,
          lt: today
        }
      },
      include: {
        contacts: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        accounts: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (danoActivities.length === 0) {
      console.log('❌ No activities found for Dano from yesterday');
    } else {
      console.log(`✅ Found ${danoActivities.length} activities for Dano from yesterday:`);
      danoActivities.forEach(activity => {
        console.log(`   📝 ${activity.type.toUpperCase()}: ${activity.subject}`);
        console.log(`      Status: ${activity.status}`);
        console.log(`      Created: ${activity.createdAt.toISOString()}`);
        if (activity.contacts) {
          console.log(`      Contact: ${activity.contacts.fullName || 'N/A'}`);
        }
        if (activity.accounts) {
          console.log(`      Account: ${activity.accounts.name || 'N/A'}`);
        }
        console.log(`      Description: ${activity.description || 'N/A'}`);
        console.log('');
      });
    }

    // STEP 6: Check for phone call activities specifically
    console.log('\n6️⃣ CHECKING FOR PHONE CALL ACTIVITIES:');
    console.log('----------------------------------------');
    
    const phoneCallActivities = await prisma.activities.findMany({
      where: {
        OR: [
          { type: { contains: 'call', mode: 'insensitive' } },
          { type: { contains: 'phone', mode: 'insensitive' } },
          { subject: { contains: 'call', mode: 'insensitive' } },
          { subject: { contains: 'phone', mode: 'insensitive' } },
          { description: { contains: 'call', mode: 'insensitive' } },
          { description: { contains: 'phone', mode: 'insensitive' } }
        ],
        createdAt: {
          gte: yesterday,
          lt: today
        }
      },
      include: {
        contacts: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        accounts: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (phoneCallActivities.length === 0) {
      console.log('❌ No phone call activities found from yesterday');
    } else {
      console.log(`✅ Found ${phoneCallActivities.length} phone call activities from yesterday:`);
      phoneCallActivities.forEach(activity => {
        console.log(`   📞 ${activity.type.toUpperCase()}: ${activity.subject}`);
        console.log(`      Status: ${activity.status}`);
        console.log(`      Created: ${activity.createdAt.toISOString()}`);
        console.log(`      User ID: ${activity.userId}`);
        if (activity.contacts) {
          console.log(`      Contact: ${activity.contacts.fullName || 'N/A'}`);
        }
        if (activity.accounts) {
          console.log(`      Account: ${activity.accounts.name || 'N/A'}`);
        }
        console.log(`      Description: ${activity.description || 'N/A'}`);
        console.log('');
      });
    }

    // STEP 7: Check for activities involving Owen or Digital Title specifically
    console.log('\n7️⃣ CHECKING FOR ACTIVITIES INVOLVING OWEN OR DIGITAL TITLE:');
    console.log('----------------------------------------------------------');
    
    const owenDigitalTitleActivities = await prisma.activities.findMany({
      where: {
        OR: [
          { subject: { contains: 'Owen', mode: 'insensitive' } },
          { description: { contains: 'Owen', mode: 'insensitive' } },
          { subject: { contains: 'Digital Title', mode: 'insensitive' } },
          { description: { contains: 'Digital Title', mode: 'insensitive' } }
        ],
        createdAt: {
          gte: yesterday,
          lt: today
        }
      },
      include: {
        contacts: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        accounts: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (owenDigitalTitleActivities.length === 0) {
      console.log('❌ No activities found involving Owen or Digital Title from yesterday');
    } else {
      console.log(`✅ Found ${owenDigitalTitleActivities.length} activities involving Owen or Digital Title from yesterday:`);
      owenDigitalTitleActivities.forEach(activity => {
        console.log(`   📝 ${activity.type.toUpperCase()}: ${activity.subject}`);
        console.log(`      Status: ${activity.status}`);
        console.log(`      Created: ${activity.createdAt.toISOString()}`);
        console.log(`      User ID: ${activity.userId}`);
        if (activity.contacts) {
          console.log(`      Contact: ${activity.contacts.fullName || 'N/A'}`);
        }
        if (activity.accounts) {
          console.log(`      Account: ${activity.accounts.name || 'N/A'}`);
        }
        console.log(`      Description: ${activity.description || 'N/A'}`);
        console.log('');
      });
    }

    // STEP 8: Summary
    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log(`👤 Users named "Owen": ${owenUsers.length}`);
    console.log(`🏢 Accounts with "Digital Title": ${digitalTitleAccounts.length}`);
    console.log(`📝 Total activities yesterday: ${yesterdayActivities.length}`);
    console.log(`👤 Dano's activities yesterday: ${danoActivities.length}`);
    console.log(`📞 Phone call activities yesterday: ${phoneCallActivities.length}`);
    console.log(`🎯 Owen/Digital Title activities yesterday: ${owenDigitalTitleActivities.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
checkOwenAndDigitalTitle().catch(console.error);
