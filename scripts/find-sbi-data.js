#!/usr/bin/env node

/**
 * 🔍 FIND SBI DATA
 * 
 * Specifically looks for SBI data in the database
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

async function findSbiData() {
  try {
    console.log('🔍 Searching specifically for SBI data...\n');
    
    await sbiPrisma.$connect();
    console.log('✅ Connected to SBI database!\n');

    // 1. Search for companies with SBI-specific terms
    console.log('🏢 SEARCHING FOR SBI COMPANIES:');
    
    const sbiSearchTerms = [
      'SBI',
      'Strategic Business Intelligence',
      'bulk analysis',
      'bulk_analysis',
      'sbi_bulk',
      'sbi_analysis',
      'strategic_business',
      'business_intelligence'
    ];

    for (const term of sbiSearchTerms) {
      try {
        const companies = await sbiPrisma.$queryRaw`
          SELECT id, name, industry, customFields, createdAt
          FROM companies 
          WHERE name ILIKE ${'%' + term + '%'}
          OR industry ILIKE ${'%' + term + '%'}
          OR customFields::text ILIKE ${'%' + term + '%'}
          LIMIT 5;
        `;
        
        if (companies.length > 0) {
          console.log(`   Found ${companies.length} companies with "${term}":`);
          companies.forEach(company => {
            console.log(`     - ${company.name} (${company.industry}) - ${company.createdAt}`);
            if (company.customfields && company.customfields.sbi) {
              console.log(`       SBI Data: ${JSON.stringify(company.customfields.sbi, null, 2)}`);
            }
          });
        }
      } catch (error) {
        console.log(`   Error searching for "${term}": ${error.message}`);
      }
    }

    // 2. Search for people with SBI-specific terms
    console.log('\n👥 SEARCHING FOR SBI PEOPLE:');
    
    for (const term of sbiSearchTerms) {
      try {
        const people = await sbiPrisma.$queryRaw`
          SELECT id, "fullName", "jobTitle", source, customFields, createdAt
          FROM people 
          WHERE "fullName" ILIKE ${'%' + term + '%'}
          OR "jobTitle" ILIKE ${'%' + term + '%'}
          OR source ILIKE ${'%' + term + '%'}
          OR customFields::text ILIKE ${'%' + term + '%'}
          LIMIT 5;
        `;
        
        if (people.length > 0) {
          console.log(`   Found ${people.length} people with "${term}":`);
          people.forEach(person => {
            console.log(`     - ${person.fullName} (${person.jobTitle}) - ${person.source} - ${person.createdAt}`);
            if (person.customfields && person.customfields.sbi) {
              console.log(`       SBI Data: ${JSON.stringify(person.customfields.sbi, null, 2)}`);
            }
          });
        }
      } catch (error) {
        console.log(`   Error searching for "${term}": ${error.message}`);
      }
    }

    // 3. Look for companies with SBI-specific custom field structures
    console.log('\n🔧 SEARCHING FOR SBI CUSTOM FIELDS:');
    
    try {
      const sbiCustomFields = await sbiPrisma.$queryRaw`
        SELECT id, name, customFields
        FROM companies 
        WHERE customFields ? 'sbi'
        OR customFields ? 'SBI'
        OR customFields ? 'bulkAnalysis'
        OR customFields ? 'strategicBusiness'
        OR customFields::text LIKE '%"sbi"%'
        OR customFields::text LIKE '%"SBI"%'
        OR customFields::text LIKE '%"bulkAnalysis"%'
        OR customFields::text LIKE '%"strategicBusiness"%'
        LIMIT 10;
      `;
      
      console.log(`   Found ${sbiCustomFields.length} companies with SBI custom fields:`);
      sbiCustomFields.forEach(company => {
        console.log(`     - ${company.name}`);
        if (company.customfields) {
          console.log(`       Custom Fields: ${JSON.stringify(company.customfields, null, 2)}`);
        }
      });
    } catch (error) {
      console.log(`   Error searching SBI custom fields: ${error.message}`);
    }

    // 4. Look for people with SBI-specific custom field structures
    console.log('\n👤 SEARCHING FOR SBI PEOPLE CUSTOM FIELDS:');
    
    try {
      const sbiPeopleCustomFields = await sbiPrisma.$queryRaw`
        SELECT id, "fullName", customFields
        FROM people 
        WHERE customFields ? 'sbi'
        OR customFields ? 'SBI'
        OR customFields ? 'bulkAnalysis'
        OR customFields ? 'strategicBusiness'
        OR customFields::text LIKE '%"sbi"%'
        OR customFields::text LIKE '%"SBI"%'
        OR customFields::text LIKE '%"bulkAnalysis"%'
        OR customFields::text LIKE '%"strategicBusiness"%'
        LIMIT 10;
      `;
      
      console.log(`   Found ${sbiPeopleCustomFields.length} people with SBI custom fields:`);
      sbiPeopleCustomFields.forEach(person => {
        console.log(`     - ${person.fullName}`);
        if (person.customfields) {
          console.log(`       Custom Fields: ${JSON.stringify(person.customfields, null, 2)}`);
        }
      });
    } catch (error) {
      console.log(`   Error searching SBI people custom fields: ${error.message}`);
    }

    // 5. Look for any data with confidence scores (SBI feature)
    console.log('\n📊 SEARCHING FOR CONFIDENCE SCORES:');
    
    try {
      const confidenceData = await sbiPrisma.$queryRaw`
        SELECT id, name, customFields
        FROM companies 
        WHERE customFields::text LIKE '%"confidence"%'
        OR customFields::text LIKE '%confidence%'
        LIMIT 5;
      `;
      
      console.log(`   Found ${confidenceData.length} companies with confidence data:`);
      confidenceData.forEach(company => {
        console.log(`     - ${company.name}`);
        if (company.customfields) {
          console.log(`       Custom Fields: ${JSON.stringify(company.customfields, null, 2)}`);
        }
      });
    } catch (error) {
      console.log(`   Error searching confidence data: ${error.message}`);
    }

    // 6. Look for any data with role information (SBI feature)
    console.log('\n👑 SEARCHING FOR ROLE DATA:');
    
    try {
      const roleData = await sbiPrisma.$queryRaw`
        SELECT id, "fullName", "jobTitle", customFields
        FROM people 
        WHERE customFields::text LIKE '%"role"%'
        OR customFields::text LIKE '%"CFO"%'
        OR customFields::text LIKE '%"CRO"%'
        OR customFields::text LIKE '%"CEO"%'
        OR "jobTitle" ILIKE '%CFO%'
        OR "jobTitle" ILIKE '%CRO%'
        OR "jobTitle" ILIKE '%CEO%'
        LIMIT 10;
      `;
      
      console.log(`   Found ${roleData.length} people with role data:`);
      roleData.forEach(person => {
        console.log(`     - ${person.fullName} (${person.jobTitle})`);
        if (person.customfields) {
          console.log(`       Custom Fields: ${JSON.stringify(person.customfields, null, 2)}`);
        }
      });
    } catch (error) {
      console.log(`   Error searching role data: ${error.message}`);
    }

    // 7. Look for any data with sources information (SBI feature)
    console.log('\n📋 SEARCHING FOR SOURCES DATA:');
    
    try {
      const sourcesData = await sbiPrisma.$queryRaw`
        SELECT id, name, customFields
        FROM companies 
        WHERE customFields::text LIKE '%"sources"%'
        OR customFields::text LIKE '%sources%'
        LIMIT 5;
      `;
      
      console.log(`   Found ${sourcesData.length} companies with sources data:`);
      sourcesData.forEach(company => {
        console.log(`     - ${company.name}`);
        if (company.customfields) {
          console.log(`       Custom Fields: ${JSON.stringify(company.customfields, null, 2)}`);
        }
      });
    } catch (error) {
      console.log(`   Error searching sources data: ${error.message}`);
    }

    // 8. Look for any data with lastVerified information (SBI feature)
    console.log('\n🔍 SEARCHING FOR VERIFICATION DATA:');
    
    try {
      const verificationData = await sbiPrisma.$queryRaw`
        SELECT id, name, customFields
        FROM companies 
        WHERE customFields::text LIKE '%"lastVerified"%'
        OR customFields::text LIKE '%lastVerified%'
        LIMIT 5;
      `;
      
      console.log(`   Found ${verificationData.length} companies with verification data:`);
      verificationData.forEach(company => {
        console.log(`     - ${company.name}`);
        if (company.customfields) {
          console.log(`       Custom Fields: ${JSON.stringify(company.customfields, null, 2)}`);
        }
      });
    } catch (error) {
      console.log(`   Error searching verification data: ${error.message}`);
    }

    // 9. Check for any data that might be from bulk analysis
    console.log('\n📊 SEARCHING FOR BULK ANALYSIS DATA:');
    
    try {
      const bulkData = await sbiPrisma.$queryRaw`
        SELECT id, name, customFields, createdAt
        FROM companies 
        WHERE customFields::text LIKE '%"bulk"%'
        OR customFields::text LIKE '%bulk%'
        OR customFields::text LIKE '%"analysis"%'
        OR customFields::text LIKE '%analysis%'
        OR customFields::text LIKE '%"pipeline"%'
        OR customFields::text LIKE '%pipeline%'
        ORDER BY createdAt DESC
        LIMIT 10;
      `;
      
      console.log(`   Found ${bulkData.length} companies with bulk/analysis data:`);
      bulkData.forEach(company => {
        console.log(`     - ${company.name} (${company.createdat})`);
        if (company.customfields) {
          console.log(`       Custom Fields: ${JSON.stringify(company.customfields, null, 2)}`);
        }
      });
    } catch (error) {
      console.log(`   Error searching bulk data: ${error.message}`);
    }

    console.log('\n✅ SBI data search completed!');

  } catch (error) {
    console.error('❌ Error during SBI data search:', error);
  } finally {
    await sbiPrisma.$disconnect();
  }
}

// Run the search
findSbiData();
