#!/usr/bin/env node

/**
 * 🧪 TEST PRISMA CONNECTION
 * 
 * Simple test to verify Prisma client works
 */

const { PrismaClient } = require('@prisma/client');

async function testPrismaConnection() {
  console.log('🧪 Testing Prisma Connection...\n');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || "postgresql://localhost:5432/adrata",
        },
      },
      log: ['error', 'warn', 'info'],
    });
    
    console.log('✅ Prisma client created successfully');
    
    // Test connection
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    console.log('🔍 Testing simple query...');
    const userCount = await prisma.userProfile.count();
    console.log(`✅ Query successful - UserProfile count: ${userCount}`);
    
    // Test specific query for Dano
    console.log('🔍 Testing Dano query...');
    const danoProfile = await prisma.userProfile.findFirst({
      where: {
        userId: 'dano',
        workspaceId: 'notary-everyday'
      }
    });
    
    if (danoProfile) {
      console.log('✅ Dano profile found:');
      console.log(`   Title: ${danoProfile.title || 'Not set'}`);
      console.log(`   Department: ${danoProfile.department || 'Not set'}`);
      console.log(`   Territory: ${danoProfile.territory || 'Not set'}`);
    } else {
      console.log('⚠️ Dano profile not found in notary-everyday workspace');
      console.log('   This is expected if Dano hasn\'t been set up yet');
    }
    
    // Test SellerProductPortfolio
    console.log('🔍 Testing SellerProductPortfolio query...');
    const danoProducts = await prisma.sellerProductPortfolio.findMany({
      where: {
        sellerId: 'dano',
        workspaceId: 'notary-everyday',
        isActive: true
      }
    });
    
    console.log(`✅ SellerProductPortfolio query successful - Found ${danoProducts.length} products for Dano`);
    
    if (danoProducts.length > 0) {
      console.log('   Products:');
      danoProducts.forEach(product => {
        console.log(`   - ${product.productName} (${product.productCategory})`);
        console.log(`     Target Industries: ${JSON.stringify(product.targetIndustries)}`);
        console.log(`     Buying Committee Roles: ${JSON.stringify(product.buyingCommitteeRoles)}`);
      });
    } else {
      console.log('   ⚠️ No products found for Dano - need to set up product portfolio');
    }
    
    await prisma.$disconnect();
    console.log('\n🎉 All Prisma tests passed!');
    
  } catch (error) {
    console.error('❌ Prisma test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPrismaConnection();
