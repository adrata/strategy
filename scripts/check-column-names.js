#!/usr/bin/env node

/**
 * 🔍 CHECK COLUMN NAMES
 * 
 * Checks the actual column names in the SBI database
 */

const { PrismaClient } = require('@prisma/client');

// SBI Database connection
const SBI_DATABASE_URL = 'postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sbiPrisma = new PrismaClient({
  datasources: {
    db: {
      url: SBI_DATABASE_URL
    }
  }
});

async function checkColumnNames() {
  try {
    console.log('🔍 Checking actual column names...\n');
    
    await sbiPrisma.$connect();
    console.log('✅ Connected to SBI database!\n');

    // 1. Check companies table columns
    console.log('🏢 COMPANIES TABLE COLUMNS:');
    const companiesColumns = await sbiPrisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `;
    
    companiesColumns.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 2. Check people table columns
    console.log('\n👥 PEOPLE TABLE COLUMNS:');
    const peopleColumns = await sbiPrisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'people' 
      ORDER BY ordinal_position;
    `;
    
    peopleColumns.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 3. Get a sample record from companies to see the actual structure
    console.log('\n🏢 SAMPLE COMPANIES RECORD:');
    try {
      const sampleCompany = await sbiPrisma.$queryRaw`
        SELECT * FROM companies LIMIT 1;
      `;
      
      if (sampleCompany.length > 0) {
        console.log('   Sample company record:');
        Object.entries(sampleCompany[0]).forEach(([key, value]) => {
          if (value !== null) {
            console.log(`     ${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`);
          }
        });
      }
    } catch (error) {
      console.log(`   Error getting sample company: ${error.message}`);
    }

    // 4. Get a sample record from people to see the actual structure
    console.log('\n👥 SAMPLE PEOPLE RECORD:');
    try {
      const samplePerson = await sbiPrisma.$queryRaw`
        SELECT * FROM people LIMIT 1;
      `;
      
      if (samplePerson.length > 0) {
        console.log('   Sample person record:');
        Object.entries(samplePerson[0]).forEach(([key, value]) => {
          if (value !== null) {
            console.log(`     ${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`);
          }
        });
      }
    } catch (error) {
      console.log(`   Error getting sample person: ${error.message}`);
    }

    console.log('\n✅ Column names check completed!');

  } catch (error) {
    console.error('❌ Error during column names check:', error);
  } finally {
    await sbiPrisma.$disconnect();
  }
}

// Run the check
checkColumnNames();
