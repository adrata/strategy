#!/usr/bin/env node

/**
 * Simple Cost Analysis - No Overlap Complexity
 * Using actual CoreSignal pricing from dashboard
 */

// CoreSignal Pricing from the dashboard image
const ANNUAL_PRICING = {
  creditCost: 0.004, // $0.004 per credit (annual plan)
  search: 2,         // 2 credits per search request
  collect: 2,        // 2 credits per profile collected (multi-source)
  headcount: 1       // 1 credit per company historical data
};

// Simple scenario: 10 companies × 100 sellers × 1000 accounts each
const SCENARIO = {
  companies: 10,
  sellersPerCompany: 100,
  accountsPerSeller: 1000,
  totalAccounts: 10 * 100 * 1000 // 1,000,000 total accounts
};

// Account size distribution (medium/large enterprise)
const ACCOUNT_COSTS = {
  medium: {
    proportion: 0.60, // 60% of accounts
    employees: 2500,
    searchRequests: 2,    // 2 searches per account
    profilesCollected: 80, // 80 profiles collected
    avgBuyerGroupSize: 9
  },
  large: {
    proportion: 0.40, // 40% of accounts  
    employees: 15000,
    searchRequests: 3,     // 3 searches per account
    profilesCollected: 120, // 120 profiles collected
    avgBuyerGroupSize: 11
  }
};

function calculateSimpleCosts() {
  console.log('💰 SIMPLE COST ANALYSIS - NO OVERLAP COMPLEXITY');
  console.log('='.repeat(80));
  console.log(`Scenario: ${SCENARIO.companies} companies × ${SCENARIO.sellersPerCompany} sellers × ${SCENARIO.accountsPerSeller} accounts each`);
  console.log(`Total accounts: ${SCENARIO.totalAccounts.toLocaleString()}`);
  console.log(`CoreSignal pricing: $${ANNUAL_PRICING.creditCost} per credit (annual plan)\n`);

  // Calculate costs per account type
  const mediumAccounts = SCENARIO.totalAccounts * ACCOUNT_COSTS.medium.proportion;
  const largeAccounts = SCENARIO.totalAccounts * ACCOUNT_COSTS.large.proportion;

  // Medium account costs
  const mediumSearchCost = ACCOUNT_COSTS.medium.searchRequests * ANNUAL_PRICING.search * ANNUAL_PRICING.creditCost;
  const mediumCollectCost = ACCOUNT_COSTS.medium.profilesCollected * ANNUAL_PRICING.collect * ANNUAL_PRICING.creditCost;
  const mediumCompanyCost = ANNUAL_PRICING.headcount * ANNUAL_PRICING.creditCost;
  const mediumTotalCost = mediumSearchCost + mediumCollectCost + mediumCompanyCost;

  // Large account costs
  const largeSearchCost = ACCOUNT_COSTS.large.searchRequests * ANNUAL_PRICING.search * ANNUAL_PRICING.creditCost;
  const largeCollectCost = ACCOUNT_COSTS.large.profilesCollected * ANNUAL_PRICING.collect * ANNUAL_PRICING.creditCost;
  const largeCompanyCost = ANNUAL_PRICING.headcount * ANNUAL_PRICING.creditCost;
  const largeTotalCost = largeSearchCost + largeCollectCost + largeCompanyCost;

  console.log('📊 PER ACCOUNT COSTS');
  console.log('-'.repeat(50));
  console.log(`Medium Account (${ACCOUNT_COSTS.medium.employees.toLocaleString()} employees):`);
  console.log(`  Search: ${ACCOUNT_COSTS.medium.searchRequests} requests × 2 credits × $0.004 = $${mediumSearchCost.toFixed(3)}`);
  console.log(`  Collect: ${ACCOUNT_COSTS.medium.profilesCollected} profiles × 2 credits × $0.004 = $${mediumCollectCost.toFixed(2)}`);
  console.log(`  Company Intel: 1 × 1 credit × $0.004 = $${mediumCompanyCost.toFixed(3)}`);
  console.log(`  Total per medium account: $${mediumTotalCost.toFixed(2)}`);
  console.log('');
  console.log(`Large Account (${ACCOUNT_COSTS.large.employees.toLocaleString()} employees):`);
  console.log(`  Search: ${ACCOUNT_COSTS.large.searchRequests} requests × 2 credits × $0.004 = $${largeSearchCost.toFixed(3)}`);
  console.log(`  Collect: ${ACCOUNT_COSTS.large.profilesCollected} profiles × 2 credits × $0.004 = $${largeCollectCost.toFixed(2)}`);
  console.log(`  Company Intel: 1 × 1 credit × $0.004 = $${largeCompanyCost.toFixed(3)}`);
  console.log(`  Total per large account: $${largeTotalCost.toFixed(2)}`);

  // Total costs
  const totalMediumCost = mediumAccounts * mediumTotalCost;
  const totalLargeCost = largeAccounts * largeTotalCost;
  const grandTotal = totalMediumCost + totalLargeCost;

  console.log('\n💸 TOTAL COSTS');
  console.log('-'.repeat(50));
  console.log(`Medium accounts: ${mediumAccounts.toLocaleString()} × $${mediumTotalCost.toFixed(2)} = $${totalMediumCost.toLocaleString()}`);
  console.log(`Large accounts: ${largeAccounts.toLocaleString()} × $${largeTotalCost.toFixed(2)} = $${totalLargeCost.toLocaleString()}`);
  console.log(`GRAND TOTAL: $${grandTotal.toLocaleString()}`);

  // Per company/seller breakdown
  const costPerCompany = grandTotal / SCENARIO.companies;
  const costPerSeller = grandTotal / (SCENARIO.companies * SCENARIO.sellersPerCompany);
  const costPerAccount = grandTotal / SCENARIO.totalAccounts;

  console.log('\n📋 BREAKDOWN');
  console.log('-'.repeat(50));
  console.log(`Cost per company: $${costPerCompany.toLocaleString()}`);
  console.log(`Cost per seller: $${costPerSeller.toLocaleString()}`);
  console.log(`Cost per buyer group: $${costPerAccount.toFixed(2)}`);

  // Revenue projections
  console.log('\n💰 REVENUE PROJECTIONS');
  console.log('-'.repeat(50));
  
  const margins = [0.50, 0.65, 0.75, 0.85];
  
  margins.forEach(margin => {
    const revenuePerCompany = costPerCompany / (1 - margin);
    const totalRevenue = revenuePerCompany * SCENARIO.companies;
    const totalProfit = totalRevenue - grandTotal;
    
    console.log(`${Math.round(margin*100)}% margin:`);
    console.log(`  Price per company: $${revenuePerCompany.toLocaleString()}`);
    console.log(`  Total revenue: $${totalRevenue.toLocaleString()}`);
    console.log(`  Total profit: $${totalProfit.toLocaleString()}`);
    console.log('');
  });

  // Credit usage summary
  const mediumCredits = ACCOUNT_COSTS.medium.searchRequests * ANNUAL_PRICING.search + 
                       ACCOUNT_COSTS.medium.profilesCollected * ANNUAL_PRICING.collect + 
                       ANNUAL_PRICING.headcount;
  const largeCredits = ACCOUNT_COSTS.large.searchRequests * ANNUAL_PRICING.search + 
                      ACCOUNT_COSTS.large.profilesCollected * ANNUAL_PRICING.collect + 
                      ANNUAL_PRICING.headcount;
  
  const totalCredits = (mediumAccounts * mediumCredits) + (largeAccounts * largeCredits);

  console.log('\n🎯 CREDIT USAGE SUMMARY');
  console.log('-'.repeat(50));
  console.log(`Total credits needed: ${totalCredits.toLocaleString()}`);
  console.log(`At $0.004/credit = $${(totalCredits * ANNUAL_PRICING.creditCost).toLocaleString()}`);
  console.log(`Credits per account: ${(totalCredits / SCENARIO.totalAccounts).toFixed(0)}`);
  
  return {
    grandTotal,
    costPerCompany,
    costPerSeller,
    costPerAccount,
    totalCredits
  };
}

if (require.main === module) {
  calculateSimpleCosts();
}

module.exports = { calculateSimpleCosts };
