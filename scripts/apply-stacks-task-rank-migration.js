/**
 * Apply StacksTask rank migration directly
 * Adds rank column and index to StacksTask table
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🚀 Applying StacksTask rank migration...\n');

  try {
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20251105000001_add_stacks_task_rank.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Read migration SQL file\n');

    // Split SQL into individual statements
    // Remove comments first, then split
    let cleanedSql = sql
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('--');
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex).trim();
        }
        return line.trim();
      })
      .join('\n');
    
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement.trim());
          console.log('  ✅ Executed:', statement.substring(0, 60).replace(/\n/g, ' '));
        } catch (error) {
          // IF NOT EXISTS should prevent errors, but handle gracefully
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('duplicate') ||
            error.code === '42P07' ||
            error.code === '42710' ||
            error.code === 'P2010'
          ) {
            console.log('  ℹ️  Skipped (already exists):', statement.substring(0, 60).replace(/\n/g, ' '));
          } else {
            console.error('  ❌ Error executing statement:', error.message);
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Migration executed successfully!\n');

    // Verify the column exists
    console.log('🔍 Verifying migration...');
    const columnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'StacksTask' 
        AND column_name = 'rank'
      );
    `;

    if (columnExists[0]?.exists) {
      console.log('✅ rank column exists in StacksTask table');
    } else {
      console.error('❌ rank column NOT found in StacksTask table');
      process.exit(1);
    }

    // Verify the index exists
    const indexExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'StacksTask' 
        AND indexname = 'StacksTask_projectId_rank_idx'
      );
    `;

    if (indexExists[0]?.exists) {
      console.log('✅ Index StacksTask_projectId_rank_idx exists');
    } else {
      console.error('❌ Index StacksTask_projectId_rank_idx NOT found');
      process.exit(1);
    }

    console.log('\n✅ Migration verification complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

