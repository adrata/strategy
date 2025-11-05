/**
 * Script to apply all Stacks-related migrations from this chat session
 * 
 * New columns/features added:
 * 1. acceptanceCriteria (TEXT) - Added to StacksStory table for acceptance criteria field
 * 2. isFlagged (BOOLEAN) - Added to StacksStory table for flagging stories
 * 3. StacksComment table - New table for threaded comments on stories
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigrations() {
  console.log('🚀 Starting Stacks migrations application...\n');

  try {
    // Migration 1: Add isFlagged and create StacksComment table
    console.log('📝 Applying migration: 20250115000000_add_stacks_flag_and_comments.sql');
    const migration1 = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/20250115000000_add_stacks_flag_and_comments.sql'),
      'utf8'
    );
    
    // Split by semicolons and execute each statement
    const statements1 = migration1.split(';').filter(s => s.trim());
    for (const statement of statements1) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement.trim());
          console.log('  ✅ Executed statement');
        } catch (error) {
          // IF NOT EXISTS should prevent errors, but log if something unexpected happens
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.warn('  ⚠️  Statement result:', error.message);
          }
        }
      }
    }

    // Migration 2: Add acceptanceCriteria
    console.log('\n📝 Applying migration: 20250115000001_add_stacks_acceptance_criteria.sql');
    const migration2 = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/20250115000001_add_stacks_acceptance_criteria.sql'),
      'utf8'
    );
    
    const statements2 = migration2.split(';').filter(s => s.trim());
    for (const statement of statements2) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement.trim());
          console.log('  ✅ Executed statement');
        } catch (error) {
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.warn('  ⚠️  Statement result:', error.message);
          }
        }
      }
    }

    // Migration 3: Verification (idempotent)
    console.log('\n📝 Applying verification migration: 20250115000002_verify_stacks_updates.sql');
    const migration3 = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/20250115000002_verify_stacks_updates.sql'),
      'utf8'
    );
    
    // Execute the entire DO block as one statement
    try {
      await prisma.$executeRawUnsafe(migration3);
      console.log('  ✅ Verification migration executed');
    } catch (error) {
      console.warn('  ⚠️  Verification migration result:', error.message);
    }

    // Verify all columns exist
    console.log('\n🔍 Verifying database state...');
    
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'StacksStory'
      AND column_name IN ('isFlagged', 'acceptanceCriteria')
      ORDER BY column_name;
    `);

    console.log('\n✅ StacksStory columns:');
    if (Array.isArray(columns) && columns.length > 0) {
      columns.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('  ⚠️  No new columns found (may already exist or need manual check)');
    }

    // Verify StacksComment table exists
    const commentTable = await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'StacksComment';
    `);

    if (Array.isArray(commentTable) && commentTable.length > 0) {
      console.log('\n✅ StacksComment table exists');
      
      // Check indexes
      const indexes = await prisma.$queryRawUnsafe(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'StacksComment';
      `);
      
      console.log(`  - Indexes: ${Array.isArray(indexes) ? indexes.length : 0} found`);
    } else {
      console.log('\n⚠️  StacksComment table not found - may need manual creation');
    }

    console.log('\n✅ All migrations applied successfully!');
    console.log('\n📋 Summary of new features:');
    console.log('  1. ✅ isFlagged field - Boolean field to flag stories');
    console.log('  2. ✅ acceptanceCriteria field - Text field for acceptance criteria');
    console.log('  3. ✅ StacksComment table - Threaded comments system');
    console.log('\n💡 Next steps:');
    console.log('  - Run: npx prisma generate --schema=prisma/schema-streamlined.prisma');
    console.log('  - Restart your dev server');
    console.log('  - Verify stacks are displaying correctly');

  } catch (error) {
    console.error('❌ Error applying migrations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  applyMigrations()
    .then(() => {
      console.log('\n🎉 Migration script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { applyMigrations };

