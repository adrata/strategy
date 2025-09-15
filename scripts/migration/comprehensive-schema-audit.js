const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function comprehensiveSchemaAudit() {
  console.log('🔍 COMPREHENSIVE SCHEMA AUDIT');
  console.log('==============================');
  console.log('Auditing Prisma schema vs production database...\n');

  const auditResults = {
    schemaIssues: [],
    databaseIssues: [],
    migrationNeeded: [],
    recommendations: []
  };

  try {
    // STEP 1: Get all tables from database
    console.log('📋 STEP 1: Analyzing database structure...');
    const allTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log(`Found ${allTables.length} tables in database:`);
    allTables.forEach(table => console.log(`  - ${table.table_name}`));

    // STEP 2: Check each table for accountId/contactId vs personId/companyId
    console.log('\n🔍 STEP 2: Checking for legacy field patterns...');
    
    for (const table of allTables) {
      const tableName = table.table_name;
      console.log(`\n📊 Analyzing table: ${tableName}`);
      
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = ${tableName} 
        ORDER BY ordinal_position;
      `;
      
      const columnNames = columns.map(col => col.column_name);
      
      // Check for legacy fields
      const hasAccountId = columnNames.includes('accountId');
      const hasContactId = columnNames.includes('contactId');
      const hasPersonId = columnNames.includes('personId');
      const hasCompanyId = columnNames.includes('companyId');
      
      console.log(`  Fields: ${columnNames.join(', ')}`);
      
      if (hasAccountId || hasContactId) {
        auditResults.schemaIssues.push({
          table: tableName,
          issue: 'Has legacy accountId/contactId fields',
          legacyFields: [hasAccountId ? 'accountId' : null, hasContactId ? 'contactId' : null].filter(Boolean),
          modernFields: [hasPersonId ? 'personId' : null, hasCompanyId ? 'companyId' : null].filter(Boolean)
        });
        console.log(`  ❌ LEGACY FIELDS: ${[hasAccountId ? 'accountId' : null, hasContactId ? 'contactId' : null].filter(Boolean).join(', ')}`);
      }
      
      if (hasPersonId || hasCompanyId) {
        console.log(`  ✅ MODERN FIELDS: ${[hasPersonId ? 'personId' : null, hasCompanyId ? 'companyId' : null].filter(Boolean).join(', ')}`);
      }
      
      // Check for data consistency
      if (hasPersonId && hasCompanyId) {
        const recordCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName}`;
        const personIdCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName} WHERE "personId" IS NOT NULL`;
        const companyIdCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName} WHERE "companyId" IS NOT NULL`;
        
        console.log(`  📊 Records: ${recordCount[0].count} total, ${personIdCount[0].count} with personId, ${companyIdCount[0].count} with companyId`);
        
        if (recordCount[0].count > 0 && personIdCount[0].count === 0 && companyIdCount[0].count === 0) {
          auditResults.databaseIssues.push({
            table: tableName,
            issue: 'Has personId/companyId fields but no data linked',
            totalRecords: recordCount[0].count,
            linkedRecords: 0
          });
          console.log(`  ⚠️  WARNING: No records linked to people/companies`);
        }
      }
    }

    // STEP 3: Check specific pipeline tables
    console.log('\n🎯 STEP 3: Analyzing pipeline tables...');
    
    const pipelineTables = ['leads', 'prospects', 'opportunities', 'customers'];
    
    for (const tableName of pipelineTables) {
      if (allTables.some(t => t.table_name === tableName)) {
        console.log(`\n📈 Pipeline table: ${tableName}`);
        
        const columns = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = ${tableName} 
          ORDER BY ordinal_position;
        `;
        
        const columnNames = columns.map(col => col.column_name);
        
        // Check for data duplication
        const hasPersonFields = ['firstName', 'lastName', 'fullName', 'email', 'workEmail'].some(field => 
          columnNames.includes(field)
        );
        const hasCompanyFields = ['company'].some(field => columnNames.includes(field));
        const hasPersonId = columnNames.includes('personId');
        const hasCompanyId = columnNames.includes('companyId');
        
        if (hasPersonFields && hasPersonId) {
          auditResults.schemaIssues.push({
            table: tableName,
            issue: 'Data duplication: has both person fields and personId',
            duplicatedFields: ['firstName', 'lastName', 'fullName', 'email', 'workEmail'].filter(f => columnNames.includes(f))
          });
          console.log(`  ❌ DATA DUPLICATION: Has both person fields and personId`);
        }
        
        if (hasCompanyFields && hasCompanyId) {
          auditResults.schemaIssues.push({
            table: tableName,
            issue: 'Data duplication: has both company field and companyId',
            duplicatedFields: ['company']
          });
          console.log(`  ❌ DATA DUPLICATION: Has both company field and companyId`);
        }
        
        // Check record counts
        const recordCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName}`;
        console.log(`  📊 Total records: ${recordCount[0].count}`);
        
        if (hasPersonId) {
          const personIdCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName} WHERE "personId" IS NOT NULL`;
          console.log(`  👥 Records with personId: ${personIdCount[0].count}`);
        }
        
        if (hasCompanyId) {
          const companyIdCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName} WHERE "companyId" IS NOT NULL`;
          console.log(`  🏢 Records with companyId: ${companyIdCount[0].count}`);
        }
      }
    }

    // STEP 4: Check core tables
    console.log('\n🏗️  STEP 4: Analyzing core tables...');
    
    const coreTables = ['people', 'companies'];
    
    for (const tableName of coreTables) {
      if (allTables.some(t => t.table_name === tableName)) {
        console.log(`\n👤 Core table: ${tableName}`);
        
        const recordCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName}`;
        console.log(`  📊 Total records: ${recordCount[0].count}`);
        
        if (recordCount[0].count === 0) {
          auditResults.databaseIssues.push({
            table: tableName,
            issue: 'Core table is empty',
            totalRecords: 0
          });
          console.log(`  ⚠️  WARNING: Core table is empty!`);
        }
      }
    }

    // STEP 5: Generate recommendations
    console.log('\n💡 STEP 5: Generating recommendations...');
    
    if (auditResults.schemaIssues.length > 0) {
      auditResults.recommendations.push('Remove legacy accountId/contactId fields from database');
      auditResults.recommendations.push('Remove data duplication in pipeline tables');
    }
    
    if (auditResults.databaseIssues.length > 0) {
      auditResults.recommendations.push('Create people and companies from pipeline data');
      auditResults.recommendations.push('Link pipeline records to core people/companies');
    }
    
    // STEP 6: Summary
    console.log('\n📋 AUDIT SUMMARY');
    console.log('================');
    console.log(`Schema Issues: ${auditResults.schemaIssues.length}`);
    console.log(`Database Issues: ${auditResults.databaseIssues.length}`);
    console.log(`Recommendations: ${auditResults.recommendations.length}`);
    
    if (auditResults.schemaIssues.length > 0) {
      console.log('\n❌ SCHEMA ISSUES:');
      auditResults.schemaIssues.forEach(issue => {
        console.log(`  - ${issue.table}: ${issue.issue}`);
      });
    }
    
    if (auditResults.databaseIssues.length > 0) {
      console.log('\n⚠️  DATABASE ISSUES:');
      auditResults.databaseIssues.forEach(issue => {
        console.log(`  - ${issue.table}: ${issue.issue}`);
      });
    }
    
    if (auditResults.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      auditResults.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }

    return auditResults;

  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveSchemaAudit()
  .then((results) => {
    console.log('\n🎉 Schema audit completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the issues and recommendations above');
    console.log('2. Run the appropriate migration scripts');
    console.log('3. Verify data integrity after migration');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Schema audit failed:', error);
    process.exit(1);
  });
