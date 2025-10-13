const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupUnassignedCompanies() {
  try {
    console.log('🧹 CLEANING UP "UNASSIGNED COMPANY" RECORDS');
    console.log('='.repeat(60));

    // First, verify the records exist and get count
    const unassignedCompanies = await prisma.companies.findMany({
      where: {
        name: 'Unassigned Company',
        deletedAt: null // Only get non-deleted records
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            people: true
          }
        }
      }
    });

    console.log(`Found ${unassignedCompanies.length} "Unassigned Company" records to clean up`);

    if (unassignedCompanies.length === 0) {
      console.log('✅ No "Unassigned Company" records found. Cleanup not needed.');
      return;
    }

    // Double-check that no people are linked
    const companiesWithPeople = unassignedCompanies.filter(c => c._count.people > 0);
    if (companiesWithPeople.length > 0) {
      console.log('❌ ERROR: Some companies have people linked. Aborting cleanup for safety.');
      console.log('Companies with people:');
      companiesWithPeople.forEach(company => {
        console.log(`  - ${company.id} (${company._count.people} people)`);
      });
      return;
    }

    console.log('✅ Verification passed: No people are linked to these companies');
    console.log('🗑️  Proceeding with soft delete...\n');

    // Soft delete all unassigned company records
    const deleteResult = await prisma.companies.updateMany({
      where: {
        name: 'Unassigned Company',
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    });

    console.log('✅ CLEANUP COMPLETE');
    console.log('='.repeat(60));
    console.log(`Successfully soft-deleted ${deleteResult.count} "Unassigned Company" records`);
    console.log('These records are now hidden from the UI but preserved in the database');
    
    // Log the deleted company IDs for audit trail
    console.log('\n📋 AUDIT TRAIL - Deleted Company IDs:');
    unassignedCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.id} (created: ${company.createdAt.toISOString()})`);
    });

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Verify the companies no longer appear in the UI');
    console.log('2. Consider running database maintenance to optimize space');
    console.log('3. Monitor for any new "Unassigned Company" records');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupUnassignedCompanies()
  .then(() => {
    console.log('\n🎉 Cleanup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup script failed:', error);
    process.exit(1);
  });
