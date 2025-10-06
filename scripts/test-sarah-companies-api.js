const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSarahCompaniesAPI() {
  try {
    console.log('🔍 Testing Sarah Rodriguez companies API...');
    
    // Test the exact query that the API uses for companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
        deletedAt: null,
        assignedUserId: 'cybersecurity-seller-2'
      },
      select: {
        id: true,
        name: true,
        industry: true,
        assignedUserId: true
      },
      take: 10
    });
    
    console.log(`🎯 Sarah Rodriguez companies found: ${companies.length}`);
    
    if (companies.length > 0) {
      console.log('✅ Sarah has companies:');
      companies.forEach((company, index) => {
        console.log(`  ${index + 1}. ${company.name} (${company.assignedUserId})`);
      });
    } else {
      console.log('❌ No companies found for Sarah Rodriguez');
      
      // Check if there are any companies with cybersecurity-seller-2
      const allSarahCompanies = await prisma.companies.count({
        where: {
          workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
          deletedAt: null,
          assignedUserId: 'cybersecurity-seller-2'
        }
      });
      
      console.log(`🔍 Total companies with cybersecurity-seller-2: ${allSarahCompanies}`);
    }
    
    // Check what companies are actually assigned to different sellers
    const assignments = await prisma.companies.groupBy({
      by: ['assignedUserId'],
      where: {
        workspaceId: '01K1VBYX2YERMXBFJ60RC6J194',
        deletedAt: null,
        assignedUserId: { not: null }
      },
      _count: { id: true }
    });
    
    console.log('\n📊 Current company assignments:');
    assignments.forEach(assignment => {
      console.log(`  ${assignment.assignedUserId}: ${assignment._count.id} companies`);
    });
    
  } catch (error) {
    console.error('❌ Error testing Sarah companies API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSarahCompaniesAPI();
