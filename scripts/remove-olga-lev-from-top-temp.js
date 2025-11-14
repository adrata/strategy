/**
 * Remove Olga Lev from Top-Temp Workspace
 * 
 * This script removes Olga Lev (Визуализатор) from the top-temp workspace
 * by soft-deleting her person record.
 * 
 * Usage:
 *   node scripts/remove-olga-lev-from-top-temp.js [--dry-run]
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const WORKSPACE_SLUG = 'top-temp';
const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';
const OLGA_LEV_NAME = 'Olga Lev';
const OLGA_LEV_JOB_TITLE = 'Визуализатор';

async function removeOlgaLev() {
  try {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');

    console.log('🗑️  REMOVING OLGA LEV FROM TOP-TEMP WORKSPACE');
    console.log('='.repeat(60));
    console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`);
    console.log('');

    // Step 1: Get workspace
    console.log('📋 STEP 1: Finding workspace...');
    let workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { slug: WORKSPACE_SLUG },
          { id: TOP_TEMP_WORKSPACE_ID }
        ],
        deletedAt: null
      }
    });

    if (!workspace) {
      console.error(`❌ Workspace "${WORKSPACE_SLUG}" not found`);
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    console.log('');

    // Step 2: Find Olga Lev
    console.log('📋 STEP 2: Finding Olga Lev...');
    const olgaLev = await prisma.people.findFirst({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        OR: [
          { fullName: { contains: OLGA_LEV_NAME, mode: 'insensitive' } },
          { 
            AND: [
              { fullName: { contains: 'Olga', mode: 'insensitive' } },
              { fullName: { contains: 'Lev', mode: 'insensitive' } }
            ]
          }
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!olgaLev) {
      console.log('⚠️  Olga Lev not found in top-temp workspace');
      console.log('   She may have already been removed or does not exist in this workspace.');
      await prisma.$disconnect();
      process.exit(0);
    }

    console.log(`✅ Found Olga Lev:`);
    console.log(`   ID: ${olgaLev.id}`);
    console.log(`   Name: ${olgaLev.fullName}`);
    console.log(`   Email: ${olgaLev.email || olgaLev.workEmail || olgaLev.personalEmail || 'N/A'}`);
    console.log(`   Job Title: ${olgaLev.jobTitle || 'N/A'}`);
    console.log(`   Company: ${olgaLev.company?.name || 'N/A'}`);
    console.log('');

    // Step 3: Remove (soft delete)
    console.log('📋 STEP 3: Removing Olga Lev from workspace...');
    
    if (isDryRun) {
      console.log('   [DRY RUN] Would soft-delete Olga Lev');
      console.log('   [DRY RUN] Would set deletedAt timestamp');
    } else {
      await prisma.people.update({
        where: { id: olgaLev.id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log('   ✅ Soft-deleted Olga Lev from top-temp workspace');
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ REMOVAL COMPLETE');
    console.log('='.repeat(60));
    console.log(`Workspace: ${workspace.name}`);
    console.log(`Person: ${olgaLev.fullName} (${olgaLev.id})`);
    console.log(`Status: ${isDryRun ? 'DRY RUN - No changes made' : 'REMOVED (soft-deleted)'}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  removeOlgaLev()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { removeOlgaLev };

