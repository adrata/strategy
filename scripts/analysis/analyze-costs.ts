#!/usr/bin/env npx tsx

/**
 * 💰 COST ANALYSIS SCRIPT
 * 
 * Analyzes API costs and provides optimization recommendations
 */

import { BuyerGroupPipeline, runBuyerGroupPipeline } from '../src/platform/services/buyer-group/index';
import { getSellerProfile } from '../src/platform/services/buyer-group/seller-profiles';

async function analyzeCosts() {
  console.log('🔍 COMPREHENSIVE COST ANALYSIS FOR DELL TECHNOLOGIES\n');
  
  try {
    // Initialize pipeline
    const sellerProfile = getSellerProfile('buyer-group-intelligence');
    
    const config = {
      sellerProfile,
      coreSignal: {
        apiKey: process.env.CORESIGNAL_API_KEY || '',
        baseUrl: 'https://api.coresignal.com',
        maxCollects: 150, // Current enterprise setting
        batchSize: 25,
        useCache: true,
        cacheTTL: 24
      },
      analysis: {
        minInfluenceScore: 5,
        maxBuyerGroupSize: 18,
        requireDirector: false,
        allowIC: true,
        targetBuyerGroupRange: { min: 12, max: 18 }
      },
      output: {
        format: 'json' as const,
        includeFlightRisk: true,
        includeDecisionFlow: true,
        generatePlaybooks: true
      }
    };

    const pipeline = new BuyerGroupPipeline(config);
    
    // Run cost analysis
    const costAnalysis = await pipeline.analyzeCostOptimization('Dell Technologies');
    
    console.log('📊 CURRENT CONFIGURATION:');
    console.log(`   Company Size: ${costAnalysis.currentConfig.companySize}`);
    console.log(`   Max Collects: ${costAnalysis.currentConfig.maxCollects}`);
    console.log(`   Batch Size: ${costAnalysis.currentConfig.batchSize}`);
    console.log(`   Target Range: ${costAnalysis.currentConfig.targetRange.min}-${costAnalysis.currentConfig.targetRange.max} members\n`);
    
    console.log('💰 COST BREAKDOWN (CURRENT):');
    console.log(`   Main Search: ${costAnalysis.costBreakdown.mainSearch.cost} credits (${costAnalysis.costBreakdown.mainSearch.description})`);
    console.log(`   Main Collection: ${costAnalysis.costBreakdown.mainCollection.cost} credits (${costAnalysis.costBreakdown.mainCollection.description})`);
    console.log(`   Role Gap-Fill: ${costAnalysis.costBreakdown.roleGapFill.cost} credits (${costAnalysis.costBreakdown.roleGapFill.description})`);
    console.log(`   Introducer Gap-Fill: ${costAnalysis.costBreakdown.introducerGapFill.cost} credits (${costAnalysis.costBreakdown.introducerGapFill.description})`);
    console.log(`   ═══ TOTAL: ${costAnalysis.costBreakdown.total} credits ═══\n`);
    
    console.log('🚨 OPTIMIZATION RESULTS:');
    console.log(`   Old Problematic Cost: ${costAnalysis.optimizationSuggestions.oldProblematicCost} credits (role gap-fill)`);
    console.log(`   New Optimized Cost: ${costAnalysis.optimizationSuggestions.newOptimizedCost} credits (role gap-fill)`);
    console.log(`   💰 CREDITS SAVED: ${costAnalysis.optimizationSuggestions.creditsSaved} credits`);
    console.log(`   Explanation: ${costAnalysis.optimizationSuggestions.explanation}\n`);
    
    console.log('🎯 RECOMMENDED FURTHER OPTIMIZATIONS:');
    console.log(`   Reduce Max Collects: ${costAnalysis.recommendedConfig.maxCollects} (from ${costAnalysis.currentConfig.maxCollects})`);
    console.log(`   Role Search Limit: ${costAnalysis.recommendedConfig.roleSearchLimit} profiles max`);
    console.log(`   Introducer Limit: ${costAnalysis.recommendedConfig.introducerLimit} profiles max`);
    console.log(`   Estimated Total Cost: ${costAnalysis.recommendedConfig.estimatedTotalCost} credits\n`);
    
    // Calculate cost at $0.20 per credit
    const currentCostUSD = costAnalysis.costBreakdown.total * 0.20;
    const recommendedCostUSD = costAnalysis.recommendedConfig.estimatedTotalCost * 0.20;
    const savingsUSD = currentCostUSD - recommendedCostUSD;
    
    console.log('💵 COST IN USD:');
    console.log(`   Current Configuration: $${currentCostUSD.toFixed(2)}`);
    console.log(`   Recommended Configuration: $${recommendedCostUSD.toFixed(2)}`);
    console.log(`   💰 Potential Savings: $${savingsUSD.toFixed(2)} per run\n`);
    
    console.log('📝 WHAT CAUSED THE 500 CREDIT CONSUMPTION:');
    console.log('   1. Role gap-fill was using full maxCollects (150) instead of limited search');
    console.log('   2. Multiple role-specific searches (decision, champion, introducer)');
    console.log('   3. Each search: 150 profiles × 2 credits = 300 credits PER ROLE');
    console.log('   4. Total problematic cost: 3 roles × 300 credits = 900 credits');
    console.log('   5. Your 500 credits = partial execution before hitting limits\n');
    
    console.log('✅ FIXES IMPLEMENTED:');
    console.log('   ✓ Role gap-fill limited to 30 profiles max (was 150)');
    console.log('   ✓ Introducer gap-fill limited to 15 profiles max');
    console.log('   ✓ Added cost tracking and logging');
    console.log('   ✓ Realistic credit estimates before execution\n');
    
  } catch (error) {
    console.error('❌ Cost analysis failed:', error);
  }
}

// Run the analysis
analyzeCosts();
