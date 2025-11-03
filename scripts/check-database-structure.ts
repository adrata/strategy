/**
 * Check database structure for Stacks tables
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure for Stacks tables...\n');

  try {
    // Get table structure
    const tableInfo = await prisma.$queryRaw<Array<{
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>>`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name IN ('StacksEpic', 'StacksEpoch', 'StacksStory', 'StacksProject')
      ORDER BY table_name, ordinal_position
    `;

    const tables: Record<string, any[]> = {};
    tableInfo.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES'
      });
    });

    console.log('📊 Database Tables Structure:\n');
    Object.keys(tables).forEach(tableName => {
      console.log(`Table: ${tableName}`);
      tables[tableName].forEach(col => {
        console.log(`  - ${col.column}: ${col.type} ${col.nullable ? '(nullable)' : '(required)'}`);
      });
      console.log('');
    });

    // Check if StacksEpoch table exists separately
    const hasEpochTable = tables['StacksEpoch'] !== undefined;
    const hasEpicTable = tables['StacksEpic'] !== undefined;

    console.log('📋 Summary:');
    console.log(`  StacksEpic table exists: ${hasEpicTable}`);
    console.log(`  StacksEpoch table exists: ${hasEpochTable}`);
    
    if (hasEpicTable && !hasEpochTable) {
      console.log('\n  ✅ Database has StacksEpic table (as expected)');
      console.log('  ℹ️  Schema maps StacksEpoch model to StacksEpic table');
    } else if (hasEpochTable && hasEpicTable) {
      console.log('\n  ✅ Both StacksEpic and StacksEpoch tables exist');
    } else if (hasEpochTable && !hasEpicTable) {
      console.log('\n  ✅ Database has StacksEpoch table');
      console.log('  ⚠️  Migration renamed StacksEpic to StacksEpoch');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStructure();

