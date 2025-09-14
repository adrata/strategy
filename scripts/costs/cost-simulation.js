#!/usr/bin/env node

/**
 * Cost Simulation for Buyer Group Pipeline
 * Analyzes cost vs accuracy trade-offs across different early stop modes
 */

// CoreSignal Pricing (based on actual rates)
const PRICING = {
  search: 2,      // 2 credits per search request
  collect: 2,     // 2 credits per profile collected (multi-source)
  headcount: 1,   // 1 credit per company historical data
  creditCost: 0.098 // $0.098 per credit (Starter plan rate)
};

// Different early stop modes and their behavior
const EARLY_STOP_MODES = {
  'off': {
    description: 'No early stop - collect all candidates',
    minProfiles: 200,
    maxProfiles: 300,
    accuracy: 98,
    completeness: 100
  },
  'accuracy_first': {
    description: 'High accuracy requirements',
    minProfiles: 80,
    maxProfiles: 150,
    minDecisionMakers: 2,
    minChampions: 2,
    minStakeholders: 1,
    minTotalMembers: 10,
    accuracy: 95,
    completeness: 95
  },
  'conservative': {
    description: 'Balanced approach',
    minProfiles: 50,
    maxProfiles: 100,
    minDecisionMakers: 1,
    minChampions: 1,
    minStakeholders: 1,
    minTotalMembers: 8,
    accuracy: 90,
    completeness: 85
  },
  'aggressive': {
    description: 'Early stop for cost savings',
    minProfiles: 30,
    maxProfiles: 60,
    minDecisionMakers: 1,
    minChampions: 1,
    accuracy: 80,
    completeness: 70
  }
};

// Company size scenarios
const COMPANY_SCENARIOS = {
  'dell_enterprise': {
    name: 'Dell Technologies (Enterprise)',
    employees: 120000,
    candidatePool: 800,      // Typical search results for enterprise
    avgProfilesNeeded: 100,
    complexity: 'high'
  },
  'medium_tech': {
    name: 'Medium Tech Company',
    employees: 5000,
    candidatePool: 200,
    avgProfilesNeeded: 60,
    complexity: 'medium'
  },
  'smb_saas': {
    name: 'SMB SaaS Company',
    employees: 500,
    candidatePool: 50,
    avgProfilesNeeded: 30,
    complexity: 'low'
  }
};

function simulateBuyerGroupCost(companyScenario, earlyStopMode, iterations = 1000) {
  const company = COMPANY_SCENARIOS[companyScenario];
  const mode = EARLY_STOP_MODES[earlyStopMode];
  
  if (!company || !mode) {
    throw new Error('Invalid scenario or mode');
  }

  let totalCosts = [];
  let totalProfiles = [];
  let successfulRuns = 0;

  for (let i = 0; i < iterations; i++) {
    // Simulate search cost (1-3 searches depending on company size)
    const searchRequests = company.complexity === 'high' ? 3 
                         : company.complexity === 'medium' ? 2 : 1;
    const searchCost = searchRequests * PRICING.search;

    // Simulate progressive collection
    let profilesCollected = 0;
    let collectCost = 0;
    
    // Start with initial batch
    const initialBatch = Math.min(20, company.candidatePool);
    profilesCollected += initialBatch;
    collectCost += initialBatch * PRICING.collect;
    
    // Simulate progressive collection until early stop criteria met
    while (profilesCollected < company.candidatePool) {
      // Check if early stop criteria met
      if (earlyStopMode !== 'off') {
        const avgProfilesForMode = (mode.minProfiles + mode.maxProfiles) / 2;
        const stopProbability = Math.min(profilesCollected / avgProfilesForMode, 1);
        
        // Add randomness based on buyer group formation success
        const buyerGroupFormationSuccess = Math.random() * 0.3 + 0.7; // 70-100% chance
        
        if (stopProbability * buyerGroupFormationSuccess > 0.8) {
          break;
        }
      }
      
      // Collect next batch
      const nextBatch = Math.min(20, company.candidatePool - profilesCollected);
      profilesCollected += nextBatch;
      collectCost += nextBatch * PRICING.collect;
      
      // Safety valve for infinite loops
      if (profilesCollected >= 300) break;
    }

    // Add company intelligence cost
    const companyCost = PRICING.headcount;
    
    // Calculate total cost
    const totalCostCredits = searchCost + collectCost + companyCost;
    const totalCostUSD = totalCostCredits * PRICING.creditCost;
    
    totalCosts.push(totalCostUSD);
    totalProfiles.push(profilesCollected);
    
    // Determine if this would be a successful buyer group
    if (profilesCollected >= (mode.minProfiles || 30)) {
      successfulRuns++;
    }
  }

  // Calculate statistics
  const avgCost = totalCosts.reduce((a, b) => a + b, 0) / totalCosts.length;
  const minCost = Math.min(...totalCosts);
  const maxCost = Math.max(...totalCosts);
  const avgProfiles = totalProfiles.reduce((a, b) => a + b, 0) / totalProfiles.length;
  const successRate = (successfulRuns / iterations) * 100;

  return {
    scenario: company.name,
    mode: earlyStopMode,
    modeDescription: mode.description,
    iterations,
    avgCost: Math.round(avgCost * 100) / 100,
    minCost: Math.round(minCost * 100) / 100,
    maxCost: Math.round(maxCost * 100) / 100,
    avgProfiles: Math.round(avgProfiles),
    successRate: Math.round(successRate),
    estimatedAccuracy: mode.accuracy,
    estimatedCompleteness: mode.completeness
  };
}

// Run comprehensive simulation
function runComprehensiveSimulation() {
  console.log('🧮 BUYER GROUP COST SIMULATION');
  console.log('=====================================\n');
  
  console.log('📊 PRICING ASSUMPTIONS:');
  console.log(`Search: ${PRICING.search} credits/request`);
  console.log(`Collect: ${PRICING.collect} credits/profile`);
  console.log(`Company Intel: ${PRICING.headcount} credit/company`);
  console.log(`Credit Cost: $${PRICING.creditCost} each\n`);

  const results = [];
  
  for (const [scenarioKey, scenario] of Object.entries(COMPANY_SCENARIOS)) {
    console.log(`\n🏢 ${scenario.name.toUpperCase()}`);
    console.log(`Employees: ${scenario.employees.toLocaleString()}, Candidate Pool: ${scenario.candidatePool}`);
    console.log('─'.repeat(80));
    
    for (const [modeKey, mode] of Object.entries(EARLY_STOP_MODES)) {
      const result = simulateBuyerGroupCost(scenarioKey, modeKey);
      results.push(result);
      
      console.log(`${modeKey.toUpperCase().padEnd(15)} | Avg: $${result.avgCost.toString().padEnd(6)} | Range: $${result.minCost}-$${result.maxCost} | Profiles: ${result.avgProfiles.toString().padEnd(3)} | Success: ${result.successRate}% | Accuracy: ${result.estimatedAccuracy}%`);
    }
  }
  
  // Scale analysis
  console.log('\n\n🚀 SCALE ANALYSIS');
  console.log('=====================================');
  
  const scales = [
    { customers: 1, sellers: 100, buyerGroups: 1000 },
    { customers: 10, sellers: 100, buyerGroups: 1000 },
    { customers: 10, sellers: 100, buyerGroups: 10000 }
  ];
  
  for (const scale of scales) {
    console.log(`\n📈 SCALE: ${scale.customers} customers, ${scale.sellers * scale.customers} sellers, ${scale.buyerGroups * scale.customers} buyer groups`);
    
    for (const [modeKey, mode] of Object.entries(EARLY_STOP_MODES)) {
      const avgCostPerGroup = results.find(r => r.scenario.includes('Dell') && r.mode === modeKey)?.avgCost || 20;
      const totalCost = avgCostPerGroup * scale.buyerGroups * scale.customers;
      const costPerCustomer = totalCost / scale.customers;
      
      console.log(`${modeKey.padEnd(15)} | Total: $${totalCost.toLocaleString().padEnd(8)} | Per Customer: $${costPerCustomer.toLocaleString().padEnd(8)} | Accuracy: ${mode.accuracy}%`);
    }
  }
  
  // Recommendations
  console.log('\n\n💡 RECOMMENDATIONS');
  console.log('=====================================');
  console.log('1. ACCURACY_FIRST for critical accounts (Fortune 500)');
  console.log('   - Higher cost but maximum accuracy');
  console.log('   - $15-25 per buyer group, 95% accuracy');
  console.log('');
  console.log('2. CONSERVATIVE for standard enterprise');
  console.log('   - Balanced cost/accuracy trade-off');
  console.log('   - $8-15 per buyer group, 90% accuracy');
  console.log('');
  console.log('3. Cost controls to prevent runaway spending:');
  console.log('   - Set maxCollects limit (100-150 for enterprise)');
  console.log('   - Monitor monthly credit usage');
  console.log('   - Implement customer-specific spending caps');
  
  return results;
}

// Export for use in other scripts
if (require.main === module) {
  runComprehensiveSimulation();
}

module.exports = { simulateBuyerGroupCost, EARLY_STOP_MODES, COMPANY_SCENARIOS };
