#!/usr/bin/env node

/**
 * Fix TOP Workspace Company Ranks Script
 * 
 * This script assigns proper ranks to companies within the TOP workspace.
 * Sets Hillenmeyer Companies to rank 1, then other important companies.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTopWorkspaceRanks() {
  const workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // TOP workspace
  
  try {
    console.log(`🔧 Starting TOP workspace company ranks fix for workspace: ${workspaceId}...`);
    
    // First, reset all ranks for this workspace to null
    console.log('🔄 Resetting all company ranks for TOP workspace...');
    await prisma.companies.updateMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      data: {
        rank: null
      }
    });
    
    // Set specific companies to specific ranks for TOP workspace
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
    
    console.log(`📊 Setting specific ranks for ${targetCompanies.length} companies in TOP workspace...`);
    
    // Update each target company with unique rank for TOP workspace
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
          console.log(`✅ Set ${target.name} to rank ${target.rank} in TOP workspace`);
        } else {
          console.log(`⚠️  Company not found in TOP workspace: ${target.name}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${target.name}:`, error.message);
      }
    }
    
    // Get remaining companies in TOP workspace and assign sequential ranks
    console.log('🔄 Setting remaining companies in TOP workspace to sequential ranks...');
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
    
    console.log(`📊 Found ${remainingCompanies.length} remaining companies in TOP workspace to rank...`);
    
    // Update remaining companies with sequential ranks starting from 11
    let currentRank = 11;
    for (const company of remainingCompanies) {
      try {
        await prisma.companies.update({
          where: { id: company.id },
          data: { rank: currentRank }
        });
        currentRank++;
      } catch (error) {
        console.error(`❌ Error updating ${company.name}:`, error.message);
      }
    }
    
    console.log(`✅ Updated ${remainingCompanies.length} remaining companies with sequential ranks`);
    
    // Verify the results for TOP workspace
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
    
    console.log(`\n🔍 Verification - Top 15 companies in TOP workspace:`);
    topCompanies.forEach(company => {
      console.log(`  Rank ${company.rank}: ${company.name}`);
    });
    
    // Count total companies in TOP workspace
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      }
    });
    
    console.log(`\n📊 Total companies in TOP workspace: ${totalCompanies}`);
    console.log(`✅ TOP workspace company ranks fix completed!`);
    
  } catch (error) {
    console.error('❌ Error fixing TOP workspace company ranks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixTopWorkspaceRanks()
  .then(() => {
    console.log('🎉 TOP workspace script completed successfully');
    console.log('💡 Next: Run similar scripts for other workspaces');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });