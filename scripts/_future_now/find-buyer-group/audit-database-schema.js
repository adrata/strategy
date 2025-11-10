const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== DATABASE SCHEMA AUDIT ===\n');
    
    // 1. Check enum types
    console.log('1. ENUM TYPES:');
    const enums = await prisma.$queryRaw`
      SELECT t.typname as enum_name, e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname IN ('CompanyStatus', 'CompanyPriority', 'company_status', 'company_priority', 'status', 'priority')
      ORDER BY t.typname, e.enumsortorder
    `;
    
    if (enums.length > 0) {
      const grouped = {};
      enums.forEach(e => {
        if (!grouped[e.enum_name]) grouped[e.enum_name] = [];
        grouped[e.enum_name].push(e.enum_value);
      });
      Object.keys(grouped).forEach(name => {
        console.log(`  ${name}: [${grouped[name].join(', ')}]`);
      });
    } else {
      console.log('  No matching enum types found');
    }
    
    // 2. Check actual column types for status and priority
    console.log('\n2. STATUS & PRIORITY COLUMN DETAILS:');
    const colDetails = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name, column_default
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      AND column_name IN ('status', 'priority')
    `;
    colDetails.forEach(col => {
      console.log(`  ${col.column_name}:`);
      console.log(`    data_type: ${col.data_type}`);
      console.log(`    udt_name: ${col.udt_name}`);
      console.log(`    default: ${col.column_default || 'NULL'}`);
    });
    
    // 3. Check what values are actually in the database
    console.log('\n3. ACTUAL VALUES IN DATABASE:');
    const sample = await prisma.$queryRaw`
      SELECT DISTINCT status, priority 
      FROM companies 
      WHERE status IS NOT NULL OR priority IS NOT NULL
      LIMIT 10
    `;
    console.log('  Sample status/priority values:');
    sample.forEach(s => {
      console.log(`    status: ${s.status}, priority: ${s.priority}`);
    });
    
    // 4. Test a simple insert to see what works
    console.log('\n4. TESTING INSERT SYNTAX:');
    const testId = 'TEST' + Date.now();
    
    // Try with enum casting
    try {
      await prisma.$executeRaw`
        INSERT INTO companies (id, "workspaceId", name, status, priority, "createdAt", "updatedAt")
        VALUES (${testId}, '01K9QAP09FHT6EAP1B4G2KP3D2', 'Test Company', 'ACTIVE'::text, 'MEDIUM'::text, NOW(), NOW())
      `;
      console.log('  ✅ Insert with ::text casting works');
      await prisma.$executeRaw`DELETE FROM companies WHERE id = ${testId}`;
    } catch (e) {
      console.log(`  ❌ ::text casting failed: ${e.message.substring(0, 100)}`);
    }
    
    // Try without enum values
    try {
      await prisma.$executeRaw`
        INSERT INTO companies (id, "workspaceId", name, "createdAt", "updatedAt")
        VALUES (${testId}, '01K9QAP09FHT6EAP1B4G2KP3D2', 'Test Company 2', NOW(), NOW())
      `;
      console.log('  ✅ Insert without status/priority works');
      await prisma.$executeRaw`DELETE FROM companies WHERE id = ${testId}`;
    } catch (e) {
      console.log(`  ❌ Insert without enums failed: ${e.message.substring(0, 100)}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
})();

