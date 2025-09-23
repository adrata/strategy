const { PrismaClient } = require('@prisma/client');

async function testPrismaClient() {
  try {
    const prisma = new PrismaClient();
    console.log('✅ Prisma client loaded successfully');
    
    // Test a simple query
    const companyCount = await prisma.companies.count();
    console.log(`✅ Database connection working - found ${companyCount} companies`);
    
    await prisma.$disconnect();
    console.log('✅ Prisma client test completed successfully');
  } catch (error) {
    console.error('❌ Prisma client test failed:', error.message);
  }
}

testPrismaClient();
