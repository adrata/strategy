/**
 * 🔍 VERIFY DANO'S STAGE MAPPINGS
 * 
 * Compares opportunities in our database with the CSV file
 * to ensure stages are correctly mapped for each deal
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Dano's workspace configuration
const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

// Stage mapping from CSV to our system
const STAGE_MAPPING = {
  'Qualification': 'qualification',
  'Needs Analysis': 'needs-analysis', 
  'Value Proposition': 'value-proposition',
  'Identify Decision Makers': 'identify-decision-makers',
  'Proposal/Price Quote': 'proposal-price-quote',
  'Negotiation/Review': 'negotiation-review',
  'Closed Won': 'closed-won',
  'Closed Lost': 'closed-lost',
  'Closed Lost to Competition': 'closed-lost-to-competition'
};

async function verifyDanoStages() {
  try {
    console.log('🔍 Starting Dano stage verification...');
    
    // 1. Get all opportunities from our database
    const dbOpportunities = await prisma.opportunity.findMany({
      where: {
        workspaceId: DANO_WORKSPACE_ID
      },
      select: {
        id: true,
        name: true,
        stage: true,
        amount: true,
        zohoId: true,
        expectedCloseDate: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`📊 Found ${dbOpportunities.length} opportunities in database`);
    
    // 2. Read and parse CSV file
    const csvPath = path.join(__dirname, '..', 'Deals_2025_08_01 2.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Parse CSV data
    const csvDeals = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length === headers.length) {
        const dealData = {};
        headers.forEach((header, index) => {
          const value = values[index]?.trim().replace(/"/g, '') || '';
          dealData[header] = value;
        });
        
        if (dealData['Deal Name']) {
          csvDeals.push(dealData);
        }
      }
    }
    
    console.log(`📋 Found ${csvDeals.length} deals in CSV`);
    
    // 3. Create comparison report
    console.log('\n📊 STAGE COMPARISON REPORT');
    console.log('=' .repeat(80));
    
    let correctMappings = 0;
    let incorrectMappings = 0;
    let missingInDB = 0;
    let missingInCSV = 0;
    
    // Check deals that exist in both
    const csvDealNames = csvDeals.map(d => d['Deal Name']);
    const dbDealNames = dbOpportunities.map(d => d.name);
    
    console.log('\n🔍 DEALS IN BOTH DATABASE AND CSV:');
    console.log('-'.repeat(80));
    
    for (const csvDeal of csvDeals) {
      const dealName = csvDeal['Deal Name'];
      const csvStage = csvDeal['Stage'];
      const expectedStage = STAGE_MAPPING[csvStage] || 'qualification';
      
      const dbDeal = dbOpportunities.find(d => d.name === dealName);
      
      if (dbDeal) {
        const isCorrect = dbDeal.stage === expectedStage;
        const status = isCorrect ? '✅' : '❌';
        
        console.log(`${status} "${dealName}"`);
        console.log(`   CSV Stage: "${csvStage}" → Expected: "${expectedStage}"`);
        console.log(`   DB Stage:  "${dbDeal.stage}"`);
        console.log(`   Amount: $${csvDeal['Amount']} | DB: $${dbDeal.amount}`);
        console.log(`   Zoho ID: ${csvDeal['Record Id']} | DB: ${dbDeal.zohoId}`);
        console.log('');
        
        if (isCorrect) {
          correctMappings++;
        } else {
          incorrectMappings++;
        }
      } else {
        console.log(`❌ "${dealName}" - MISSING IN DATABASE`);
        console.log(`   CSV Stage: "${csvStage}" → Expected: "${expectedStage}"`);
        console.log(`   Amount: $${csvDeal['Amount']}`);
        console.log(`   Zoho ID: ${csvDeal['Record Id']}`);
        console.log('');
        missingInDB++;
      }
    }
    
    // Check deals in DB but not in CSV
    console.log('\n🔍 DEALS IN DATABASE BUT NOT IN CSV:');
    console.log('-'.repeat(80));
    
    for (const dbDeal of dbOpportunities) {
      if (!csvDealNames.includes(dbDeal.name)) {
        console.log(`⚠️ "${dbDeal.name}" - MISSING IN CSV`);
        console.log(`   DB Stage: "${dbDeal.stage}"`);
        console.log(`   Amount: $${dbDeal.amount}`);
        console.log(`   Zoho ID: ${dbDeal.zohoId}`);
        console.log('');
        missingInCSV++;
      }
    }
    
    // Summary statistics
    console.log('\n📈 SUMMARY STATISTICS');
    console.log('=' .repeat(80));
    console.log(`✅ Correct stage mappings: ${correctMappings}`);
    console.log(`❌ Incorrect stage mappings: ${incorrectMappings}`);
    console.log(`❌ Missing in database: ${missingInDB}`);
    console.log(`⚠️ Missing in CSV: ${missingInCSV}`);
    console.log(`📊 Total deals in CSV: ${csvDeals.length}`);
    console.log(`📊 Total deals in DB: ${dbOpportunities.length}`);
    
    const accuracy = csvDeals.length > 0 ? (correctMappings / csvDeals.length * 100).toFixed(1) : 0;
    console.log(`🎯 Stage mapping accuracy: ${accuracy}%`);
    
    // Stage distribution analysis
    console.log('\n📊 STAGE DISTRIBUTION ANALYSIS');
    console.log('=' .repeat(80));
    
    const csvStageCounts = {};
    const dbStageCounts = {};
    
    csvDeals.forEach(deal => {
      const stage = deal['Stage'];
      csvStageCounts[stage] = (csvStageCounts[stage] || 0) + 1;
    });
    
    dbOpportunities.forEach(deal => {
      const stage = deal.stage;
      dbStageCounts[stage] = (dbStageCounts[stage] || 0) + 1;
    });
    
    console.log('\nCSV Stage Distribution:');
    Object.entries(csvStageCounts).forEach(([stage, count]) => {
      console.log(`  ${stage}: ${count} deals`);
    });
    
    console.log('\nDatabase Stage Distribution:');
    Object.entries(dbStageCounts).forEach(([stage, count]) => {
      console.log(`  ${stage}: ${count} deals`);
    });
    
    // Recommendations
    if (incorrectMappings > 0) {
      console.log('\n🔧 RECOMMENDATIONS');
      console.log('=' .repeat(80));
      console.log('❌ Some stage mappings are incorrect. Consider:');
      console.log('   1. Updating the STAGE_MAPPING object');
      console.log('   2. Re-running the import script');
      console.log('   3. Manually correcting specific deals');
    }
    
    if (missingInDB > 0) {
      console.log('\n⚠️ Missing deals in database. Consider:');
      console.log('   1. Re-running the import script');
      console.log('   2. Checking for CSV parsing issues');
    }
    
  } catch (error) {
    console.error('❌ Error verifying stages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

// Run the verification
verifyDanoStages().catch(console.error); 