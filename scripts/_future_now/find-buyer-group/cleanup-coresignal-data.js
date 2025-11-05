/**
 * Cleanup Script: Remove Fake Coresignal Emails
 * 
 * This script removes ONLY fake @coresignal.temp emails from the database:
 * - Removes fake @coresignal.temp emails from People records (sets to null)
 * - Removes fake @coresignal.temp emails from BuyerGroupMembers records
 * - KEEPS coresignalData storage (we want to keep that data)
 * 
 * Run for specific workspace (e.g., user 'dan')
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Clean up coresignal data for a specific workspace
 */
async function cleanupCoresignalData(workspaceName) {
  console.log(`\n🧹 Starting cleanup for workspace: ${workspaceName}\n`);

  try {
    // 1. Find the workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: workspaceName, mode: 'insensitive' } },
          { slug: { contains: workspaceName, mode: 'insensitive' } },
          { id: workspaceName } // Allow direct ID lookup
        ]
      }
    });

    if (!workspace) {
      console.error(`❌ Workspace not found: ${workspaceName}`);
      console.log('\nAvailable workspaces:');
      const allWorkspaces = await prisma.workspaces.findMany({
        select: { id: true, name: true, slug: true }
      });
      allWorkspaces.forEach(w => {
        console.log(`  - ${w.name} (ID: ${w.id}, Slug: ${w.slug})`);
      });
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspace.id})\n`);

    // 2. Find and clean up People with coresignal emails
    console.log('🔍 Finding people with @coresignal.temp emails...');
    const peopleWithFakeEmails = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        email: { contains: '@coresignal.temp' }
      },
      select: { id: true, email: true, fullName: true }
    });

    console.log(`Found ${peopleWithFakeEmails.length} people with fake coresignal emails`);
    
    if (peopleWithFakeEmails.length > 0) {
      // Update to set email to null
      const updateResult = await prisma.people.updateMany({
        where: {
          workspaceId: workspace.id,
          email: { contains: '@coresignal.temp' }
        },
        data: {
          email: null
        }
      });
      console.log(`✅ Removed ${updateResult.count} fake coresignal emails\n`);
    }

    // 3. Find and clean up BuyerGroupMembers with fake emails
    console.log('🔍 Finding BuyerGroupMembers with @coresignal.temp emails...');
    const bgMembersWithFakeEmails = await prisma.buyerGroupMembers.findMany({
      where: {
        email: { contains: '@coresignal.temp' }
      },
      select: { id: true, name: true, email: true }
    });

    console.log(`Found ${bgMembersWithFakeEmails.length} BuyerGroupMembers with fake coresignal emails`);
    
    if (bgMembersWithFakeEmails.length > 0) {
      // Update to set email to null
      const updateResult = await prisma.buyerGroupMembers.updateMany({
        where: {
          email: { contains: '@coresignal.temp' }
        },
        data: {
          email: null
        }
      });
      console.log(`✅ Removed ${updateResult.count} fake coresignal emails from BuyerGroupMembers\n`);
    }

    // 4. Summary Report
    console.log('📊 Cleanup Summary:');
    console.log('==================');
    console.log(`Workspace: ${workspace.name}`);
    console.log(`People with fake emails removed: ${peopleWithFakeEmails.length}`);
    console.log(`BuyerGroupMembers with fake emails removed: ${bgMembersWithFakeEmails.length}`);
    console.log('\n✅ Cleanup completed successfully!\n');

    // 5. Verification - Check if any fake emails remain
    console.log('🔍 Verifying cleanup...');
    
    const remainingFakeEmailsPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        email: { contains: '@coresignal.temp' }
      }
    });

    const remainingFakeEmailsBGM = await prisma.buyerGroupMembers.count({
      where: {
        email: { contains: '@coresignal.temp' }
      }
    });

    if (remainingFakeEmailsPeople === 0 && remainingFakeEmailsBGM === 0) {
      console.log('✅ Verification passed: No fake @coresignal.temp emails found\n');
    } else {
      console.warn(`⚠️ Warning: Still found ${remainingFakeEmailsPeople} fake emails in People and ${remainingFakeEmailsBGM} in BuyerGroupMembers\n`);
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const workspaceName = process.argv[2] || 'dan';

console.log(`
╔════════════════════════════════════════════════════╗
║    Coresignal Data Cleanup Script                 ║
║    Removes all coresignal-related data            ║
╚════════════════════════════════════════════════════╝
`);

cleanupCoresignalData(workspaceName)
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

