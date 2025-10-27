#!/usr/bin/env tsx

/**
 * Test Speedrun API
 * 
 * Test the speedrun API to see what data it's returning
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function testSpeedrunAPI() {
  console.log('🧪 TESTING SPEEDRUN API');
  
  try {
    // First, check what's in the database
    console.log('\n1. Database check:');
    const dbPeople = await prisma.people.findMany({
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

    console.log(`Found ${dbPeople.length} people in database:`);
    dbPeople.forEach(p => {
      console.log(`  Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
    });

    // Test the API endpoint
    console.log('\n2. Testing API endpoint...');
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/speedrun?limit=50', {
        method: 'GET',
        headers: {
          'x-workspace-id': ADRATA_WORKSPACE_ID,
          'x-user-id': ROSS_USER_ID
        }
      });

      if (!response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return;
      }

      const result = await response.json();
      console.log('API Response:', {
        success: result.success,
        dataLength: result.data?.length || 0,
        meta: result.meta
      });

      if (result.data && result.data.length > 0) {
        console.log('\nFirst 5 people from API:');
        result.data.slice(0, 5).forEach((person: any, index: number) => {
          console.log(`  ${index + 1}. Rank ${person.rank}: ${person.name} (${person.company?.name})`);
        });
      }

    } catch (apiError) {
      console.error('API request failed:', apiError);
    }

    // Test the re-rank endpoint
    console.log('\n3. Testing re-rank endpoint...');
    
    try {
      const reRankResponse = await fetch('http://localhost:3000/api/v1/speedrun/re-rank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': ADRATA_WORKSPACE_ID,
          'x-user-id': ROSS_USER_ID
        },
        body: JSON.stringify({
          completedCount: 0,
          triggerAutoFetch: false,
          isDailyReset: false,
          manualRankUpdate: false,
          trigger: 'manual-test'
        })
      });

      if (!reRankResponse.ok) {
        console.error(`Re-rank API Error: ${reRankResponse.status} ${reRankResponse.statusText}`);
        const errorText = await reRankResponse.text();
        console.error('Re-rank error response:', errorText);
      } else {
        const reRankResult = await reRankResponse.json();
        console.log('Re-rank Response:', {
          success: reRankResult.success,
          message: reRankResult.message
        });
      }

    } catch (reRankError) {
      console.error('Re-rank request failed:', reRankError);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpeedrunAPI();
