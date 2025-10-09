#!/usr/bin/env node

/**
 * Fix Unique Company Ranks Script
 * 
 * This script ensures each company has a unique rank, with Hillenmeyer as rank 1.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUniqueCompanyRanks() {
  try {
    console.log('🔧 Starting unique company ranks fix...');
    
    // First, reset all ranks to null
    console.log('🔄 Resetting all company ranks...');
    await prisma.companies.updateMany({
      where: {
        deletedAt: null
      },
      data: {
        rank: null
      }
    });
    
    // Set specific companies to specific ranks
    const targetCompanies = [
      { name: 'Hillenmeyer Companies: Weed Man & Mosquito Authority', rank: 1 },
      { name: 'Alabama Power Company', rank: 2 },
      { name: 'Western Area Power Administration', rank: 3 },
      { name: 'WKW Associates LLC.', rank: 4 },
      { name: 'Vantage Point Solutions', rank: 5 },
      { name: 'VELCO - Vermont Electric Power Company', rank: 6 },
      { name: 'PowerSouth Energy Cooperative', rank: 7 },
      { name: 'Yuba Water Agency', rank: 8 },
      { name: 'Talquin Electric Cooperative, Inc.', rank: 9 },
      { name: 'Blue Ridge Electric Membership Corporation', rank: 10 }
    ];
    
    console.log(`📊 Setting specific ranks for ${targetCompanies.length} companies...`);
    
    // Update each target company with unique rank
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
          console.log(`✅ Set ${target.name} to rank ${target.rank}`);
        } else {
          console.log(`⚠️  Company not found: ${target.name}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${target.name}:`, error.message);
      }
    }
    
    // Set remaining companies to ranks 11+
    console.log('🔄 Setting remaining companies to ranks 11+...');
    const remainingCompanies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
        rank: null
      },
      orderBy: [
        { updatedAt: 'desc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true
      }
    });
    
    console.log(`📊 Found ${remainingCompanies.length} remaining companies to rank...`);
    
    // Update remaining companies in batches
    const batchSize = 100;
    let currentRank = 11;
    
    for (let i = 0; i < remainingCompanies.length; i += batchSize) {
      const batch = remainingCompanies.slice(i, i + batchSize);
      
      for (let j = 0; j < batch.length; j++) {
        const company = batch[j];
        try {
          await prisma.companies.update({
            where: { id: company.id },
            data: { rank: currentRank + j }
          });
        } catch (error) {
          console.error(`❌ Error updating ${company.name}:`, error.message);
        }
      }
      
      currentRank += batch.length;
      console.log(`✅ Updated batch ${Math.floor(i / batchSize) + 1} (companies ${i + 1}-${Math.min(i + batchSize, remainingCompanies.length)})`);
    }
    
    // Verify the results
    const topCompanies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
        rank: { lte: 15 }
      },
      orderBy: { rank: 'asc' },
      select: {
        id: true,
        name: true,
        rank: true
      }
    });
    
    console.log('\n🔍 Verification - Top 15 companies:');
    topCompanies.forEach(company => {
      console.log(`  Rank ${company.rank}: ${company.name}`);
    });
    
    console.log('\n✅ Unique company ranks fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing company ranks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixUniqueCompanyRanks()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
