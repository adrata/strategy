#!/usr/bin/env node

console.log('🎯 SIMPLE BUYER GROUP TEST');
console.log('==========================');

const { PrismaClient } = require('@prisma/client');

async function testBuyerGroupAnalysis() {
  const prisma = new PrismaClient();
  
  try {
    console.log('✅ Prisma client initialized');
    
    // Get TOP workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: 'TOP', mode: 'insensitive' } }
    });
    
    if (!workspace) {
      console.log('❌ TOP workspace not found');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    
    // Count companies with people having buyer group roles
    const companiesWithRoles = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        people: {
          some: {
            buyerGroupRole: { not: null }
          }
        }
      },
      include: {
        people: {
          where: { buyerGroupRole: { not: null } },
          select: { id: true, buyerGroupRole: true }
        }
      }
    });
    
    console.log(`✅ Found ${companiesWithRoles.length} companies with people having buyer group roles`);
    
    // Count companies with formal buyer groups
    const companiesWithBuyerGroups = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        buyerGroups: { some: {} }
      }
    });
    
    console.log(`✅ Found ${companiesWithBuyerGroups.length} companies with formal buyer groups`);
    
    // Show first few companies
    console.log('\n📋 First 5 companies with people having roles:');
    companiesWithRoles.slice(0, 5).forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} - ${company.people.length} people with roles`);
    });
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testBuyerGroupAnalysis();
