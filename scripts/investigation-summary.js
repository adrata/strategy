#!/usr/bin/env node

/**
 * Final Investigation Summary
 * 
 * Shows the complete status of all 20 companies and recommendations
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';

async function createSummary() {
  try {
    await prisma.$connect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
        website: true,
        linkedinUrl: true,
        _count: {
          select: {
            people: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const buyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        companyName: { in: companies.map(c => c.name) }
      },
      select: {
        companyName: true,
        totalMembers: true
      }
    });

    const bgMap = new Map(buyerGroups.map(bg => [bg.companyName.toLowerCase(), bg]));

    console.log('\n📊 FINAL INVESTIGATION SUMMARY');
    console.log('═'.repeat(70));
    console.log('Buyer Group Discovery Status for Adrata (USA-only)\n');

    const categories = {
      hasBuyerGroup: [],
      hasPeopleNoBG: [],
      noPeople: []
    };

    for (const company of companies) {
      const hasBG = bgMap.has(company.name.toLowerCase());
      const hasPeople = company._count.people > 0;

      if (hasBG) {
        categories.hasBuyerGroup.push(company);
      } else if (hasPeople) {
        categories.hasPeopleNoBG.push(company);
      } else {
        categories.noPeople.push(company);
      }
    }

    console.log(`✅ Companies with Buyer Groups: ${categories.hasBuyerGroup.length}`);
    categories.hasBuyerGroup.forEach(c => {
      const bg = bgMap.get(c.name.toLowerCase());
      console.log(`   - ${c.name}: ${bg?.totalMembers || 0} members, ${c._count.people} people in DB`);
    });

    console.log(`\n⚠️  Companies with People but No Buyer Group: ${categories.hasPeopleNoBG.length}`);
    categories.hasPeopleNoBG.forEach(c => {
      console.log(`   - ${c.name}: ${c._count.people} people`);
    });

    console.log(`\n❌ Companies with No People: ${categories.noPeople.length}`);
    categories.noPeople.forEach(c => {
      console.log(`   - ${c.name}`);
    });

    // Check People with buyer group roles
    const peopleWithRoles = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        companyId: { in: companies.map(c => c.id) },
        deletedAt: null,
        buyerGroupRole: { not: null }
      },
      select: {
        buyerGroupRole: true,
        company: { select: { name: true } }
      }
    });

    console.log(`\n👥 People with Buyer Group Roles: ${peopleWithRoles.length}`);
    const byCompany = {};
    peopleWithRoles.forEach(p => {
      const companyName = p.company?.name || 'Unknown';
      byCompany[companyName] = (byCompany[companyName] || 0) + 1;
    });
    Object.entries(byCompany).forEach(([name, count]) => {
      console.log(`   - ${name}: ${count} people`);
    });

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('─'.repeat(70));
    
    if (categories.hasPeopleNoBG.length > 0) {
      console.log(`\n1. Run buyer group discovery for ${categories.hasPeopleNoBG.length} companies with people but no buyer group:`);
      categories.hasPeopleNoBG.forEach(c => {
        console.log(`   - ${c.name}`);
      });
    }

    if (categories.noPeople.length > 0) {
      console.log(`\n2. Investigate ${categories.noPeople.length} companies with no people:`);
      console.log('   These companies returned 0 employees from Coresignal API:');
      categories.noPeople.forEach(c => {
        console.log(`   - ${c.name}`);
      });
      console.log('\n   Possible solutions:');
      console.log('   • Verify LinkedIn URLs are correct');
      console.log('   • Check if companies exist in Coresignal database');
      console.log('   • Try alternative search methods (company name, website domain)');
      console.log('   • Check API rate limits or errors');
      console.log('   • Consider removing USA-only filter to see if employees exist in other locations');
    }

    console.log(`\n✅ SUCCESS RATE: ${((categories.hasBuyerGroup.length / companies.length) * 100).toFixed(1)}%`);
    console.log(`   ${categories.hasBuyerGroup.length} out of ${companies.length} companies have buyer groups\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSummary();

