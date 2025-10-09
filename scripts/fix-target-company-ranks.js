#!/usr/bin/env node

/**
 * Fix Target Company Ranks Script
 * 
 * This script assigns proper ranks to specific companies that should be prioritized.
 * Sets Hillenmeyer Companies to rank 1, then other important companies.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTargetCompanyRanks() {
  try {
    console.log('🔧 Starting targeted company ranks fix...');
    
    // Define the target companies and their desired ranks
    const targetCompanies = [
      { name: 'Hillenmeyer Companies: Weed Man & Mosquito Authority', rank: 1 },
      { name: 'Alabama Power Company', rank: 2 },
      { name: 'Western Area Power Administration', rank: 3 },
      { name: 'WKW Associates LLC.', rank: 4 },
      { name: 'Vantage Point Solutions', rank: 5 },
      { name: 'VELCO - Vermont Electric Power Company', rank: 6 },
      { name: 'PowerSouth Energy Cooperative', rank: 7 },
      { name: 'Cabicon', rank: 8 },
      { name: 'Yuba Water Agency', rank: 9 },
      { name: 'Talquin Electric Cooperative, Inc.', rank: 10 }
    ];
    
    console.log(`📊 Updating ${targetCompanies.length} target companies...`);
    
    // Update each target company
    for (const target of targetCompanies) {
      try {
        const result = await prisma.companies.updateMany({
          where: {
            name: target.name,
            deletedAt: null
          },
          data: {
            rank: target.rank
          }
        });
        
        if (result.count > 0) {
          console.log(`✅ Updated ${target.name} to rank ${target.rank}`);
        } else {
          console.log(`⚠️  Company not found: ${target.name}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${target.name}:`, error.message);
      }
    }
    
    // Verify the results
    const updatedCompanies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
        rank: { in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }
      },
      orderBy: { rank: 'asc' },
      select: {
        id: true,
        name: true,
        rank: true
      }
    });
    
    console.log('\n🔍 Verification - Top 10 companies:');
    updatedCompanies.forEach(company => {
      console.log(`  Rank ${company.rank}: ${company.name}`);
    });
    
    console.log('\n✅ Targeted company ranks fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing company ranks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixTargetCompanyRanks()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
