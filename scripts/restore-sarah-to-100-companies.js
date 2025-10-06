const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreSarahTo100Companies() {
  try {
    console.log('🎯 Restoring Sarah Rodriguez to 100 companies like other sellers...');
    
    // First, let's see current assignments
    const currentAssignments = await prisma.companies.groupBy({
      by: ['assignedUserId'],
      where: {
        workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
        deletedAt: null,
        assignedUserId: { not: null }
      },
      _count: { id: true }
    });
    
    console.log('📊 Current company assignments:');
    currentAssignments.forEach(assignment => {
      console.log(`  ${assignment.assignedUserId}: ${assignment._count.id} companies`);
    });
    
    // Get Sarah's current companies
    const sarahCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
        deletedAt: null,
        assignedUserId: 'cybersecurity-seller-2'
      },
      select: {
        id: true,
        name: true
      }
    });
    
    console.log(`\n🎯 Sarah currently has ${sarahCompanies.length} companies`);
    
    if (sarahCompanies.length < 100) {
      // Add more companies to Sarah to reach 100
      const needed = 100 - sarahCompanies.length;
      console.log(`🔄 Adding ${needed} more companies to Sarah to reach 100`);
      
      // Get companies from other sellers who have more than 100
      const availableCompanies = await prisma.companies.findMany({
        where: {
          workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
          deletedAt: null,
          assignedUserId: { not: 'cybersecurity-seller-2' }
        },
        take: needed,
        select: {
          id: true,
          name: true,
          assignedUserId: true
        }
      });
      
      for (const company of availableCompanies) {
        await prisma.companies.update({
          where: { id: company.id },
          data: { assignedUserId: 'cybersecurity-seller-2' }
        });
        
        console.log(`  ✅ Assigned ${company.name} to Sarah (was ${company.assignedUserId})`);
      }
    } else if (sarahCompanies.length > 100) {
      // Remove excess companies (keep first 100, remove the rest)
      const companiesToRemove = sarahCompanies.slice(100);
      console.log(`🔄 Removing ${companiesToRemove.length} excess companies from Sarah`);
      
      // Reassign excess companies to other sellers
      const otherSellers = ['cybersecurity-seller-1', 'cybersecurity-seller-3', 'cybersecurity-seller-4', 'cybersecurity-seller-5'];
      
      for (let i = 0; i < companiesToRemove.length; i++) {
        const company = companiesToRemove[i];
        const targetSeller = otherSellers[i % otherSellers.length];
        
        await prisma.companies.update({
          where: { id: company.id },
          data: { assignedUserId: targetSeller }
        });
        
        console.log(`  ✅ Reassigned ${company.name} to ${targetSeller}`);
      }
    } else {
      console.log('✅ Sarah already has exactly 100 companies');
    }
    
    // Verify final count
    const finalSarahCount = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
        deletedAt: null,
        assignedUserId: 'cybersecurity-seller-2'
      }
    });
    
    console.log(`\n🎯 Final result: Sarah Rodriguez has ${finalSarahCount} companies`);
    
    // Show updated assignments
    const updatedAssignments = await prisma.companies.groupBy({
      by: ['assignedUserId'],
      where: {
        workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
        deletedAt: null,
        assignedUserId: { not: null }
      },
      _count: { id: true }
    });
    
    console.log('\n📊 Updated company assignments:');
    updatedAssignments.forEach(assignment => {
      console.log(`  ${assignment.assignedUserId}: ${assignment._count.id} companies`);
    });
    
  } catch (error) {
    console.error('❌ Error restoring Sarah companies count:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreSarahTo100Companies();
