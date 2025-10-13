#!/usr/bin/env node

/**
 * 🗑️ REMOVE WRONG DAN ACCESS
 * 
 * Remove workspace access from Dan Darceystone (wrong Dan) since we want Dan Mirolli
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeWrongDanAccess() {
  try {
    console.log('🗑️ REMOVING ACCESS FROM WRONG DAN\n');
    
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Find Dan Darceystone (the wrong Dan)
    console.log('👤 FINDING DAN DARCEYSTONE (WRONG DAN):');
    console.log('=======================================');
    
    const wrongDan = await prisma.users.findFirst({
      where: {
        email: 'dan@retail-products.com'
      }
    });
    
    if (!wrongDan) {
      console.log('❌ Dan Darceystone not found - may have already been removed');
      return;
    }
    
    console.log(`✅ Found Dan Darceystone: ${wrongDan.name} (${wrongDan.email}) - ID: ${wrongDan.id}\n`);

    // 2. Check current access
    console.log('🔍 CHECKING CURRENT ACCESS:');
    console.log('============================');
    
    const currentAccess = await prisma.workspace_users.findMany({
      where: {
        userId: wrongDan.id
      },
      include: {
        workspace: true
      }
    });
    
    if (currentAccess.length === 0) {
      console.log('✅ Dan Darceystone has no workspace access - nothing to remove');
      return;
    }
    
    console.log(`❌ Dan Darceystone currently has access to ${currentAccess.length} workspaces:`);
    currentAccess.forEach(access => {
      console.log(`   - ${access.workspace.name} (${access.role})`);
    });
    console.log('');

    // 3. Remove all workspace access
    console.log('🗑️ REMOVING ALL WORKSPACE ACCESS:');
    console.log('==================================');
    
    const deletedCount = await prisma.workspace_users.deleteMany({
      where: {
        userId: wrongDan.id
      }
    });
    
    console.log(`✅ Removed ${deletedCount.count} workspace access entries for Dan Darceystone`);
    
    // 4. Verify removal
    console.log('\n🔍 VERIFICATION:');
    console.log('=================');
    
    const remainingAccess = await prisma.workspace_users.findMany({
      where: {
        userId: wrongDan.id
      }
    });
    
    if (remainingAccess.length === 0) {
      console.log('✅ Dan Darceystone now has no workspace access');
    } else {
      console.log(`❌ Warning: Dan Darceystone still has ${remainingAccess.length} access entries`);
    }
    
    console.log('\n🎉 WRONG DAN ACCESS REMOVED SUCCESSFULLY!');
    console.log('=========================================');
    console.log('Dan Darceystone no longer has access to any workspaces.');
    console.log('Dan Mirolli (dan@adrata.com) is the correct user with access.');
    
  } catch (error) {
    console.error('❌ Error removing wrong Dan access:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
removeWrongDanAccess()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
