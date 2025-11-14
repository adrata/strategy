/**
 * Populate Intelligence for TOP Workspace Companies
 * 
 * Generates intelligence (strategy data) for all companies in the TOP workspace
 * that don't already have it. Runs in batches to avoid overwhelming the API.
 */

import { prisma } from '../src/lib/prisma';
import { autoStrategyPopulationService } from '../src/platform/services/auto-strategy-population-service';

const TOP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function populateTopIntelligence() {
  console.log('🚀 POPULATE INTELLIGENCE FOR TOP WORKSPACE COMPANIES\n');
  console.log('='.repeat(80));
  console.log(`\n🎯 Workspace ID: ${TOP_WORKSPACE_ID}\n`);

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Check how many companies need intelligence
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        customFields: true
      }
    });

    const companiesWithoutIntelligence = allCompanies.filter(company => {
      const customFields = company.customFields as any;
      return !customFields || !customFields.strategyData;
    }).length;

    const companiesWithIntelligence = allCompanies.filter(company => {
      const customFields = company.customFields as any;
      return customFields && customFields.strategyData;
    }).length;

    console.log(`📊 Companies with intelligence: ${companiesWithIntelligence}`);
    console.log(`📊 Companies without intelligence: ${companiesWithoutIntelligence}\n`);

    if (companiesWithoutIntelligence === 0) {
      console.log('✅ All companies already have intelligence data!\n');
      return;
    }

    console.log(`🔄 Starting intelligence generation for ${companiesWithoutIntelligence} companies...\n`);
    console.log('⏱️  This will process in batches of 50 companies at a time.\n');
    console.log('⏱️  Each company takes ~30-60 seconds to generate.\n');
    console.log('⏱️  Estimated total time: ~' + Math.ceil(companiesWithoutIntelligence / 50) * 60 + ' minutes\n');

    let totalProcessed = 0;
    let totalGenerated = 0;
    let totalErrors = 0;
    let batchNumber = 1;

    // Process in batches
    while (true) {
      console.log(`\n📦 Batch ${batchNumber}:\n`);

      const result = await autoStrategyPopulationService.populateStrategiesForAllCompanies(TOP_WORKSPACE_ID);

      totalProcessed += result.companiesProcessed;
      totalGenerated += result.strategiesGenerated;
      totalErrors += result.errors.length;

      console.log(`\n📊 Batch ${batchNumber} Results:`);
      console.log(`   ✅ Generated: ${result.strategiesGenerated}`);
      console.log(`   ❌ Errors: ${result.errors.length}`);
      if (result.errors.length > 0) {
        console.log(`   Error details:`);
        result.errors.forEach((error, i) => {
          console.log(`     ${i + 1}. ${error}`);
        });
      }

      // Check if there are more companies to process
      const allRemainingCompanies = await prisma.companies.findMany({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null
        },
        select: {
          id: true,
          customFields: true
        }
      });

      const remaining = allRemainingCompanies.filter(company => {
        const customFields = company.customFields as any;
        return !customFields || !customFields.strategyData;
      }).length;

      console.log(`📊 Remaining companies without intelligence: ${remaining}`);

      if (remaining === 0 || result.companiesProcessed === 0) {
        console.log(`\n✅ No more companies to process (remaining: ${remaining}, processed: ${result.companiesProcessed})`);
        break;
      }

      batchNumber++;
      console.log(`\n⏳ Waiting 5 seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ INTELLIGENCE POPULATION COMPLETE\n');
    console.log(`📊 Total Processed: ${totalProcessed}`);
    console.log(`✅ Total Generated: ${totalGenerated}`);
    console.log(`❌ Total Errors: ${totalErrors}\n`);

    // Final count
    const finalCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        customFields: true
      }
    });

    const finalCount = finalCompanies.filter(company => {
      const customFields = company.customFields as any;
      return customFields && customFields.strategyData;
    }).length;

    console.log(`📊 Final count: ${finalCount} companies now have intelligence data\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('✅ Database connection closed\n');
  }
}

// Run the script
populateTopIntelligence()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

