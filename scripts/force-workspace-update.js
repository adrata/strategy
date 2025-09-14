#!/usr/bin/env node

/**
 * 🔧 FORCE WORKSPACE UPDATE FOR DANO
 * 
 * Forces Dano's active workspace to be Notary Everyday
 * This should fix the JWT token workspace context issue
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Configuration
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';

async function forceWorkspaceUpdate() {
  console.log('🔧 FORCING WORKSPACE UPDATE FOR DANO');
  console.log('=====================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // 1. Check current state
    console.log('🔍 Checking current state...');
    
    const currentUser = await prisma.users.findUnique({
      where: { id: DANO_USER_ID },
      select: { 
        id: true, 
        email: true, 
        activeWorkspaceId: true 
      }
    });
    
    if (!currentUser) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`📊 Current user state:`);
    console.log(`   ID: ${currentUser.id}`);
    console.log(`   Email: ${currentUser.email}`);
    console.log(`   Active Workspace: ${currentUser.activeWorkspaceId}`);
    
    // 2. Check workspace membership
    console.log('\n🔍 Checking workspace membership...');
    
    const memberships = await prisma.workspaceMembership.findMany({
      where: { userId: DANO_USER_ID },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    });
    
    console.log(`📊 Workspace memberships:`);
    memberships.forEach(m => {
      console.log(`   ${m.workspace.name}: ${m.workspace.id}`);
    });
    
    // 3. Force update active workspace
    console.log('\n🔧 Force updating active workspace...');
    
    if (currentUser.activeWorkspaceId !== NOTARY_WORKSPACE_ID) {
      console.log(`   Changing from ${currentUser.activeWorkspaceId} to ${NOTARY_WORKSPACE_ID}`);
      
      await prisma.users.update({
        where: { id: DANO_USER_ID },
        data: { activeWorkspaceId: NOTARY_WORKSPACE_ID }
      });
      
      console.log('   ✅ Active workspace updated');
    } else {
      console.log('   ✅ Active workspace is already correct');
    }
    
    // 4. Verify the update
    console.log('\n🔍 Verifying the update...');
    
    const updatedUser = await prisma.users.findUnique({
      where: { id: DANO_USER_ID },
      select: { 
        id: true, 
        email: true, 
        activeWorkspaceId: true 
      }
    });
    
    console.log(`📊 Updated user state:`);
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Active Workspace: ${updatedUser.activeWorkspaceId}`);
    
    if (updatedUser.activeWorkspaceId === NOTARY_WORKSPACE_ID) {
      console.log('✅ SUCCESS: Active workspace is now Notary Everyday');
      console.log('🔄 You may need to refresh your browser or log out/in for the JWT to update');
    } else {
      console.log('❌ FAILED: Active workspace was not updated');
    }
    
    // 5. Test API access
    console.log('\n🧪 Testing API access...');
    
    // This is just a test - the actual API call would need proper authentication
    console.log('   Note: API access test requires proper JWT token');
    console.log('   The workspace context should now be correct');
    
  } catch (error) {
    console.error('❌ Force workspace update failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
if (import.meta.url === `file://${process.argv[1]}`) {
  forceWorkspaceUpdate();
}
