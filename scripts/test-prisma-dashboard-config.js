#!/usr/bin/env node

/**
 * 🧪 TEST PRISMA DASHBOARD CONFIG ACCESS
 * 
 * Tests if Prisma client can access dashboardConfig field
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardConfig() {
  try {
    console.log('🧪 Testing Prisma dashboardConfig access...\n');
    
    // Try to query a user with dashboardConfig
    const user = await prisma.users.findFirst({
      select: {
        id: true,
        email: true,
        name: true
        // Try with dashboardConfig - if it fails, we know it's not in the client
      }
    });
    
    if (!user) {
      console.log('❌ No users found');
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    
    // Now try to access dashboardConfig directly
    try {
      const userWithConfig = await prisma.users.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          dashboardConfig: true
        }
      });
      
      if (userWithConfig) {
        console.log('✅ dashboardConfig field is accessible in Prisma client!');
        console.log(`   Value: ${userWithConfig.dashboardConfig ? JSON.stringify(userWithConfig.dashboardConfig) : 'null'}`);
      }
    } catch (error) {
      if (error.message && error.message.includes('dashboardConfig')) {
        console.log('❌ dashboardConfig field NOT accessible in Prisma client');
        console.log('   Prisma client needs to be regenerated');
        console.log(`   Error: ${error.message}`);
      } else {
        throw error;
      }
    }
    
    // Test if we can update dashboardConfig
    try {
      const testUpdate = await prisma.users.update({
        where: { id: user.id },
        data: {
          dashboardConfig: { test: 'value' }
        },
        select: {
          dashboardConfig: true
        }
      });
      
      console.log('✅ Can write to dashboardConfig field');
      
      // Revert the test update
      await prisma.users.update({
        where: { id: user.id },
        data: {
          dashboardConfig: null
        }
      });
      
    } catch (error) {
      if (error.message && error.message.includes('dashboardConfig')) {
        console.log('❌ Cannot write to dashboardConfig field');
        console.log('   Prisma client needs to be regenerated');
      } else {
        console.log(`⚠️  Error updating: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardConfig();

