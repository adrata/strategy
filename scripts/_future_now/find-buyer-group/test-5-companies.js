#!/usr/bin/env node

/**
 * Test Buyer Group Discovery on 5 Companies
 * 
 * Runs the buyer group discovery pipeline on 5 companies from TOP's workspace
 * with JSON export and database skip enabled for testing
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { ProductionBuyerGroupPipeline } = require('./production-buyer-group');

const prisma = new PrismaClient();

async function findTopWorkspace() {
  // Find TOP workspace by name
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'TOP', mode: 'insensitive' } },
        { name: { contains: 'Top Engineers', mode: 'insensitive' } },
        { name: { contains: 'Top Engineers Plus', mode: 'insensitive' } }
      ]
    }
  });
  
  if (!workspace) {
    throw new Error('TOP workspace not found. Please provide workspace ID manually.');
  }
  
  console.log(`✅ Found TOP workspace: ${workspace.name} (${workspace.id})`);
  return workspace;
}

async function getTestCompanies(workspaceId, limit = 5) {
  // Get companies from workspace, prefer those with websites or LinkedIn URLs
  // But also include companies without URLs (we can use company name)
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId: workspaceId,
      deletedAt: null
    },
    take: limit * 2, // Get more to filter
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      name: true,
      website: true,
      linkedinUrl: true,
      industry: true
    }
  });
  
  if (companies.length === 0) {
    throw new Error(`No companies found in workspace ${workspaceId}`);
  }
  
  // Prefer companies with URLs, but include some without if needed
  const withUrls = companies.filter(c => c.website || c.linkedinUrl);
  const withoutUrls = companies.filter(c => !c.website && !c.linkedinUrl);
  
  const selected = [
    ...withUrls.slice(0, limit),
    ...withoutUrls.slice(0, Math.max(0, limit - withUrls.length))
  ].slice(0, limit);
  
  console.log(`✅ Found ${selected.length} companies for testing:`);
  selected.forEach((c, i) => {
    const url = c.website || c.linkedinUrl || 'no URL (will use company name)';
    console.log(`   ${i + 1}. ${c.name} (${url})`);
  });
  
  return selected;
}

async function runTestForCompany(company, workspaceId, testNumber) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST ${testNumber}/5: ${company.name}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Prefer website over LinkedIn URL for better accuracy
  // LinkedIn URLs can be ambiguous (e.g., "sce" matches multiple companies)
  let identifier = company.website || company.linkedinUrl;
  if (!identifier) {
    // If no URL, use company name (pipeline will try to find it)
    identifier = company.name;
    console.log(`⚠️  No URL found for ${company.name}, using company name as identifier`);
  } else if (company.website) {
    console.log(`✅ Using website URL for better accuracy: ${company.website}`);
  } else {
    console.log(`⚠️  Using LinkedIn URL (may be less accurate): ${company.linkedinUrl}`);
  }
  
  const options = {
    linkedinUrl: identifier,
    workspaceId: workspaceId,
    dealSize: 250000, // $250K typical for TOP
    maxPages: 5,
    skipInterview: true, // Skip interview for testing
    exportResultsJson: true,
    skipDatabase: true, // CRITICAL: Don't save to database
    jsonOutput: `./test-results/buyer-group-${company.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`
  };
  
  try {
    const pipeline = new ProductionBuyerGroupPipeline(options);
    const result = await pipeline.run();
    
    if (result && result.buyerGroup) {
      console.log(`\n✅ Test ${testNumber} completed successfully!`);
      console.log(`   Buyer Group Size: ${result.buyerGroup.length}`);
      console.log(`   Total Cost: $${(result.costs?.total || 0).toFixed(2)}`);
      console.log(`   JSON exported to: ${options.jsonOutput}`);
      return { success: true, result };
    } else {
      console.log(`\n⚠️  Test ${testNumber} completed but no buyer group found`);
      return { success: false, result: null };
    }
  } catch (error) {
    console.error(`\n❌ Test ${testNumber} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    console.log('🚀 Starting Buyer Group Discovery Test Suite');
    console.log('─'.repeat(60));
    
    // Find TOP workspace
    const workspace = await findTopWorkspace();
    
    // Get 5 test companies
    const companies = await getTestCompanies(workspace.id, 5);
    
    // Create test results directory
    const fs = require('fs');
    const path = require('path');
    const testDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Run tests
    const results = [];
    for (let i = 0; i < companies.length; i++) {
      const testResult = await runTestForCompany(companies[i], workspace.id, i + 1);
      results.push({
        company: companies[i].name,
        ...testResult
      });
      
      // Wait a bit between tests to avoid rate limiting
      if (i < companies.length - 1) {
        console.log('\n⏳ Waiting 5 seconds before next test...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 TEST SUMMARY');
    console.log(`${'='.repeat(60)}\n`);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successful}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}\n`);
    
    results.forEach((r, i) => {
      const status = r.success ? '✅' : '❌';
      console.log(`${status} ${i + 1}. ${r.company}`);
      if (r.result && r.result.buyerGroup) {
        console.log(`   Buyer Group: ${r.result.buyerGroup.length} members`);
        console.log(`   Cost: $${(r.result.costs?.total || 0).toFixed(2)}`);
      }
      if (r.error) {
        console.log(`   Error: ${r.error}`);
      }
    });
    
    console.log(`\n📁 All JSON results saved to: ./test-results/`);
    console.log('✅ Test suite completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findTopWorkspace, getTestCompanies, runTestForCompany };

