const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Get ALL columns from companies table
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'companies'
      ORDER BY ordinal_position
    `;
    
    console.log('=== ALL COMPANIES TABLE COLUMNS ===\n');
    columns.forEach(col => {
      console.log(`${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check required fields
    console.log('\n=== REQUIRED FIELDS CHECK ===');
    const required = ['id', 'workspaceId', 'name', 'createdAt', 'updatedAt'];
    const optional = ['mainSellerId', 'priority', 'status', 'website', 'industry', 'employeeCount', 'revenue', 'description', 'domain'];
    
    const allColNames = columns.map(c => c.column_name);
    
    console.log('\nRequired fields:');
    required.forEach(field => {
      const exists = allColNames.includes(field);
      console.log(`  ${field}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
    console.log('\nOptional fields we want to use:');
    optional.forEach(field => {
      const exists = allColNames.includes(field);
      console.log(`  ${field}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

