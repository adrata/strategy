#!/usr/bin/env node

/**
 * 🔍 DEBUG ADRATA COMPANIES
 * 
 * Debug script to find where the 22 companies are located
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAdrataCompanies() {
  try {
    console.log('🔍 DEBUGGING ADRATA COMPANIES');
    console.log('=============================');
    console.log('');

    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Check all workspaces
    console.log('🏢 ALL WORKSPACES:');
    console.log('==================');
    const workspaces = await prisma.workspaces.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true }
    });
    
    workspaces.forEach(ws => {
      console.log(`   ${ws.id} - ${ws.name} (${ws.slug})`);
    });
    console.log('');

    // Check companies in each workspace
    console.log('🏢 COMPANIES BY WORKSPACE:');
    console.log('==========================');
    
    for (const workspace of workspaces) {
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          mainSellerId: true
        }
      });
      
      console.log(`${workspace.name} (${workspace.id}): ${companies.length} companies`);
      
      if (companies.length > 0) {
        const danCompanies = companies.filter(c => c.mainSellerId === '01K1VBYZMWTCT09FWEKBDMCXZM');
        const unassigned = companies.filter(c => c.mainSellerId === null);
        const otherAssigned = companies.filter(c => c.mainSellerId !== null && c.mainSellerId !== '01K1VBYZMWTCT09FWEKBDMCXZM');
        
        console.log(`   ✅ Dan: ${danCompanies.length}`);
        console.log(`   ❓ Unassigned: ${unassigned.length}`);
        console.log(`   ❌ Others: ${otherAssigned.length}`);
        
        if (companies.length <= 5) {
          companies.forEach(c => {
            console.log(`      - ${c.name} (seller: ${c.mainSellerId || 'null'})`);
          });
        } else {
          console.log(`      - Showing first 5 of ${companies.length} companies:`);
          companies.slice(0, 5).forEach(c => {
            console.log(`        ${c.name} (seller: ${c.mainSellerId || 'null'})`);
          });
        }
      }
      console.log('');
    }

    // Check if there are any companies with null workspaceId
    console.log('🔍 COMPANIES WITH NULL WORKSPACE:');
    console.log('==================================');
    const nullWorkspaceCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: null,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        mainSellerId: true
      }
    });
    
    console.log(`Found ${nullWorkspaceCompanies.length} companies with null workspaceId`);
    if (nullWorkspaceCompanies.length > 0) {
      nullWorkspaceCompanies.slice(0, 5).forEach(c => {
        console.log(`   - ${c.name} (seller: ${c.mainSellerId || 'null'})`);
      });
    }
    console.log('');

    // Check Dan's user record
    console.log('👤 DAN MIROLLI USER RECORD:');
    console.log('============================');
    const danUser = await prisma.users.findFirst({
      where: {
        email: 'dan@adrata.com'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    if (danUser) {
      console.log(`✅ Found Dan: ${danUser.name} (${danUser.email}) - ID: ${danUser.id}`);
    } else {
      console.log('❌ Dan Mirolli not found!');
    }
    console.log('');

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the script
debugAdrataCompanies();
