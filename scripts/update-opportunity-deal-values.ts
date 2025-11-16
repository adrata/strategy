/**
 * Update Opportunity Deal Values
 * 
 * Updates existing opportunity deal values to ensure they fall within
 * the $150k-$500k range for TOP Engineering Plus contracts.
 * 
 * This script re-estimates deal values using the updated DealValueEstimationService
 * which now clamps values to the correct range.
 */

import { PrismaClient } from '@prisma/client';
import { DealValueEstimationService } from '../src/platform/services/DealValueEstimationService';

const prisma = new PrismaClient();

async function main() {
  const workspaceId = process.argv[2];
  
  if (!workspaceId) {
    console.error('❌ Please provide a workspace ID as an argument');
    console.log('Usage: npx tsx scripts/update-opportunity-deal-values.ts <workspaceId>');
    process.exit(1);
  }

  console.log('💰 Update Opportunity Deal Values');
  console.log('======================================================================');
  console.log(`📁 Workspace: ${workspaceId}\n`);

  try {
    // Find all opportunities with deal values outside $150k-$500k range
    const opportunities = await prisma.companies.findMany({
      where: {
        workspaceId,
        status: 'OPPORTUNITY',
        OR: [
          { opportunityAmount: null },
          { opportunityAmount: 0 },
          { opportunityAmount: { lt: 150000 } },
          { opportunityAmount: { gt: 500000 } }
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
        lastAction: true,
        opportunityAmount: true
      }
    });

    console.log(`📊 Found ${opportunities.length} opportunities to update\n`);

    if (opportunities.length === 0) {
      console.log('✅ All opportunities already have deal values in the correct range!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each opportunity
    for (const opportunity of opportunities) {
      try {
        const currentValue = opportunity.opportunityAmount;
        const needsUpdate = !currentValue || currentValue === 0 || currentValue < 150000 || currentValue > 500000;
        
        if (!needsUpdate) {
          skippedCount++;
          continue;
        }

        console.log(`💰 Updating deal value for: ${opportunity.name || opportunity.id}`);
        console.log(`   Current value: ${currentValue ? `$${currentValue.toLocaleString()}` : 'Not set'}`);
        
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

        // Update database with new value
        await prisma.companies.update({
          where: { id: opportunity.id },
          data: { opportunityAmount: estimatedValue }
        });

        console.log(`   ✅ Updated: $${estimatedValue.toLocaleString()}\n`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error updating deal value for ${opportunity.name || opportunity.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n======================================================================');
    console.log('📊 Summary:');
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ⏭️  Skipped (already in range): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Total processed: ${opportunities.length}`);
    console.log('======================================================================\n');

  } catch (error) {
    console.error('❌ Error during update:', error);
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

