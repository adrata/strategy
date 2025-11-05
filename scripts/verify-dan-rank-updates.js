#!/usr/bin/env node

/**
 * Verify Dan's Rank Updates
 * Check that new companies and people have been updated with today's engagement
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function verifyUpdates() {
  try {
    await prisma.$connect();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        mainSellerId: DAN_USER_ID,
        deletedAt: null,
        createdAt: { gte: today }
      },
      select: {
        id: true,
        name: true,
        lastActionDate: true,
        globalRank: true,
        createdAt: true
      },
      orderBy: {
        lastActionDate: 'desc'
      }
    });

    console.log('📊 Companies Added Today');
    console.log('═'.repeat(60));
    console.log(`Total: ${companies.length} companies\n`);

    const companiesWithTodayAction = companies.filter(c => {
      if (!c.lastActionDate) return false;
      const actionDate = new Date(c.lastActionDate);
      return actionDate.toDateString() === today.toDateString();
    });

    console.log(`✅ Companies with today's engagement: ${companiesWithTodayAction.length}/${companies.length}\n`);

    companies.forEach((company, index) => {
      const hasTodayAction = company.lastActionDate && 
        new Date(company.lastActionDate).toDateString() === today.toDateString();
      const status = hasTodayAction ? '✅' : '⚠️';
      console.log(`${index + 1}. ${status} ${company.name}`);
      console.log(`   Last Action: ${company.lastActionDate ? new Date(company.lastActionDate).toLocaleString() : 'None'}`);
      console.log(`   Global Rank: ${company.globalRank || 'Not ranked'}`);
      console.log('');
    });

    // Check people
    const companyIds = companies.map(c => c.id);
    const people = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        companyId: { in: companyIds },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        company: { select: { name: true } },
        lastActionDate: true,
        globalRank: true
      },
      orderBy: {
        lastActionDate: 'desc'
      }
    });

    console.log('\n📊 People from New Companies');
    console.log('═'.repeat(60));
    console.log(`Total: ${people.length} people\n`);

    const peopleWithTodayAction = people.filter(p => {
      if (!p.lastActionDate) return false;
      const actionDate = new Date(p.lastActionDate);
      return actionDate.toDateString() === today.toDateString();
    });

    console.log(`✅ People with today's engagement: ${peopleWithTodayAction.length}/${people.length}\n`);

    // Show top 10 people
    const topPeople = people.slice(0, 10);
    topPeople.forEach((person, index) => {
      const hasTodayAction = person.lastActionDate && 
        new Date(person.lastActionDate).toDateString() === today.toDateString();
      const status = hasTodayAction ? '✅' : '⚠️';
      console.log(`${index + 1}. ${status} ${person.fullName} at ${person.company?.name}`);
      console.log(`   Last Action: ${person.lastActionDate ? new Date(person.lastActionDate).toLocaleString() : 'None'}`);
      console.log(`   Global Rank: ${person.globalRank || 'Not ranked'}`);
      console.log('');
    });

    if (people.length > 10) {
      console.log(`   ... and ${people.length - 10} more people\n`);
    }

    console.log('\n📊 SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Companies with today's engagement: ${companiesWithTodayAction.length}/${companies.length}`);
    console.log(`People with today's engagement: ${peopleWithTodayAction.length}/${people.length}`);
    
    if (companiesWithTodayAction.length === companies.length && peopleWithTodayAction.length === people.length) {
      console.log('\n✅ All records updated successfully!');
      console.log('💡 Re-ranking will place these high in the speedrun list when triggered.');
    } else {
      console.log('\n⚠️  Some records may need manual updates.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUpdates();

