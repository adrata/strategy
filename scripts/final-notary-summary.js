const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';

async function generateFinalSummary() {
  console.log('🎯 NOTARY EVERYDAY - FINAL STATUS REPORT');
  console.log('=' .repeat(70));
  console.log('\n📊 WORKSPACE OVERVIEW');
  console.log('-'.repeat(70));
  
  // Get workspace info
  const workspace = await prisma.workspaces.findUnique({
    where: { id: WORKSPACE_ID },
    select: { name: true, createdAt: true }
  });
  
  console.log(`Workspace: ${workspace.name}`);
  console.log(`Workspace ID: ${WORKSPACE_ID}`);
  console.log(`Created: ${workspace.createdAt.toISOString().split('T')[0]}`);

  // People stats
  const totalPeople = await prisma.people.count({
    where: { workspaceId: WORKSPACE_ID, deletedAt: null }
  });

  const linkedPeople = await prisma.people.count({
    where: {
      workspaceId: WORKSPACE_ID,
      deletedAt: null,
      companyId: { not: null }
    }
  });

  const linkageRate = ((linkedPeople / totalPeople) * 100).toFixed(1);

  console.log('\n👥 PEOPLE STATISTICS');
  console.log('-'.repeat(70));
  console.log(`Total People: ${totalPeople}`);
  console.log(`Linked to Companies: ${linkedPeople}`);
  console.log(`Unlinked: ${totalPeople - linkedPeople}`);
  console.log(`Linkage Rate: ${linkageRate}%`);

  // Company stats
  const totalCompanies = await prisma.companies.count({
    where: { workspaceId: WORKSPACE_ID, deletedAt: null }
  });

  const companiesWithPeople = await prisma.companies.count({
    where: {
      workspaceId: WORKSPACE_ID,
      deletedAt: null,
      people: { some: { deletedAt: null } }
    }
  });

  console.log('\n🏢 COMPANY STATISTICS');
  console.log('-'.repeat(70));
  console.log(`Total Companies: ${totalCompanies}`);
  console.log(`Companies with Linked People: ${companiesWithPeople}`);
  console.log(`Empty Companies: ${totalCompanies - companiesWithPeople}`);

  // Buyer Group stats
  const totalBuyerGroups = await prisma.BuyerGroups.count({
    where: { workspaceId: WORKSPACE_ID }
  });

  const buyerGroupMembers = await prisma.BuyerGroupMembers.count({
    where: {
      BuyerGroups: { workspaceId: WORKSPACE_ID }
    }
  });

  console.log('\n🎯 BUYER GROUP INTELLIGENCE');
  console.log('-'.repeat(70));
  console.log(`Total Buyer Groups: ${totalBuyerGroups}`);
  console.log(`Total Buyer Group Members: ${buyerGroupMembers}`);

  // Buyer group role distribution
  const peopleByRole = await prisma.people.groupBy({
    by: ['buyerGroupRole'],
    where: {
      workspaceId: WORKSPACE_ID,
      deletedAt: null,
      buyerGroupRole: { not: null }
    },
    _count: true
  });

  if (peopleByRole.length > 0) {
    console.log('\n📈 BUYER GROUP ROLE DISTRIBUTION');
    console.log('-'.repeat(70));
    peopleByRole.forEach(role => {
      console.log(`${role.buyerGroupRole}: ${role._count}`);
    });
  }

  // Recently added people
  const recentPeople = await prisma.people.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      deletedAt: null,
      customFields: {
        path: ['importSource'],
        equals: 'batch_people_import'
      }
    },
    select: {
      fullName: true,
      email: true,
      jobTitle: true,
      buyerGroupRole: true,
      company: {
        select: { name: true }
      }
    }
  });

  if (recentPeople.length > 0) {
    console.log('\n✨ RECENTLY ADDED PEOPLE');
    console.log('-'.repeat(70));
    recentPeople.forEach(person => {
      console.log(`• ${person.fullName} - ${person.jobTitle}`);
      console.log(`  ${person.company?.name || 'No Company'}`);
      console.log(`  Role: ${person.buyerGroupRole || 'Not Assigned'}, Email: ${person.email}`);
    });
  }

  // Location coverage for companies
  const companiesWithState = await prisma.companies.count({
    where: {
      workspaceId: WORKSPACE_ID,
      deletedAt: null,
      state: { not: null }
    }
  });

  const stateCoverage = ((companiesWithState / totalCompanies) * 100).toFixed(1);

  console.log('\n📍 LOCATION DATA COVERAGE');
  console.log('-'.repeat(70));
  console.log(`Companies with State Data: ${companiesWithState} (${stateCoverage}%)`);

  // Top companies by people count
  const topCompanies = await prisma.companies.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      deletedAt: null,
      people: { some: { deletedAt: null } }
    },
    include: {
      people: {
        where: { deletedAt: null },
        select: { id: true }
      }
    },
    orderBy: {
      people: { _count: 'desc' }
    },
    take: 10
  });

  console.log('\n🏆 TOP 10 COMPANIES BY PEOPLE COUNT');
  console.log('-'.repeat(70));
  topCompanies.forEach((company, index) => {
    console.log(`${index + 1}. ${company.name}: ${company.people.length} people`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ SUMMARY COMPLETE');
  console.log('='.repeat(70));

  await prisma.$disconnect();
}

generateFinalSummary().catch(async (error) => {
  console.error('Error:', error);
  await prisma.$disconnect();
  process.exit(1);
});

