#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearSpeedrunCache() {
  try {
    console.log('🗑️ Clearing speedrun caches...');
    
    // Get all users with workspaces
    const users = await prisma.users.findMany({
      where: {
        activeWorkspaceId: { not: null }
      },
      select: {
        id: true,
        name: true,
        activeWorkspaceId: true
      }
    });
    
    console.log(`Found ${users.length} users with workspaces`);
    
    // Clear cache for each user by calling the cache invalidation API
    for (const user of users) {
      try {
        console.log(`Clearing cache for ${user.name}...`);
        
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/speedrun`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-workspace-id': user.activeWorkspaceId,
            'x-user-id': user.id
          }
        });
        
        if (response.ok) {
          console.log(`  ✅ Cleared cache for ${user.name}`);
        } else {
          console.log(`  ⚠️ Failed to clear cache for ${user.name}: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ Error clearing cache for ${user.name}:`, error.message);
      }
    }
    
    console.log('\n🔄 Testing speedrun API with fresh data...');
    
    // Test Victoria's speedrun API with fresh data
    const victoria = users.find(u => u.name.includes('Victoria'));
    if (victoria) {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/speedrun?refresh=true&limit=10`, {
          headers: {
            'x-workspace-id': victoria.activeWorkspaceId,
            'x-user-id': victoria.id
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Victoria's speedrun data (first 5):`);
          data.data?.slice(0, 5).forEach((person, i) => {
            console.log(`  ${i + 1}. Rank ${person.globalRank}: ${person.fullName}`);
          });
        } else {
          console.log(`❌ Failed to fetch Victoria's data: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Error fetching Victoria's data:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSpeedrunCache();
