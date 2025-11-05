#!/usr/bin/env node

/**
 * Verify New Dan Companies
 * Check how many companies were added and their status
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function verifyCompanies() {
  try {
    await prisma.$connect();
    
    // Get all companies added today
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
        createdAt: true,
        _count: {
          select: {
            people: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📊 New Companies Added Today for Dan');
    console.log('═'.repeat(60));
    console.log(`Total: ${companies.length} companies\n`);

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Website: ${company.website || 'N/A'}`);
      console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
      console.log(`   People: ${company._count.people}`);
      console.log(`   Added: ${company.createdAt.toISOString()}`);
      console.log('');
    });

    const withPeople = companies.filter(c => c._count.people > 0).length;
    console.log(`\n✅ Companies with buyer groups: ${withPeople}/${companies.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCompanies();

