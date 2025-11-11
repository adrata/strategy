#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function checkDuplicateBuyerGroups() {
  const prisma = new PrismaClient();

  try {
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
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by companyId to find duplicates
    const byCompany = {};
    buyerGroups.forEach(bg => {
      if (!byCompany[bg.companyId]) {
        byCompany[bg.companyId] = [];
      }
      byCompany[bg.companyId].push(bg);
    });

    // Find companies with multiple buyer groups
    const duplicates = Object.entries(byCompany)
      .filter(([companyId, groups]) => groups.length > 1)
      .map(([companyId, groups]) => ({
        companyId,
        count: groups.length,
        groups: groups.map(g => ({
          id: g.id,
          companyName: g.companyName,
          createdAt: g.createdAt
        }))
      }));

    console.log('\n📊 Buyer Group Analysis\n');
    console.log('='.repeat(60));
    console.log(`Total buyer groups: ${buyerGroups.length}`);
    console.log(`Unique companies with buyer groups: ${Object.keys(byCompany).length}`);
    console.log(`Companies with multiple buyer groups: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates.length} companies with multiple buyer groups:`);
      duplicates.slice(0, 10).forEach(dup => {
        console.log(`\n   Company: ${dup.groups[0].companyName || dup.companyId}`);
        console.log(`   Buyer groups: ${dup.count}`);
        dup.groups.forEach((g, i) => {
          console.log(`     ${i + 1}. ${g.id} - Created: ${g.createdAt.toISOString()}`);
        });
      });
      if (duplicates.length > 10) {
        console.log(`   ... and ${duplicates.length - 10} more`);
      }
    }

    // Check the actual count that should be processed
    const companiesToProcess = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { website: { not: null } },
          { linkedinUrl: { not: null } }
        ]
      },
      select: {
        id: true
      }
    });

    const processedCompanyIds = new Set(Object.keys(byCompany));
    const shouldProcess = companiesToProcess.filter(c => !processedCompanyIds.has(c.id));

    console.log(`\n📈 Processing Status:`);
    console.log(`   Companies eligible: ${companiesToProcess.length}`);
    console.log(`   Already processed: ${processedCompanyIds.size}`);
    console.log(`   Should process: ${shouldProcess.length}`);
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkDuplicateBuyerGroups();
}

