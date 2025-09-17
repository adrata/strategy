const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickAudit() {
  console.log('🔍 QUICK SCHEMA AUDIT');
  console.log('=====================');
  console.log('Checking current data model status...\n');

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
    const clientsCount = await prisma.clients.count();
    
    console.log(`  🎯 Leads: ${leadsCount} records`);
    console.log(`  🔍 Prospects: ${prospectsCount} records`);
    console.log(`  💰 Opportunities: ${opportunitiesCount} records`);
    console.log(`  🏆 Customers: ${clientsCount} records`);

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

    // Check for legacy fields in activities
    console.log('\n📝 ACTIVITIES TABLE:');
    try {
      const activitiesCount = await prisma.activities.count();
      console.log(`  📊 Total activities: ${activitiesCount}`);
      
      const activitiesWithAccountId = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM activities WHERE "accountId" IS NOT NULL
      `;
      
      const activitiesWithContactId = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM activities WHERE "contactId" IS NOT NULL
      `;
      
      const activitiesWithPersonId = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM activities WHERE "personId" IS NOT NULL
      `;
      
      const activitiesWithCompanyId = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM activities WHERE "companyId" IS NOT NULL
      `;
      
      console.log(`  ❌ Legacy: ${activitiesWithAccountId[0].count} with accountId, ${activitiesWithContactId[0].count} with contactId`);
      console.log(`  ✅ Modern: ${activitiesWithPersonId[0].count} with personId, ${activitiesWithCompanyId[0].count} with companyId`);
      
    } catch (error) {
      console.log(`  ⚠️  Could not check activities table: ${error.message}`);
    }

    // Summary
    console.log('\n📋 AUDIT SUMMARY');
    console.log('================');
    
    if (peopleCount > 0 && companiesCount > 0) {
      console.log('✅ Core tables (people/companies) have data');
    } else {
      console.log('❌ Core tables are empty');
    }
    
    if (leadsWithPersonId === leadsCount && prospectsWithPersonId === prospectsCount) {
      console.log('✅ All leads and prospects are linked to people');
    } else {
      console.log('❌ Some leads/prospects are not linked to people');
    }
    
    if (leadsWithCompanyId > 0 && prospectsWithCompanyId === prospectsCount) {
      console.log('✅ Most records are linked to companies');
    } else {
      console.log('⚠️  Some records are not linked to companies');
    }

    console.log('\n🎉 Data model audit completed!');

  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

quickAudit()
  .then(() => {
    console.log('\n✅ Quick audit completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Quick audit failed:', error);
    process.exit(1);
  });
