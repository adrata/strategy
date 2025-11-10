const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Check actual column names in companies table
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      AND (column_name LIKE '%seller%' OR column_name LIKE '%main%' OR column_name = 'workspace_id' OR column_name = 'workspaceId')
      ORDER BY column_name
    `;
    
    console.log('Company columns (seller/main/workspace):');
    console.log(JSON.stringify(columns, null, 2));
    
    // Also check a sample company to see field names
    const sample = await prisma.$queryRaw`SELECT * FROM companies LIMIT 1`;
    if (sample && sample.length > 0) {
      console.log('\nSample company fields:');
      console.log(Object.keys(sample[0]).filter(k => k.includes('seller') || k.includes('main') || k.includes('workspace')).join(', '));
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();

