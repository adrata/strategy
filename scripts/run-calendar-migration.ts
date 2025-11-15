#!/usr/bin/env tsx

/**
 * Safely run calendar tables migration
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🔧 Running Calendar Tables Migration\n');
  console.log('='.repeat(70));
  
  // Read SQL migration file
  const migrationPath = path.join(process.cwd(), 'prisma', 'migrations', 'add_calendar_tables.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    await prisma.$disconnect();
    return;
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('📄 Migration file found');
  console.log(`   Path: ${migrationPath}`);
  console.log(`   Size: ${sql.length} bytes\n`);
  
  // Check if tables already exist
  console.log('🔍 Checking if tables already exist...');
  
  const calendarExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'calendar'
    ) as exists
  `;
  
  const eventsExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'events'
    ) as exists
  `;
  
  const calendarTableExists = calendarExists[0]?.exists || false;
  const eventsTableExists = eventsExists[0]?.exists || false;
  
  console.log(`   Calendar table: ${calendarTableExists ? '✅ Exists' : '❌ Missing'}`);
  console.log(`   Events table: ${eventsTableExists ? '✅ Exists' : '❌ Missing'}\n`);
  
  if (calendarTableExists && eventsTableExists) {
    console.log('✅ Tables already exist. Migration not needed.\n');
    await prisma.$disconnect();
    return;
  }
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📝 Executing ${statements.length} SQL statements...\n`);
  
  let executed = 0;
  let errors = 0;
  
  for (const statement of statements) {
    try {
      // Skip IF NOT EXISTS checks if table already exists
      if (statement.includes('CREATE TABLE IF NOT EXISTS calendar') && calendarTableExists) {
        console.log('⏭️  Skipping calendar table creation (already exists)');
        continue;
      }
      
      if (statement.includes('CREATE TABLE IF NOT EXISTS events') && eventsTableExists) {
        console.log('⏭️  Skipping events table creation (already exists)');
        continue;
      }
      
      await prisma.$executeRawUnsafe(statement);
      executed++;
      
      if (statement.includes('CREATE TABLE')) {
        console.log(`✅ Created table: ${statement.match(/CREATE TABLE.*?(\w+)/)?.[1] || 'unknown'}`);
      } else if (statement.includes('CREATE INDEX')) {
        console.log(`✅ Created index: ${statement.match(/CREATE INDEX.*?(\w+)/)?.[1] || 'unknown'}`);
      } else if (statement.includes('CREATE FUNCTION')) {
        console.log(`✅ Created function: ${statement.match(/CREATE.*?FUNCTION.*?(\w+)/)?.[1] || 'unknown'}`);
      } else if (statement.includes('CREATE TRIGGER')) {
        console.log(`✅ Created trigger: ${statement.match(/CREATE TRIGGER.*?(\w+)/)?.[1] || 'unknown'}`);
      }
    } catch (error: any) {
      // Ignore "already exists" errors
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log(`⏭️  Skipped (already exists): ${statement.substring(0, 50)}...`);
        continue;
      }
      
      errors++;
      console.error(`❌ Error executing statement:`, error.message);
      console.error(`   Statement: ${statement.substring(0, 100)}...`);
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Statements executed: ${executed}`);
  console.log(`   Errors: ${errors}`);
  
  if (errors === 0) {
    console.log(`\n✅ Migration completed successfully!\n`);
  } else {
    console.log(`\n⚠️  Migration completed with ${errors} error(s)\n`);
  }
  
  // Verify tables exist
  const calendarExistsAfter = await prisma.$queryRaw<Array<{exists: boolean}>>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'calendar'
    ) as exists
  `;
  
  const eventsExistsAfter = await prisma.$queryRaw<Array<{exists: boolean}>>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'events'
    ) as exists
  `;
  
  console.log('🔍 Verification:');
  console.log(`   Calendar table: ${calendarExistsAfter[0]?.exists ? '✅ Exists' : '❌ Missing'}`);
  console.log(`   Events table: ${eventsExistsAfter[0]?.exists ? '✅ Exists' : '❌ Missing'}\n`);
  
  await prisma.$disconnect();
}

main().catch(console.error);

