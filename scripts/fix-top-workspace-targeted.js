#!/usr/bin/env node

/**
 * Fix TOP Workspace Company Ranks - Targeted Script
 * 
 * This script fixes company ranks ONLY for the TOP workspace (01K1VBYXHD0J895XAN0HGFBKJP).
 * Sets Hillenmeyer Companies to rank 1, then assigns sequential ranks to remaining companies.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTopWorkspaceTargeted() {
  const workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // TOP workspace
  
  try {
    console.log(`🔧 Starting targeted TOP workspace company ranks fix...`);
    console.log(`📊 Workspace: ${workspaceId}`);
    
    // Step 1: Get current state
    const currentCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      orderBy: { rank: 'asc' },
      select: {
        id: true,
        name: true,
        rank: true,
        updatedAt: true
      },
      take: 10
    });
    
    console.log(`\n📋 Current top 10 companies in TOP workspace:`);
    currentCompanies.forEach(company => {
      console.log(`  Rank ${company.rank || 'NULL'}: ${company.name}`);
    });
    
    // Step 2: Reset all ranks for this workspace to null
    console.log(`\n🔄 Resetting all company ranks for TOP workspace...`);
    const resetResult = await prisma.companies.updateMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      data: {
        rank: null
      }
    });
    
    console.log(`✅ Reset ${resetResult.count} companies to rank NULL`);
    
    // Step 3: Set specific companies to specific ranks
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
    
    console.log(`\n📊 Setting specific ranks for ${targetCompanies.length} companies...`);
    
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
          console.log(`✅ Set ${target.name} to rank ${target.rank}`);
        } else {
          console.log(`⚠️  Company not found: ${target.name}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${target.name}:`, error.message);
      }
    }
    
    // Step 4: Get remaining companies and assign sequential ranks
    console.log(`\n🔄 Setting remaining companies to sequential ranks...`);
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
    
    console.log(`📊 Found ${remainingCompanies.length} remaining companies to rank...`);
    
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
    
    // Step 5: Verify the results
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
    
    // Count total companies
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
fixTopWorkspaceTargeted()
  .then(() => {
    console.log('🎉 TOP workspace ranking fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
