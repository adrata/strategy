#!/usr/bin/env node

console.log('🔍 Testing Perplexity Integration');
console.log('================================');

// Test environment variables
console.log('Environment check:');
console.log('PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? 'SET' : 'NOT SET');
console.log('CORESIGNAL_API_KEY:', process.env.CORESIGNAL_API_KEY ? 'SET' : 'NOT SET');

// Test database connection
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('\n📊 Testing database connection...');
    const companyCount = await prisma.companies.count({
      where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1' }
    });
    console.log(`✅ Database connected. Found ${companyCount} companies in TOP workspace.`);
    
    const companiesWithoutPeople = await prisma.companies.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        people: { none: {} }
      },
      select: { id: true, name: true, website: true },
      take: 5
    });
    
    console.log(`\n📋 Companies without people (first 5):`);
    companiesWithoutPeople.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.website || 'No website'})`);
    });
    
    await prisma.$disconnect();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    await prisma.$disconnect();
  }
}

testDatabase();
