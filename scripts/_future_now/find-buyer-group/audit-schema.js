const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 FULL DATABASE SCHEMA AUDIT\n');
    console.log('='.repeat(70));
    
    // Check companies table columns
    console.log('\n📊 COMPANIES TABLE COLUMNS:');
    const companyColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'companies'
      ORDER BY ordinal_position
    `;
    
    // Find key columns we need
    const keyColumns = ['workspaceId', 'workspace_id', 'mainSellerId', 'main_seller_id', 'coreCompanyId', 'core_company_id'];
    const foundColumns = {};
    
    companyColumns.forEach(col => {
      const colName = col.column_name;
      if (keyColumns.some(k => colName.toLowerCase().includes(k.toLowerCase().replace('_', '')))) {
        foundColumns[colName] = col;
      }
    });
    
    console.log('\nKey columns found:');
    Object.keys(foundColumns).forEach(k => {
      console.log(`  ${k}: ${foundColumns[k].data_type} (nullable: ${foundColumns[k].is_nullable})`);
    });
    
    // Check people table columns
    console.log('\n📊 PEOPLE TABLE COLUMNS (key fields):');
    const peopleColumns = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'people'
      AND (column_name LIKE '%buyer%' OR column_name LIKE '%seller%' OR column_name LIKE '%workspace%' OR column_name LIKE '%email%' OR column_name LIKE '%phone%')
      ORDER BY column_name
    `;
    
    peopleColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Test a simple query to see what Prisma returns
    console.log('\n🧪 TESTING PRISMA QUERY:');
    try {
      const testCompany = await prisma.companies.findFirst({
        where: { workspaceId: '01K9QAP09FHT6EAP1B4G2KP3D2' },
        take: 1
      });
      if (testCompany) {
        console.log('✅ Prisma query works');
        console.log(`  Company: ${testCompany.name}`);
        console.log(`  Has mainSellerId field: ${testCompany.mainSellerId !== undefined ? 'YES' : 'NO'}`);
        if (testCompany.mainSellerId !== undefined) {
          console.log(`  mainSellerId value: ${testCompany.mainSellerId || 'NULL'}`);
        }
      } else {
        console.log('⚠️  No companies found in workspace');
      }
    } catch (e) {
      console.log(`❌ Prisma query failed: ${e.message}`);
    }
    
    // Check actual column names by querying raw
    console.log('\n🔍 RAW SQL COLUMN NAMES:');
    try {
      const rawResult = await prisma.$queryRaw`SELECT * FROM companies LIMIT 1`;
      if (rawResult && rawResult.length > 0) {
        const keys = Object.keys(rawResult[0]);
        console.log('Actual column names in database:');
        keys.filter(k => k.includes('seller') || k.includes('workspace') || k.includes('core')).forEach(k => {
          console.log(`  ${k}`);
        });
      }
    } catch (e) {
      console.log(`❌ Raw query failed: ${e.message}`);
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
})();

