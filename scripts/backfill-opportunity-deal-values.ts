/**
 * Backfill Opportunity Deal Values
 * 
 * Estimates and saves deal values for all opportunities that don't have one set.
 * This script should be run once to populate deal values for existing opportunities.
 */

import { PrismaClient } from '@prisma/client';
import { DealValueEstimationService } from '../src/platform/services/DealValueEstimationService';

const prisma = new PrismaClient();

async function main() {
  const workspaceId = process.argv[2];
  
  if (!workspaceId) {
    console.error('❌ Please provide a workspace ID as an argument');
    console.log('Usage: npx tsx scripts/backfill-opportunity-deal-values.ts <workspaceId>');
    process.exit(1);
  }

  console.log('💰 Backfill Opportunity Deal Values');
  console.log('======================================================================');
  console.log(`📁 Workspace: ${workspaceId}\n`);

  try {
    // Find all opportunities without deal values
    const opportunities = await prisma.companies.findMany({
      where: {
        workspaceId,
        status: 'OPPORTUNITY',
        OR: [
          { opportunityAmount: null },
          { opportunityAmount: 0 }
        ]
      },
      select: {
        id: true,
        name: true,
        industry: true,
        size: true,
        revenue: true,
        description: true,
        descriptionEnriched: true,
        lastAction: true
      }
    });

    console.log(`📊 Found ${opportunities.length} opportunities without deal values\n`);

    if (opportunities.length === 0) {
      console.log('✅ All opportunities already have deal values!');
      await prisma.$disconnect();
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each opportunity
    for (const opportunity of opportunities) {
      try {
        console.log(`💰 Estimating deal value for: ${opportunity.name || opportunity.id}`);
        
        const estimatedValue = await DealValueEstimationService.estimateDealValue(
          {
            companyName: opportunity.name || '',
            industry: opportunity.industry,
            employeeCount: opportunity.size || null,
            revenue: opportunity.revenue,
            description: opportunity.description,
            descriptionEnriched: opportunity.descriptionEnriched,
            lastAction: opportunity.lastAction
          },
          workspaceId
        );

        // Save estimated value to database
        await prisma.companies.update({
          where: { id: opportunity.id },
          data: { opportunityAmount: estimatedValue }
        });

        console.log(`   ✅ Estimated: $${estimatedValue.toLocaleString()}\n`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error estimating deal value for ${opportunity.name || opportunity.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n======================================================================');
    console.log('📊 Summary:');
    console.log(`   ✅ Successfully estimated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Total processed: ${opportunities.length}`);
    console.log('======================================================================\n');

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

