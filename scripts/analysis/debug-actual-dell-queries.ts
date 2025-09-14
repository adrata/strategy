#!/usr/bin/env tsx

/**
 * 🐛 DEBUG ACTUAL DELL QUERIES
 * 
 * Debug the exact queries being sent to CoreSignal to understand why we're getting wrong companies
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { ComprehensiveSearchStrategy } from '../src/platform/services/buyer-group/comprehensive-search-strategy';
import { SellerProfileGenerator } from '../src/platform/services/buyer-group/seller-profiles';

async function debugActualDellQueries() {
  console.log('🐛 DEBUGGING ACTUAL DELL QUERIES');
  console.log('=================================');
  console.log('🎯 Goal: Understand why searches return non-Dell employees');
  console.log();

  const sellerProfile = SellerProfileGenerator.generateProfile('dell-na-enterprise-250k');
  
  if (!sellerProfile) {
    throw new Error('Dell seller profile not found');
  }

  console.log('🔍 Generating search strategy...');
  
  // Build search strategy  
  const strategy = ComprehensiveSearchStrategy.buildSearchStrategy(
    'Dell Technologies', 
    sellerProfile, 
    5  // Just 5 queries for debugging
  );
  
  console.log(`📊 Generated ${strategy.queries.length} queries`);
  console.log();

  // Show the actual queries being sent
  console.log('🔍 ACTUAL ELASTICSEARCH QUERIES BEING SENT:');
  console.log('===========================================');
  
  strategy.queries.forEach((query, i) => {
    console.log(`\n📋 Query ${i + 1}: ${query.description}`);
    console.log(`🎯 Role: ${query.role}`);
    console.log(`⭐ Priority: ${query.priority}`);
    console.log(`📄 Full Elasticsearch DSL:`);
    console.log(JSON.stringify(query.query, null, 2));
    console.log(`${'='.repeat(80)}`);
  });
  
  console.log();
  console.log('🔍 ANALYZING COMPANY MATCHING LOGIC:');
  console.log('====================================');
  
  // Extract and analyze the company matching part
  const firstQuery = strategy.queries[0];
  if (firstQuery && firstQuery.query.query) {
    const queryMust = firstQuery.query.query.bool?.must || [];
    console.log('📊 Query MUST clauses:');
    queryMust.forEach((mustClause: any, i: number) => {
      console.log(`   ${i + 1}. ${JSON.stringify(mustClause, null, 4)}`);
    });
  }
  
  console.log();
  console.log('💡 RECOMMENDATIONS:');
  console.log('===================');
  console.log('1. Check if the nested experience query is correctly structured');
  console.log('2. Verify company name variations include exact Dell matches');
  console.log('3. Ensure is_working and active_experience filters are correct');
  console.log('4. Test a simplified query with just company name matching');
}

// Run the debug
debugActualDellQueries().catch(console.error);
