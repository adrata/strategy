const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simpleSchemaAudit() {
  console.log('🔍 SIMPLE SCHEMA AUDIT');
  console.log('======================');
  console.log('Auditing key tables for people/companies migration...\n');

  const issues = [];
  const recommendations = [];

  try {
    // Check core tables
    console.log('🏗️  CORE TABLES:');
    
    const peopleCount = await prisma.people.count();
    const companiesCount = await prisma.companies.count();
    
    console.log(`  👥 People: ${peopleCount} records`);
    console.log(`  🏢 Companies: ${companiesCount} records`);
    
    if (peopleCount === 0) {
      issues.push('People table is empty');
      recommendations.push('Create people from leads/prospects data');
    }
    
    if (companiesCount === 0) {
      issues.push('Companies table is empty');
      recommendations.push('Create companies from leads/prospects data');
    }

    // Check pipeline tables
    console.log('\n📈 PIPELINE TABLES:');
    
    const leadsCount = await prisma.leads.count();
    const prospectsCount = await prisma.prospects.count();
    const opportunitiesCount = await prisma.opportunities.count();
    const clientsCount = await prisma.clients.count();
    
    console.log(`  🎯 Leads: ${leadsCount} records`);
    console.log(`  🔍 Prospects: ${prospectsCount} records`);
    console.log(`  💰 Opportunities: ${opportunitiesCount} records`);
    console.log(`  🏆 Customers: ${clientsCount} records`);

    // Check linking status
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

    // Check for data duplication
    console.log('\n🔄 DATA DUPLICATION CHECK:');
    
    // Check if leads have person data that should be in people table
    const leadsWithPersonData = await prisma.leads.findFirst({
      where: {
        OR: [
          { firstName: { not: null } },
          { lastName: { not: null } },
          { fullName: { not: null } },
          { email: { not: null } },
          { workEmail: { not: null } }
        ]
      }
    });
    
    if (leadsWithPersonData) {
      issues.push('Leads table has duplicated person data (firstName, lastName, email, etc.)');
      recommendations.push('Move person data from leads to people table and link via personId');
    }
    
    // Check if leads have company data that should be in companies table
    const leadsWithCompanyData = await prisma.leads.findFirst({
      where: { company: { not: null } }
    });
    
    if (leadsWithCompanyData) {
      issues.push('Leads table has duplicated company data (company field)');
      recommendations.push('Move company data from leads to companies table and link via companyId');
    }

    // Check activities table for legacy fields
    console.log('\n📝 ACTIVITIES TABLE:');
    
    try {
      const activitiesCount = await prisma.activities.count();
      console.log(`  📊 Total activities: ${activitiesCount}`);
      
      // Check if activities table has legacy fields
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
      
      if (activitiesWithAccountId[0].count > 0 || activitiesWithContactId[0].count > 0) {
        issues.push('Activities table has legacy accountId/contactId fields');
        recommendations.push('Remove accountId/contactId from activities table');
      }
      
    } catch (error) {
      console.log(`  ⚠️  Could not check activities table: ${error.message}`);
    }

    // Summary
    console.log('\n📋 AUDIT SUMMARY');
    console.log('================');
    console.log(`Issues found: ${issues.length}`);
    console.log(`Recommendations: ${recommendations.length}`);
    
    if (issues.length > 0) {
      console.log('\n❌ ISSUES:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    // Next steps
    console.log('\n🚀 NEXT STEPS:');
    if (issues.length > 0) {
      console.log('1. Run the comprehensive data migration script');
      console.log('2. Remove legacy fields from database');
      console.log('3. Verify data integrity');
    } else {
      console.log('✅ No issues found! Data model is properly structured.');
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

simpleSchemaAudit()
  .then(() => {
    console.log('\n🎉 Schema audit completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Schema audit failed:', error);
    process.exit(1);
  });
