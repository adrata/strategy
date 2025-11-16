/**
 * Create Opportunities Table and Migrate Data for TOP Workspace
 * 
 * This script:
 * 1. Creates the opportunities table if it doesn't exist
 * 2. Migrates companies with status=OPPORTUNITY to opportunities table
 * 3. Specifically for TOP workspace (01K75ZD7DWHG1XF16HAF2YVKCK)
 */

import { prisma } from '@/platform/database/prisma-client';

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

async function checkOpportunitiesTable() {
  console.log('🔧 Checking if opportunities table exists...');
  
  try {
    // Check if table exists by trying to query it
    await prisma.$queryRaw`SELECT 1 FROM "opportunities" LIMIT 1`;
    console.log('✅ Opportunities table exists');
    return true;
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('❌ Opportunities table does NOT exist');
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   The opportunities table needs to be created manually in production.');
      console.log('   Please run the migration SQL from: prisma/migrations/20250131000001_add_opportunities_table/migration.sql');
      console.log('   Or resolve the failed migration and run: npx prisma migrate deploy');
      return false;
    } else {
      console.error('❌ Error checking table:', error);
      return false;
    }
  }
}

async function migrateOpportunities() {
  console.log(`\n🔄 Migrating companies with status=OPPORTUNITY to opportunities table...`);
  console.log(`📁 Workspace: ${TOP_WORKSPACE_ID}\n`);
  
  try {
    const companiesToMigrate = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
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

    console.log(`📊 Found ${companiesToMigrate.length} companies with status=OPPORTUNITY to migrate\n`);

    if (companiesToMigrate.length === 0) {
      console.log('✅ No companies to migrate');
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
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Create and Populate Opportunities Table');
    console.log('======================================================================\n');
    
    // Step 1: Check if table exists
    const tableExists = await checkOpportunitiesTable();
    if (!tableExists) {
      console.error('\n❌ Cannot proceed without opportunities table');
      process.exit(1);
    }
    
    // Step 2: Migrate data
    await migrateOpportunities();
    
    // Step 3: Verify
    const count = await prisma.opportunities.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`\n✅ Verification: Found ${count} opportunity records in production database`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Script failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main().catch(console.error);

