#!/usr/bin/env node

/**
 * Clear Ross Workspace Cache
 * 
 * This script will:
 * 1. Clear server-side counts cache for Ross's user ID
 * 2. Provide instructions for Ross to clear browser localStorage
 * 3. Force refresh the counts API
 */

const { PrismaClient } = require('@prisma/client');

class ClearRossWorkspaceCache {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async clearRossCache() {
    try {
      console.log('🧹 CLEARING ROSS WORKSPACE CACHE');
      console.log('=================================');
      console.log('');

      // Find Ross user
      const rossUser = await this.prisma.users.findFirst({
        where: { email: 'ross@adrata.com' },
        select: {
          id: true,
          name: true,
          email: true,
          activeWorkspaceId: true
        }
      });

      if (!rossUser) {
        console.log('❌ Ross user not found');
        return;
      }

      console.log('👤 ROSS USER INFO:');
      console.log('==================');
      console.log(`   ID: ${rossUser.id}`);
      console.log(`   Name: ${rossUser.name}`);
      console.log(`   Email: ${rossUser.email}`);
      console.log(`   Active Workspace ID: ${rossUser.activeWorkspaceId}`);
      console.log('');

      // Clear server-side counts cache by calling the counts API POST endpoint
      console.log('🧹 CLEARING SERVER-SIDE CACHE:');
      console.log('===============================');
      
      try {
        const response = await fetch('http://localhost:3000/api/data/counts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Server-side cache cleared successfully');
          console.log(`   Response: ${result.message || 'Cache cleared'}`);
        } else {
          console.log('⚠️  Server-side cache clear failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.log('⚠️  Could not clear server-side cache (server may not be running):', error.message);
      }
      console.log('');

      // Force refresh counts for Ross's current workspace
      console.log('🔄 FORCE REFRESHING COUNTS:');
      console.log('============================');
      
      try {
        const countsResponse = await fetch(`http://localhost:3000/api/data/counts?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (countsResponse.ok) {
          const countsData = await countsResponse.json();
          console.log('✅ Counts refreshed successfully');
          console.log(`   Workspace: ${countsData.workspaceId || 'Unknown'}`);
          console.log(`   Response time: ${countsData.responseTime || 'Unknown'}ms`);
        } else {
          console.log('⚠️  Counts refresh failed:', countsResponse.status, countsResponse.statusText);
        }
      } catch (error) {
        console.log('⚠️  Could not refresh counts (server may not be running):', error.message);
      }
      console.log('');

      console.log('📋 BROWSER CACHE CLEARING INSTRUCTIONS:');
      console.log('========================================');
      console.log('Ross needs to clear his browser cache to see the correct workspace data:');
      console.log('');
      console.log('1. Open browser Developer Tools (F12)');
      console.log('2. Go to Application tab (Chrome) or Storage tab (Firefox)');
      console.log('3. Find "Local Storage" in the left sidebar');
      console.log('4. Look for entries starting with "adrata-fast-counts-"');
      console.log('5. Delete all entries that contain "notary-everyday" or old workspace IDs');
      console.log('6. Refresh the page (Ctrl+F5 or Cmd+Shift+R)');
      console.log('');
      console.log('Alternative: Clear all localStorage:');
      console.log('1. Open browser Developer Tools (F12)');
      console.log('2. Go to Console tab');
      console.log('3. Type: localStorage.clear()');
      console.log('4. Press Enter');
      console.log('5. Refresh the page');
      console.log('');

      console.log('✅ CACHE CLEARING COMPLETE!');
      console.log('============================');
      console.log('After clearing browser cache, Ross should see:');
      console.log('• Adrata workspace data in the left panel');
      console.log('• Correct counts for Adrata workspace');
      console.log('• No more Notary Everyday data');
      console.log('');

    } catch (error) {
      console.error('❌ ERROR CLEARING ROSS CACHE:');
      console.error('==============================');
      console.error(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

const clearer = new ClearRossWorkspaceCache();
clearer.clearRossCache().catch(console.error);
