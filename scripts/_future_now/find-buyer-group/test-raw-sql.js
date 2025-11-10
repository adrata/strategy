const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Get actual column names
    const cols = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      AND (column_name LIKE '%seller%' OR column_name LIKE '%workspace%' OR column_name = 'id')
      ORDER BY column_name
    `;
    
    console.log('Actual database columns:');
    cols.forEach(c => console.log(`  ${c.column_name}`));
    
    // Test if we can query with the column
    const test = await prisma.$queryRaw`SELECT "mainSellerId", "workspaceId", id FROM companies LIMIT 1`;
    console.log('\n✅ Query test works - columns exist');
    console.log('Sample:', test[0]);
    
    // Test if we can insert (but rollback)
    console.log('\nTesting INSERT syntax...');
    const testId = 'TEST' + Date.now();
    try {
      // This will fail because we're using a test ID, but it will show us the syntax error
      await prisma.$executeRaw`
        INSERT INTO companies (id, "workspaceId", name, "mainSellerId", status, priority, "createdAt", "updatedAt")
        VALUES (${testId}, '01K9QAP09FHT6EAP1B4G2KP3D2', 'Test Company', 'test-seller-id', 'ACTIVE', 'MEDIUM', NOW(), NOW())
      `;
      console.log('✅ INSERT syntax works');
      // Clean up
      await prisma.$executeRaw`DELETE FROM companies WHERE id = ${testId}`;
    } catch (e) {
      if (e.message.includes('does not exist')) {
        console.log('❌ Column name issue:', e.message);
      } else {
        console.log('⚠️  Other error (expected for test):', e.message.substring(0, 100));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

