const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignCompaniesToSarah() {
  try {
    console.log('🎯 Assigning companies to Sarah Rodriguez (cybersecurity-seller-2)...');
    
    // First, let's see how many companies are currently assigned to different sellers
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
    
    // Get some companies that are currently assigned to other sellers
    const companiesToReassign = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
        deletedAt: null,
        assignedUserId: { not: null },
        NOT: { assignedUserId: 'cybersecurity-seller-2' }
      },
      take: 10, // Take 10 companies to reassign to Sarah
      select: {
        id: true,
        name: true,
        assignedUserId: true
      }
    });
    
    console.log(`\n🔄 Found ${companiesToReassign.length} companies to reassign to Sarah Rodriguez`);
    
    if (companiesToReassign.length === 0) {
      console.log('❌ No companies found to reassign');
      return;
    }
    
    // Reassign these companies to Sarah Rodriguez
    const updateResult = await prisma.companies.updateMany({
      where: {
        id: { in: companiesToReassign.map(c => c.id) }
      },
      data: {
        assignedUserId: 'cybersecurity-seller-2'
      }
    });
    
    console.log(`✅ Successfully reassigned ${updateResult.count} companies to Sarah Rodriguez`);
    
    // Verify the assignment
    const sarahCompanies = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
        deletedAt: null,
        assignedUserId: 'cybersecurity-seller-2'
      }
    });
    
    console.log(`🎯 Sarah Rodriguez now has ${sarahCompanies} companies assigned`);
    
    // Show the updated assignments
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
    console.error('❌ Error assigning companies to Sarah:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignCompaniesToSarah();
