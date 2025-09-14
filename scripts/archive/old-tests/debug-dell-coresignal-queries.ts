#!/usr/bin/env npx ts-node

/**
 * 🔍 DEBUG DELL CORESIGNAL QUERY ANALYSIS
 * 
 * This script analyzes what queries we're sending to CoreSignal for Dell
 * and identifies why we're getting poor results
 */

import { QueryBuilder } from '../src/platform/services/buyer-group/query-builder';
import { getSellerProfile } from '../src/platform/services/buyer-group/seller-profiles';

async function debugDellQueries() {
  console.log('🚀 DEBUGGING DELL CORESIGNAL QUERIES\n');
  
  const queryBuilder = new QueryBuilder();
  const sellerProfile = getSellerProfile('buyer-group-intelligence');
  const companyName = "Dell Technologies";
  
  console.log('📊 SELLER PROFILE CONFIGURATION:');
  console.log(`- Decision Level: ${sellerProfile.decisionLevel}`);
  console.log(`- Deal Size: ${sellerProfile.dealSize}`);
  console.log(`- Target Departments: ${sellerProfile.targetDepartments?.join(', ')}`);
  console.log(`- Decision Roles: ${sellerProfile.rolePriorities.decision.slice(0, 5).join(', ')}...`);
  console.log('');
  
  console.log('🏢 COMPANY VARIATIONS GENERATED:');
  // Test the company variation generation
  const variations = queryBuilder['generateCompanyVariations'](companyName, ['Dell', 'Dell Inc', 'Dell EMC']);
  variations.forEach((variation, index) => {
    console.log(`  ${index + 1}. "${variation}"`);
  });
  console.log('');
  
  console.log('🎯 DECISION MAKER QUERIES BEING BUILT:');
  const dmQueries = queryBuilder['buildDecisionMakerQueries'](variations, sellerProfile);
  dmQueries.slice(0, 3).forEach((query, index) => {
    console.log(`\n  Query ${index + 1}:`);
    console.log(`  ${JSON.stringify(query, null, 2)}`);
  });
  
  console.log('\n🚀 CHAMPION QUERIES BEING BUILT:');
  const championQueries = queryBuilder['buildChampionQueries'](variations, sellerProfile);
  championQueries.slice(0, 2).forEach((query, index) => {
    console.log(`\n  Query ${index + 1}:`);
    console.log(`  ${JSON.stringify(query, null, 2)}`);
  });
  
  console.log('\n🔍 MICRO-TARGETED QUERIES GENERATED:');
  const microQueries = queryBuilder.buildMicroTargetedQueries(companyName, sellerProfile);
  console.log(`  Total queries: ${microQueries.length}`);
  console.log(`  Expected to find: VP Sales, CRO, SVP Sales, Director Sales Operations`);
  console.log(`  Actual search targets:`);
  
  // Extract the search terms from queries
  microQueries.slice(0, 5).forEach((query, index) => {
    const queryStr = JSON.stringify(query);
    const titleMatches = queryStr.match(/"query":"([^"]+)"/g);
    if (titleMatches) {
      console.log(`    ${index + 1}. ${titleMatches.map(m => m.replace('"query":"', '').replace('"', '')).join(', ')}`);
    }
  });
  
  console.log('\n🚨 POTENTIAL ISSUES IDENTIFIED:');
  console.log('1. **Query Precision**: Are our title searches too broad?');
  console.log('2. **Company Matching**: Are we matching wrong "Dell" companies?');
  console.log('3. **Authority Filters**: Are we missing VP-level authority validation?');
  console.log('4. **Department Filtering**: Are we not filtering to sales/revenue functions?');
  
  console.log('\n💡 RECOMMENDED FIXES:');
  console.log('1. Add stricter company domain validation (dell.com)');
  console.log('2. Add mandatory sales/revenue department filtering');  
  console.log('3. Add minimum authority level validation for deal size');
  console.log('4. Add negative filters for clearly wrong roles (Police, Engineering)');
  
  console.log('\n✅ ANALYSIS COMPLETE');
}

debugDellQueries().catch(console.error);
