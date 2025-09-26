#!/usr/bin/env node

/**
 * Fix Company Ranking by People Count
 * 
 * This script re-ranks companies based on the number of people they have,
 * moving companies with no people to the bottom.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRankingByPeopleCount() {
  try {
    console.log('🔧 FIXING COMPANY RANKING BY PEOPLE COUNT...\n');
    
    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Get all companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`📊 Found ${companies.length} companies to re-rank\n`);
    
    // Get people count for each company and sort
    const companiesWithPeopleCount = [];
    
    for (const company of companies) {
      const peopleCount = await prisma.people.count({
        where: {
          workspaceId,
          deletedAt: null,
          companyId: company.id
        }
      });
      
      companiesWithPeopleCount.push({
        ...company,
        peopleCount
      });
    }
    
    // Sort by people count (descending), then by updatedAt
    companiesWithPeopleCount.sort((a, b) => {
      if (b.peopleCount !== a.peopleCount) {
        return b.peopleCount - a.peopleCount;
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    
    // Show the new ranking preview
    console.log('🔍 NEW RANKING PREVIEW (Top 10):');
    console.log('================================');
    companiesWithPeopleCount.slice(0, 10).forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   People: ${company.peopleCount}`);
      console.log(`   Old Rank: ${company.rank}`);
      console.log('');
    });
    
    // Assign new sequential ranks
    console.log('🔄 Updating company ranks...');
    for (let i = 0; i < companiesWithPeopleCount.length; i++) {
      const company = companiesWithPeopleCount[i];
      const newRank = i + 1;
      
      await prisma.companies.update({
        where: { id: company.id },
        data: { rank: newRank }
      });
      
      if (i < 10) {
        console.log(`✅ Updated ${company.name} to rank ${newRank} (${company.peopleCount} people)`);
      }
    }
    
    console.log(`\n✅ Successfully updated ranks for ${companies.length} companies\n`);
    
    // Verify the results
    const updatedCompanies = await prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      orderBy: { rank: 'asc' },
      take: 10
    });
    
    console.log('🔍 VERIFICATION - New Top 10 Companies:');
    console.log('======================================');
    for (const company of updatedCompanies) {
      const peopleCount = await prisma.people.count({
        where: {
          workspaceId,
          deletedAt: null,
          companyId: company.id
        }
      });
      console.log(`Rank ${company.rank}: ${company.name} - ${peopleCount} people`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing company ranking:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixRankingByPeopleCount();
