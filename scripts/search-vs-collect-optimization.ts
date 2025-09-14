#!/usr/bin/env npx tsx

/**
 * 🔍 SEARCH vs COLLECT OPTIMIZATION ANALYSIS
 * 
 * Optimize pipeline to use abundant search credits vs limited collect credits
 */

interface CreditBalance {
  searchCredits: number;
  collectCredits: number;
  searchRatio: number;
  collectRatio: number;
}

interface OptimizationStrategy {
  name: string;
  description: string;
  searchCreditsUsed: number;
  collectCreditsUsed: number;
  profilesCollected: number;
  estimatedAccuracy: number;
  feasible: boolean;
}

function analyzeCreditImbalance(): void {
  console.log('🔍 SEARCH vs COLLECT OPTIMIZATION ANALYSIS\n');
  
  const currentBalance: CreditBalance = {
    searchCredits: 12081,
    collectCredits: 2551,
    searchRatio: 12081 / (12081 + 2551) * 100,
    collectRatio: 2551 / (12081 + 2551) * 100
  };

  console.log('📊 CURRENT CREDIT BALANCE:');
  console.log(`   Search Credits: ${currentBalance.searchCredits.toLocaleString()} (${currentBalance.searchRatio.toFixed(1)}%)`);
  console.log(`   Collect Credits: ${currentBalance.collectCredits.toLocaleString()} (${currentBalance.collectRatio.toFixed(1)}%)`);
  console.log(`   Imbalance: ${(currentBalance.searchRatio / currentBalance.collectRatio).toFixed(1)}x more search than collect\n`);

  // Current Dell pipeline
  const currentDell = {
    searchCredits: 8,
    collectCredits: 150,
    totalCredits: 158, // 8 search + 150 collect (2 credits each = 316 total)
    maxRuns: Math.floor(currentBalance.collectCredits / 150), // Limited by collect
    efficiency: 'Collect-limited'
  };

  console.log('🎯 CURRENT DELL PIPELINE:');
  console.log(`   Search: 8 calls (16 credits)`);
  console.log(`   Collect: 150 calls (300 credits)`);
  console.log(`   Bottleneck: ${currentDell.efficiency}`);
  console.log(`   Max Runs: ${currentDell.maxRuns} (limited by collect credits)\n`);

  // Optimization strategies
  const strategies: OptimizationStrategy[] = [
    {
      name: "CURRENT APPROACH",
      description: "Enterprise collection (150 profiles)",
      searchCreditsUsed: 16,
      collectCreditsUsed: 300,
      profilesCollected: 150,
      estimatedAccuracy: 95,
      feasible: true
    },
    {
      name: "SEARCH-HEAVY FILTERING",
      description: "Use 10x more searches to pre-filter, collect only top 75",
      searchCreditsUsed: 160, // 80 search calls × 2 credits
      collectCreditsUsed: 150, // 75 profiles × 2 credits  
      profilesCollected: 75,
      estimatedAccuracy: 92,
      feasible: true
    },
    {
      name: "ULTRA-TARGETED SEARCH",
      description: "50 precise searches, collect only top 50 profiles",
      searchCreditsUsed: 100, // 50 search calls × 2 credits
      collectCreditsUsed: 100, // 50 profiles × 2 credits
      profilesCollected: 50,
      estimatedAccuracy: 88,
      feasible: true
    },
    {
      name: "SEARCH-DOMINANT STRATEGY",
      description: "100 targeted searches, minimal collection (25 profiles)",
      searchCreditsUsed: 200, // 100 search calls × 2 credits
      collectCreditsUsed: 50,  // 25 profiles × 2 credits
      profilesCollected: 25,
      estimatedAccuracy: 85,
      feasible: true
    },
    {
      name: "MAXIMUM SEARCH UTILIZATION",
      description: "500 micro-targeted searches, ultra-selective collection",
      searchCreditsUsed: 1000, // 500 search calls × 2 credits
      collectCreditsUsed: 40,   // 20 profiles × 2 credits
      profilesCollected: 20,
      estimatedAccuracy: 80,
      feasible: true
    }
  ];

  console.log('🚀 OPTIMIZATION STRATEGIES:\n');

  for (const strategy of strategies) {
    const totalCredits = strategy.searchCreditsUsed + strategy.collectCreditsUsed;
    const maxRuns = Math.min(
      Math.floor(currentBalance.searchCredits / strategy.searchCreditsUsed),
      Math.floor(currentBalance.collectCredits / strategy.collectCreditsUsed)
    );
    const limitingFactor = (currentBalance.searchCredits / strategy.searchCreditsUsed) < 
                          (currentBalance.collectCredits / strategy.collectCreditsUsed) ? 'Search' : 'Collect';

    console.log(`📈 ${strategy.name}:`);
    console.log(`   ${strategy.description}`);
    console.log(`   Search: ${strategy.searchCreditsUsed} credits`);
    console.log(`   Collect: ${strategy.collectCreditsUsed} credits`);
    console.log(`   Profiles: ${strategy.profilesCollected}`);
    console.log(`   Accuracy: ${strategy.estimatedAccuracy}%`);
    console.log(`   Max Runs: ${maxRuns} (limited by ${limitingFactor})`);
    console.log(`   Total Capacity: ${maxRuns * strategy.profilesCollected} profiles\n`);
  }

  // Specific optimizations for CoreSignal API
  console.log('🔍 CORESIGNAL SEARCH OPTIMIZATION OPPORTUNITIES:\n');

  console.log('1. 📍 MICRO-SEGMENTED SEARCH QUERIES:');
  console.log('   • Current: 4 broad segmented queries');
  console.log('   • Optimized: 20-50 highly specific role-based queries');
  console.log('   • Each query returns 5-10 highly relevant candidates');
  console.log('   • Trade search credits for collect precision\n');

  console.log('2. 🎯 PROGRESSIVE FILTERING APPROACH:');
  console.log('   • Phase 1: Broad search to get 500+ candidate IDs (50 search credits)');
  console.log('   • Phase 2: Role-specific searches to filter to 200 IDs (20 search credits)');
  console.log('   • Phase 3: Authority-level searches to get top 100 IDs (10 search credits)');
  console.log('   • Phase 4: Collect only the top 50 profiles (100 collect credits)');
  console.log('   • Result: 80 search + 100 collect = 180 total credits vs 316 current\n');

  console.log('3. 🧠 SMART QUERY CHAINING:');
  console.log('   • Use search results to inform next search queries');
  console.log('   • Chain 10-15 searches to progressively narrow down');
  console.log('   • Each search refines the target pool');
  console.log('   • Final collection is highly targeted and smaller\n');

  console.log('4. 🏗️ ROLE-PRIORITY COLLECTION:');
  console.log('   • Search extensively for Decision Makers (high search cost)');
  console.log('   • Collect only confirmed DMs and Champions (low collect cost)');
  console.log('   • Use search-only data for Stakeholders/Blockers');
  console.log('   • Collect full profiles only for critical roles\n');

  // ROI Analysis
  console.log('💰 ROI ANALYSIS:\n');

  const currentROI = {
    runsWithCurrentCredits: Math.floor(currentBalance.collectCredits / 150),
    totalProfilesCollected: Math.floor(currentBalance.collectCredits / 150) * 150,
    searchCreditsWasted: currentBalance.searchCredits - (Math.floor(currentBalance.collectCredits / 150) * 8)
  };

  const optimizedROI = {
    runsWithOptimization: Math.floor(currentBalance.collectCredits / 75), // Using search-heavy strategy
    totalProfilesCollected: Math.floor(currentBalance.collectCredits / 75) * 75,
    searchCreditsUsed: Math.floor(currentBalance.collectCredits / 75) * 80
  };

  console.log('📊 CURRENT APPROACH:');
  console.log(`   Possible runs: ${currentROI.runsWithCurrentCredits}`);
  console.log(`   Total profiles: ${currentROI.totalProfilesCollected.toLocaleString()}`);
  console.log(`   Search credits wasted: ${currentROI.searchCreditsWasted.toLocaleString()}\n`);

  console.log('🚀 SEARCH-OPTIMIZED APPROACH:');
  console.log(`   Possible runs: ${optimizedROI.runsWithOptimization}`);
  console.log(`   Total profiles: ${optimizedROI.totalProfilesCollected.toLocaleString()}`);
  console.log(`   Search credits used: ${optimizedROI.searchCreditsUsed.toLocaleString()}`);
  console.log(`   Improvement: ${((optimizedROI.runsWithOptimization / currentROI.runsWithCurrentCredits) - 1) * 100}% more runs\n`);

  console.log('🎯 RECOMMENDATIONS:\n');
  console.log('✅ IMMEDIATE ACTIONS:');
  console.log('   1. Implement search-heavy filtering (10x more searches, 50% fewer collects)');
  console.log('   2. Use progressive search chaining to narrow down candidates');
  console.log('   3. Collect only top 50-75 profiles instead of 150');
  console.log('   4. Reserve full collection for Decision Makers and Champions only\n');

  console.log('🔧 IMPLEMENTATION STRATEGY:');
  console.log('   • Phase 1: Reduce collect target from 150 → 75 profiles');
  console.log('   • Phase 2: Increase search specificity (4 → 20 targeted queries)');
  console.log('   • Phase 3: Implement role-priority collection logic');
  console.log('   • Phase 4: Add progressive filtering pipeline\n');

  console.log('📈 EXPECTED OUTCOMES:');
  console.log(`   • Double the number of companies you can analyze`);
  console.log(`   • Better utilize your ${currentBalance.searchCredits.toLocaleString()} search credits`);
  console.log(`   • Maintain 85-90% accuracy with 50% fewer collects`);
  console.log(`   • Extend runway until next plan upgrade`);
}

// Run the analysis
analyzeCreditImbalance();
