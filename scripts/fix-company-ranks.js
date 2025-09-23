#!/usr/bin/env node

/**
 * Fix Company Ranks Script
 * 
 * This script assigns proper sequential ranks (1, 2, 3, ...) to all companies
 * in the database, sorted by updatedAt descending, then by name alphabetically.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCompanyRanks() {
  try {
    console.log('🔧 Starting company ranks fix...');
    
    // Get all companies, sorted by updatedAt descending, then by name alphabetically
    const companies = await prisma.companies.findMany({
      where: {
        deletedAt: null
      },
      orderBy: [
        { updatedAt: 'desc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        updatedAt: true,
        rank: true
      }
    });
    
    console.log(`📊 Found ${companies.length} companies to rank`);
    
    // Assign sequential ranks starting from 1
    const updatePromises = companies.map((company, index) => {
      const newRank = index + 1;
      console.log(`🏢 Updating ${company.name} (ID: ${company.id}) to rank ${newRank}`);
      
      return prisma.companies.update({
        where: { id: company.id },
        data: { rank: newRank }
      });
    });
    
    // Execute all updates
    await Promise.all(updatePromises);
    
    console.log(`✅ Successfully updated ranks for ${companies.length} companies`);
    
    // Verify the results
    const updatedCompanies = await prisma.companies.findMany({
      where: {
        deletedAt: null
      },
      orderBy: { rank: 'asc' },
      select: {
        id: true,
        name: true,
        rank: true
      },
      take: 10
    });
    
    console.log('🔍 Verification - First 10 companies:');
    updatedCompanies.forEach(company => {
      console.log(`  Rank ${company.rank}: ${company.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing company ranks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixCompanyRanks()
    .then(() => {
      console.log('🎉 Company ranks fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Company ranks fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixCompanyRanks };
