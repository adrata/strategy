#!/usr/bin/env node

/**
 * Run Buyer Group Discovery for New Dan Companies
 * 
 * Executes buyer-group discovery pipeline for companies that were just added
 * for Dan in the Adrata workspace. Uses ProductionBuyerGroupPipeline.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { ProductionBuyerGroupPipeline } = require('./_future_now/find-buyer-group/production-buyer-group');

const prisma = new PrismaClient();

const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DELAY_BETWEEN_RUNS = 2000; // 2 seconds between companies

async function runBuyerGroupDiscovery() {
  console.log('🚀 Buyer Group Discovery for New Dan Companies');
  console.log('═'.repeat(60));
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Verify workspace exists
    const workspace = await prisma.workspaces.findUnique({
      where: { id: ADRATA_WORKSPACE_ID },
      select: { id: true, name: true }
    });

    if (!workspace) {
      throw new Error(`Workspace ${ADRATA_WORKSPACE_ID} not found`);
    }
    console.log(`✅ Workspace: ${workspace.name}\n`);

    // Verify Dan user exists
    const danUser = await prisma.users.findUnique({
      where: { id: DAN_USER_ID },
      select: { id: true, name: true, email: true }
    });

    if (!danUser) {
      throw new Error(`User ${DAN_USER_ID} not found`);
    }
    console.log(`✅ User: ${danUser.name} (${danUser.email})\n`);

    // Get companies assigned to Dan that have LinkedIn URLs or websites
    // and don't have people yet (newly added companies)
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        mainSellerId: DAN_USER_ID,
        deletedAt: null,
        OR: [
          { linkedinUrl: { not: null } },
          { website: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${companies.length} companies assigned to Dan\n`);

    if (companies.length === 0) {
      console.log('⚠️  No companies found. Exiting.');
      await prisma.$disconnect();
      return;
    }

    // Filter companies that have LinkedIn/website but no people yet
    // Or process all if user wants to re-run
    const companiesToProcess = companies.filter(c => 
      (c.linkedinUrl || c.website) && c._count.people === 0
    );

    if (companiesToProcess.length === 0) {
      console.log('⚠️  No companies found without buyer groups. All companies already have people.');
      console.log('   To re-run for all companies, modify the filter in the script.\n');
      await prisma.$disconnect();
      return;
    }

    console.log(`📋 Processing ${companiesToProcess.length} companies without buyer groups...\n`);

    const results = {
      completed: [],
      failed: [],
      skipped: []
    };

    for (let i = 0; i < companiesToProcess.length; i++) {
      const company = companiesToProcess[i];
      console.log(`[${i + 1}/${companiesToProcess.length}] ${company.name}`);
      console.log(`   ID: ${company.id}`);

      // Determine identifier (LinkedIn URL preferred, fallback to website)
      const identifier = company.linkedinUrl || company.website;
      
      if (!identifier) {
        console.log(`   ⏭️  Skipping: No LinkedIn URL or website`);
        results.skipped.push({
          id: company.id,
          name: company.name,
          reason: 'No LinkedIn URL or website'
        });
        continue;
      }

      console.log(`   🔗 Using identifier: ${identifier}`);

      try {
        // Initialize pipeline
        const pipeline = new ProductionBuyerGroupPipeline({
          workspaceId: ADRATA_WORKSPACE_ID,
          linkedinUrl: identifier,
          dealSize: 150000,
          maxPages: 5,
          skipInterview: true, // Use saved config if available
          usaOnly: true, // USA-only filter
          prisma: prisma // Pass prisma instance to avoid creating new connections
        });

        console.log(`   🚀 Starting buyer group discovery...`);
        const startTime = Date.now();

        // Execute pipeline
        const result = await pipeline.run();

        const processingTime = Date.now() - startTime;
        console.log(`   ✅ Completed in ${(processingTime / 1000).toFixed(1)}s`);

        if (result && result.buyerGroup) {
          const buyerGroupSize = Array.isArray(result.buyerGroup) 
            ? result.buyerGroup.length 
            : Object.keys(result.buyerGroup).length;
          console.log(`   👥 Buyer group: ${buyerGroupSize} members`);
          
          if (result.costs) {
            console.log(`   💰 Cost: $${result.costs.total?.toFixed(2) || 'N/A'}`);
          }

          results.completed.push({
            id: company.id,
            name: company.name,
            buyerGroupSize: buyerGroupSize,
            processingTime: processingTime
          });
        } else {
          console.log(`   ⚠️  No buyer group found`);
          results.completed.push({
            id: company.id,
            name: company.name,
            buyerGroupSize: 0,
            processingTime: processingTime
          });
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        if (error.stack) {
          console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
        }
        
        results.failed.push({
          id: company.id,
          name: company.name,
          error: error.message
        });
      }

      // Delay between companies (except for last one)
      if (i < companiesToProcess.length - 1) {
        console.log(`   ⏳ Waiting ${DELAY_BETWEEN_RUNS}ms before next company...\n`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_RUNS));
      } else {
        console.log('');
      }
    }

    // Print summary
    console.log('\n📊 SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Completed: ${results.completed.length} companies`);
    console.log(`❌ Failed: ${results.failed.length} companies`);
    console.log(`⏭️  Skipped: ${results.skipped.length} companies`);

    if (results.completed.length > 0) {
      const totalMembers = results.completed.reduce((sum, c) => sum + (c.buyerGroupSize || 0), 0);
      console.log(`\n👥 Total buyer group members found: ${totalMembers}`);
      
      console.log('\n✅ Successfully processed:');
      results.completed.forEach(c => {
        console.log(`   - ${c.name}: ${c.buyerGroupSize || 0} members`);
      });
    }

    if (results.failed.length > 0) {
      console.log('\n❌ Failed companies:');
      results.failed.forEach(c => {
        console.log(`   - ${c.name}: ${c.error}`);
      });
    }

    if (results.skipped.length > 0) {
      console.log('\n⏭️  Skipped companies:');
      results.skipped.forEach(c => {
        console.log(`   - ${c.name}: ${c.reason}`);
      });
    }

    console.log('\n✅ Process complete!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  runBuyerGroupDiscovery().catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
}

module.exports = { runBuyerGroupDiscovery };

