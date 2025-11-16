/**
 * Apply Leads & People Performance Indexes - Direct SQL Execution
 * Executes the entire SQL file as one transaction
 */

import { prisma } from '../src/platform/database/prisma-client';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyIndexes() {
  console.log('🚀 Applying leads & people performance indexes...\n');

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'sql', 'apply_leads_people_indexes.sql');
    let sql = readFileSync(sqlPath, 'utf-8');

    // Remove COMMENT statements (they can cause issues)
    sql = sql.replace(/COMMENT ON INDEX[^;]+;/gi, '');

    // Remove empty lines and normalize
    sql = sql
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('--'))
      .join('\n');

    console.log('📝 Executing SQL statements...\n');

    // Execute the entire SQL file as one transaction
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('✅ All indexes created successfully!\n');
    } catch (error: any) {
      // If transaction fails, try executing statements individually
      console.log('⚠️  Batch execution failed, trying individual statements...\n');
      
      const statements = sql.split(';').filter(s => s.trim().length > 0);
      
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (!trimmed || trimmed.startsWith('--')) continue;

        const indexMatch = trimmed.match(/CREATE INDEX.*?"([^"]+)"/i);
        const indexName = indexMatch ? indexMatch[1] : 'Unknown';

        try {
          await prisma.$executeRawUnsafe(trimmed + ';');
          console.log(`✅ ${indexName}`);
        } catch (err: any) {
          if (err.message?.includes('already exists') || err.code === '42P07' || err.code === '42501') {
            console.log(`ℹ️  ${indexName} (already exists or permission issue)`);
          } else {
            console.error(`❌ ${indexName}: ${err.message}`);
          }
        }
      }
    }

    // Verify indexes
    console.log('\n📊 Verifying indexes...\n');
    const indexes = await prisma.$queryRawUnsafe<Array<{ indexname: string; tablename: string }>>(`
      SELECT indexname, tablename
      FROM pg_indexes 
      WHERE tablename IN ('people', 'actions', 'companies', 'core_people', 'users')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);

    const expectedIndexes = [
      'idx_people_workspace_status_fullname',
      'idx_people_workspace_seller_status_fullname',
      'idx_people_workspace_status_fullname_nulls',
      'idx_people_workspace_status_globalrank',
      'idx_people_workspace_status_createdat',
      'idx_people_workspace_status_lastactiondate',
      'idx_people_workspace_email',
      'idx_people_workspace_workemail',
      'idx_actions_personid_deleted_status_completed',
      'idx_actions_personid_completedat_desc',
      'idx_companies_workspace_name',
      'idx_companies_id_workspace',
      'idx_core_people_id_normalized',
      'idx_core_people_email',
      'idx_users_id_name_email'
    ];

    const foundIndexes = indexes.map(idx => idx.indexname);
    const missingIndexes = expectedIndexes.filter(idx => !foundIndexes.includes(idx));

    console.log(`✅ Found ${indexes.length} indexes total`);
    
    if (missingIndexes.length > 0) {
      console.log(`\n⚠️  Missing ${missingIndexes.length} indexes (may need admin permissions):`);
      missingIndexes.forEach(idx => console.log(`   - ${idx}`));
      console.log('\n💡 To create these indexes, run the SQL file directly in your database client');
      console.log('   (Neon Console, pgAdmin, or DBeaver) with a user that has CREATE INDEX permissions.\n');
    } else {
      console.log('\n🎉 All performance indexes are in place!\n');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 The database user may not have CREATE INDEX permissions.');
      console.error('   Please run sql/apply_leads_people_indexes.sql directly in your database client.\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes();
