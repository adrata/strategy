#!/usr/bin/env node

/**
 * Dan's Sales Hunter Buyer Group Discovery
 * 
 * Uses the BGI Pipeline with STRICT SALES MODE:
 * =============================================
 * 1. USA-based contacts only
 * 2. Sales/Revenue roles ONLY (no marketing, HR, ops)
 * 3. Phone numbers enriched via Prospeo
 * 4. Skip companies that don't have sales people (no fallback to random employees)
 * 
 * This uses the new strictSalesMode option in SmartBuyerGroupPipeline
 * which ensures only sales hunters are added to buyer groups.
 * 
 * TARGET PERSONAS:
 * ================
 * - CRO (Chief Revenue Officer)
 * - VP Sales / VP Revenue
 * - RVP (Regional Vice President)
 * - Sales Director
 * - Head of Sales
 * - Account Executive (Commercial, NOT Strategic/Enterprise)
 * - BDR/SDR Manager
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');

const prisma = new PrismaClient();

// Custom filtering for sales hunters (used by the pipeline)
const SALES_HUNTER_PROFILE = {
  targetDepartments: ['sales', 'revenue', 'business development', 'commercial'],
  excludeDepartments: ['marketing', 'hr', 'human resources', 'people', 'recruiting', 
    'customer success', 'support', 'engineering', 'product', 'finance', 'legal', 'operations', 'it', 'design'],
  targetTitles: ['chief revenue officer', 'cro', 'vp sales', 'vice president sales', 
    'head of sales', 'sales director', 'rvp', 'regional vice president', 'commercial',
    'account executive', 'ae ', 'sales manager', 'bdr manager', 'sdr manager', 
    'business development', 'revenue operations', 'sales operations', 'sales enablement'],
  excludeTitles: ['marketing', 'hr', 'recruiter', 'talent', 'people', 'customer success',
    'account manager', 'strategic account', 'global account', 'partner', 'channel',
    'support', 'engineer', 'product', 'design', 'analyst', 'finance', 'legal',
    'operations manager', 'executive assistant', 'executive business partner']
};

async function runSalesHunterPipeline(company) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎯 ${company.name}`);
  console.log(`${'═'.repeat(60)}`);
  
  const danId = '01K7B327HWN9G6KGWA97S1TK43';
  const workspaceId = '01K7464TNANHQXPCZT1FYX205V';
  
  try {
    // Use the BGI Pipeline with STRICT SALES MODE
    // This ensures only sales hunters are added, no fallback to random employees
    const pipeline = new SmartBuyerGroupPipeline({
      dealSize: 25000,
      productCategory: 'sales',
      usaOnly: true,
      maxPages: 3,
      prisma: prisma,
      workspaceId: workspaceId,
      mainSellerId: danId,
      customFiltering: SALES_HUNTER_PROFILE,
      strictSalesMode: true  // 🎯 NEW: Only sales hunters, no fallbacks
    });
    
    const result = await pipeline.run({
      name: company.name,
      website: company.website,
      originalIdentifier: company.website
    });
    
    if (!result || !result.buyerGroup || result.buyerGroup.length === 0) {
      console.log('⚠️ No sales hunters found for this company');
      return { company: company.name, status: 'no_sales', members: [] };
    }
    
    console.log(`\n✅ Found ${result.buyerGroup.length} sales hunters:`);
    for (const m of result.buyerGroup) {
      console.log(`   - ${m.name} | ${m.title}`);
      console.log(`     📧 ${m.email || 'No email'} | 📞 ${m.phone || 'No phone'}`);
    }
    
    return { company: company.name, status: 'success', members: result.buyerGroup };
    
  } catch (error) {
    console.log(`❌ Error: ${error.message?.substring(0, 60)}`);
    return { company: company.name, status: 'error', members: [] };
  }
}

async function main() {
  console.log('═'.repeat(70));
  console.log('DAN\'S SALES HUNTER BUYER GROUP DISCOVERY');
  console.log('═'.repeat(70));
  console.log('\n🎯 Strict Requirements:');
  console.log('   ✓ USA-based contacts only');
  console.log('   ✓ Sales/Revenue roles ONLY');
  console.log('   ✓ No fallback to non-sales employees');
  console.log('   ✓ Phone numbers when available\n');
  
  const danId = '01K7B327HWN9G6KGWA97S1TK43';
  
  // Get Dan's companies that need buyer groups
  const danCompanies = await prisma.companies.findMany({
    where: { mainSellerId: danId },
    select: { id: true, name: true, website: true }
  });
  
  // Dedupe by name
  const seen = new Set();
  const uniqueCompanies = danCompanies.filter(c => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
  
  // Get companies without buyer groups
  const companiesWithBG = await prisma.buyerGroups.findMany({
    where: { companyId: { in: danCompanies.map(c => c.id) } },
    select: { companyId: true }
  });
  const bgCompanyIds = new Set(companiesWithBG.map(bg => bg.companyId));
  
  const needsBG = uniqueCompanies.filter(c => !bgCompanyIds.has(c.id) && c.website);
  
  console.log(`📦 Companies needing buyer groups: ${needsBG.length}`);
  
  // Run for first 10
  const toRun = needsBG.slice(0, 10);
  const results = [];
  
  for (const company of toRun) {
    const result = await runSalesHunterPipeline(company);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));
  
  const success = results.filter(r => r.status === 'success');
  const noSales = results.filter(r => r.status === 'no_sales');
  const failed = results.filter(r => r.status === 'error' || r.status === 'no_results');
  
  console.log(`\n✅ Success: ${success.length}`);
  for (const r of success) {
    console.log(`   - ${r.company}: ${r.members.length} sales hunters`);
  }
  
  console.log(`\n⚠️ No sales people found (skipped): ${noSales.length}`);
  for (const r of noSales) {
    console.log(`   - ${r.company}`);
  }
  
  console.log(`\n❌ Failed/No results: ${failed.length}`);
  for (const r of failed) {
    console.log(`   - ${r.company}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
