#!/usr/bin/env tsx

/**
 * Safely run calendar tables migration - executes SQL statements properly
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
  
  // Split SQL into statements, handling functions and multi-line statements
  const statements: string[] = [];
  let currentStatement = '';
  let inFunction = false;
  let dollarQuote = '';
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (trimmed.startsWith('--') || trimmed === '') {
      continue;
    }
    
    currentStatement += line + '\n';
    
    // Detect start of function (CREATE FUNCTION or CREATE OR REPLACE FUNCTION)
    if (trimmed.match(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i)) {
      inFunction = true;
      // Extract dollar quote delimiter ($$ or $tag$)
      const match = trimmed.match(/\$\w*\$/);
      if (match) {
        dollarQuote = match[0];
      } else {
        // Look for $$ in next lines
        const nextLines = lines.slice(lines.indexOf(line) + 1);
        for (const nextLine of nextLines) {
          const nextMatch = nextLine.match(/\$\w*\$/);
          if (nextMatch) {
            dollarQuote = nextMatch[0];
            break;
          }
        }
      }
    }
    
    // Detect end of function
    if (inFunction && trimmed.includes(dollarQuote) && trimmed.includes('LANGUAGE')) {
      inFunction = false;
      dollarQuote = '';
      statements.push(currentStatement.trim());
      currentStatement = '';
      continue;
    }
    
    // Detect end of statement (semicolon not inside function)
    if (!inFunction && trimmed.endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  console.log(`📝 Executing ${statements.length} SQL statements...\n`);
  
  let executed = 0;
  let skipped = 0;
  let errors = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement || statement.startsWith('--')) continue;
    
    try {
      await prisma.$executeRawUnsafe(statement);
      executed++;
      
      // Log what was created
      if (statement.includes('CREATE TABLE')) {
        const tableMatch = statement.match(/CREATE TABLE.*?(\w+)/i);
        console.log(`✅ Created table: ${tableMatch?.[1] || 'unknown'}`);
      } else if (statement.includes('CREATE INDEX')) {
        const indexMatch = statement.match(/CREATE INDEX.*?(\w+)/i);
        console.log(`✅ Created index: ${indexMatch?.[1] || 'unknown'}`);
      } else if (statement.includes('CREATE FUNCTION')) {
        const funcMatch = statement.match(/CREATE.*?FUNCTION\s+(\w+)/i);
        console.log(`✅ Created function: ${funcMatch?.[1] || 'unknown'}`);
      } else if (statement.includes('CREATE TRIGGER')) {
        const triggerMatch = statement.match(/CREATE TRIGGER\s+(\w+)/i);
        console.log(`✅ Created trigger: ${triggerMatch?.[1] || 'unknown'}`);
      }
    } catch (error: any) {
      // Ignore "already exists" errors
      if (error.message?.includes('already exists') || 
          error.message?.includes('duplicate') ||
          error.code === '42P07' || // duplicate_table
          error.code === '42710') { // duplicate_object
        skipped++;
        console.log(`⏭️  Skipped (already exists): ${statement.substring(0, 60)}...`);
        continue;
      }
      
      errors++;
      console.error(`❌ Error executing statement ${i + 1}:`, error.message);
      console.error(`   Code: ${error.code}`);
      console.error(`   Statement preview: ${statement.substring(0, 100)}...`);
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Statements executed: ${executed}`);
  console.log(`   Statements skipped: ${skipped}`);
  console.log(`   Errors: ${errors}\n`);
  
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
  
  if (calendarExistsAfter[0]?.exists && eventsExistsAfter[0]?.exists) {
    console.log('🎉 Migration completed successfully!\n');
  } else {
    console.log('⚠️  Some tables may be missing. Check errors above.\n');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
