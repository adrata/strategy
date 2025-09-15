const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeAccountIdFromDatabase() {
  console.log('🗑️  REMOVING ACCOUNTID FROM DATABASE');
  console.log('=====================================');
  console.log('Removing legacy accountId field from customers table...\n');

  try {
    // First, let's see what's in the customers table
    console.log('📋 Checking current customers table structure...');
    const customers = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position;
    `;
    
    console.log('Current customers table columns:');
    customers.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if accountId column exists
    const hasAccountId = customers.some(col => col.column_name === 'accountId');
    
    if (hasAccountId) {
      console.log('\n🔧 Removing accountId column from customers table...');
      
      // Drop the accountId column
      await prisma.$executeRaw`ALTER TABLE customers DROP COLUMN IF EXISTS "accountId";`;
      console.log('✅ Successfully removed accountId column');
      
      // Also remove any constraints that might reference accountId
      try {
        await prisma.$executeRaw`ALTER TABLE customers DROP CONSTRAINT IF EXISTS "customers_accountId_fkey";`;
        console.log('✅ Removed accountId foreign key constraint');
      } catch (e) {
        console.log('ℹ️  No accountId foreign key constraint found');
      }
      
    } else {
      console.log('✅ accountId column already removed from customers table');
    }

    // Check other tables for accountId
    console.log('\n🔍 Checking other tables for accountId...');
    const allTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `;
    
    for (const table of allTables) {
      const tableName = table.table_name;
      const columns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${tableName} 
        AND column_name = 'accountId';
      `;
      
      if (columns.length > 0) {
        console.log(`🔧 Removing accountId from ${tableName}...`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "accountId";`);
        console.log(`✅ Removed accountId from ${tableName}`);
      }
    }

    // Check for contactId as well
    console.log('\n🔍 Checking for contactId columns...');
    for (const table of allTables) {
      const tableName = table.table_name;
      const columns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${tableName} 
        AND column_name = 'contactId';
      `;
      
      if (columns.length > 0) {
        console.log(`🔧 Removing contactId from ${tableName}...`);
        await prisma.$executeRaw`ALTER TABLE ${tableName} DROP COLUMN IF EXISTS "contactId";`;
        console.log(`✅ Removed contactId from ${tableName}`);
      }
    }

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('The database now matches the updated Prisma schema.');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

removeAccountIdFromDatabase()
  .then(() => {
    console.log('\n🎉 Database migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database migration failed:', error);
    process.exit(1);
  });
