#!/usr/bin/env node

/**
 * ✅ VERIFY CORRECT USERS ACCESS
 * 
 * Verify that Dan Mirolli, Ross, and Todd have access to all workspaces
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyCorrectUsersAccess() {
  try {
    console.log('✅ VERIFYING CORRECT USERS ACCESS\n');
    
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Find the correct users
    console.log('👤 FINDING CORRECT USERS:');
    console.log('==========================');
    
    const danMirolli = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com' }
    });
    
    const ross = await prisma.users.findFirst({
      where: { email: 'ross@adrata.com' }
    });
    
    const todd = await prisma.users.findFirst({
      where: { email: 'todd@adrata.com' }
    });
    
    if (!danMirolli) throw new Error('Dan Mirolli not found!');
    if (!ross) throw new Error('Ross not found!');
    if (!todd) throw new Error('Todd not found!');
    
    console.log(`✅ Dan Mirolli: ${danMirolli.name} (${danMirolli.email})`);
    console.log(`✅ Ross: ${ross.name} (${ross.email})`);
    console.log(`✅ Todd: ${todd.name} (${todd.email})\n`);

    // 2. Find all workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`🏢 Found ${workspaces.length} active workspaces:`);
    workspaces.forEach(ws => {
      console.log(`   - ${ws.name} (${ws.slug})`);
    });
    console.log('');

    // 3. Check access for each user
    const users = [
      { user: danMirolli, name: 'Dan Mirolli' },
      { user: ross, name: 'Ross' },
      { user: todd, name: 'Todd' }
    ];
    
    console.log('🔍 CHECKING WORKSPACE ACCESS:');
    console.log('==============================');
    
    let allUsersHaveFullAccess = true;
    
    for (const { user, name } of users) {
      console.log(`\n👤 ${name}:`);
      
      const userAccess = await prisma.workspace_users.findMany({
        where: {
          userId: user.id,
          isActive: true
        },
        include: {
          workspace: true
        }
      });
      
      const accessibleWorkspaces = userAccess.map(access => access.workspace.id);
      const allWorkspaceIds = workspaces.map(ws => ws.id);
      
      // Check if user has access to all workspaces
      const hasAllAccess = allWorkspaceIds.every(wsId => accessibleWorkspaces.includes(wsId));
      
      if (hasAllAccess && userAccess.length === workspaces.length) {
        console.log(`   ✅ Has access to all ${workspaces.length} workspaces:`);
        userAccess.forEach(access => {
          console.log(`      - ${access.workspace.name} (${access.role})`);
        });
      } else {
        console.log(`   ❌ Missing access to some workspaces:`);
        console.log(`      - Has access to: ${userAccess.length}/${workspaces.length} workspaces`);
        userAccess.forEach(access => {
          console.log(`        ✅ ${access.workspace.name} (${access.role})`);
        });
        
        // Show missing workspaces
        const missingWorkspaces = workspaces.filter(ws => !accessibleWorkspaces.includes(ws.id));
        missingWorkspaces.forEach(ws => {
          console.log(`        ❌ ${ws.name} (MISSING)`);
        });
        
        allUsersHaveFullAccess = false;
      }
    }
    
    // 4. Final summary
    console.log('\n📊 FINAL SUMMARY:');
    console.log('==================');
    
    if (allUsersHaveFullAccess) {
      console.log('🎉 SUCCESS! All users have full access to all workspaces:');
      console.log('   ✅ Dan Mirolli (dan@adrata.com)');
      console.log('   ✅ Ross Sylvester (ross@adrata.com)');
      console.log('   ✅ Todd Nestor (todd@adrata.com)');
      console.log(`   ✅ All ${workspaces.length} workspaces accessible`);
    } else {
      console.log('❌ ISSUE: Some users are missing access to some workspaces');
      console.log('Please check the details above and run the access grant script again.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying user access:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
verifyCorrectUsersAccess()
  .then(() => {
    console.log('\n✅ Verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  });
