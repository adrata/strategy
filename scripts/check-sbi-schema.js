#!/usr/bin/env node

/**
 * 🔍 SBI SCHEMA CHECKER
 * 
 * Checks the actual schema of the SBI database
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

async function checkSbiSchema() {
  try {
    console.log('🔍 Checking SBI database schema...\n');
    
    await sbiPrisma.$connect();
    console.log('✅ Connected to SBI database!\n');

    // 1. Check companies table schema
    console.log('🏢 COMPANIES TABLE SCHEMA:');
    const companiesColumns = await sbiPrisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `;
    
    console.log('   Companies columns:');
    companiesColumns.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 2. Check people table schema
    console.log('\n👥 PEOPLE TABLE SCHEMA:');
    const peopleColumns = await sbiPrisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'people' 
      ORDER BY ordinal_position;
    `;
    
    console.log('   People columns:');
    peopleColumns.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 3. Get sample data from people table
    console.log('\n👥 SAMPLE PEOPLE DATA:');
    try {
      const samplePeople = await sbiPrisma.$queryRaw`
        SELECT * FROM people LIMIT 3;
      `;
      
      console.log('   Sample people records:');
      samplePeople.forEach((person, index) => {
        console.log(`     Person ${index + 1}:`);
        Object.entries(person).forEach(([key, value]) => {
          if (value !== null) {
            console.log(`       ${key}: ${value}`);
          }
        });
        console.log('');
      });
    } catch (error) {
      console.log(`   Error getting sample people: ${error.message}`);
    }

    // 4. Get sample data from companies table
    console.log('\n🏢 SAMPLE COMPANIES DATA:');
    try {
      const sampleCompanies = await sbiPrisma.$queryRaw`
        SELECT * FROM companies LIMIT 3;
      `;
      
      console.log('   Sample companies records:');
      sampleCompanies.forEach((company, index) => {
        console.log(`     Company ${index + 1}:`);
        Object.entries(company).forEach(([key, value]) => {
          if (value !== null && key !== 'customFields') {
            console.log(`       ${key}: ${value}`);
          }
        });
        if (company.customFields) {
          console.log(`       customFields: ${JSON.stringify(company.customFields, null, 2)}`);
        }
        console.log('');
      });
    } catch (error) {
      console.log(`   Error getting sample companies: ${error.message}`);
    }

    // 5. Check for SBI-specific data
    console.log('\n🔍 SBI-SPECIFIC DATA:');
    
    // Check for companies with SBI data
    try {
      const sbiCompanies = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM companies 
        WHERE customFields::text LIKE '%sbi%' 
        OR customFields::text LIKE '%SBI%'
        OR customFields::text LIKE '%bulk%'
        OR customFields::text LIKE '%analysis%';
      `;
      
      console.log(`   Companies with SBI-related custom fields: ${sbiCompanies[0].count}`);
    } catch (error) {
      console.log(`   Error checking SBI companies: ${error.message}`);
    }

    // Check for people with SBI data
    try {
      const sbiPeople = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM people 
        WHERE customFields::text LIKE '%sbi%' 
        OR customFields::text LIKE '%SBI%'
        OR customFields::text LIKE '%bulk%'
        OR customFields::text LIKE '%analysis%';
      `;
      
      console.log(`   People with SBI-related custom fields: ${sbiPeople[0].count}`);
    } catch (error) {
      console.log(`   Error checking SBI people: ${error.message}`);
    }

    // 6. Check for enriched data patterns
    console.log('\n📊 ENRICHED DATA PATTERNS:');
    
    // Check for CoreSignal data
    try {
      const coreSignalCompanies = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM companies 
        WHERE customFields::text LIKE '%coreSignal%';
      `;
      
      console.log(`   Companies with CoreSignal data: ${coreSignalCompanies[0].count}`);
    } catch (error) {
      console.log(`   Error checking CoreSignal data: ${error.message}`);
    }

    // Check for retail intelligence data
    try {
      const retailIntelligenceCompanies = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM companies 
        WHERE customFields::text LIKE '%retailIntelligence%';
      `;
      
      console.log(`   Companies with retail intelligence: ${retailIntelligenceCompanies[0].count}`);
    } catch (error) {
      console.log(`   Error checking retail intelligence: ${error.message}`);
    }

    console.log('\n✅ SBI schema check completed!');

  } catch (error) {
    console.error('❌ Error during SBI schema check:', error);
  } finally {
    await sbiPrisma.$disconnect();
  }
}

// Run the check
checkSbiSchema();
