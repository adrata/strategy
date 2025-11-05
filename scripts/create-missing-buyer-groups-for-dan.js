#!/usr/bin/env node

/**
 * Create Missing Buyer Groups for Dan's Companies
 * 
 * Finds companies that have people but no buyer group record,
 * then runs buyer group discovery to create the missing buyer groups.
 * Only uses real data - no fallback or placeholder data.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { ProductionBuyerGroupPipeline } = require('./_future_now/find-buyer-group/production-buyer-group');

const prisma = new PrismaClient();

const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DELAY_BETWEEN_RUNS = 3000; // 3 seconds between companies

async function createMissingBuyerGroups() {
  console.log('🔍 Creating Missing Buyer Groups for Dan\'s Companies');
  console.log('═'.repeat(60));
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get companies added today that have people but no buyer group
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        mainSellerId: DAN_USER_ID,
        deletedAt: null,
        createdAt: { gte: today }
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        createdAt: true,
        _count: {
          select: {
            people: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Found ${companies.length} companies added today\n`);

    // Check existing buyer groups
    const existingBuyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        companyName: { in: companies.map(c => c.name) }
      },
      select: {
        companyName: true
      }
    });

    const existingCompanyNames = new Set(
      existingBuyerGroups.map(bg => bg.companyName.toLowerCase())
    );

    // Filter: companies that have people BUT no buyer group record
    const companiesNeedingBuyerGroups = companies.filter(company => {
      const hasPeople = company._count.people > 0;
      const hasBuyerGroup = existingCompanyNames.has(company.name.toLowerCase());
      return hasPeople && !hasBuyerGroup;
    });

    console.log('📊 ANALYSIS');
    console.log('═'.repeat(60));
    console.log(`Total companies: ${companies.length}`);
    console.log(`Companies with people: ${companies.filter(c => c._count.people > 0).length}`);
    console.log(`Companies with buyer groups: ${existingBuyerGroups.length}`);
    console.log(`Companies needing buyer groups: ${companiesNeedingBuyerGroups.length}\n`);

    if (companiesNeedingBuyerGroups.length === 0) {
      console.log('✅ All companies with people already have buyer groups!');
      await prisma.$disconnect();
      return;
    }

    console.log('🎯 COMPANIES NEEDING BUYER GROUPS:');
    console.log('─'.repeat(60));
    companiesNeedingBuyerGroups.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (${company._count.people} people)`);
      console.log(`   Website: ${company.website || 'N/A'}`);
      console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
    });
    console.log('');

    const results = {
      completed: [],
      failed: [],
      skipped: []
    };

    // Process each company
    for (let i = 0; i < companiesNeedingBuyerGroups.length; i++) {
      const company = companiesNeedingBuyerGroups[i];
      const progress = `[${i + 1}/${companiesNeedingBuyerGroups.length}]`;
      
      console.log(`${'='.repeat(60)}`);
      console.log(`${progress} Processing: ${company.name}`);
      console.log(`${'='.repeat(60)}`);

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
      console.log(`   👥 People in database: ${company._count.people}`);
      console.log(`   🚀 Starting buyer group discovery (real data only)...`);

      try {
        // Initialize pipeline - NO fallback data, only real people
        const pipeline = new ProductionBuyerGroupPipeline({
          workspaceId: ADRATA_WORKSPACE_ID,
          linkedinUrl: identifier,
          dealSize: 150000,
          maxPages: 5,
          skipInterview: true, // Use saved config if available
          usaOnly: true, // USA-only filter
          prisma: prisma // Pass prisma instance to avoid creating new connections
        });

        const startTime = Date.now();

        // Execute pipeline - this will use real data from Coresignal API
        const result = await pipeline.run();

        const processingTime = Date.now() - startTime;
        console.log(`   ✅ Completed in ${(processingTime / 1000).toFixed(1)}s`);

        if (result && result.buyerGroup) {
          const buyerGroupSize = Array.isArray(result.buyerGroup) 
            ? result.buyerGroup.length 
            : Object.keys(result.buyerGroup).length;
          
          console.log(`   👥 Buyer group created: ${buyerGroupSize} members`);
          
          if (result.costs) {
            console.log(`   💰 Cost: $${result.costs.total?.toFixed(2) || 'N/A'}`);
          }

          // Verify buyer group was saved
          const savedBG = await prisma.buyerGroups.findFirst({
            where: {
              workspaceId: ADRATA_WORKSPACE_ID,
              companyName: company.name
            }
          });

          if (savedBG) {
            console.log(`   ✅ Buyer group saved to database: ${savedBG.id}`);
          } else {
            console.log(`   ⚠️  Warning: Buyer group not found in database after creation`);
          }

          results.completed.push({
            id: company.id,
            name: company.name,
            buyerGroupSize: buyerGroupSize,
            processingTime: processingTime
          });
        } else {
          console.log(`   ⚠️  No buyer group generated`);
          results.failed.push({
            id: company.id,
            name: company.name,
            error: 'No buyer group generated'
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
      if (i < companiesNeedingBuyerGroups.length - 1) {
        console.log(`   ⏳ Waiting ${DELAY_BETWEEN_RUNS}ms before next company...\n`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_RUNS));
      } else {
        console.log('');
      }
    }

    // Print summary
    console.log('\n📊 FINAL SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Completed: ${results.completed.length} companies`);
    console.log(`❌ Failed: ${results.failed.length} companies`);
    console.log(`⏭️  Skipped: ${results.skipped.length} companies`);

    if (results.completed.length > 0) {
      const totalMembers = results.completed.reduce((sum, c) => sum + (c.buyerGroupSize || 0), 0);
      console.log(`\n👥 Total buyer group members created: ${totalMembers}`);
      
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

    // Final verification
    console.log('\n🔍 VERIFICATION');
    console.log('═'.repeat(60));
    const finalBuyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        companyName: { in: companies.map(c => c.name) }
      },
      select: {
        companyName: true,
        totalMembers: true
      }
    });

    console.log(`Total buyer groups now: ${finalBuyerGroups.length} out of ${companies.length} companies`);
    const successRate = ((finalBuyerGroups.length / companies.length) * 100).toFixed(1);
    console.log(`Success rate: ${successRate}%\n`);

    console.log('✅ Process complete!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createMissingBuyerGroups().catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
}

module.exports = { createMissingBuyerGroups };

