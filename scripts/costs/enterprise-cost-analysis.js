#!/usr/bin/env node

/**
 * Enterprise Cost Analysis for 10 Companies × 100 Sellers × 1000 Buyer Groups
 * Includes caching overlap analysis and revenue projections
 */

// CoreSignal Pricing (actual rates)
const PRICING = {
  search: 2,      // 2 credits per search request
  collect: 2,     // 2 credits per profile collected (multi-source)
  headcount: 1,   // 1 credit per company historical data
  creditCost: 0.098 // $0.098 per credit (Starter plan rate)
};

// Company overlap scenarios (based on target account similarity)
const OVERLAP_SCENARIOS = {
  high_overlap: {
    description: "Fortune 500 targeting - 70% account overlap",
    accountOverlap: 0.70,
    profileOverlap: 0.85, // Higher profile overlap due to executive mobility
    cacheHitRate: 0.60
  },
  medium_overlap: {
    description: "Industry-focused - 40% account overlap", 
    accountOverlap: 0.40,
    profileOverlap: 0.60,
    cacheHitRate: 0.35
  },
  low_overlap: {
    description: "Diversified markets - 15% account overlap",
    accountOverlap: 0.15,
    profileOverlap: 0.25,
    cacheHitRate: 0.10
  }
};

// Target account size distribution
const ACCOUNT_SIZES = {
  medium: {
    proportion: 0.60, // 60% of targets
    avgEmployees: 2500,
    avgCandidatePool: 150,
    avgProfilesCollected: 80,
    avgBuyerGroupSize: 9,
    complexity: 'medium'
  },
  large: {
    proportion: 0.40, // 40% of targets  
    avgEmployees: 15000,
    avgCandidatePool: 400,
    avgProfilesCollected: 120,
    avgBuyerGroupSize: 11,
    complexity: 'high'
  }
};

function calculateEnterpriseScenario(scenario = 'medium_overlap') {
  const overlap = OVERLAP_SCENARIOS[scenario];
  
  // Base scenario
  const companies = 10;
  const sellersPerCompany = 100;
  const accountsPerSeller = 1000;
  const totalSellerAccounts = companies * sellersPerCompany * accountsPerSeller; // 1M total
  
  // Account distribution
  const mediumAccounts = Math.round(totalSellerAccounts * ACCOUNT_SIZES.medium.proportion);
  const largeAccounts = Math.round(totalSellerAccounts * ACCOUNT_SIZES.large.proportion);
  
  // Calculate unique accounts after overlap
  const uniqueAccounts = Math.round(totalSellerAccounts * (1 - overlap.accountOverlap));
  const uniqueMedium = Math.round(mediumAccounts * (1 - overlap.accountOverlap));
  const uniqueLarge = Math.round(largeAccounts * (1 - overlap.accountOverlap));
  
  console.log(`📊 ENTERPRISE SCENARIO: ${overlap.description.toUpperCase()}`);
  console.log('='.repeat(80));
  console.log(`Companies: ${companies}`);
  console.log(`Sellers per company: ${sellersPerCompany}`);
  console.log(`Target accounts per seller: ${accountsPerSeller}`);
  console.log(`Total seller-account combinations: ${totalSellerAccounts.toLocaleString()}`);
  console.log(`Unique target accounts (after ${Math.round(overlap.accountOverlap*100)}% overlap): ${uniqueAccounts.toLocaleString()}`);
  console.log(`├─ Medium accounts (${ACCOUNT_SIZES.medium.proportion*100}%): ${uniqueMedium.toLocaleString()}`);
  console.log(`└─ Large accounts (${ACCOUNT_SIZES.large.proportion*100}%): ${uniqueLarge.toLocaleString()}`);
  
  // Cost calculation without caching
  const costMedium = calculateAccountCosts(ACCOUNT_SIZES.medium);
  const costLarge = calculateAccountCosts(ACCOUNT_SIZES.large);
  
  const totalCostMedium = uniqueMedium * costMedium.totalCost;
  const totalCostLarge = uniqueLarge * costLarge.totalCost;
  const totalCostWithoutCache = totalCostMedium + totalCostLarge;
  
  // Cost with caching (profile collection savings)
  const cacheHitRate = overlap.cacheHitRate;
  const collectSavingsRate = cacheHitRate * 0.70; // 70% of collect costs saved on cache hits
  
  const cachedCostMedium = uniqueMedium * (costMedium.totalCost * (1 - collectSavingsRate));
  const cachedCostLarge = uniqueLarge * (costLarge.totalCost * (1 - collectSavingsRate));
  const totalCostWithCache = cachedCostMedium + cachedCostLarge;
  
  const cacheSavings = totalCostWithoutCache - totalCostWithCache;
  
  console.log('\n💰 COST BREAKDOWN');
  console.log('-'.repeat(80));
  console.log('Per Account Costs:');
  console.log(`Medium account: $${costMedium.totalCost.toFixed(2)} (${costMedium.profilesCollected} profiles)`);
  console.log(`Large account: $${costLarge.totalCost.toFixed(2)} (${costLarge.profilesCollected} profiles)`);
  
  console.log('\nTotal Costs:');
  console.log(`Without caching: $${totalCostWithoutCache.toLocaleString()}`);
  console.log(`With caching (${Math.round(cacheHitRate*100)}% hit rate): $${totalCostWithCache.toLocaleString()}`);
  console.log(`Cache savings: $${cacheSavings.toLocaleString()} (${Math.round((cacheSavings/totalCostWithoutCache)*100)}%)`);
  
  console.log('\nPer Company Breakdown:');
  console.log(`Cost per company: $${(totalCostWithCache/companies).toLocaleString()}`);
  console.log(`Cost per seller: $${(totalCostWithCache/(companies*sellersPerCompany)).toLocaleString()}`);
  console.log(`Cost per buyer group: $${(totalCostWithCache/uniqueAccounts).toFixed(2)}`);
  
  // Revenue projections
  console.log('\n💵 REVENUE PROJECTIONS');
  console.log('-'.repeat(80));
  
  const margins = [0.50, 0.65, 0.75, 0.85]; // 50%, 65%, 75%, 85% margins
  
  margins.forEach(margin => {
    const revenuePerCompany = totalCostWithCache / companies / (1 - margin);
    const revenuePerSeller = revenuePerCompany / sellersPerCompany;
    const totalRevenue = revenuePerCompany * companies;
    const profit = totalRevenue - totalCostWithCache;
    
    console.log(`${Math.round(margin*100)}% Margin:`);
    console.log(`  Revenue per company: $${revenuePerCompany.toLocaleString()}`);
    console.log(`  Revenue per seller: $${revenuePerSeller.toLocaleString()}`);
    console.log(`  Total revenue: $${totalRevenue.toLocaleString()}`);
    console.log(`  Total profit: $${profit.toLocaleString()}`);
    console.log('');
  });
  
  return {
    scenario: scenario,
    costs: {
      withoutCache: totalCostWithoutCache,
      withCache: totalCostWithCache,
      savings: cacheSavings,
      perCompany: totalCostWithCache/companies,
      perSeller: totalCostWithCache/(companies*sellersPerCompany),
      perBuyerGroup: totalCostWithCache/uniqueAccounts
    },
    accounts: {
      total: totalSellerAccounts,
      unique: uniqueAccounts,
      medium: uniqueMedium,
      large: uniqueLarge
    },
    caching: {
      hitRate: cacheHitRate,
      savingsRate: Math.round((cacheSavings/totalCostWithoutCache)*100)
    }
  };
}

function calculateAccountCosts(accountSize) {
  // Search costs (1-3 searches based on complexity)
  const searchRequests = accountSize.complexity === 'high' ? 3 : 2;
  const searchCost = searchRequests * PRICING.search * PRICING.creditCost;
  
  // Collection costs
  const collectCost = accountSize.avgProfilesCollected * PRICING.collect * PRICING.creditCost;
  
  // Company intelligence cost
  const companyCost = PRICING.headcount * PRICING.creditCost;
  
  const totalCost = searchCost + collectCost + companyCost;
  
  return {
    searchCost,
    collectCost, 
    companyCost,
    totalCost,
    profilesCollected: accountSize.avgProfilesCollected,
    creditsUsed: searchRequests * PRICING.search + accountSize.avgProfilesCollected * PRICING.collect + PRICING.headcount
  };
}

function generateComparisonTable() {
  console.log('\n📋 SCENARIO COMPARISON TABLE');
  console.log('='.repeat(100));
  
  const scenarios = Object.keys(OVERLAP_SCENARIOS);
  const results = scenarios.map(scenario => calculateEnterpriseScenario(scenario));
  
  console.log('\n🔄 OVERLAP IMPACT SUMMARY');
  console.log('-'.repeat(100));
  console.log('Scenario'.padEnd(20) + 'Overlap'.padEnd(12) + 'Cache Hit'.padEnd(12) + 'Total Cost'.padEnd(15) + 'Per Company'.padEnd(15) + 'Savings'.padEnd(10));
  console.log('-'.repeat(100));
  
  results.forEach(result => {
    const overlap = OVERLAP_SCENARIOS[result.scenario];
    console.log(
      overlap.description.padEnd(20) +
      `${Math.round(overlap.accountOverlap*100)}%`.padEnd(12) +
      `${Math.round(overlap.cacheHitRate*100)}%`.padEnd(12) +
      `$${result.costs.withCache.toLocaleString()}`.padEnd(15) +
      `$${result.costs.perCompany.toLocaleString()}`.padEnd(15) +
      `${result.caching.savingsRate}%`.padEnd(10)
    );
  });
  
  return results;
}

if (require.main === module) {
  // Run all scenarios
  const results = generateComparisonTable();
  
  console.log('\n🎯 RECOMMENDED PRICING STRATEGY');
  console.log('='.repeat(80));
  console.log('Based on Medium Overlap scenario (most realistic):');
  const mediumResult = results.find(r => r.scenario === 'medium_overlap');
  console.log(`Total COGS: $${mediumResult.costs.withCache.toLocaleString()}`);
  console.log(`Cost per company: $${mediumResult.costs.perCompany.toLocaleString()}`);
  console.log('');
  console.log('Recommended pricing (75% margin):');
  const recommendedPrice = mediumResult.costs.perCompany / 0.25; // 75% margin
  console.log(`Price per company: $${recommendedPrice.toLocaleString()}`);
  console.log(`Total revenue: $${(recommendedPrice * 10).toLocaleString()}`);
  console.log(`Total profit: $${(recommendedPrice * 10 - mediumResult.costs.withCache).toLocaleString()}`);
}

module.exports = { calculateEnterpriseScenario, generateComparisonTable };
