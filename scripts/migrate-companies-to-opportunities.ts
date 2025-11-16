/**
 * Migrate Companies to Opportunities
 * 
 * Migrates existing companies with status=OPPORTUNITY to the new opportunities table.
 * This script:
 * 1. Finds all companies with status = 'OPPORTUNITY'
 * 2. Creates opportunity records for each
 * 3. Maps fields: opportunityStage → stage, opportunityAmount → amount, etc.
 * 4. Sets companyId reference
 * 5. Keeps company status as OPPORTUNITY (for now)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const workspaceId = process.argv[2];
  
  if (!workspaceId) {
    console.error('❌ Please provide a workspace ID as an argument');
    console.log('Usage: npx tsx scripts/migrate-companies-to-opportunities.ts <workspaceId>');
    console.log('Or use "all" to migrate all workspaces');
    process.exit(1);
  }

  console.log('🔄 Migrate Companies to Opportunities');
  console.log('======================================================================');
  
  try {
    let companiesToMigrate;
    
    if (workspaceId === 'all') {
      console.log('📁 Migrating all workspaces\n');
      companiesToMigrate = await prisma.companies.findMany({
        where: {
          status: 'OPPORTUNITY',
          deletedAt: null
        },
        select: {
          id: true,
          workspaceId: true,
          name: true,
          description: true,
          descriptionEnriched: true,
          opportunityAmount: true,
          opportunityStage: true,
          opportunityProbability: true,
          expectedCloseDate: true,
          actualCloseDate: true,
          mainSellerId: true
        }
      });
    } else {
      console.log(`📁 Workspace: ${workspaceId}\n`);
      companiesToMigrate = await prisma.companies.findMany({
        where: {
          workspaceId,
          status: 'OPPORTUNITY',
          deletedAt: null
        },
        select: {
          id: true,
          workspaceId: true,
          name: true,
          description: true,
          descriptionEnriched: true,
          opportunityAmount: true,
          opportunityStage: true,
          opportunityProbability: true,
          expectedCloseDate: true,
          actualCloseDate: true,
          mainSellerId: true
        }
      });
    }

    console.log(`📊 Found ${companiesToMigrate.length} companies with status=OPPORTUNITY to migrate\n`);

    if (companiesToMigrate.length === 0) {
      console.log('✅ No companies to migrate');
      await prisma.$disconnect();
      return;
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const company of companiesToMigrate) {
      try {
        // Check if opportunity already exists for this company
        const existingOpportunity = await prisma.opportunities.findFirst({
          where: {
            companyId: company.id,
            workspaceId: company.workspaceId,
            deletedAt: null
          }
        });

        if (existingOpportunity) {
          console.log(`⏭️  Skipping ${company.name} - opportunity already exists`);
          skipped++;
          continue;
        }

        // Create opportunity record
        const opportunity = await prisma.opportunities.create({
          data: {
            workspaceId: company.workspaceId,
            companyId: company.id,
            name: company.name || 'Unnamed Opportunity',
            description: company.descriptionEnriched || company.description || null,
            amount: company.opportunityAmount ? parseFloat(company.opportunityAmount.toString()) : null,
            stage: company.opportunityStage || 'Discovery',
            probability: company.opportunityProbability || 0.1,
            expectedCloseDate: company.expectedCloseDate || null,
            actualCloseDate: company.actualCloseDate || null,
            ownerId: company.mainSellerId || null
          }
        });

        console.log(`✅ Migrated: ${company.name} → Opportunity ${opportunity.id}`);
        migrated++;
      } catch (error) {
        console.error(`❌ Error migrating ${company.name}:`, error instanceof Error ? error.message : error);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total: ${companiesToMigrate.length}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main().catch(console.error);

