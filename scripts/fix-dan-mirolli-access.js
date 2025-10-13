#!/usr/bin/env node

/**
 * 🔧 FIX DAN MIROLLI ACCESS
 * 
 * Find Dan Mirolli (dan@adrata.com) and grant him access to all workspaces
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDanMirolliAccess() {
  try {
    console.log('🔧 FIXING DAN MIROLLI ACCESS\n');
    
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Find Dan Mirolli specifically
    console.log('👤 FINDING DAN MIROLLI:');
    console.log('=======================');
    
    const danMirolli = await prisma.users.findFirst({
      where: {
        email: 'dan@adrata.com'
      }
    });
    
    if (!danMirolli) {
      console.log('❌ Dan Mirolli (dan@adrata.com) not found!');
      console.log('🔍 Searching for other Dan users...\n');
      
      const allDans = await prisma.users.findMany({
        where: {
          name: {
            contains: 'Dan',
            mode: 'insensitive'
          }
        }
      });
      
      console.log('Found Dan users:');
      allDans.forEach(dan => {
        console.log(`   - ${dan.name} (${dan.email}) - ID: ${dan.id}`);
      });
      
      throw new Error('Dan Mirolli not found. Please check the email address.');
    }
    
    console.log(`✅ Found Dan Mirolli: ${danMirolli.name} (${danMirolli.email}) - ID: ${danMirolli.id}\n`);

    // 2. Find all active workspaces
    console.log('🏢 FINDING ALL WORKSPACES:');
    console.log('==========================');
    
    const workspaces = await prisma.workspaces.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`✅ Found ${workspaces.length} active workspaces:`);
    workspaces.forEach(ws => {
      console.log(`   - ${ws.name} (${ws.slug}) - ID: ${ws.id}`);
    });
    console.log('');

    // 3. Check current access for Dan Mirolli
    console.log('🔍 CHECKING CURRENT ACCESS:');
    console.log('============================');
    
    const currentAccess = await prisma.workspace_users.findMany({
      where: {
        userId: danMirolli.id
      },
      include: {
        workspace: true
      }
    });
    
    if (currentAccess.length === 0) {
      console.log('❌ Dan Mirolli has no workspace access currently');
    } else {
      console.log(`✅ Dan Mirolli currently has access to ${currentAccess.length} workspaces:`);
      currentAccess.forEach(access => {
        console.log(`   - ${access.workspace.name} (${access.role}) - Active: ${access.isActive}`);
      });
    }
    console.log('');

    // 4. Grant access to all workspaces
    console.log('🔗 GRANTING ACCESS TO ALL WORKSPACES:');
    console.log('=====================================');
    
    let totalGrants = 0;
    let totalUpdates = 0;
    
    for (const workspace of workspaces) {
      // Check if Dan already has access to this workspace
      const existingAccess = await prisma.workspace_users.findFirst({
        where: {
          userId: danMirolli.id,
          workspaceId: workspace.id
        }
      });
      
      if (existingAccess) {
        // Update existing access to WORKSPACE_ADMIN
        await prisma.workspace_users.update({
          where: {
            id: existingAccess.id
          },
          data: {
            role: 'WORKSPACE_ADMIN',
            isActive: true,
            updatedAt: new Date()
          }
        });
        
        console.log(`   ✅ Updated access to ${workspace.name} (${existingAccess.role} → WORKSPACE_ADMIN)`);
        totalUpdates++;
      } else {
        // Create new access
        await prisma.workspace_users.create({
          data: {
            userId: danMirolli.id,
            workspaceId: workspace.id,
            role: 'WORKSPACE_ADMIN',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`   ✅ Granted access to ${workspace.name} (NEW)`);
        totalGrants++;
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`✅ User: ${danMirolli.name} (${danMirolli.email})`);
    console.log(`✅ Workspaces processed: ${workspaces.length}`);
    console.log(`✅ New access grants: ${totalGrants}`);
    console.log(`✅ Access updates: ${totalUpdates}`);
    console.log(`✅ Total operations: ${totalGrants + totalUpdates}`);
    
    // 5. Verify final access
    console.log('\n🔍 FINAL VERIFICATION:');
    console.log('=======================');
    
    const finalAccess = await prisma.workspace_users.findMany({
      where: {
        userId: danMirolli.id,
        isActive: true
      },
      include: {
        workspace: true
      }
    });
    
    console.log(`✅ Dan Mirolli now has access to ${finalAccess.length} workspaces:`);
    finalAccess.forEach(access => {
      console.log(`   - ${access.workspace.name} (${access.role})`);
    });
    
    console.log('\n🎉 DAN MIROLLI ACCESS FIXED SUCCESSFULLY!');
    console.log('=========================================');
    console.log('Dan Mirolli now has WORKSPACE_ADMIN access to all workspaces.');
    
  } catch (error) {
    console.error('❌ Error fixing Dan Mirolli access:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
fixDanMirolliAccess()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
