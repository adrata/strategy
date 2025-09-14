#!/usr/bin/env tsx

/**
 * 🧪 COMPANY FILTERING FIX TEST
 * 
 * Tests the fixed company matching logic without expensive full pipeline runs.
 * Should return Dell employees instead of random companies.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { ComprehensiveSearchStrategy } from '../src/platform/services/buyer-group/comprehensive-search-strategy';
import { sellerProfiles, SellerProfileGenerator } from '../src/platform/services/buyer-group/seller-profiles';
import { CoreSignalClient } from '../src/platform/services/buyer-group/coresignal-client';

async function testCompanyFilteringFix() {
  console.log('🧪 TESTING COMPANY FILTERING FIX');
  console.log('=====================================');
  console.log('🎯 Goal: Verify search returns Dell employees, not random companies');
  console.log('💰 Cost: Only 2-4 search credits (~$0.53)');
  console.log();

  const apiKey = process.env.CORESIGNAL_API_KEY;
  if (!apiKey) {
    throw new Error('CORESIGNAL_API_KEY not found in environment');
  }

  const client = new CoreSignalClient({
    apiKey,
    baseUrl: 'https://api.coresignal.com',
    maxCollects: 100,
    batchSize: 50,
    useCache: false,
    cacheTTL: 24
  });
  const sellerProfile = SellerProfileGenerator.generateProfile('dell-na-enterprise-250k');
  
  if (!sellerProfile) {
    throw new Error('Dell seller profile not found');
  }

  console.log('🔍 Building test search strategy...');
  
  // Build search strategy and take just 2 queries for testing
  const strategy = ComprehensiveSearchStrategy.buildSearchStrategy(
    'Dell Technologies', 
    sellerProfile, 
    20  // Generate 20, we'll only use 2
  );
  
  // Limit to just 2 queries for cost-effective testing
  strategy.queries = strategy.queries.slice(0, 2);
  
  console.log(`📊 Generated ${strategy.queries.length} test queries`);
  console.log(`💰 Expected cost: ${strategy.expectedCredits} credits ($${(strategy.expectedCredits * 0.133).toFixed(2)})`);
  console.log();

  // Execute the test queries
  console.log('🔍 Executing test searches...');
  const results: any[] = [];
  
  for (let i = 0; i < Math.min(2, strategy.queries.length); i++) {
    const query = strategy.queries[i];
    console.log(`   Query ${i + 1}: ${query.description}`);
    
    try {
      const searchResult = await client.searchCandidates(query.query, 10); // Only get 10 results
      
      if (searchResult && searchResult.length > 0) {
        results.push(...searchResult);
        console.log(`   ✅ Found ${searchResult.length} candidates`);
      } else {
        console.log(`   ⚠️  No results found`);
      }
    } catch (error) {
      console.log(`   ❌ Search failed: ${error}`);
    }
  }

  console.log();
  console.log('📊 COMPANY FILTERING TEST RESULTS:');
  console.log('=================================');
  
  if (results.length === 0) {
    console.log('❌ No candidates found - this indicates the search is too restrictive');
    return;
  }

  console.log(`📈 Total candidates found: ${results.length}`);
  
  // Check if results are actually from Dell
  const dellEmployees = results.filter(r => {
    const company = r.active_experience_company_name || r.company_name || 'Unknown';
    return company.toLowerCase().includes('dell');
  });
  
  const nonDellEmployees = results.filter(r => {
    const company = r.active_experience_company_name || r.company_name || 'Unknown';
    return !company.toLowerCase().includes('dell');
  });

  console.log(`✅ Dell employees: ${dellEmployees.length}`);
  console.log(`❌ Non-Dell employees: ${nonDellEmployees.length}`);
  
  if (dellEmployees.length > 0) {
    console.log();
    console.log('🎉 SUCCESS: Found Dell employees!');
    console.log('Sample Dell employees:');
    dellEmployees.slice(0, 3).forEach((emp, i) => {
      const company = emp.active_experience_company_name || emp.company_name || 'Unknown';
      const title = emp.active_experience_title || emp.title || 'Unknown';
      console.log(`   ${i + 1}. ${company} - ${title}`);
    });
  }
  
  if (nonDellEmployees.length > 0) {
    console.log();
    console.log('⚠️  WARNING: Found non-Dell employees (indicating filtering issue):');
    nonDellEmployees.slice(0, 3).forEach((emp, i) => {
      const company = emp.active_experience_company_name || emp.company_name || 'Unknown';
      const title = emp.active_experience_title || emp.title || 'Unknown';
      console.log(`   ${i + 1}. ${company} - ${title}`);
    });
  }

  const successRate = dellEmployees.length / results.length * 100;
  console.log();
  console.log(`📊 Company Filtering Success Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 80) {
    console.log('🎉 EXCELLENT: Company filtering is working correctly!');
    console.log('✅ Ready to run full pipeline without wasting credits on wrong companies');
  } else if (successRate >= 50) {
    console.log('⚠️  MODERATE: Some filtering issues remain, but much better');
  } else {
    console.log('❌ POOR: Company filtering still needs work');
  }
}

// Run the test
testCompanyFilteringFix().catch(console.error);
