#!/usr/bin/env node

/**
 * 🔍 CHECK COMPANY IDENTIFIERS
 * 
 * Checks which companies have LinkedIn URLs, websites, etc.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCompanyIdentifiers() {
  try {
    await prisma.$connect();
    
    const workspace = await prisma.workspaces.findFirst({
      where: { id: '01K7DSWP8ZBA75K5VSWVXPEMAH' }
    });
    
    const justin = await prisma.users.findFirst({
      where: { username: 'justin' }
    });
    
    // Get companies without buyer groups
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: justin.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true,
        linkedinUrl: true,
        _count: {
          select: {
            people: {
              where: {
                isBuyerGroupMember: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    const companiesWithoutBuyerGroups = allCompanies.filter(c => c._count.people === 0);
    
    console.log(`📊 COMPANIES WITHOUT BUYER GROUPS (${companiesWithoutBuyerGroups.length}):\n`);
    
    companiesWithoutBuyerGroups.forEach((company, idx) => {
      console.log(`${idx + 1}. ${company.name}`);
      console.log(`   LinkedIn URL: ${company.linkedinUrl || '❌ MISSING'}`);
      console.log(`   Website: ${company.website || '❌ MISSING'}`);
      console.log(`   Domain: ${company.domain || '❌ MISSING'}`);
      console.log('');
    });
    
    const missingLinkedIn = companiesWithoutBuyerGroups.filter(c => !c.linkedinUrl);
    const missingWebsite = companiesWithoutBuyerGroups.filter(c => !c.website && !c.domain);
    
    console.log(`\n📋 SUMMARY:`);
    console.log(`   Companies missing LinkedIn: ${missingLinkedIn.length}`);
    console.log(`   Companies missing Website/Domain: ${missingWebsite.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompanyIdentifiers();

