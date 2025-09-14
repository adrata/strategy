// BUYER GROUP CONTACT VOLUME ESTIMATE
// 45 sellers × 600 accounts × multiple departments

console.log('📊 BUYER GROUP CONTACT VOLUME ESTIMATE');
console.log('=====================================');
console.log('🎯 Goal: Identify buyer groups across marketing, sales, CS, ops, legal');
console.log('📈 Scale: 45 sellers × 600 accounts (mid/large enterprises)');
console.log('');

// Department sizing for mid vs large enterprises
const departmentSizes = {
  midsize: {
    // 100-1000 employees
    marketing: { min: 5, max: 15, avg: 10 },
    sales: { min: 10, max: 30, avg: 20 },
    customerSuccess: { min: 3, max: 10, avg: 6 },
    operations: { min: 5, max: 15, avg: 10 },
    legal: { min: 2, max: 5, avg: 3 },
    total: 49
  },
  large: {
    // 1000+ employees  
    marketing: { min: 15, max: 50, avg: 32 },
    sales: { min: 30, max: 100, avg: 65 },
    customerSuccess: { min: 10, max: 30, avg: 20 },
    operations: { min: 15, max: 50, avg: 32 },
    legal: { min: 5, max: 15, avg: 10 },
    total: 159
  }
};

// Account distribution assumption
const accountMix = {
  midsize: 0.6, // 60% mid-size (360 accounts)
  large: 0.4   // 40% large (240 accounts)
};

const totalAccounts = 600;
const totalSellers = 45;
const accountsPerSeller = Math.round(totalAccounts / totalSellers);

console.log('🏢 ENTERPRISE BREAKDOWN:');
console.log('========================');
console.log(`Mid-size enterprises (100-1K employees): ${Math.round(totalAccounts * accountMix.midsize)} accounts`);
console.log(`Large enterprises (1K+ employees): ${Math.round(totalAccounts * accountMix.large)} accounts`);
console.log(`Accounts per seller: ${accountsPerSeller}`);
console.log('');

// Calculate total contacts per enterprise type
const midsizeTotal = departmentSizes.midsize.total;
const largeTotal = departmentSizes.large.total;

const midsizeAccounts = Math.round(totalAccounts * accountMix.midsize);
const largeAccounts = Math.round(totalAccounts * accountMix.large);

const totalContactsRaw = (midsizeAccounts * midsizeTotal) + (largeAccounts * largeTotal);

console.log('📊 RAW CONTACT VOLUMES:');
console.log('=======================');
console.log(`Mid-size: ${midsizeAccounts} accounts × ${midsizeTotal} contacts = ${(midsizeAccounts * midsizeTotal).toLocaleString()} contacts`);
console.log(`Large: ${largeAccounts} accounts × ${largeTotal} contacts = ${(largeAccounts * largeTotal).toLocaleString()} contacts`);
console.log(`RAW TOTAL: ${totalContactsRaw.toLocaleString()} contacts`);
console.log('');

// Buyer group filtering (not everyone is a decision maker)
const buyerGroupFilters = {
  seniorityFilter: 0.4, // 40% are senior enough to influence decisions
  relevanceFilter: 0.7, // 70% are in roles relevant to your solution
  activeFilter: 0.8,    // 80% are actively employed/findable
  overallFilter: 0.4 * 0.7 * 0.8 // Combined: ~22% are actual buyer group members
};

const buyerGroupContacts = Math.round(totalContactsRaw * buyerGroupFilters.overallFilter);

console.log('🎯 BUYER GROUP FILTERING:');
console.log('=========================');
console.log(`Seniority filter: ${(buyerGroupFilters.seniorityFilter * 100)}% (director+ level)`);
console.log(`Relevance filter: ${(buyerGroupFilters.relevanceFilter * 100)}% (relevant to your solution)`);
console.log(`Active filter: ${(buyerGroupFilters.activeFilter * 100)}% (currently employed/reachable)`);
console.log(`Combined filter: ${(buyerGroupFilters.overallFilter * 100).toFixed(1)}%`);
console.log('');
console.log(`BUYER GROUP TOTAL: ${buyerGroupContacts:,} qualified contacts`);
console.log('');

// Per-seller breakdown
const contactsPerSeller = Math.round(buyerGroupContacts / totalSellers);
const accountsPerSellerDetail = Math.round(totalAccounts / totalSellers);
const contactsPerAccount = Math.round(buyerGroupContacts / totalAccounts);

console.log('👤 PER-SELLER BREAKDOWN:');
console.log('========================');
console.log(`Each seller manages: ${accountsPerSellerDetail} accounts`);
console.log(`Contacts per seller: ${contactsPerSeller:,} buyer group members`);
console.log(`Contacts per account: ${contactsPerAccount} qualified buyers`);
console.log('');

// Processing implications for Adrata
const processingVolume = {
  initialEnrichment: totalContactsRaw,
  buyerGroupIdentification: buyerGroupContacts,
  ongoingMonitoring: buyerGroupContacts * 1.2, // 20% churn/updates
};

console.log('🔧 ADRATA PROCESSING REQUIREMENTS:');
console.log('===================================');
console.log(`Initial enrichment: ${processingVolume.initialEnrichment:,} contacts`);
console.log(`Buyer group identification: ${processingVolume.buyerGroupIdentification:,} contacts`);
console.log(`Ongoing monitoring: ${Math.round(processingVolume.ongoingMonitoring):,} contacts/quarter`);
console.log('');

// Cost implications (rough estimates)
const costEstimates = {
  dataAcquisition: totalContactsRaw * 0.05, // $0.05 per contact
  enrichment: totalContactsRaw * 0.03,      // $0.03 per enrichment
  monitoring: buyerGroupContacts * 0.02 * 4 // $0.02 per contact per quarter
};

const totalYearlyCost = costEstimates.dataAcquisition + costEstimates.enrichment + costEstimates.monitoring;

console.log('💰 ESTIMATED PROCESSING COSTS:');
console.log('==============================');
console.log(`Data acquisition: $${costEstimates.dataAcquisition:,.0f}`);
console.log(`Contact enrichment: $${costEstimates.enrichment:,.0f}`);
console.log(`Quarterly monitoring: $${costEstimates.monitoring:,.0f}/year`);
console.log(`TOTAL ANNUAL: $${totalYearlyCost:,.0f}`);
console.log('');

// Monaco pipeline implications
console.log('🧠 MONACO PIPELINE IMPLICATIONS:');
console.log('=================================');
console.log(`Initial ML training: ${totalContactsRaw:,} contact profiles`);
console.log(`Buyer group classification: ${buyerGroupContacts:,} active targets`);
console.log(`Relationship mapping: ${Math.round(buyerGroupContacts * 1.5):,} connections to analyze`);
console.log(`Intent signals to monitor: ${Math.round(buyerGroupContacts * 0.3):,} high-value contacts`);
console.log('');

console.log('📈 SUMMARY FOR ADRATA SCALING:');
console.log('==============================');
console.log(`🎯 Target buyer group: ${buyerGroupContacts:,} qualified contacts`);
console.log(`📊 Processing volume: ${totalContactsRaw:,} total contacts`);
console.log(`👥 Seller efficiency: ${contactsPerSeller:,} contacts per seller`);
console.log(`🏢 Account depth: ${contactsPerAccount} buyers per account`);
console.log(`💰 Annual cost: $${totalYearlyCost:,.0f}`);
console.log(`🔄 Quarterly updates: ${Math.round(processingVolume.ongoingMonitoring):,} contacts`);
console.log('');

console.log('🚀 RECOMMENDED ADRATA APPROACH:');
console.log('===============================');
console.log('1. Start with top 100 accounts (pilot)');
console.log(`2. Process ~${Math.round(totalContactsRaw/6):,} contacts initially`);
console.log(`3. Identify ~${Math.round(buyerGroupContacts/6):,} buyer group members`);
console.log('4. Validate Monaco classification accuracy');
console.log('5. Scale to full 600 accounts');
console.log('6. Implement ongoing monitoring system');

// Return the key numbers
return {
  totalContacts: totalContactsRaw,
  buyerGroupContacts: buyerGroupContacts,
  contactsPerSeller: contactsPerSeller,
  contactsPerAccount: contactsPerAccount,
  annualCost: totalYearlyCost
}; 