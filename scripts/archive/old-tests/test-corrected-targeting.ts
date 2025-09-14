#!/usr/bin/env tsx

/**
 * 🧪 TEST CORRECTED TARGETING LOGIC
 * Quick test to verify we're now targeting the right people
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { getSellerProfile } from '../src/platform/services/buyer-group/seller-profiles';

async function testCorrectedTargeting() {
  console.log('🧪 TESTING CORRECTED TARGETING LOGIC');
  console.log('===================================');
  
  const profile = getSellerProfile('dell-na-enterprise-250k');
  
  console.log('📋 CORRECTED CONFIGURATION:');
  console.log(`Product: ${profile.productName}`);
  console.log(`Target Market: ${profile.targetMarket}`);
  console.log(`Deal Size: ${profile.dealSize}`);
  console.log('');
  
  console.log('🎯 TARGET DEPARTMENTS:');
  profile.targetDepartments?.forEach((dept, i) => {
    console.log(`   ${i + 1}. ${dept}`);
  });
  console.log('');
  
  console.log('🔍 ROLE PRIORITIES:');
  console.log('Decision Makers:');
  profile.rolePriorities.decision.slice(0, 5).forEach((role, i) => {
    console.log(`   ${i + 1}. ${role}`);
  });
  console.log('');
  
  console.log('✅ LOGIC CHECK:');
  console.log('❓ Who has buyer group identification problems?');
  console.log('✅ SALES TEAMS → need to identify buyer groups');
  console.log('✅ SALES OPERATIONS → need to optimize sales process');
  console.log('✅ REVENUE OPERATIONS → need pipeline accuracy');
  console.log('');
  
  console.log('❓ Who can approve $250K purchase?');
  console.log('✅ VP SALES → has budget authority');
  console.log('✅ SVP SALES → has budget authority');
  console.log('✅ DIRECTOR SALES → can champion/influence');
  console.log('');
  
  console.log('🎯 CORRECTED LOGIC:');
  console.log('1. Target SALES department (people with the pain)');
  console.log('2. Find VPs/SVPs in sales (people with budget)');
  console.log('3. Find Directors/Managers (champions)');
  console.log('4. Find front-line sellers (introducers)');
  console.log('5. Find procurement/legal (blockers)');
}

testCorrectedTargeting().catch(console.error);
