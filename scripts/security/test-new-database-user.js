#!/usr/bin/env node

/**
 * Test script for new database user connection
 * 
 * Usage:
 *   DATABASE_URL="postgresql://username:password@host/database?sslmode=require" node scripts/security/test-new-database-user.js
 * 
 * Or set DATABASE_URL in your .env file
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  // Get DATABASE_URL from environment or use default
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable is required');
    console.log('\nUsage:');
    console.log('  DATABASE_URL="postgresql://username:password@host/database?sslmode=require" node scripts/security/test-new-database-user.js');
    console.log('\nOr set DATABASE_URL in your .env file');
    process.exit(1);
  }

  // Mask password in logs
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':***@');
  console.log(`🔌 Connecting to: ${maskedUrl}`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    // Test table access
    console.log('🔍 Testing table access...');
    const userCount = await prisma.users.count();
    console.log(`✅ Users table accessible: ${userCount} users found`);
    
    const workspaceCount = await prisma.workspaces.count();
    console.log(`✅ Workspaces table accessible: ${workspaceCount} workspaces found`);
    
    const companyCount = await prisma.companies.count();
    console.log(`✅ Companies table accessible: ${companyCount} companies found`);
    
    // Test a sample query
    const sampleUser = await prisma.users.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    });
    
    if (sampleUser) {
      console.log(`✅ Sample query successful: Found user ${sampleUser.email}`);
    }
    
    console.log('\n🎉 DATABASE CONNECTION TEST PASSED!');
    console.log('✅ All tests successful - new credentials are working correctly');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Verify your credentials in Neon Console');
    console.log('   2. Check that the user has proper permissions');
    console.log('   3. Ensure SSL is enabled (sslmode=require)');
    console.log('   4. Verify the host and database name are correct');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
