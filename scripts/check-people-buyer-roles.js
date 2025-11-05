#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';

async function checkPeopleBuyerRoles() {
  try {
    await prisma.$connect();
    
    // Get companies added today
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
        name: true
      }
    });

    console.log('Checking People records with buyer group roles...');
    console.log('='.repeat(60));
    console.log('');

    for (const company of companies) {
      const people = await prisma.people.findMany({
        where: {
          companyId: company.id,
          deletedAt: null
        },
        select: {
          fullName: true,
          buyerGroupRole: true,
          jobTitle: true
        }
      });

      const withRoles = people.filter(p => p.buyerGroupRole);
      
      if (people.length > 0) {
        console.log(`${company.name}:`);
        console.log(`  Total people: ${people.length}`);
        console.log(`  People with buyer group roles: ${withRoles.length}`);
        if (withRoles.length > 0) {
          withRoles.forEach(p => {
            console.log(`    - ${p.fullName} (${p.jobTitle || 'N/A'}): ${p.buyerGroupRole}`);
          });
        }
        console.log('');
      }
    }

    // Summary
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        companyId: { in: companies.map(c => c.id) },
        deletedAt: null,
        buyerGroupRole: { not: null }
      },
      select: {
        buyerGroupRole: true
      }
    });

    console.log('='.repeat(60));
    console.log(`SUMMARY:`);
    console.log(`Total people with buyer group roles: ${allPeople.length}`);
    
    const roleCounts = {};
    allPeople.forEach(p => {
      roleCounts[p.buyerGroupRole] = (roleCounts[p.buyerGroupRole] || 0) + 1;
    });
    
    console.log('\nRole distribution:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeopleBuyerRoles();

