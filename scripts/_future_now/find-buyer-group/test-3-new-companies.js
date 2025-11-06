#!/usr/bin/env node

/**
 * Test Buyer Group Discovery on 3 New Companies
 * 
 * Tests the buyer group discovery pipeline with the new smart sizing system
 * on 3 companies that haven't been tested yet.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');

const prisma = new PrismaClient();

async function findTopWorkspace() {
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

async function getNewTestCompanies(workspaceId, excludeNames = []) {
  // Get companies that haven't been tested yet
  // Exclude companies we've already tested
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId: workspaceId,
      NOT: {
        OR: [
          { name: { in: excludeNames } },
          { name: { contains: 'Unassigned', mode: 'insensitive' } },
          { name: { contains: 'Test', mode: 'insensitive' } }
        ]
      }
    },
    take: 20, // Get more to filter from
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Prioritize companies with website or LinkedIn URL
  const withUrls = companies.filter(c => c.website || c.linkedinUrl);
  const withoutUrls = companies.filter(c => !c.website && !c.linkedinUrl);

  // Select 3 companies: prefer those with URLs, but include by name if needed
  const selected = [];
  
  // First, try to get 3 with URLs
  for (const company of withUrls) {
    if (selected.length >= 3) break;
    if (!excludeNames.some(ex => company.name.toLowerCase().includes(ex.toLowerCase()))) {
      selected.push(company);
    }
  }

  // If we need more, add companies by name
  for (const company of withoutUrls) {
    if (selected.length >= 3) break;
    if (!excludeNames.some(ex => company.name.toLowerCase().includes(ex.toLowerCase()))) {
      selected.push(company);
    }
  }

  if (selected.length === 0) {
    throw new Error('No new companies found to test');
  }

  console.log(`\n📋 Selected ${selected.length} new companies for testing:`);
  selected.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.name} (${c.website || c.linkedinUrl || 'name only'})`);
  });

  return selected.slice(0, 3); // Return exactly 3
}

async function runTestForCompany(company, workspaceId, testNumber) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST ${testNumber}/3: ${company.name}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Prefer website over LinkedIn URL for better accuracy
  let identifier = company.website || company.linkedinUrl;
  if (!identifier) {
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
    const pipeline = new SmartBuyerGroupPipeline(options);
    const result = await pipeline.run(company);
    
    if (result && result.buyerGroup) {
      console.log(`\n✅ Test ${testNumber} completed successfully!`);
      console.log(`   Buyer Group Size: ${result.buyerGroup.length} members`);
      console.log(`   Cost: $${(result.costs?.total || 0).toFixed(2)}`);
      
      // Show sizing analysis if available
      if (result.pipelineState?.buyerGroupSizing) {
        const sizing = result.pipelineState.buyerGroupSizing;
        console.log(`   Size Constraints: ${sizing.constraints.min}-${sizing.constraints.max} (ideal: ${sizing.constraints.ideal})`);
        console.log(`   Size Validation Score: ${sizing.validation.score}/100`);
        console.log(`   Recommendation: ${sizing.recommendation.message}`);
      }
      
      // Show sample members
      if (result.buyerGroup.length > 0) {
        console.log(`\n   Sample Members:`);
        result.buyerGroup.slice(0, 3).forEach((member, i) => {
          console.log(`     ${i + 1}. ${member.name} - ${member.title} (${member.buyerGroupRole})`);
        });
      }
    } else {
      console.log(`\n⚠️  Test ${testNumber} completed but no buyer group found`);
    }
    
    return { success: true, company: company.name, result };
  } catch (error) {
    console.error(`\n❌ Test ${testNumber} failed:`, error.message);
    console.error(error.stack);
    return { success: false, company: company.name, error: error.message };
  }
}

async function main() {
  try {
    console.log('🚀 Starting Buyer Group Discovery Test (3 New Companies)');
    console.log('📊 Testing with Smart Buyer Group Sizing System\n');

    // Find TOP workspace
    const workspace = await findTopWorkspace();
    
    // Get companies we've already tested (from previous test)
    const excludeNames = [
      'Southern California Edison',
      'City of Columbia Heights',
      'El Dorado Irrigation District',
      'Great Plains Natural Gas',
      'MidAmerican Energy Company',
      'Southern Company', // Just tested
      'SCE',
      'Nokia', // Exclude Nokia (wrong match)
      'Unassigned Company' // Exclude placeholder companies
    ];
    
    // Get 3 new companies
    const testCompanies = await getNewTestCompanies(workspace.id, excludeNames);
    
    if (testCompanies.length === 0) {
      console.error('❌ No new companies found to test');
      process.exit(1);
    }
    
    // Run tests
    const results = [];
    for (let i = 0; i < testCompanies.length; i++) {
      const result = await runTestForCompany(testCompanies[i], workspace.id, i + 1);
      results.push(result);
      
      // Small delay between tests
      if (i < testCompanies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 TEST SUMMARY');
    console.log(`${'='.repeat(60)}\n`);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successful}/3`);
    console.log(`❌ Failed: ${failed}/3\n`);
    
    results.forEach((r, i) => {
      const status = r.success ? '✅' : '❌';
      console.log(`${status} ${i + 1}. ${r.company}`);
      if (r.error) {
        console.log(`   Error: ${r.error}`);
      } else if (r.result?.buyerGroup) {
        console.log(`   Buyer Group: ${r.result.buyerGroup.length} members`);
        console.log(`   Cost: $${(r.result.costs?.total || 0).toFixed(2)}`);
      }
    });
    
    console.log('\n✅ Test suite completed!');
    
    // Show sizing analysis summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📏 BUYER GROUP SIZING ANALYSIS');
    console.log(`${'='.repeat(60)}\n`);
    
    results.filter(r => r.success && r.result?.pipelineState?.buyerGroupSizing).forEach((r, i) => {
      const sizing = r.result.pipelineState.buyerGroupSizing;
      console.log(`${i + 1}. ${r.company}:`);
      console.log(`   Size: ${r.result.buyerGroup.length} members`);
      console.log(`   Constraints: ${sizing.constraints.min}-${sizing.constraints.max} (ideal: ${sizing.constraints.ideal})`);
      console.log(`   Validation: ${sizing.validation.score}/100 - ${sizing.validation.reasoning}`);
      console.log(`   Recommendation: ${sizing.recommendation.message}`);
      console.log('');
    });
    
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

module.exports = { runTestForCompany };

