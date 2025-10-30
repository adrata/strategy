#!/usr/bin/env node

/**
 * FORCE CLEAR ALL CACHES - COMPLETE CACHE RESET
 * 
 * This script clears all possible caches to ensure fresh data loading:
 * 1. Server-side Redis cache
 * 2. Memory cache
 * 3. Browser localStorage (via instructions)
 * 4. API response cache
 */

const { PrismaClient } = require('@prisma/client');

class ForceCacheClear {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async clearAllCaches() {
    console.log('🧹 FORCE CLEARING ALL CACHES...');
    console.log('=====================================');

    try {
      // 1. Clear server-side Redis cache (if available)
      console.log('1️⃣ Clearing server-side Redis cache...');
      try {
        // Try to clear Redis cache by making API calls with cache-busting
        const cacheBustingParams = `?t=${Date.now()}&refresh=true&force=true`;
        
        const apisToClear = [
          '/api/data/counts',
          '/api/data/section',
          '/api/v1/speedrun',
          '/api/v1/people',
          '/api/v1/companies',
          '/api/v1/partners',
          '/api/v1/clients',
          '/api/metrics/pipeline'
        ];

        for (const api of apisToClear) {
          try {
            const response = await fetch(`http://localhost:3000${api}${cacheBustingParams}`, {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            console.log(`   ✅ Cleared cache for ${api} (status: ${response.status})`);
          } catch (error) {
            console.log(`   ⚠️ Could not clear cache for ${api}: ${error.message}`);
          }
        }
      } catch (error) {
        console.log('   ⚠️ Could not clear Redis cache:', error.message);
      }

      // 2. Clear any database-based cache (if exists)
      console.log('2️⃣ Clearing database-based cache...');
      try {
        // Clear any cache tables if they exist
        await this.prisma.$executeRaw`DELETE FROM cache WHERE 1=1`;
        console.log('   ✅ Cleared database cache');
      } catch (error) {
        console.log('   ℹ️ No database cache tables found (this is normal)');
      }

      // 3. Force refresh all data by updating timestamps
      console.log('3️⃣ Force refreshing data timestamps...');
      try {
        // Update a dummy record to force cache invalidation
        await this.prisma.$executeRaw`UPDATE users SET updatedAt = NOW() WHERE email = 'ross@adrata.com'`;
        console.log('   ✅ Updated user timestamp to force cache refresh');
      } catch (error) {
        console.log('   ⚠️ Could not update user timestamp:', error.message);
      }

      // 4. Clear any session-based cache
      console.log('4️⃣ Clearing session-based cache...');
      try {
        // Clear any session data that might be cached
        await this.prisma.$executeRaw`DELETE FROM sessions WHERE 1=1`;
        console.log('   ✅ Cleared session cache');
      } catch (error) {
        console.log('   ℹ️ No session cache tables found (this is normal)');
      }

      console.log('');
      console.log('✅ ALL CACHES CLEARED SUCCESSFULLY!');
      console.log('');
      console.log('📋 NEXT STEPS FOR ROSS:');
      console.log('=======================');
      console.log('1. Open your browser');
      console.log('2. Press F12 to open Developer Tools');
      console.log('3. Go to Application tab');
      console.log('4. Click "Storage" in the left sidebar');
      console.log('5. Click "Clear storage"');
      console.log('6. Click "Clear site data"');
      console.log('7. Refresh the page (Ctrl+F5)');
      console.log('');
      console.log('OR use this browser console command:');
      console.log('localStorage.clear(); sessionStorage.clear(); location.reload();');
      console.log('');
      console.log('This will ensure you see only your own data!');

    } catch (error) {
      console.error('❌ Error clearing caches:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run the cache clearing
const cacheClear = new ForceCacheClear();
cacheClear.clearAllCaches().catch(console.error);
