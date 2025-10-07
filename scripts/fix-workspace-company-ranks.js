#!/usr/bin/env node

/**
 * Fix Workspace Company Ranks Script
 * 
 * This script assigns proper ranks to companies within a specific workspace.
 * Sets Hillenmeyer Companies to rank 1 for Dan's workspace.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixWorkspaceCompanyRanks(workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP') {
  try {
    console.log(`🔧 Starting workspace company ranks fix for workspace: ${workspaceId}...`);
    
    // First, reset all ranks for this workspace to null
    console.log('🔄 Resetting all company ranks for this workspace...');
    await prisma.companies.updateMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      data: {
        rank: null
      }
    });
    
    // Set specific companies to specific ranks for this workspace
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
    
    console.log(`📊 Setting specific ranks for ${targetCompanies.length} companies in workspace ${workspaceId}...`);
    
    // Update each target company with unique rank for this workspace
    for (const target of targetCompanies) {
      try {
        const result = await prisma.companies.updateMany({
          where: {
            name: target.name,
            workspaceId: workspaceId,
            deletedAt: null
          },
          data: {
            rank: target.rank
          }
        });
        
        if (result.count > 0) {
          console.log(`✅ Set ${target.name} to rank ${target.rank} in workspace ${workspaceId}`);
        } else {
          console.log(`⚠️  Company not found in workspace: ${target.name}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${target.name}:`, error.message);
      }
    }
    
    // Set remaining companies in this workspace to ranks 11+
    console.log('🔄 Setting remaining companies in workspace to ranks 11+...');
    const remainingCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
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
    
    console.log(`📊 Found ${remainingCompanies.length} remaining companies in workspace to rank...`);
    
    // Update remaining companies in batches
    const batchSize = 50;
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
    
    // Verify the results for this workspace
    const topCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
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
    
    console.log(`\n🔍 Verification - Top 15 companies in workspace ${workspaceId}:`);
    topCompanies.forEach(company => {
      console.log(`  Rank ${company.rank}: ${company.name}`);
    });
    
    console.log(`\n✅ Workspace company ranks fix completed for workspace ${workspaceId}!`);
    
  } catch (error) {
    console.error('❌ Error fixing company ranks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixWorkspaceCompanyRanks()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
