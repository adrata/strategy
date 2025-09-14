#!/usr/bin/env npx tsx

/**
 * 🔍 SEARCH VS. COLLECT OPTIMIZATION ANALYSIS
 * 
 * Analyzes the current buyer group pipeline to identify opportunities
 * for optimizing search vs collect credit usage.
 */

interface OptimizationAnalysis {
  current: {
    searchCredits: number;
    collectCredits: number;
    totalCredits: number;
    profilesCollected: number;
    finalBuyerGroupSize: number;
    efficiency: number; // profiles actually used / profiles collected
  };
  optimized: {
    searchCredits: number;
    collectCredits: number;
    totalCredits: number;
    profilesCollected: number;
    finalBuyerGroupSize: number;
    efficiency: number;
  };
  savings: {
    creditsS saved: number;
    costSaved: number;
    efficiencyImprovement: number;
  };
}

function analyzeDellOptimization(): OptimizationAnalysis {
  const CREDIT_COST = 0.08; // $0.08 per credit (Pro plan)
  
  // CURRENT APPROACH
  const current = {
    searchCredits: 8 * 2, // 8 search queries × 2 credits each
    collectCredits: 150 * 2, // 150 profile collections × 2 credits each
    totalCredits: 0,
    profilesCollected: 150,
    finalBuyerGroupSize: 12,
    efficiency: 0
  };
  current.totalCredits = current.searchCredits + current.collectCredits;
  current.efficiency = current.finalBuyerGroupSize / current.profilesCollected;

  // OPTIMIZED SEARCH-HEAVY APPROACH
  const optimized = {
    // More targeted searches to narrow candidates before collecting
    searchCredits: 25 * 2, // 25 micro-targeted search queries × 2 credits each
    collectCredits: 35 * 2, // Only collect top 35 candidates × 2 credits each
    totalCredits: 0,
    profilesCollected: 35,
    finalBuyerGroupSize: 12,
    efficiency: 0
  };
  optimized.totalCredits = optimized.searchCredits + optimized.collectCredits;
  optimized.efficiency = optimized.finalBuyerGroupSize / optimized.profilesCollected;

  // SAVINGS CALCULATION
  const savings = {
    creditsSaved: current.totalCredits - optimized.totalCredits,
    costSaved: (current.totalCredits - optimized.totalCredits) * CREDIT_COST,
    efficiencyImprovement: (optimized.efficiency - current.efficiency) / current.efficiency
  };

  return { current, optimized, savings };
}

function displayOptimizationReport(analysis: OptimizationAnalysis) {
  console.log('\n🔍 SEARCH vs. COLLECT OPTIMIZATION ANALYSIS');
  console.log('═══════════════════════════════════════════\n');

  console.log('📊 CURRENT APPROACH (COLLECT-HEAVY):');
  console.log(`   Search Queries: 8 × 2 credits = ${analysis.current.searchCredits} credits`);
  console.log(`   Profile Collections: ${analysis.current.profilesCollected} × 2 credits = ${analysis.current.collectCredits} credits`);
  console.log(`   Total Credits: ${analysis.current.totalCredits}`);
  console.log(`   Final Buyer Group: ${analysis.current.finalBuyerGroupSize} people`);
  console.log(`   Efficiency: ${(analysis.current.efficiency * 100).toFixed(1)}% (${analysis.current.finalBuyerGroupSize}/${analysis.current.profilesCollected} profiles used)`);
  console.log(`   Cost per Dell Buyer Group: $${(analysis.current.totalCredits * 0.08).toFixed(2)}\n`);

  console.log('🚀 OPTIMIZED APPROACH (SEARCH-HEAVY):');
  console.log(`   Targeted Search Queries: 25 × 2 credits = ${analysis.optimized.searchCredits} credits`);
  console.log(`   Profile Collections: ${analysis.optimized.profilesCollected} × 2 credits = ${analysis.optimized.collectCredits} credits`);
  console.log(`   Total Credits: ${analysis.optimized.totalCredits}`);
  console.log(`   Final Buyer Group: ${analysis.optimized.finalBuyerGroupSize} people`);
  console.log(`   Efficiency: ${(analysis.optimized.efficiency * 100).toFixed(1)}% (${analysis.optimized.finalBuyerGroupSize}/${analysis.optimized.profilesCollected} profiles used)`);
  console.log(`   Cost per Dell Buyer Group: $${(analysis.optimized.totalCredits * 0.08).toFixed(2)}\n`);

  console.log('💰 OPTIMIZATION SAVINGS:');
  console.log(`   Credits Saved: ${analysis.savings.creditsSaved} credits (${((analysis.savings.creditsSaved / analysis.current.totalCredits) * 100).toFixed(1)}% reduction)`);
  console.log(`   Cost Saved: $${analysis.savings.costSaved.toFixed(2)} per buyer group`);
  console.log(`   Efficiency Improvement: ${(analysis.savings.efficiencyImprovement * 100).toFixed(1)}% better`);
  console.log(`   Companies per Month: ${Math.floor(2551 / analysis.optimized.totalCredits)} vs ${Math.floor(2551 / analysis.current.totalCredits)} (current)`);
}

function generateOptimizationStrategy() {
  console.log('\n🎯 IMPLEMENTATION STRATEGY:');
  console.log('═══════════════════════════════════════\n');

  console.log('1. MICRO-TARGETED SEARCH QUERIES:');
  console.log('   • Search by specific role + department combinations');
  console.log('   • Search by seniority levels separately');
  console.log('   • Search by tenure ranges (reduce flight risk)');
  console.log('   • Search by location (if relevant to deal size)');
  console.log('   • Use boolean logic to combine criteria\n');

  console.log('2. SMART CANDIDATE RANKING:');
  console.log('   • Score candidates using search response metadata');
  console.log('   • Rank by role relevance, seniority, tenure');
  console.log('   • Prioritize decision makers and champions');
  console.log('   • Apply company size context (Dell = enterprise)\n');

  console.log('3. SELECTIVE COLLECTION:');
  console.log('   • Collect only top 35 candidates (vs 150 current)');
  console.log('   • Focus on high-probability buyer group members');
  console.log('   • Use progressive collection: collect, analyze, decide to continue\n');

  console.log('4. COST CONTROLS:');
  console.log('   • Max 25 search queries per company');
  console.log('   • Max 35 profile collections per company');
  console.log('   • Early stop if buyer group complete');
  console.log('   • Cache results for 72 hours');
}

// MAIN EXECUTION
async function main() {
  const analysis = analyzeDellOptimization();
  displayOptimizationReport(analysis);
  generateOptimizationStrategy();
  
  console.log('\n🚨 KEY INSIGHT:');
  console.log('   We only need ~12 people for the buyer group, but we\'re');
  console.log('   collecting 150+ profiles. Search is cheap, collect is expensive.');
  console.log('   This optimization could DOUBLE our pipeline capacity!\n');
}

main().catch(console.error);
