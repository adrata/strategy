#!/usr/bin/env node

/**
 * 🔍 CHECK NOTARY COMPANIES CUSTOMFIELDS
 * 
 * Check if Notary Everyday companies have customFields data
 */

const { PrismaClient } = require('@prisma/client');

// Database connections
const SBI_DATABASE_URL = 'postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sbiPrisma = new PrismaClient({
  datasources: {
    db: {
      url: SBI_DATABASE_URL
    }
  }
});

async function checkNotaryCompaniesCustomFields() {
  try {
    console.log('🔍 Checking Notary Everyday companies customFields...\n');
    
    // Connect to SBI database
    await sbiPrisma.$connect();
    console.log('✅ Connected to SBI database!\n');

    // 1. Find Notary Everyday workspace
    const sbiWorkspace = await sbiPrisma.$queryRaw`
      SELECT id, name, slug, timezone, description, "createdAt", "updatedAt"
      FROM workspaces 
      WHERE name ILIKE '%notary everyday%'
      LIMIT 1;
    `;
    
    if (!sbiWorkspace || sbiWorkspace.length === 0) {
      console.log('❌ Notary Everyday workspace not found in SBI database!');
      return;
    }
    
    console.log(`✅ Found SBI workspace: ${sbiWorkspace[0].name} (${sbiWorkspace[0].id})\n`);

    // 2. Check all companies in Notary Everyday workspace
    const allCompanies = await sbiPrisma.$queryRaw`
      SELECT id, name, "workspaceId", "customFields", "createdAt"
      FROM companies 
      WHERE "workspaceId" = ${sbiWorkspace[0].id}
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`📊 TOTAL COMPANIES: ${allCompanies.length}`);
    
    // 3. Check companies with customFields
    const companiesWithCustomFields = allCompanies.filter(company => 
      company.customFields && 
      company.customFields !== null && 
      JSON.stringify(company.customFields) !== '{}'
    );
    
    console.log(`📊 COMPANIES WITH CUSTOMFIELDS: ${companiesWithCustomFields.length}`);
    console.log(`📊 COMPANIES WITHOUT CUSTOMFIELDS: ${allCompanies.length - companiesWithCustomFields.length}`);
    
    // 4. Show sample companies
    console.log('\n📋 SAMPLE COMPANIES:');
    allCompanies.slice(0, 5).forEach((company, index) => {
      const hasCustomFields = company.customFields && 
        company.customFields !== null && 
        JSON.stringify(company.customFields) !== '{}';
      
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Has customFields: ${hasCustomFields ? '✅' : '❌'}`);
      if (hasCustomFields) {
        console.log(`   CustomFields keys: ${Object.keys(company.customFields).join(', ')}`);
      }
      console.log('');
    });
    
    // 5. Check if we should migrate all companies regardless of customFields
    console.log('💡 RECOMMENDATION:');
    if (allCompanies.length > companiesWithCustomFields.length) {
      console.log('   The migration script should be updated to migrate ALL companies,');
      console.log('   not just those with customFields data.');
      console.log('   This will ensure all Notary Everyday companies are migrated.');
    } else {
      console.log('   All companies have customFields data, so the migration should work.');
    }

  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    await sbiPrisma.$disconnect();
  }
}

// Run the check
checkNotaryCompaniesCustomFields();
