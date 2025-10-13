#!/usr/bin/env node

/**
 * 🔐 GRANT MULTI-WORKSPACE ACCESS
 * 
 * Grants Dan, Ross, and Todd access to all workspaces with WORKSPACE_ADMIN role
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function grantMultiWorkspaceAccess() {
  try {
    console.log('🔐 GRANTING MULTI-WORKSPACE ACCESS TO DAN, ROSS, AND TODD\n');
    
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Find users
    console.log('👤 FINDING USERS:');
    console.log('==================');
    
    const dan = await prisma.users.findFirst({
      where: {
        name: {
          contains: 'Dan',
          mode: 'insensitive'
        }
      }
    });
    
    const ross = await prisma.users.findFirst({
      where: {
        name: {
          contains: 'Ross',
          mode: 'insensitive'
        }
      }
    });
    
    const todd = await prisma.users.findFirst({
      where: {
        name: {
          contains: 'Todd',
          mode: 'insensitive'
        }
      }
    });
    
    if (!dan) {
      throw new Error('Dan user not found!');
    }
    if (!ross) {
      throw new Error('Ross user not found!');
    }
    if (!todd) {
      throw new Error('Todd user not found!');
    }
    
    console.log(`✅ Dan: ${dan.name} (${dan.email}) - ID: ${dan.id}`);
    console.log(`✅ Ross: ${ross.name} (${ross.email}) - ID: ${ross.id}`);
    console.log(`✅ Todd: ${todd.name} (${todd.email}) - ID: ${todd.id}\n`);

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
    
    if (workspaces.length === 0) {
      throw new Error('No active workspaces found!');
    }
    
    console.log(`✅ Found ${workspaces.length} active workspaces:`);
    workspaces.forEach(ws => {
      console.log(`   - ${ws.name} (${ws.slug}) - ID: ${ws.id}`);
    });
    console.log('');

    // 3. Grant access to each user for each workspace
    const users = [dan, ross, todd];
    let totalGrants = 0;
    let totalUpdates = 0;
    
    console.log('🔗 GRANTING WORKSPACE ACCESS:');
    console.log('=============================');
    
    for (const user of users) {
      console.log(`\n👤 Processing ${user.name}:`);
      
      for (const workspace of workspaces) {
        // Check if user already has access to this workspace
        const existingAccess = await prisma.workspace_users.findFirst({
          where: {
            userId: user.id,
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
              userId: user.id,
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
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`✅ Users processed: ${users.length} (Dan, Ross, Todd)`);
    console.log(`✅ Workspaces processed: ${workspaces.length}`);
    console.log(`✅ New access grants: ${totalGrants}`);
    console.log(`✅ Access updates: ${totalUpdates}`);
    console.log(`✅ Total operations: ${totalGrants + totalUpdates}`);
    
    // 4. Verify access
    console.log('\n🔍 VERIFICATION:');
    console.log('=================');
    
    for (const user of users) {
      const userAccess = await prisma.workspace_users.findMany({
        where: {
          userId: user.id,
          isActive: true
        },
        include: {
          workspace: true
        }
      });
      
      console.log(`\n👤 ${user.name} has access to ${userAccess.length} workspaces:`);
      userAccess.forEach(access => {
        console.log(`   - ${access.workspace.name} (${access.role})`);
      });
    }
    
    console.log('\n🎉 MULTI-WORKSPACE ACCESS GRANTED SUCCESSFULLY!');
    console.log('===============================================');
    console.log('Dan, Ross, and Todd now have WORKSPACE_ADMIN access to all workspaces.');
    
  } catch (error) {
    console.error('❌ Error granting multi-workspace access:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
grantMultiWorkspaceAccess()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
