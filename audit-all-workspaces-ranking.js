const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditAllWorkspacesRanking() {
  console.log('🔍 Auditing all workspaces for proper speedrun ranking...\n');
  
  try {
    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        slug: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 Found ${workspaces.length} workspaces to audit\n`);
    
    let totalUsers = 0;
    let usersWithSpeedrun = 0;
    let usersNeedingRanking = [];
    
    for (const workspace of workspaces) {
      console.log(`\n🏢 Workspace: ${workspace.name} (${workspace.slug})`);
      console.log(`   ID: ${workspace.id}`);
      
      // Get all users in this workspace via workspace_users table
      const workspaceUserIds = await prisma.workspace_users.findMany({
        where: {
          workspaceId: workspace.id,
          isActive: true
        },
        select: {
          userId: true
        }
      });
      
      const userIds = workspaceUserIds.map(wu => wu.userId);
      
      const workspaceUsers = await prisma.users.findMany({
        where: {
          id: { in: userIds }
        },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });
      
      console.log(`   👥 Users: ${workspaceUsers.length}`);
      
      for (const user of workspaceUsers) {
        totalUsers++;
        
        // Count people assigned to this user
        const peopleCount = await prisma.people.count({
          where: {
            workspaceId: workspace.id,
            mainSellerId: user.id,
            deletedAt: null
          }
        });
        
        // Count people with speedrun ranks (1-50)
        const speedrunCount = await prisma.people.count({
          where: {
            workspaceId: workspace.id,
            mainSellerId: user.id,
            deletedAt: null,
            globalRank: { not: null, gte: 1, lte: 50 }
          }
        });
        
        // Count people with any globalRank
        const rankedCount = await prisma.people.count({
          where: {
            workspaceId: workspace.id,
            mainSellerId: user.id,
            deletedAt: null,
            globalRank: { not: null }
          }
        });
        
        const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        
        if (peopleCount > 0) {
          console.log(`     👤 ${displayName}: ${peopleCount} people, ${speedrunCount} speedrun, ${rankedCount} ranked`);
          
          if (speedrunCount > 0) {
            usersWithSpeedrun++;
          } else if (peopleCount > 0) {
            // User has people but no speedrun ranks
            usersNeedingRanking.push({
              workspace: workspace.name,
              workspaceId: workspace.id,
              user: displayName,
              userId: user.id,
              peopleCount,
              rankedCount
            });
          }
        }
      }
    }
    
    console.log(`\n📊 AUDIT SUMMARY:`);
    console.log(`   Total workspaces: ${workspaces.length}`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with speedrun data: ${usersWithSpeedrun}`);
    console.log(`   Users needing ranking: ${usersNeedingRanking.length}`);
    
    if (usersNeedingRanking.length > 0) {
      console.log(`\n⚠️  USERS NEEDING SPEEDRUN RANKING:`);
      usersNeedingRanking.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.user} in ${user.workspace} (${user.peopleCount} people, ${user.rankedCount} ranked)`);
      });
      
      console.log(`\n🔧 RECOMMENDED ACTIONS:`);
      console.log(`   1. Create ranking scripts for users with people but no speedrun ranks`);
      console.log(`   2. Ensure all users have at least their top 50 people ranked 1-50`);
      console.log(`   3. Verify nextActionDate is set to TODAY for speedrun ranks`);
      console.log(`   4. Check that lastAction shows "Record added" for people with no meaningful actions`);
    } else {
      console.log(`\n✅ All users have proper speedrun ranking!`);
    }
    
    // Check for any duplicate ranks within workspaces
    console.log(`\n🔍 Checking for duplicate ranks...`);
    
    for (const workspace of workspaces) {
      const duplicateRanks = await prisma.people.groupBy({
        by: ['globalRank'],
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          globalRank: { not: null, gte: 1, lte: 50 }
        },
        _count: { id: true },
        having: {
          id: { _count: { gt: 1 } }
        }
      });
      
      if (duplicateRanks.length > 0) {
        console.log(`   ⚠️  ${workspace.name}: Found duplicate ranks:`, duplicateRanks.map(r => `Rank ${r.globalRank} (${r._count.id} people)`));
      }
    }
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditAllWorkspacesRanking();
