#!/usr/bin/env node

/**
 * 🔧 SAFE DATABASE SCHEMA UPDATE
 * 
 * This script safely adds new columns to the companies table
 * without deleting any existing data
 */

const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function updateCompaniesSchema() {
  console.log('🔧 SAFE DATABASE SCHEMA UPDATE');
  console.log('==============================\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Check current schema
    console.log('📊 Checking current companies table schema...');
    const currentSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `;
    
    console.log('Current columns:');
    currentSchema.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Define new columns to add
    const newColumns = [
      { name: 'size', type: 'VARCHAR(50)', nullable: true },
      { name: 'revenue', type: 'BIGINT', nullable: true },
      { name: 'phone', type: 'VARCHAR(50)', nullable: true },
      { name: 'founded_year', type: 'INTEGER', nullable: true },
      { name: 'market', type: 'VARCHAR(100)', nullable: true },
      { name: 'category', type: 'VARCHAR(100)', nullable: true },
      { name: 'segment', type: 'VARCHAR(100)', nullable: true },
      { name: 'coresignal_data', type: 'JSONB', nullable: true },
      { name: 'last_enriched_at', type: 'TIMESTAMP', nullable: true },
      { name: 'enrichment_source', type: 'VARCHAR(100)', nullable: true }
    ];

    console.log('\n🔍 Checking which columns need to be added...');
    
    const existingColumns = currentSchema.map(col => col.column_name);
    const columnsToAdd = newColumns.filter(col => !existingColumns.includes(col.name));

    if (columnsToAdd.length === 0) {
      console.log('✅ All columns already exist!');
      return;
    }

    console.log(`📋 Columns to add: ${columnsToAdd.length}`);
    columnsToAdd.forEach(col => {
      console.log(`   - ${col.name}: ${col.type}`);
    });

    // Add columns safely
    console.log('\n🔧 Adding new columns...');
    
    for (const column of columnsToAdd) {
      try {
        const sql = `ALTER TABLE companies ADD COLUMN ${column.name} ${column.type}`;
        console.log(`   Adding ${column.name}...`);
        
        await prisma.$executeRawUnsafe(sql);
        console.log(`   ✅ ${column.name} added successfully`);
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  ${column.name} already exists, skipping`);
        } else {
          console.error(`   ❌ Failed to add ${column.name}: ${error.message}`);
        }
      }
    }

    // Verify final schema
    console.log('\n📊 Verifying final schema...');
    const finalSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `;
    
    console.log('Final columns:');
    finalSchema.forEach(col => {
      const isNew = columnsToAdd.some(newCol => newCol.name === col.column_name);
      const marker = isNew ? '🆕' : '  ';
      console.log(`   ${marker} ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('\n✅ Database schema update completed successfully!');
    console.log('🔒 All existing data preserved');

  } catch (error) {
    console.error('❌ Schema update failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the schema update
updateCompaniesSchema().catch(console.error);
