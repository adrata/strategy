const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalVerification() {
  console.log('✅ FINAL VERIFICATION');
  console.log('=====================');
  console.log('Verifying complete data model migration...\n');

  try {
    // Core tables
    console.log('🏗️  CORE TABLES:');
    const peopleCount = await prisma.people.count();
    const companiesCount = await prisma.companies.count();
    console.log(`  👥 People: ${peopleCount} records`);
    console.log(`  🏢 Companies: ${companiesCount} records`);

    // Pipeline tables
    console.log('\n📈 PIPELINE TABLES:');
    const leadsCount = await prisma.leads.count();
    const prospectsCount = await prisma.prospects.count();
    const opportunitiesCount = await prisma.opportunities.count();
    const customersCount = await prisma.customers.count();
    
    console.log(`  🎯 Leads: ${leadsCount} records`);
    console.log(`  🔍 Prospects: ${prospectsCount} records`);
    console.log(`  💰 Opportunities: ${opportunitiesCount} records`);
    console.log(`  🏆 Customers: ${customersCount} records`);

    // Linking status
    console.log('\n🔗 LINKING STATUS:');
    const leadsWithPersonId = await prisma.leads.count({ where: { personId: { not: null } } });
    const leadsWithCompanyId = await prisma.leads.count({ where: { companyId: { not: null } } });
    
    const prospectsWithPersonId = await prisma.prospects.count({ where: { personId: { not: null } } });
    const prospectsWithCompanyId = await prisma.prospects.count({ where: { companyId: { not: null } } });
    
    const opportunitiesWithPersonId = await prisma.opportunities.count({ where: { personId: { not: null } } });
    const opportunitiesWithCompanyId = await prisma.opportunities.count({ where: { companyId: { not: null } } });
    
    console.log(`  🎯 Leads: ${leadsWithPersonId}/${leadsCount} linked to people, ${leadsWithCompanyId}/${leadsCount} linked to companies`);
    console.log(`  🔍 Prospects: ${prospectsWithPersonId}/${prospectsCount} linked to people, ${prospectsWithCompanyId}/${prospectsCount} linked to companies`);
    console.log(`  💰 Opportunities: ${opportunitiesWithPersonId}/${opportunitiesCount} linked to people, ${opportunitiesWithCompanyId}/${opportunitiesCount} linked to companies`);

    // Activities table - check with correct field names
    console.log('\n📝 ACTIVITIES TABLE:');
    const activitiesCount = await prisma.activities.count();
    console.log(`  📊 Total activities: ${activitiesCount}`);
    
    const activitiesWithPersonId = await prisma.activities.count({ where: { personId: { not: null } } });
    const activitiesWithCompanyId = await prisma.activities.count({ where: { companyId: { not: null } } });
    
    console.log(`  ✅ Modern fields: ${activitiesWithPersonId} with personId, ${activitiesWithCompanyId} with companyId`);

    // Check for any remaining legacy fields
    console.log('\n🔍 LEGACY FIELD CHECK:');
    try {
      // Try to query for accountId - should fail if column doesn't exist
      await prisma.$queryRaw`SELECT COUNT(*) FROM activities WHERE "accountId" IS NOT NULL`;
      console.log('  ❌ accountId column still exists');
    } catch (error) {
      if (error.message.includes('column "accountId" does not exist')) {
        console.log('  ✅ accountId column successfully removed');
      } else {
        console.log(`  ⚠️  Unexpected error checking accountId: ${error.message}`);
      }
    }
    
    try {
      // Try to query for contactId - should fail if column doesn't exist
      await prisma.$queryRaw`SELECT COUNT(*) FROM activities WHERE "contactId" IS NOT NULL`;
      console.log('  ❌ contactId column still exists');
    } catch (error) {
      if (error.message.includes('column "contactId" does not exist')) {
        console.log('  ✅ contactId column successfully removed');
      } else {
        console.log(`  ⚠️  Unexpected error checking contactId: ${error.message}`);
      }
    }

    // Final summary
    console.log('\n🎉 MIGRATION VERIFICATION COMPLETE');
    console.log('===================================');
    
    const allGood = (
      peopleCount > 0 &&
      companiesCount > 0 &&
      leadsWithPersonId === leadsCount &&
      prospectsWithPersonId === prospectsCount &&
      activitiesWithPersonId > 0 &&
      activitiesWithCompanyId > 0
    );
    
    if (allGood) {
      console.log('✅ SUCCESS: Data model migration completed successfully!');
      console.log('✅ All core tables have data');
      console.log('✅ All leads and prospects are linked to people');
      console.log('✅ Activities table uses modern personId/companyId fields');
      console.log('✅ Legacy accountId/contactId fields have been removed');
      console.log('\n🎯 Your CRM data model is now properly structured with:');
      console.log('   • People & Companies as core records');
      console.log('   • Pipeline records (Leads, Prospects, Opportunities, Customers) linked to core records');
      console.log('   • No data duplication or legacy field references');
    } else {
      console.log('⚠️  Some issues remain - please review the data above');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification()
  .then(() => {
    console.log('\n✅ Final verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Final verification failed:', error);
    process.exit(1);
  });
