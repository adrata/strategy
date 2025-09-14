#!/usr/bin/env node

/**
 * Audit Dano's Real Deal Data vs Our Database
 * 
 * This script compares Dano's real Zoho deal data (source of truth) 
 * against our current database opportunities to identify discrepancies
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Parse the real Zoho deal data
function parseZohoDeals() {
  const csvPath = 'Deals_2025_08_14.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.log('❌ Zoho deals CSV file not found. Please ensure Deals_2025_08_14.csv is in the root directory.');
    return [];
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  const deals = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    if (values.length < headers.length) continue;
    
    const deal = {};
    headers.forEach((header, index) => {
      deal[header.trim()] = values[index] ? values[index].trim() : '';
    });
    
    deals.push(deal);
  }
  
  return deals;
}

async function auditDealsData() {
  console.log('🔍 AUDITING DANO\'S REAL DEALS DATA VS OUR DATABASE\n');

  try {
    // 1. Load real Zoho deals
    console.log('📊 LOADING REAL ZOHO DEALS...');
    const zohoDeals = parseZohoDeals();
    console.log(`✅ Found ${zohoDeals.length} real Zoho deals\n`);

    // Sample of real deal structure
    if (zohoDeals.length > 0) {
      console.log('📋 REAL DEAL STRUCTURE (First Deal):');
      const firstDeal = zohoDeals[0];
      Object.keys(firstDeal).forEach(key => {
        console.log(`  ${key}: ${firstDeal[key]}`);
      });
      console.log('');
    }

    // 2. Load our database opportunities
    console.log('📊 LOADING OUR DATABASE OPPORTUNITIES...');
    const dbOpportunities = await prisma.opportunity.findMany({
      where: {
        workspaceId: 'adrata',
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`✅ Found ${dbOpportunities.length} opportunities in our database\n`);

    // 3. Analyze real deal data patterns
    console.log('🎯 ANALYZING REAL DEAL PATTERNS:\n');
    
    const stageAnalysis = {};
    const accountAnalysis = {};
    const amountAnalysis = { total: 0, won: 0, lost: 0, active: 0 };
    const sourceAnalysis = {};
    
    zohoDeals.forEach(deal => {
      const stage = deal.Stage || 'Unknown';
      const account = deal['Account Name'] || 'Unknown';
      const amount = parseFloat(deal.Amount) || 0;
      const source = deal['Lead Source'] || 'Unknown';
      
      // Stage analysis
      stageAnalysis[stage] = (stageAnalysis[stage] || 0) + 1;
      
      // Account analysis
      accountAnalysis[account] = (accountAnalysis[account] || 0) + 1;
      
      // Amount analysis
      amountAnalysis.total += amount;
      if (stage.includes('Closed Won')) {
        amountAnalysis.won += amount;
      } else if (stage.includes('Closed Lost')) {
        amountAnalysis.lost += amount;
      } else {
        amountAnalysis.active += amount;
      }
      
      // Source analysis
      sourceAnalysis[source] = (sourceAnalysis[source] || 0) + 1;
    });

    console.log('STAGE BREAKDOWN:');
    Object.entries(stageAnalysis)
      .sort((a, b) => b[1] - a[1])
      .forEach(([stage, count]) => {
        console.log(`  ${stage}: ${count} deals`);
      });
    console.log('');

    console.log('TOP ACCOUNTS:');
    Object.entries(accountAnalysis)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([account, count]) => {
        console.log(`  ${account}: ${count} deals`);
      });
    console.log('');

    console.log('REVENUE ANALYSIS:');
    console.log(`  Total Pipeline: $${amountAnalysis.total.toLocaleString()}`);
    console.log(`  Won Revenue: $${amountAnalysis.won.toLocaleString()}`);
    console.log(`  Lost Revenue: $${amountAnalysis.lost.toLocaleString()}`);
    console.log(`  Active Pipeline: $${amountAnalysis.active.toLocaleString()}`);
    console.log('');

    console.log('LEAD SOURCES:');
    Object.entries(sourceAnalysis)
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        console.log(`  ${source}: ${count} deals`);
      });
    console.log('');

    // 4. Compare with our database
    console.log('🔍 COMPARING WITH OUR DATABASE:\n');
    
    console.log('OUR DATABASE STAGES:');
    const dbStages = {};
    dbOpportunities.forEach(opp => {
      const stage = opp.stage || 'Unknown';
      dbStages[stage] = (dbStages[stage] || 0) + 1;
    });
    Object.entries(dbStages).forEach(([stage, count]) => {
      console.log(`  ${stage}: ${count} deals`);
    });
    console.log('');

    // 5. Identify key discrepancies
    console.log('🚨 KEY DISCREPANCIES:\n');
    
    console.log('❌ MISSING DATA IN OUR DATABASE:');
    const realStages = Object.keys(stageAnalysis);
    const dbStagesList = Object.keys(dbStages);
    const missingStages = realStages.filter(stage => !dbStagesList.includes(stage));
    if (missingStages.length > 0) {
      console.log(`  Missing Stages: ${missingStages.join(', ')}`);
    }
    
    const realAccounts = Object.keys(accountAnalysis);
    const dbAccounts = [...new Set(dbOpportunities.map(o => o.account?.name || 'Unknown'))];
    const missingAccounts = realAccounts.filter(acc => !dbAccounts.includes(acc)).slice(0, 5);
    if (missingAccounts.length > 0) {
      console.log(`  Missing Accounts (sample): ${missingAccounts.join(', ')}`);
    }
    console.log('');

    // 6. Generate import recommendations
    console.log('💡 IMPORT RECOMMENDATIONS:\n');
    console.log('1. STAGE MAPPING NEEDED:');
    console.log('   Real Stages → Our Stages');
    realStages.forEach(stage => {
      const suggested = stage.includes('Closed Won') ? 'Closed Won' :
                       stage.includes('Closed Lost') ? 'Closed Lost' :
                       stage.includes('Proposal') ? 'Proposal' :
                       stage.includes('Qualification') ? 'Qualification' :
                       stage.includes('Negotiation') ? 'Negotiation' :
                       'Discovery';
      console.log(`   "${stage}" → "${suggested}"`);
    });
    console.log('');

    console.log('2. ACCOUNT IMPORT NEEDED:');
    console.log(`   ${realAccounts.length} unique accounts in Zoho`);
    console.log(`   ${dbAccounts.length} accounts in our database`);
    console.log('');

    console.log('3. DEAL IMPORT NEEDED:');
    console.log(`   ${zohoDeals.length} real deals vs ${dbOpportunities.length} in database`);
    console.log('');

    // 7. Check for specific example deals
    console.log('🔍 SPECIFIC DEAL EXAMPLES:\n');
    
    const topcoRFP = zohoDeals.find(d => d['Deal Name']?.includes('Fall RFP Topco'));
    if (topcoRFP) {
      console.log('FALL RFP TOPCO DEAL (Real Data):');
      console.log(`  Amount: $${parseFloat(topcoRFP.Amount).toLocaleString()}`);
      console.log(`  Stage: ${topcoRFP.Stage}`);
      console.log(`  Account: ${topcoRFP['Account Name']}`);
      console.log(`  Close Date: ${topcoRFP['Closing Date']}`);
      console.log(`  Created: ${topcoRFP['Created Time']}`);
      
      // Check if it exists in our database
      const dbTopco = dbOpportunities.find(o => 
        o.name?.includes('Topco') || o.name?.includes('Fall RFP')
      );
      
      if (dbTopco) {
        console.log('\n  IN OUR DATABASE:');
        console.log(`  Amount: $${dbTopco.amount?.toLocaleString() || '0'}`);
        console.log(`  Stage: ${dbTopco.stage}`);
        console.log(`  Account: ${dbTopco.account?.name || 'None'}`);
      } else {
        console.log('\n  ❌ NOT FOUND IN OUR DATABASE');
      }
    }

  } catch (error) {
    console.error('❌ AUDIT ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditDealsData()
  .then(() => {
    console.log('✅ Audit complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
