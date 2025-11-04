#!/usr/bin/env node

/**
 * Apply missing Stacks columns directly to database
 * This bypasses the migration system and applies only the critical columns
 * needed for Stacks to work properly.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyStacksColumns() {
  console.log('🔧 Applying missing Stacks columns to database...\n');

  try {
    // Apply the critical StacksStory columns
    console.log('1. Adding columns to StacksStory table...');
    
    const stacksStoryColumns = [
      { name: 'viewType', type: 'VARCHAR(20)' },
      { name: 'product', type: 'VARCHAR(50)' },
      { name: 'section', type: 'VARCHAR(50)' },
      { name: 'statusChangedAt', type: 'TIMESTAMP' }
    ];

    for (const column of stacksStoryColumns) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "StacksStory" 
          ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type}
        `);
        console.log(`   ✅ Added ${column.name} column`);
      } catch (error) {
        if (error.message?.includes('already exists') || error.code === '42701') {
          console.log(`   ✓ ${column.name} column already exists`);
        } else {
          console.log(`   ⚠️  ${column.name}: ${error.message}`);
        }
      }
    }

    // Apply StacksTask columns
    console.log('\n2. Adding columns to StacksTask table...');
    
    const stacksTaskColumns = [
      { name: 'product', type: 'VARCHAR(50)' },
      { name: 'section', type: 'VARCHAR(50)' }
    ];

    for (const column of stacksTaskColumns) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "StacksTask" 
          ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type}
        `);
        console.log(`   ✅ Added ${column.name} column`);
      } catch (error) {
        if (error.message?.includes('already exists') || error.code === '42701') {
          console.log(`   ✓ ${column.name} column already exists`);
        } else {
          console.log(`   ⚠️  ${column.name}: ${error.message}`);
        }
      }
    }

    // Check if StacksEpoch table exists
    console.log('\n3. Checking StacksEpoch table...');
    try {
      const epochTableCheck = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'StacksEpoch'
        )
      `);
      
      const tableExists = epochTableCheck[0]?.exists;
      if (tableExists) {
        console.log('   ✓ StacksEpoch table exists');
      } else {
        console.log('   ⚠️  StacksEpoch table does not exist (may need full migration)');
      }
    } catch (error) {
      console.log(`   ⚠️  Could not check StacksEpoch: ${error.message}`);
    }

    console.log('\n✅ Stacks columns application complete!');
    console.log('   Try creating a story again in the Workstream interface.');

  } catch (error) {
    console.error('\n❌ Error applying columns:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyStacksColumns();

