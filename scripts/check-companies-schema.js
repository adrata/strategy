#!/usr/bin/env node

/**
 * 🔍 CHECK COMPANIES SCHEMA
 * 
 * This script checks what fields are available in the companies table
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompaniesSchema() {
  console.log('🔍 CHECKING COMPANIES TABLE SCHEMA');
  console.log('===================================\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get all columns from companies table
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `;

    console.log('📊 COMPANIES TABLE COLUMNS:');
    console.log('===========================\n');
    
    columns.forEach((col, index) => {
      const nullable = col.is_nullable === 'YES' ? 'nullable' : 'not null';
      const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${col.column_name.padEnd(25, ' ')} | ${col.data_type.padEnd(20, ' ')} | ${nullable}${defaultVal}`);
    });

    console.log(`\n📈 TOTAL COLUMNS: ${columns.length}`);

    // Check for our new enrichment fields
    const enrichmentFields = ['founded_year', 'market', 'category', 'segment', 'coresignal_data', 'last_enriched_at', 'enrichment_source'];
    
    console.log('\n🔍 ENRICHMENT FIELDS STATUS:');
    console.log('============================\n');
    
    enrichmentFields.forEach(field => {
      const column = columns.find(col => col.column_name === field);
      if (column) {
        console.log(`✅ ${field}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      } else {
        console.log(`❌ ${field}: NOT FOUND`);
      }
    });

    // Check for existing fields that we can use
    const existingFields = ['description', 'size', 'revenue', 'city', 'state', 'country', 'phone', 'website', 'industry', 'sector'];
    
    console.log('\n🔍 EXISTING FIELDS WE CAN USE:');
    console.log('==============================\n');
    
    existingFields.forEach(field => {
      const column = columns.find(col => col.column_name === field);
      if (column) {
        console.log(`✅ ${field}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      } else {
        console.log(`❌ ${field}: NOT FOUND`);
      }
    });

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkCompaniesSchema().catch(console.error);
