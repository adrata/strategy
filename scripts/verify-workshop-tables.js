/**
 * Verify workshop tables exist
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'workshop%'
      ORDER BY table_name
    `;
    
    console.log('✅ Found workshop tables:');
    console.log(tables);
    
    // Try to query one table
    const folderCount = await prisma.workshopFolder.count();
    console.log(`\n✅ workshopFolder table is accessible. Count: ${folderCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('workshopFolder')) {
      console.log('\n⚠️  Tables may not exist yet. Run the create script again.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();

