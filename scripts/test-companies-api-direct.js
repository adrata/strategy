const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompaniesAPI() {
  try {
    console.log('🔍 Testing companies API directly...');
    
    // Test the exact query that the API uses
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
        deletedAt: null,
        assignedUserId: { not: null }
      },
      select: {
        id: true,
        name: true,
        assignedUserId: true
      },
      take: 10
    });
    
    console.log(`📊 Found ${companies.length} companies with assignedUserId`);
    
    // Check specifically for Sarah's companies
    const sarahCompanies = companies.filter(c => c.assignedUserId === 'cybersecurity-seller-2');
    console.log(`🎯 Sarah Rodriguez (cybersecurity-seller-2) companies: ${sarahCompanies.length}`);
    
    if (sarahCompanies.length > 0) {
      console.log('✅ Sarah has companies assigned:');
      sarahCompanies.forEach(company => {
        console.log(`  - ${company.name} (${company.assignedUserId})`);
      });
    } else {
      console.log('❌ No companies found for Sarah Rodriguez');
    }
    
    // Show all assigned user IDs
    const assignedUserIds = [...new Set(companies.map(c => c.assignedUserId))];
    console.log(`\n📋 All assigned user IDs in sample:`);
    assignedUserIds.forEach(id => {
      const count = companies.filter(c => c.assignedUserId === id).length;
      console.log(`  ${id}: ${count} companies`);
    });
    
    // Check if Sarah has any companies at all
    const sarahCount = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
        deletedAt: null,
        assignedUserId: 'cybersecurity-seller-2'
      }
    });
    
    console.log(`\n🎯 Total companies assigned to Sarah Rodriguez: ${sarahCount}`);
    
    if (sarahCount === 0) {
      console.log('❌ PROBLEM: Sarah has no companies assigned in the database!');
      console.log('🔧 Let me check what happened to the assignment...');
      
      // Check if the assignment script actually worked
      const allAssignments = await prisma.companies.groupBy({
        by: ['assignedUserId'],
        where: {
          workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
          deletedAt: null,
          assignedUserId: { not: null }
        },
        _count: { id: true }
      });
      
      console.log('\n📊 Current company assignments:');
      allAssignments.forEach(assignment => {
        console.log(`  ${assignment.assignedUserId}: ${assignment._count.id} companies`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing companies API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompaniesAPI();
