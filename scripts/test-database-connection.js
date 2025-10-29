#!/usr/bin/env node

/**
 * Test Database Connection and BuyerGroups Table
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected');
    
    console.log('🔍 Testing BuyerGroups table...');
    const count = await prisma.buyerGroups.count();
    console.log(`✅ BuyerGroups table accessible, count: ${count}`);
    
    console.log('🔍 Testing table structure...');
    const sample = await prisma.buyerGroups.findFirst({
      select: {
        id: true,
        companyName: true,
        companyTier: true,
        dealSize: true,
        totalEmployeesFound: true,
        totalCost: true
      }
    });
    console.log('✅ Table structure looks good');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
