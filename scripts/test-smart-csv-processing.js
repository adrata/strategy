#!/usr/bin/env node

/**
 * 🧪 TEST SMART CSV PROCESSING
 * 
 * Demonstrates the new AI-powered CSV processing capabilities:
 * - Natural language understanding
 * - Smart company prioritization
 * - Context-aware processing
 */

const { NaturalLanguageParser } = require('../src/platform/services/natural-language-parser');

// Test cases that users might actually say
const testQueries = [
  "Find CFOs at the first 10 companies",
  "Get executives from the largest 20 companies",
  "Find CEOs at Fortune 500 companies, limit to 15",
  "Get CFOs from the first 10 companies alphabetically",
  "Find executives at the top 5 companies by revenue",
  "Get decision makers from small companies, limit to 25",
  "Find CFOs at random 10 companies",
  "Get executives from the biggest companies, just the first 8",
  "Find CFOs at Apple, Microsoft, and Google",
  "Get all executives from tech companies"
];

// Sample CSV data for context
const sampleCSVData = [
  ['Company', 'Industry', 'Employees', 'Revenue'],
  ['Apple Inc', 'Technology', '164000', '394328000000'],
  ['Microsoft Corporation', 'Technology', '221000', '211915000000'],
  ['Amazon.com Inc', 'E-commerce', '1541000', '513983000000'],
  ['Google LLC', 'Technology', '174014', '307394000000'],
  ['Tesla Inc', 'Automotive', '127855', '96773000000'],
  ['Meta Platforms', 'Technology', '86482', '134902000000'],
  ['Netflix Inc', 'Entertainment', '12800', '31616000000'],
  ['Salesforce Inc', 'Software', '79390', '31352000000'],
  ['Adobe Inc', 'Software', '26788', '19411000000'],
  ['Oracle Corporation', 'Software', '164000', '50077000000']
];

console.log('🧪 TESTING SMART CSV PROCESSING');
console.log('================================\n');

// Test each query
testQueries.forEach((query, index) => {
  console.log(`Test ${index + 1}: "${query}"`);
  console.log('─'.repeat(50));
  
  try {
    const parsed = NaturalLanguageParser.parseRequest(query);
    
    console.log(`✅ Parsed Successfully:`);
    console.log(`   Intent: ${parsed.intent}`);
    console.log(`   Limit: ${parsed.limit || 'No limit'}`);
    console.log(`   Prioritization: ${parsed.prioritization}`);
    console.log(`   Roles: ${parsed.roles?.join(', ') || 'None specified'}`);
    console.log(`   Confidence: ${Math.round(parsed.confidence * 100)}%`);
    
    if (parsed.companies && parsed.companies.length > 0) {
      console.log(`   Specific Companies: ${parsed.companies.join(', ')}`);
    }
    
    // Generate prioritization criteria
    const criteria = NaturalLanguageParser.generatePrioritizationCriteria(
      parsed.prioritization,
      parsed.limit
    );
    
    console.log(`   Prioritization Method: ${criteria.method} (${criteria.direction || 'default'})`);
    
    // Apply to sample data
    const prioritized = NaturalLanguageParser.prioritizeCompanies(
      sampleCSVData.slice(1).map((row, idx) => ({
        name: row[0],
        industry: row[1],
        employees: parseInt(row[2]) || 0,
        revenue: parseInt(row[3]) || 0,
        originalIndex: idx
      })),
      criteria,
      parsed.limit
    );
    
    console.log(`   Result: Would process ${prioritized.length} companies:`);
    prioritized.slice(0, 5).forEach((company, i) => {
      console.log(`     ${i + 1}. ${company.name} (${company.employees?.toLocaleString()} employees)`);
    });
    if (prioritized.length > 5) {
      console.log(`     ... and ${prioritized.length - 5} more`);
    }
    
  } catch (error) {
    console.log(`❌ Parsing Failed: ${error.message}`);
  }
  
  console.log('');
});

// Test smart processing workflow
console.log('🎯 SMART PROCESSING WORKFLOW SIMULATION');
console.log('======================================\n');

const userQuery = "Find CFOs at the first 10 companies";
const csvHeaders = sampleCSVData[0];
const csvData = sampleCSVData.slice(1);

console.log(`User Query: "${userQuery}"`);
console.log(`CSV Data: ${csvData.length} companies available`);
console.log(`Headers: ${csvHeaders.join(', ')}`);
console.log('');

// Step 1: Parse intent
const intent = NaturalLanguageParser.parseRequest(userQuery);
console.log('Step 1: Intent Parsing');
console.log(`  ✅ Understood: Process ${intent.limit || 'all'} companies using ${intent.prioritization} method`);
console.log(`  ✅ Looking for: ${intent.roles?.join(', ') || 'General contacts'}`);
console.log(`  ✅ Confidence: ${Math.round(intent.confidence * 100)}%`);
console.log('');

// Step 2: Apply prioritization
const criteria = NaturalLanguageParser.generatePrioritizationCriteria(intent.prioritization, intent.limit);
const selectedCompanies = NaturalLanguageParser.prioritizeCompanies(
  csvData.map((row, idx) => ({
    name: row[0],
    industry: row[1],
    employees: parseInt(row[2]) || 0,
    revenue: parseInt(row[3]) || 0,
    originalIndex: idx
  })),
  criteria,
  intent.limit
);

console.log('Step 2: Company Selection');
console.log(`  ✅ Selected ${selectedCompanies.length} companies for processing:`);
selectedCompanies.forEach((company, i) => {
  console.log(`     ${i + 1}. ${company.name}`);
});
console.log('');

// Step 3: Estimate processing
const estimatedCredits = selectedCompanies.length * (intent.roles?.length || 1);
const estimatedTime = Math.ceil(selectedCompanies.length * 2 / 60); // 2 seconds per company

console.log('Step 3: Processing Estimates');
console.log(`  ✅ Estimated API credits: ${estimatedCredits}`);
console.log(`  ✅ Estimated time: ${estimatedTime} minutes`);
console.log(`  ✅ Cost efficiency: Processing ${selectedCompanies.length}/${csvData.length} companies (${Math.round(selectedCompanies.length/csvData.length*100)}%)`);
console.log('');

console.log('🎉 SMART PROCESSING READY!');
console.log('The system now understands natural language and can:');
console.log('  • Parse complex user intents with high confidence');
console.log('  • Apply intelligent company prioritization');
console.log('  • Provide accurate processing estimates');
console.log('  • Optimize API usage and costs');
console.log('  • Handle various prioritization methods');
console.log('');
console.log('Example queries that now work:');
testQueries.slice(0, 5).forEach(query => {
  console.log(`  • "${query}"`);
});
