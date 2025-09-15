#!/usr/bin/env node

/**
 * QUICK ACTION SYSTEM AUDIT
 * Fast overview of action system status
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickAudit() {
  console.log('🔍 QUICK ACTION SYSTEM AUDIT');
  console.log('============================\n');

  try {
    // Get basic counts
    const [
      totalActions,
      totalPeople,
      totalCompanies,
      totalLeads,
      totalOpportunities,
      totalProspects,
      orphanedActions,
      peopleWithLastAction,
      peopleWithNextAction,
      companiesWithLastAction,
      companiesWithNextAction
    ] = await Promise.all([
      prisma.actions.count(),
      prisma.people.count(),
      prisma.companies.count(),
      prisma.leads.count(),
      prisma.opportunities.count(),
      prisma.prospects.count(),
      prisma.actions.count({
        where: {
          AND: [
            { personId: null },
            { companyId: null },
            { leadId: null },
            { opportunityId: null },
            { prospectId: null }
          ]
        }
      }),
      prisma.people.count({ where: { lastAction: { not: null } } }),
      prisma.people.count({ where: { nextAction: { not: null } } }),
      prisma.companies.count({ where: { lastAction: { not: null } } }),
      prisma.companies.count({ where: { nextAction: { not: null } } })
    ]);

    // Get action types summary
    const actionTypes = await prisma.actions.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } },
      take: 10
    });

    console.log('📊 CORE METRICS:');
    console.log(`  Total Actions: ${totalActions}`);
    console.log(`  Total People: ${totalPeople}`);
    console.log(`  Total Companies: ${totalCompanies}`);
    console.log(`  Total Leads: ${totalLeads}`);
    console.log(`  Total Opportunities: ${totalOpportunities}`);
    console.log(`  Total Prospects: ${totalProspects}`);

    console.log('\n🔗 CONNECTION HEALTH:');
    console.log(`  Orphaned Actions: ${orphanedActions} (${((orphanedActions / totalActions) * 100).toFixed(1)}%)`);

    console.log('\n🎯 ACTION FIELD COMPLETION:');
    console.log(`  People with lastAction: ${peopleWithLastAction}/${totalPeople} (${((peopleWithLastAction / totalPeople) * 100).toFixed(1)}%)`);
    console.log(`  People with nextAction: ${peopleWithNextAction}/${totalPeople} (${((peopleWithNextAction / totalPeople) * 100).toFixed(1)}%)`);
    console.log(`  Companies with lastAction: ${companiesWithLastAction}/${totalCompanies} (${((companiesWithLastAction / totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`  Companies with nextAction: ${companiesWithNextAction}/${totalCompanies} (${((companiesWithNextAction / totalCompanies) * 100).toFixed(1)}%)`);

    console.log('\n📋 TOP ACTION TYPES:');
    actionTypes.forEach(type => {
      console.log(`  ${type.type}: ${type._count.type}`);
    });

    // Calculate overall health score
    const connectionScore = Math.max(0, 100 - ((orphanedActions / totalActions) * 100));
    const peopleLastActionScore = (peopleWithLastAction / totalPeople) * 100;
    const peopleNextActionScore = (peopleWithNextAction / totalPeople) * 100;
    const companiesLastActionScore = (companiesWithLastAction / totalCompanies) * 100;
    const companiesNextActionScore = (companiesWithNextAction / totalCompanies) * 100;

    const overallScore = (connectionScore + peopleLastActionScore + peopleNextActionScore + companiesLastActionScore + companiesNextActionScore) / 5;

    console.log(`\n🎯 OVERALL HEALTH: ${overallScore.toFixed(1)}/100`);
    
    if (overallScore >= 90) {
      console.log('  ✅ EXCELLENT!');
    } else if (overallScore >= 75) {
      console.log('  ✅ GOOD!');
    } else if (overallScore >= 50) {
      console.log('  ⚠️  FAIR - needs improvement');
    } else {
      console.log('  ❌ POOR - needs significant work');
    }

    console.log('\n🎉 Quick audit complete!');

  } catch (error) {
    console.error('❌ Audit failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickAudit();
