const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countNotaryCompanies() {
  try {
    console.log('🔍 Counting companies in Notary Everyday workspace...\n');
    
    const NOTARY_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
    
    // Count total companies in Notary Everyday workspace
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`📊 Total companies in Notary Everyday workspace: ${totalCompanies}`);
    
    // Also show breakdown by assignment status
    const assignedCompanies = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: { not: null }
      }
    });
    
    const unassignedCompanies = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: null
      }
    });
    
    console.log(`   - Assigned companies: ${assignedCompanies}`);
    console.log(`   - Unassigned companies: ${unassignedCompanies}`);
    
    // Show assignment breakdown
    const assignmentBreakdown = await prisma.companies.groupBy({
      by: ['assignedUserId'],
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    console.log(`\n📋 Companies by assigned user:`);
    for (const assignment of assignmentBreakdown) {
      const user = await prisma.users.findUnique({
        where: { id: assignment.assignedUserId },
        select: { name: true, email: true }
      });
      
      if (user) {
        console.log(`   ${user.name} (${user.email}): ${assignment._count.id} companies`);
      } else {
        console.log(`   User ${assignment.assignedUserId}: ${assignment._count.id} companies`);
      }
    }
    
    if (unassignedCompanies > 0) {
      console.log(`   Unassigned: ${unassignedCompanies} companies`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countNotaryCompanies();
