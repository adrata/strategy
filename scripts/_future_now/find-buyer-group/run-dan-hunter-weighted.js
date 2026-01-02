#!/usr/bin/env node

/**
 * Dan's Hunter-Weighted Buyer Group Pipeline
 * 
 * Uses the BGI Pipeline with HUNTER WEIGHTED MODE:
 * ================================================
 * ✅ Builds COMPLETE buyer groups with all roles
 * ✅ Excludes "farmer" roles (Account Managers, Strategic AEs, Customer Success)
 * ✅ Prioritizes sales hunters in scoring
 * ✅ USA-based contacts preferred
 * ✅ Phone number enrichment
 * 
 * This creates real buyer groups with Decision Makers, Champions, and
 * Stakeholders - just weighted towards hunters instead of farmers.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');

const prisma = new PrismaClient();

const DAN_ID = '01K7B327HWN9G6KGWA97S1TK43';
const WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function runPipeline(company) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🎯 ${company.name}`);
  console.log(`   ${company.website || 'No website'}`);
  
  try {
    const pipeline = new SmartBuyerGroupPipeline({
      dealSize: 50000,
      productCategory: 'sales',
      usaOnly: true,
      maxPages: 5,
      prisma: prisma,
      workspaceId: WORKSPACE_ID,
      mainSellerId: DAN_ID,
      hunterWeightedMode: true  // 🎯 Full buyer groups, exclude farmers
    });
    
    const result = await pipeline.run({
      name: company.name,
      website: company.website,
      originalIdentifier: company.website
    });
    
    const count = result?.buyerGroup?.length || 0;
    if (count > 0) {
      console.log(`\n✅ Created buyer group with ${count} members:`);
      for (const m of result.buyerGroup) {
        const role = m.buyerGroupRole || m.role || 'stakeholder';
        console.log(`   ${role.toUpperCase()}: ${m.name} | ${m.title}`);
      }
      return { company: company.name, status: 'success', count };
    } else {
      console.log('⚠️ No buyer group created');
      return { company: company.name, status: 'empty', count: 0 };
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message?.substring(0, 60)}`);
    return { company: company.name, status: 'error', count: 0 };
  }
}

async function main() {
  console.log('═'.repeat(70));
  console.log('DAN\'S HUNTER-WEIGHTED BUYER GROUP PIPELINE');
  console.log('═'.repeat(70));
  console.log('Mode: Hunter Weighted (full buyer groups, no farmers)');
  console.log('Enrichment: Coresignal email, Lusha + Prospeo phone');
  console.log('');
  
  // NEW COMPANIES ADDED TODAY - prioritize these first
  const newCompanyNames = [
    'Linear', 'Amplitude', 'Airtable', 'June', 'Loom', 'Calendly', 'Canva',
    'Supabase', 'Railway', 'Resend', 'Neon', 'Inngest', 'Knock', 'Stytch',
    'Loops', 'Dub', 'Cal.com', 'Plane', 'Trigger.dev', 'Infisical', 'Upstash',
    'Lago', 'Tinybird', 'Defer', 'Unkey'
  ];
  
  // Get Dan's companies
  const companies = await prisma.companies.findMany({
    where: { mainSellerId: DAN_ID },
    select: { id: true, name: true, website: true }
  });
  
  // Dedupe by name, keep those with websites
  const seen = new Map();
  companies.forEach(c => {
    if (c.website && !seen.has(c.name)) seen.set(c.name, c);
  });
  const unique = [...seen.values()];
  
  // Get existing buyer groups
  const bgs = await prisma.buyerGroups.findMany({
    where: { companyId: { in: companies.map(c => c.id) } },
    include: { BuyerGroupMembers: true }
  });
  
  // Find companies needing buyer groups
  const bgByCompany = {};
  bgs.forEach(bg => {
    if (!bgByCompany[bg.companyId]) bgByCompany[bg.companyId] = { count: 0, members: 0 };
    bgByCompany[bg.companyId].count++;
    bgByCompany[bg.companyId].members += bg.BuyerGroupMembers?.length || 0;
  });
  
  const needsRun = unique.filter(c => {
    const info = bgByCompany[c.id];
    return !info || info.members === 0;
  });
  
  // Sort to prioritize new companies first
  needsRun.sort((a, b) => {
    const aIsNew = newCompanyNames.includes(a.name) ? 0 : 1;
    const bIsNew = newCompanyNames.includes(b.name) ? 0 : 1;
    return aIsNew - bIsNew;
  });
  
  const newCompaniesFirst = needsRun.filter(c => newCompanyNames.includes(c.name));
  const otherCompanies = needsRun.filter(c => !newCompanyNames.includes(c.name));
  
  console.log(`📊 Dan's companies: ${unique.length} unique`);
  console.log(`📊 Need buyer groups: ${needsRun.length}`);
  console.log(`   - New companies (priority): ${newCompaniesFirst.length}`);
  console.log(`   - Other companies: ${otherCompanies.length}`);
  console.log(`📊 Already have buyer groups: ${unique.length - needsRun.length}`);
  console.log('');
  
  // Run pipeline for all
  const results = { success: 0, empty: 0, error: 0, totalMembers: 0 };
  let processed = 0;
  
  for (const company of needsRun) {
    processed++;
    console.log(`\n[${processed}/${needsRun.length}]`);
    
    const result = await runPipeline(company);
    results[result.status]++;
    results.totalMembers += result.count;
    
    // Progress every 10
    if (processed % 10 === 0) {
      console.log(`\n📊 Progress: ${processed}/${needsRun.length} | ✅ ${results.success} | ⚠️ ${results.empty} | ❌ ${results.error}`);
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('FINAL SUMMARY');
  console.log('═'.repeat(70));
  console.log(`✅ Success: ${results.success} companies`);
  console.log(`⚠️ Empty: ${results.empty} companies`);
  console.log(`❌ Errors: ${results.error} companies`);
  console.log(`👥 Total new buyer group members: ${results.totalMembers}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

