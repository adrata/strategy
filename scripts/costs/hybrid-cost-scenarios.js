#!/usr/bin/env node

/**
 * Hybrid Cost Scenarios - API-only vs Database + API Freshness
 * All numbers are estimates based on public pricing: $0.004/credit (annual plan)
 * Credit model: Search=2 credits; Collect=2 credits/profile; Company intel=1 credit
 */

const CREDIT_COST = 0.004;
const SEARCH_CREDITS = 2;      // per refresh per account (one search)
const COLLECT_CREDITS = 2;     // per changed profile
const ACCOUNTS = 1_000_000;    // buyer groups
const BASELINE_PROFILES = 100; // midpoint of 80–120 profiles per buyer group
const DB_PRICE_ESTIMATE = 150_000; // $150k estimated employee database license

// Initial costs (verified from weighted mix calc: 600k @ $0.66, 400k @ $0.99)
const API_INITIAL_TOTAL = 791_200; // $791,200 verified
const API_INITIAL_PER_ACCOUNT = API_INITIAL_TOTAL / ACCOUNTS; // $0.7912

function refreshCostPerAccount(changeRate) {
  const changedProfiles = BASELINE_PROFILES * changeRate; // e.g., 5 profiles at 5%
  const credits = SEARCH_CREDITS + (COLLECT_CREDITS * changedProfiles);
  return credits * CREDIT_COST;
}

function format(n) { return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }
function format2(n) { return `$${n.toFixed(4)}`; }

const rates = [0.02, 0.05, 0.10];
const periods = [
  { name: 'Monthly', times: 12 },
  { name: 'Quarterly', times: 4 },
];

console.log('📘 COST SCENARIOS: API-only vs Database + API Freshness');
console.log('='.repeat(78));
console.log('\nASSUMPTIONS');
console.log(`• Credit cost: $${CREDIT_COST}/credit (annual plan)`);
console.log('• Search = 2 credits; Collect = 2 credits/profile; Company intel = 1 credit (initial only)');
console.log('• Baseline profiles per buyer group = 100 (midpoint of 80–120)');
console.log('• Employee database one-time/license baseline (estimate) = $150,000');
console.log('• 1,000,000 buyer groups total');
console.log('\nAPI INITIAL RUN');
console.log(`• Per buyer group ≈ ${format2(API_INITIAL_PER_ACCOUNT)} → Total initial = ${format(API_INITIAL_TOTAL)}`);

for (const period of periods) {
  console.log(`\n${period.name.toUpperCase()} REFRESH SCENARIOS`);
  console.log('-'.repeat(78));
  for (const rate of rates) {
    const perAccount = refreshCostPerAccount(rate);
    const perRefreshTotal = perAccount * ACCOUNTS;
    const annualRefreshTotal = perRefreshTotal * period.times;

    const apiOnlyAnnual = API_INITIAL_TOTAL + annualRefreshTotal;
    const hybridAnnual = DB_PRICE_ESTIMATE + annualRefreshTotal;
    const savings = apiOnlyAnnual - hybridAnnual;

    const label = `${Math.round(rate * 100)}% change`;
    console.log(`${label.padEnd(12)} | per refresh/account: ${format2(perAccount).padEnd(8)} | refresh total: ${format(perRefreshTotal).padEnd(10)} | API-only Annual: ${format(apiOnlyAnnual).padEnd(12)} | Hybrid Annual: ${format(hybridAnnual).padEnd(12)} | Savings: ${format(savings)}`);
  }
}
