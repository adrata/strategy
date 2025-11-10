const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Get actual column names from database
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      AND (column_name LIKE '%seller%' OR column_name LIKE '%main%' OR column_name LIKE '%workspace%')
      ORDER BY column_name
    `;
    
    console.log('Actual database column names:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}`);
    });
    
    // Test a raw query with different column name formats
    console.log('\nTesting raw queries...');
    
    // Try camelCase
    try {
      const test1 = await prisma.$queryRawUnsafe('SELECT "mainSellerId" FROM companies LIMIT 1');
      console.log('✅ camelCase "mainSellerId" works');
    } catch (e) {
      console.log(`❌ camelCase failed: ${e.message.substring(0, 100)}`);
    }
    
    // Try snake_case
    try {
      const test2 = await prisma.$queryRawUnsafe('SELECT main_seller_id FROM companies LIMIT 1');
      console.log('✅ snake_case main_seller_id works');
    } catch (e) {
      console.log(`❌ snake_case failed: ${e.message.substring(0, 100)}`);
    }
    
    // Try unquoted
    try {
      const test3 = await prisma.$queryRawUnsafe('SELECT mainSellerId FROM companies LIMIT 1');
      console.log('✅ unquoted mainSellerId works');
    } catch (e) {
      console.log(`❌ unquoted failed: ${e.message.substring(0, 100)}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

