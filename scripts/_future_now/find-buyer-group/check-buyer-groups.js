#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function checkBuyerGroups() {
  const prisma = new PrismaClient();
  
  try {
    const buyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID
      },
      select: {
        id: true,
        companyId: true,
        companyName: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    console.log(`\n📊 Found ${buyerGroups.length} buyer groups total\n`);
    console.log('Recent buyer groups:');
    buyerGroups.forEach((bg, i) => {
      console.log(`${i + 1}. CompanyId: ${bg.companyId || 'NULL'}, CompanyName: ${bg.companyName || 'NULL'}`);
      console.log(`   Created: ${bg.createdAt.toISOString()}`);
    });
    
    const withCompanyId = buyerGroups.filter(b => b.companyId).length;
    const withCompanyName = buyerGroups.filter(b => b.companyName).length;
    
    console.log(`\n📈 Summary:`);
    console.log(`   - With companyId: ${withCompanyId}/${buyerGroups.length}`);
    console.log(`   - With companyName: ${withCompanyName}/${buyerGroups.length}`);
    
    // Count unique companies
    const uniqueCompanyIds = new Set(buyerGroups.map(bg => bg.companyId).filter(Boolean));
    const uniqueCompanyNames = new Set(buyerGroups.map(bg => bg.companyName).filter(Boolean));
    
    console.log(`   - Unique companyIds: ${uniqueCompanyIds.size}`);
    console.log(`   - Unique companyNames: ${uniqueCompanyNames.size}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBuyerGroups();

