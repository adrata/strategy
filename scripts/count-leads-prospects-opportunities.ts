#!/usr/bin/env tsx

/**
 * Count Leads, Prospects, and Opportunities
 * 
 * Shows counts of people and companies by status
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  const args = process.argv.slice(2);
  const workspaceIdArg = args.find(arg => arg.startsWith('--workspace='));
  const workspaceId = workspaceIdArg ? workspaceIdArg.split('=')[1] : null;

  if (!workspaceId) {
    console.log('❌ Please provide workspace ID: --workspace=WORKSPACE_ID');
    await prisma.$disconnect();
    return;
  }

  console.log('📊 Leads, Prospects, and Opportunities Count');
  console.log('='.repeat(70));
  console.log(`\n📁 Workspace: ${workspaceId}\n`);

  // Count people by status
  const peopleByStatus = await prisma.people.groupBy({
    by: ['status'],
    where: {
      workspaceId,
      deletedAt: null
    },
    _count: {
      id: true
    }
  });

  // Count companies by status
  const companiesByStatus = await prisma.companies.groupBy({
    by: ['status'],
    where: {
      workspaceId,
      deletedAt: null
    },
    _count: {
      id: true
    }
  });

  console.log('👥 People by Status:');
  const peopleStatusMap: Record<string, number> = {};
  peopleByStatus.forEach(item => {
    const status = item.status || 'LEAD';
    peopleStatusMap[status] = item._count.id;
    console.log(`   ${status}: ${item._count.id}`);
  });

  // Show totals
  const totalPeople = peopleByStatus.reduce((sum, item) => sum + item._count.id, 0);
  console.log(`   Total: ${totalPeople}\n`);

  console.log('🏢 Companies by Status:');
  const companiesStatusMap: Record<string, number> = {};
  companiesByStatus.forEach(item => {
    const status = item.status || 'ACTIVE';
    companiesStatusMap[status] = item._count.id;
    console.log(`   ${status}: ${item._count.id}`);
  });

  // Show totals
  const totalCompanies = companiesByStatus.reduce((sum, item) => sum + item._count.id, 0);
  console.log(`   Total: ${totalCompanies}\n`);

  // Summary
  console.log('📈 Summary:');
  console.log(`   Leads (People): ${peopleStatusMap['LEAD'] || 0}`);
  console.log(`   Prospects (People): ${peopleStatusMap['PROSPECT'] || 0}`);
  console.log(`   Opportunities (People): ${peopleStatusMap['OPPORTUNITY'] || 0}`);
  console.log(`   Clients (People): ${peopleStatusMap['CLIENT'] || 0}`);
  console.log(`   Leads (Companies): ${companiesStatusMap['LEAD'] || 0}`);
  console.log(`   Prospects (Companies): ${companiesStatusMap['PROSPECT'] || 0}`);
  console.log(`   Opportunities (Companies): ${companiesStatusMap['OPPORTUNITY'] || 0}`);
  console.log(`   Clients (Companies): ${companiesStatusMap['CLIENT'] || 0}`);

  const totalLeads = (peopleStatusMap['LEAD'] || 0) + (companiesStatusMap['LEAD'] || 0);
  const totalProspects = (peopleStatusMap['PROSPECT'] || 0) + (companiesStatusMap['PROSPECT'] || 0);
  const totalOpportunities = (peopleStatusMap['OPPORTUNITY'] || 0) + (companiesStatusMap['OPPORTUNITY'] || 0);
  const totalClients = (peopleStatusMap['CLIENT'] || 0) + (companiesStatusMap['CLIENT'] || 0);

  console.log(`\n🎯 Combined Totals:`);
  console.log(`   Leads: ${totalLeads}`);
  console.log(`   Prospects: ${totalProspects}`);
  console.log(`   Opportunities: ${totalOpportunities}`);
  console.log(`   Clients: ${totalClients}`);

  await prisma.$disconnect();
}

main().catch(console.error);

