#!/usr/bin/env tsx

/**
 * Test Speedrun API Script
 * 
 * Tests the speedrun API endpoints to verify they're working correctly
 * after the fixes have been applied
 */

interface SpeedrunPerson {
  id: string;
  name: string;
  globalRank: number | null;
  nextActionTiming: string;
  lastActionTime: string;
  company: {
    name: string;
  } | null;
}

interface ApiResponse {
  success: boolean;
  data: SpeedrunPerson[];
  meta: {
    count: number;
    responseTime: number;
    cached: boolean;
  };
}

/**
 * Test the speedrun API endpoint
 */
async function testSpeedrunAPI(workspaceId: string, userId: string): Promise<ApiResponse | null> {
  try {
    console.log(`🧪 Testing speedrun API for workspace: ${workspaceId}`);
    
    const response = await fetch(`http://localhost:3000/api/v1/speedrun?limit=50&refresh=true`, {
      method: 'GET',
      headers: {
        'x-workspace-id': workspaceId,
        'x-user-id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }
    
    const result: ApiResponse = await response.json();
    return result;
    
  } catch (error) {
    console.error('❌ API request failed:', error);
    return null;
  }
}

/**
 * Test the re-rank API endpoint
 */
async function testReRankAPI(workspaceId: string, userId: string): Promise<boolean> {
  try {
    console.log(`🔄 Testing re-rank API for workspace: ${workspaceId}`);
    
    const response = await fetch('http://localhost:3000/api/v1/speedrun/re-rank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId,
        'x-user-id': userId
      },
      body: JSON.stringify({
        completedCount: 0,
        triggerAutoFetch: false,
        isDailyReset: false,
        manualRankUpdate: false,
        trigger: 'manual-test'
      })
    });
    
    if (!response.ok) {
      console.error(`❌ Re-rank API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Re-rank error response:', errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Re-rank API response:', result);
    return result.success;
    
  } catch (error) {
    console.error('❌ Re-rank API request failed:', error);
    return false;
  }
}

/**
 * Analyze the API response
 */
function analyzeResponse(result: ApiResponse): void {
  console.log('\n📊 API RESPONSE ANALYSIS:');
  console.log(`  Success: ${result.success}`);
  console.log(`  Data count: ${result.data.length}`);
  console.log(`  Response time: ${result.meta.responseTime}ms`);
  console.log(`  Cached: ${result.meta.cached}`);
  
  if (result.data.length === 0) {
    console.log('❌ ISSUE: No data returned from API');
    return;
  }
  
  // Check ranking
  const rankedPeople = result.data.filter(p => p.globalRank && p.globalRank <= 50);
  console.log(`  Ranked people (1-50): ${rankedPeople.length}`);
  
  // Check timing
  const nowCount = result.data.filter(p => p.nextActionTiming === 'Now').length;
  const todayCount = result.data.filter(p => p.nextActionTiming === 'Tomorrow').length;
  const in7dCount = result.data.filter(p => p.nextActionTiming === 'in 7d').length;
  
  console.log(`  Timing distribution:`);
  console.log(`    "Now": ${nowCount}`);
  console.log(`    "Tomorrow": ${todayCount}`);
  console.log(`    "in 7d": ${in7dCount}`);
  
  // Show top 10
  console.log('\n🏆 TOP 10 PEOPLE:');
  result.data.slice(0, 10).forEach((person, index) => {
    const rankText = person.globalRank ? `Rank ${person.globalRank}` : 'No rank';
    const companyText = person.company?.name || 'No company';
    console.log(`  ${index + 1}. ${rankText}: ${person.name} (${companyText})`);
    console.log(`     Next Action: ${person.nextActionTiming}`);
    console.log(`     Last Action: ${person.lastActionTime}`);
    console.log('');
  });
  
  // Check for issues
  if (nowCount === 0 && todayCount === 0) {
    console.log('❌ ISSUE: No records showing "Now" or "Tomorrow" timing');
    console.log('   This suggests nextActionDate values are still stale');
  }
  
  if (in7dCount > 5) {
    console.log('⚠️  WARNING: Many records showing "in 7d" timing');
    console.log('   This suggests nextActionDate values are not set to today');
  }
  
  if (rankedPeople.length === 0) {
    console.log('❌ ISSUE: No people have globalRank values');
    console.log('   This suggests the ranking system has not been run');
  }
}

/**
 * Main test function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const workspaceId = args[0];
    const userId = args[1];
    
    if (!workspaceId || !userId) {
      console.log('Usage: tsx scripts/test-speedrun-api.ts <workspace-id> <user-id>');
      console.log('Example: tsx scripts/test-speedrun-api.ts 01K7464TNANHQXPCZT1FYX205V 01K7469230N74BVGK2PABPNNZ9');
      process.exit(1);
    }
    
    console.log('🧪 SPEEDRUN API TEST');
    console.log('====================\n');
    
    // Test 1: Speedrun API
    console.log('1. Testing speedrun API...');
    const speedrunResult = await testSpeedrunAPI(workspaceId, userId);
    
    if (speedrunResult) {
      analyzeResponse(speedrunResult);
    } else {
      console.log('❌ Speedrun API test failed');
      process.exit(1);
    }
    
    // Test 2: Re-rank API
    console.log('\n2. Testing re-rank API...');
    const reRankSuccess = await testReRankAPI(workspaceId, userId);
    
    if (reRankSuccess) {
      console.log('✅ Re-rank API test passed');
    } else {
      console.log('❌ Re-rank API test failed');
    }
    
    // Test 3: Speedrun API again (to see if re-ranking worked)
    console.log('\n3. Testing speedrun API after re-ranking...');
    const speedrunResult2 = await testSpeedrunAPI(workspaceId, userId);
    
    if (speedrunResult2) {
      console.log('📊 COMPARISON:');
      const beforeNow = speedrunResult.data.filter(p => p.nextActionTiming === 'Now').length;
      const afterNow = speedrunResult2.data.filter(p => p.nextActionTiming === 'Now').length;
      const beforeToday = speedrunResult.data.filter(p => p.nextActionTiming === 'Tomorrow').length;
      const afterToday = speedrunResult2.data.filter(p => p.nextActionTiming === 'Tomorrow').length;
      
      console.log(`  "Now" timing: ${beforeNow} -> ${afterNow} ${afterNow > beforeNow ? '✅' : ''}`);
      console.log(`  "Tomorrow" timing: ${beforeToday} -> ${afterToday} ${afterToday > beforeToday ? '✅' : ''}`);
    }
    
    console.log('\n🎉 API TEST COMPLETE');
    console.log('\nIf you see issues:');
    console.log('1. Run the diagnostic script to check database state');
    console.log('2. Run the fix script to update data');
    console.log('3. Clear browser cache and refresh the page');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

main();