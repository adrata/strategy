#!/usr/bin/env node

/**
 * Fix TOP Workspace All Companies Ranking
 * 
 * This script ranks ALL companies in the TOP workspace (01K1VBYXHD0J895XAN0HGFBKJP)
 * based on business logic: updatedAt descending, then name alphabetical.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTopWorkspaceAllCompanies() {
  const workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // TOP workspace
  
  try {
    console.log(`🔧 Starting TOP workspace ALL companies ranking fix...`);
    console.log(`📊 Workspace: ${workspaceId}`);
    
    // Step 1: Get all companies in TOP workspace, sorted by business logic
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      orderBy: [
        { updatedAt: 'desc' },  // Most recent first
        { name: 'asc' }         // Then alphabetical
      ],
      select: {
        id: true,
        name: true,
        rank: true,
        updatedAt: true
      }
    });
    
    console.log(`📊 Found ${companies.length} companies in TOP workspace to rank`);
    
    // Step 2: Reset all ranks to null first
    console.log(`\n🔄 Resetting all company ranks...`);
    await prisma.companies.updateMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      data: {
        rank: null
      }
    });
    
    // Step 3: Assign sequential ranks (1, 2, 3, 4, 5...)
    console.log(`\n📊 Assigning sequential ranks to all companies...`);
    
    // Update in batches to avoid connection pool issues
    const batchSize = 50;
    let currentRank = 1;
    
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      
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
      console.log(`✅ Updated batch ${Math.floor(i / batchSize) + 1} (companies ${i + 1}-${Math.min(i + batchSize, companies.length)}) - Ranks ${currentRank - batch.length} to ${currentRank - 1}`);
    }
    
    // Step 4: Verify the results
    const topCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        rank: { lte: 20 }
      },
      orderBy: { rank: 'asc' },
      select: {
        id: true,
        name: true,
        rank: true,
        updatedAt: true
      }
    });
    
    console.log(`\n🔍 Verification - Top 20 companies in TOP workspace:`);
    topCompanies.forEach(company => {
      const dateStr = company.updatedAt.toISOString().split('T')[0];
      console.log(`  Rank ${company.rank}: ${company.name} (Updated: ${dateStr})`);
    });
    
    // Count total companies
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      }
    });
    
    console.log(`\n📊 Total companies in TOP workspace: ${totalCompanies}`);
    console.log(`✅ TOP workspace ALL companies ranking completed!`);
    
  } catch (error) {
    console.error('❌ Error fixing TOP workspace company ranks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixTopWorkspaceAllCompanies()
  .then(() => {
    console.log('🎉 TOP workspace ALL companies ranking completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
