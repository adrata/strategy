#!/usr/bin/env node

/**
 * Remove Duplicate Buyer Groups
 * 
 * Removes duplicate buyer groups for the same company, keeping only the most recent one.
 * This fixes the issue where companies have multiple buyer groups from previous runs.
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function removeDuplicateBuyerGroups() {
  const prisma = new PrismaClient();

  try {
    console.log('\n🧹 Removing Duplicate Buyer Groups\n');
    console.log('='.repeat(60));

    // Get all buyer groups with companyId
    const buyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        companyId: { not: null }
      },
      select: {
        id: true,
        companyId: true,
        companyName: true,
        createdAt: true,
        totalMembers: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by companyId
    const byCompany = {};
    buyerGroups.forEach(bg => {
      if (!byCompany[bg.companyId]) {
        byCompany[bg.companyId] = [];
      }
      byCompany[bg.companyId].push(bg);
    });

    // Find companies with multiple buyer groups
    const duplicates = Object.entries(byCompany)
      .filter(([companyId, groups]) => groups.length > 1);

    console.log(`Found ${duplicates.length} companies with duplicate buyer groups\n`);

    let deleted = 0;
    let kept = 0;

    for (const [companyId, groups] of duplicates) {
      // Keep the most recent one (first in array since sorted by createdAt desc)
      const keep = groups[0];
      const toDelete = groups.slice(1);

      console.log(`\nCompany: ${keep.companyName || companyId}`);
      console.log(`  Keeping: ${keep.id} (${keep.totalMembers} members, created ${keep.createdAt.toISOString()})`);
      
      for (const bg of toDelete) {
        console.log(`  Deleting: ${bg.id} (${bg.totalMembers} members, created ${bg.createdAt.toISOString()})`);
        
        // Delete buyer group members first (cascade should handle this, but being explicit)
        await prisma.buyerGroupMembers.deleteMany({
          where: { buyerGroupId: bg.id }
        });
        
        // Delete the buyer group
        await prisma.buyerGroups.delete({
          where: { id: bg.id }
        });
        
        deleted++;
      }
      
      kept++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Cleanup Complete:`);
    console.log(`   - Companies processed: ${duplicates.length}`);
    console.log(`   - Buyer groups kept: ${kept}`);
    console.log(`   - Buyer groups deleted: ${deleted}`);
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  removeDuplicateBuyerGroups();
}

