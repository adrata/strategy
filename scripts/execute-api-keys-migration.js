#!/usr/bin/env node

/**
 * Execute API Keys Table Migration
 * Creates the api_keys table in the database
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function executeMigration() {
  try {
    console.log('🚀 Executing API Keys migration...\n');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', 'add_api_keys.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Read migration SQL file\n');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    // Execute the SQL - split by semicolons and execute individually
    console.log('🔨 Executing SQL migration...\n');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message?.includes('already exists') || error.code === '42P07' || error.code === 'P2010') {
            console.log(`ℹ️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_keys'
      );
    `;
    
    if (tableExists[0]?.exists) {
      console.log('✅ Verified: api_keys table exists\n');
    } else {
      console.error('❌ Warning: api_keys table not found after migration\n');
    }
    
    // Check indexes
    const indexes = await prisma.$queryRaw`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'api_keys';
    `;
    
    console.log(`📊 Found ${indexes.length} indexes on api_keys table:`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Check if table already exists (not a fatal error)
    if (error.message?.includes('already exists') || error.code === '42P07') {
      console.log('ℹ️  Table may already exist. This is not a fatal error.\n');
      
      // Try to verify table exists
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "api_keys" LIMIT 1`;
        console.log('✅ Table exists and is accessible\n');
      } catch (verifyError) {
        console.error('❌ Table exists but is not accessible:', verifyError.message);
        process.exit(1);
      }
    } else {
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database connection closed');
  }
}

executeMigration();

