#!/usr/bin/env node

/**
 * Script to apply the Stacks Story Rank migration
 * 
 * This migration adds:
 * - rank field (INTEGER) to StacksStory table for backlog ordering
 * - index on (projectId, rank) for efficient ordering queries
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🚀 Starting Stacks Rank migration application...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '../prisma/migrations/20251105000000_add_stacks_story_rank.sql'
    );
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    console.log('📝 Reading migration file...');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and execute each statement
    // Remove comments first, then split by semicolons
    const cleanedSQL = migrationSQL
      .split('\n')
      .map(line => {
        // Remove inline comments (-- style)
        const commentIndex = line.indexOf('--');
        return commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line.trim();
      })
      .filter(line => line.length > 0)
      .join('\n');
    
    const statements = cleanedSQL
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
        AND table_name = 'StacksStory' 
        AND column_name = 'rank'
      );
    `;

    if (columnExists[0]?.exists) {
      console.log('✅ rank column exists in StacksStory table');
    } else {
      console.error('❌ rank column NOT found in StacksStory table');
      process.exit(1);
    }

    // Verify the index exists
    const indexExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'StacksStory' 
        AND indexname = 'StacksStory_projectId_rank_idx'
      );
    `;

    if (indexExists[0]?.exists) {
      console.log('✅ Index StacksStory_projectId_rank_idx exists');
    } else {
      console.error('❌ Index StacksStory_projectId_rank_idx NOT found');
      process.exit(1);
    }

    // Check current rank values
    const rankCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as total, COUNT(rank)::int as with_rank
      FROM "StacksStory";
    `;

    const total = Number(rankCount[0]?.total || 0);
    const withRank = Number(rankCount[0]?.with_rank || 0);

    console.log(`\n📊 Current StacksStory records:`);
    console.log(`   Total: ${total}`);
    console.log(`   With rank: ${withRank}`);
    console.log(`   Without rank: ${total - withRank}`);

    console.log('\n✅ Migration verification complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npx prisma generate --schema=prisma/schema-streamlined.prisma');
    console.log('   2. Restart your dev server');
    console.log('   3. Test drag-and-drop reordering in the backlog');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

