#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE DATABASE AUDIT
 * 
 * Audits the old SBI database to ensure we captured all people, companies, accounts, and contacts
 * with their associations and key data
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

const newPrisma = new PrismaClient();

async function comprehensiveDatabaseAudit() {
  try {
    console.log('🔍 COMPREHENSIVE DATABASE AUDIT\n');
    console.log('Auditing old SBI database for complete data migration...\n');
    
    // Connect to both databases
    await sbiPrisma.$connect();
    await newPrisma.$connect();
    console.log('✅ Connected to both databases!\n');

    // 1. AUDIT ALL WORKSPACES
    console.log('📋 AUDITING ALL WORKSPACES:');
    console.log('==========================');
    
    const allWorkspaces = await sbiPrisma.$queryRaw`
      SELECT id, name, slug, timezone, description, "createdAt", "updatedAt"
      FROM workspaces 
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`Found ${allWorkspaces.length} workspaces in SBI database:`);
    allWorkspaces.forEach((workspace, index) => {
      console.log(`${index + 1}. ${workspace.name} (${workspace.id})`);
    });
    console.log('');

    // 2. AUDIT ALL TABLES AND THEIR STRUCTURE
    console.log('🗂️ AUDITING DATABASE TABLES:');
    console.log('============================');
    
    const tables = await sbiPrisma.$queryRaw`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('Available tables in SBI database:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name} (${table.table_type})`);
    });
    console.log('');

    // 3. AUDIT COMPANIES BY WORKSPACE
    console.log('🏢 AUDITING COMPANIES BY WORKSPACE:');
    console.log('===================================');
    
    for (const workspace of allWorkspaces) {
      const companies = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM companies 
        WHERE "workspaceId" = ${workspace.id};
      `;
      
      const companiesWithCustomFields = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM companies 
        WHERE "workspaceId" = ${workspace.id}
        AND "customFields" IS NOT NULL 
        AND "customFields"::text != '{}';
      `;
      
      console.log(`${workspace.name}:`);
      console.log(`  Total companies: ${companies[0].count}`);
      console.log(`  With customFields: ${companiesWithCustomFields[0].count}`);
      console.log(`  Without customFields: ${companies[0].count - companiesWithCustomFields[0].count}`);
      console.log('');
    }

    // 4. AUDIT PEOPLE BY WORKSPACE
    console.log('👥 AUDITING PEOPLE BY WORKSPACE:');
    console.log('===============================');
    
    for (const workspace of allWorkspaces) {
      const people = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM people 
        WHERE "workspaceId" = ${workspace.id};
      `;
      
      const peopleWithCustomFields = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM people 
        WHERE "workspaceId" = ${workspace.id}
        AND "customFields" IS NOT NULL 
        AND "customFields"::text != '{}';
      `;
      
      console.log(`${workspace.name}:`);
      console.log(`  Total people: ${people[0].count}`);
      console.log(`  With customFields: ${peopleWithCustomFields[0].count}`);
      console.log(`  Without customFields: ${people[0].count - peopleWithCustomFields[0].count}`);
      console.log('');
    }

    // 5. CHECK FOR DEPRECATED TABLES (leads, contacts, accounts)
    console.log('🗑️ CHECKING FOR DEPRECATED TABLES:');
    console.log('==================================');
    
    const deprecatedTables = ['leads', 'contacts', 'accounts', 'opportunities'];
    
    for (const tableName of deprecatedTables) {
      try {
        const count = await sbiPrisma.$queryRaw`
          SELECT COUNT(*) as count FROM ${tableName};
        `;
        console.log(`${tableName}: ${count[0].count} records`);
      } catch (error) {
        console.log(`${tableName}: Table does not exist`);
      }
    }
    console.log('');

    // 6. AUDIT COMPANY-PEOPLE ASSOCIATIONS
    console.log('🔗 AUDITING COMPANY-PEOPLE ASSOCIATIONS:');
    console.log('========================================');
    
    for (const workspace of allWorkspaces) {
      const peopleWithCompanies = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM people 
        WHERE "workspaceId" = ${workspace.id}
        AND "companyId" IS NOT NULL;
      `;
      
      const peopleWithoutCompanies = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM people 
        WHERE "workspaceId" = ${workspace.id}
        AND "companyId" IS NULL;
      `;
      
      console.log(`${workspace.name}:`);
      console.log(`  People with company associations: ${peopleWithCompanies[0].count}`);
      console.log(`  People without company associations: ${peopleWithoutCompanies[0].count}`);
      console.log('');
    }

    // 7. AUDIT KEY DATA FIELDS
    console.log('📊 AUDITING KEY DATA FIELDS:');
    console.log('============================');
    
    for (const workspace of allWorkspaces) {
      console.log(`${workspace.name}:`);
      
      // Companies with key fields
      const companiesWithEmails = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM companies 
        WHERE "workspaceId" = ${workspace.id}
        AND email IS NOT NULL AND email != '';
      `;
      
      const companiesWithPhones = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM companies 
        WHERE "workspaceId" = ${workspace.id}
        AND phone IS NOT NULL AND phone != '';
      `;
      
      const companiesWithWebsites = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM companies 
        WHERE "workspaceId" = ${workspace.id}
        AND website IS NOT NULL AND website != '';
      `;
      
      // People with key fields
      const peopleWithEmails = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM people 
        WHERE "workspaceId" = ${workspace.id}
        AND email IS NOT NULL AND email != '';
      `;
      
      const peopleWithPhones = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM people 
        WHERE "workspaceId" = ${workspace.id}
        AND phone IS NOT NULL AND phone != '';
      `;
      
      const peopleWithLinkedIn = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM people 
        WHERE "workspaceId" = ${workspace.id}
        AND "linkedinUrl" IS NOT NULL AND "linkedinUrl" != '';
      `;
      
      console.log(`  Companies with emails: ${companiesWithEmails[0].count}`);
      console.log(`  Companies with phones: ${companiesWithPhones[0].count}`);
      console.log(`  Companies with websites: ${companiesWithWebsites[0].count}`);
      console.log(`  People with emails: ${peopleWithEmails[0].count}`);
      console.log(`  People with phones: ${peopleWithPhones[0].count}`);
      console.log(`  People with LinkedIn: ${peopleWithLinkedIn[0].count}`);
      console.log('');
    }

    // 8. CHECK FOR MISSING DATA IN NEW DATABASE
    console.log('🆚 COMPARING WITH NEW DATABASE:');
    console.log('===============================');
    
    for (const workspace of allWorkspaces) {
      // Find corresponding workspace in new database
      const newWorkspace = await newPrisma.workspaces.findFirst({
        where: {
          name: {
            contains: workspace.name,
            mode: 'insensitive'
          }
        }
      });
      
      if (newWorkspace) {
        const newCompanies = await newPrisma.companies.count({
          where: { workspaceId: newWorkspace.id }
        });
        
        const newPeople = await newPrisma.people.count({
          where: { workspaceId: newWorkspace.id }
        });
        
        const sbiCompanies = await sbiPrisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM companies 
          WHERE "workspaceId" = ${workspace.id};
        `;
        
        const sbiPeople = await sbiPrisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM people 
          WHERE "workspaceId" = ${workspace.id};
        `;
        
        console.log(`${workspace.name}:`);
        console.log(`  SBI Companies: ${sbiCompanies[0].count} | New Companies: ${newCompanies}`);
        console.log(`  SBI People: ${sbiPeople[0].count} | New People: ${newPeople}`);
        
        if (Number(sbiCompanies[0].count) !== newCompanies) {
          console.log(`  ⚠️  COMPANY COUNT MISMATCH: Missing ${Number(sbiCompanies[0].count) - newCompanies} companies`);
        }
        
        if (Number(sbiPeople[0].count) !== newPeople) {
          console.log(`  ⚠️  PEOPLE COUNT MISMATCH: Missing ${Number(sbiPeople[0].count) - newPeople} people`);
        }
        
        console.log('');
      } else {
        console.log(`${workspace.name}: ❌ No corresponding workspace in new database`);
        console.log('');
      }
    }

    // 9. SAMPLE DATA ANALYSIS
    console.log('📋 SAMPLE DATA ANALYSIS:');
    console.log('========================');
    
    // Get sample companies with rich data
    const sampleCompanies = await sbiPrisma.$queryRaw`
      SELECT name, email, phone, website, industry, "companySize", 
             "customFields", notes, "createdAt"
      FROM companies 
      WHERE "customFields" IS NOT NULL 
      AND "customFields"::text != '{}'
      ORDER BY "createdAt" DESC
      LIMIT 3;
    `;
    
    console.log('Sample companies with customFields:');
    sampleCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   Email: ${company.email || 'N/A'}`);
      console.log(`   Phone: ${company.phone || 'N/A'}`);
      console.log(`   Website: ${company.website || 'N/A'}`);
      console.log(`   Industry: ${company.industry || 'N/A'}`);
      console.log(`   Size: ${company.companySize || 'N/A'}`);
      console.log(`   Has customFields: ${company.customFields ? 'Yes' : 'No'}`);
      console.log(`   Notes: ${company.notes ? company.notes.substring(0, 100) + '...' : 'N/A'}`);
      console.log('');
    });
    
    // Get sample people with rich data
    const samplePeople = await sbiPrisma.$queryRaw`
      SELECT "fullName", email, phone, "linkedinUrl", "jobTitle", 
             "customFields", notes, "createdAt"
      FROM people 
      WHERE "customFields" IS NOT NULL 
      AND "customFields"::text != '{}'
      ORDER BY "createdAt" DESC
      LIMIT 3;
    `;
    
    console.log('Sample people with customFields:');
    samplePeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Email: ${person.email || 'N/A'}`);
      console.log(`   Phone: ${person.phone || 'N/A'}`);
      console.log(`   LinkedIn: ${person.linkedinUrl || 'N/A'}`);
      console.log(`   Job Title: ${person.jobTitle || 'N/A'}`);
      console.log(`   Has customFields: ${person.customFields ? 'Yes' : 'No'}`);
      console.log(`   Notes: ${person.notes ? person.notes.substring(0, 100) + '...' : 'N/A'}`);
      console.log('');
    });

    console.log('🎯 AUDIT RECOMMENDATIONS:');
    console.log('=========================');
    console.log('1. Check for workspaces that were not migrated');
    console.log('2. Verify all companies and people were migrated regardless of customFields');
    console.log('3. Ensure company-people associations are preserved');
    console.log('4. Check for any deprecated table data that needs migration');
    console.log('5. Verify all key contact information was preserved');

  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await sbiPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

// Run the audit
comprehensiveDatabaseAudit();
