#!/usr/bin/env tsx

/**
 * Fix and Refresh Script
 * 
 * 1. Fix Ross's ranking in database
 * 2. Clear frontend cache
 * 3. Force refresh
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function fixAndRefresh() {
  console.log('🔧 FIXING ROSS\'S RANKING AND CLEARING CACHE');
  
  try {
    // Step 1: Fix database ranking
    console.log('\n1. Fixing database ranking...');
    
    const rossPeople = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        companyId: { not: null },
        mainSellerId: ROSS_USER_ID
      },
      orderBy: { globalRank: 'asc' },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        company: { select: { name: true } }
      }
    });

    console.log(`Found ${rossPeople.length} people for Ross`);

    // Re-rank them 1-N
    for (let i = 0; i < rossPeople.length; i++) {
      const person = rossPeople[i];
      await prisma.people.update({
        where: { id: person.id },
        data: {
          globalRank: i + 1,
          customFields: {
            userRank: i + 1,
            userId: ROSS_USER_ID,
            rankingMode: 'global'
          }
        }
      });
      console.log(`  Fixed rank ${i + 1} for ${person.fullName}`);
    }

    console.log('✅ Database ranking fixed!');

    // Step 2: Test the API
    console.log('\n2. Testing API...');
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/speedrun?limit=50&refresh=true', {
        method: 'GET',
        headers: {
          'x-workspace-id': ADRATA_WORKSPACE_ID,
          'x-user-id': ROSS_USER_ID
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', {
          success: result.success,
          dataLength: result.data?.length || 0
        });

        if (result.data && result.data.length > 0) {
          console.log('First 5 people from API:');
          result.data.slice(0, 5).forEach((person: any, index: number) => {
            console.log(`  ${index + 1}. Rank ${person.rank}: ${person.name} (${person.company?.name})`);
          });
        }
      } else {
        console.error(`API Error: ${response.status} ${response.statusText}`);
      }
    } catch (apiError) {
      console.error('API test failed:', apiError);
    }

    // Step 3: Clear cache instructions
    console.log('\n3. Cache clearing instructions:');
    console.log('To clear the frontend cache, run this in your browser console:');
    console.log(`
// Clear speedrun cache
window.dispatchEvent(new CustomEvent('cache-invalidate', {
  detail: { pattern: 'speedrun', reason: 'manual-clear' }
}));

// Or clear all caches
localStorage.clear();
sessionStorage.clear();
location.reload();
    `);

    console.log('\n✅ FIX COMPLETE!');
    console.log('Ross should now see ranks 1-12 instead of 376-394');
    console.log('If you still see old ranks, clear your browser cache and refresh');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAndRefresh();
