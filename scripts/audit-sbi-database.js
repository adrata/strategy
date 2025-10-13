#!/usr/bin/env node

/**
 * 🔍 SBI DATABASE AUDIT
 * 
 * Connects to the SBI database and audits the data
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

async function auditSbiDatabase() {
  try {
    console.log('🔍 Connecting to SBI database...\n');
    
    // Test connection
    await sbiPrisma.$connect();
    console.log('✅ Connected to SBI database successfully!\n');

    // 1. Check database schema
    console.log('📊 DATABASE SCHEMA:');
    const tables = await sbiPrisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('   Available tables:');
    tables.forEach(table => {
      console.log(`     - ${table.table_name}`);
    });

    // 2. Check for companies table
    console.log('\n🏢 COMPANIES TABLE:');
    try {
      const companiesCount = await sbiPrisma.companies.count();
      console.log(`   Total companies: ${companiesCount}`);

      if (companiesCount > 0) {
        // Get sample companies
        const sampleCompanies = await sbiPrisma.companies.findMany({
          select: {
            id: true,
            name: true,
            industry: true,
            size: true,
            website: true,
            domain: true,
            createdAt: true,
            customFields: true
          },
          take: 5
        });

        console.log('   Sample companies:');
        sampleCompanies.forEach(company => {
          console.log(`     - ${company.name} (${company.industry}) - ${company.size} - ${company.createdAt}`);
          if (company.customFields) {
            console.log(`       Custom fields: ${JSON.stringify(company.customFields, null, 2)}`);
          }
        });

        // Check for SBI-specific fields
        const sbiCompanies = await sbiPrisma.companies.findMany({
          where: {
            OR: [
              { name: { contains: 'SBI', mode: 'insensitive' } },
              { industry: { contains: 'SBI', mode: 'insensitive' } },
              { customFields: { path: ['sbi'], not: null } },
              { customFields: { path: ['source'], equals: 'sbi' } }
            ]
          },
          select: {
            id: true,
            name: true,
            industry: true,
            customFields: true,
            createdAt: true
          },
          take: 10
        });

        console.log(`   SBI-related companies: ${sbiCompanies.length}`);
        if (sbiCompanies.length > 0) {
          console.log('   SBI companies:');
          sbiCompanies.forEach(company => {
            console.log(`     - ${company.name} (${company.industry}) - ${company.createdAt}`);
            if (company.customFields) {
              console.log(`       Custom fields: ${JSON.stringify(company.customFields, null, 2)}`);
            }
          });
        }
      }
    } catch (error) {
      console.log(`   ❌ Error accessing companies table: ${error.message}`);
    }

    // 3. Check for people table
    console.log('\n👥 PEOPLE TABLE:');
    try {
      const peopleCount = await sbiPrisma.people.count();
      console.log(`   Total people: ${peopleCount}`);

      if (peopleCount > 0) {
        // Get sample people
        const samplePeople = await sbiPrisma.people.findMany({
          select: {
            id: true,
            fullName: true,
            title: true,
            jobTitle: true,
            email: true,
            phone: true,
            linkedinUrl: true,
            source: true,
            createdAt: true,
            customFields: true
          },
          take: 5
        });

        console.log('   Sample people:');
        samplePeople.forEach(person => {
          console.log(`     - ${person.fullName} (${person.title || person.jobTitle}) - ${person.source} - ${person.createdAt}`);
          if (person.customFields) {
            console.log(`       Custom fields: ${JSON.stringify(person.customFields, null, 2)}`);
          }
        });

        // Check for SBI-specific people
        const sbiPeople = await sbiPrisma.people.findMany({
          where: {
            OR: [
              { source: { contains: 'sbi', mode: 'insensitive' } },
              { customFields: { path: ['sbi'], not: null } },
              { customFields: { path: ['source'], equals: 'sbi' } }
            ]
          },
          select: {
            id: true,
            fullName: true,
            title: true,
            jobTitle: true,
            source: true,
            customFields: true,
            createdAt: true
          },
          take: 10
        });

        console.log(`   SBI-related people: ${sbiPeople.length}`);
        if (sbiPeople.length > 0) {
          console.log('   SBI people:');
          sbiPeople.forEach(person => {
            console.log(`     - ${person.fullName} (${person.title || person.jobTitle}) - ${person.source} - ${person.createdAt}`);
            if (person.customFields) {
              console.log(`       Custom fields: ${JSON.stringify(person.customFields, null, 2)}`);
            }
          });
        }

        // Check for executives (CFO, CRO, CEO)
        const executives = await sbiPrisma.people.findMany({
          where: {
            OR: [
              { title: { contains: 'CFO', mode: 'insensitive' } },
              { title: { contains: 'CRO', mode: 'insensitive' } },
              { title: { contains: 'CEO', mode: 'insensitive' } },
              { jobTitle: { contains: 'CFO', mode: 'insensitive' } },
              { jobTitle: { contains: 'CRO', mode: 'insensitive' } },
              { jobTitle: { contains: 'CEO', mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            fullName: true,
            title: true,
            jobTitle: true,
            source: true,
            customFields: true,
            createdAt: true
          },
          take: 10
        });

        console.log(`   Executives (CFO/CRO/CEO): ${executives.length}`);
        if (executives.length > 0) {
          console.log('   Sample executives:');
          executives.forEach(person => {
            console.log(`     - ${person.fullName} (${person.title || person.jobTitle}) - ${person.source} - ${person.createdAt}`);
            if (person.customFields) {
              console.log(`       Custom fields: ${JSON.stringify(person.customFields, null, 2)}`);
            }
          });
        }
      }
    } catch (error) {
      console.log(`   ❌ Error accessing people table: ${error.message}`);
    }

    // 4. Check for any other tables that might contain SBI data
    console.log('\n🔍 OTHER TABLES:');
    for (const table of tables) {
      const tableName = table.table_name;
      if (tableName !== 'companies' && tableName !== 'people') {
        try {
          const count = await sbiPrisma.$queryRaw`SELECT COUNT(*) as count FROM ${sbiPrisma.$queryRawUnsafe(`"${tableName}"`)}`;
          console.log(`   ${tableName}: ${count[0].count} records`);
        } catch (error) {
          console.log(`   ${tableName}: Error accessing table`);
        }
      }
    }

    // 5. Check for any SBI-specific data patterns
    console.log('\n🔍 SBI DATA PATTERNS:');
    
    // Check for companies with confidence scores
    try {
      const companiesWithConfidence = await sbiPrisma.companies.findMany({
        where: {
          customFields: {
            path: ['confidence'],
            not: null
          }
        },
        select: {
          id: true,
          name: true,
          customFields: true
        },
        take: 5
      });

      console.log(`   Companies with confidence scores: ${companiesWithConfidence.length}`);
      if (companiesWithConfidence.length > 0) {
        console.log('   Sample confidence data:');
        companiesWithConfidence.forEach(company => {
          const confidence = company.customFields?.confidence;
          console.log(`     - ${company.name}: ${confidence}% confidence`);
        });
      }
    } catch (error) {
      console.log(`   Error checking confidence scores: ${error.message}`);
    }

    // Check for people with role data
    try {
      const peopleWithRoles = await sbiPrisma.people.findMany({
        where: {
          customFields: {
            path: ['role'],
            not: null
          }
        },
        select: {
          id: true,
          fullName: true,
          title: true,
          customFields: true
        },
        take: 5
      });

      console.log(`   People with role data: ${peopleWithRoles.length}`);
      if (peopleWithRoles.length > 0) {
        console.log('   Sample role data:');
        peopleWithRoles.forEach(person => {
          const role = person.customFields?.role;
          console.log(`     - ${person.fullName}: ${role} (${person.title})`);
        });
      }
    } catch (error) {
      console.log(`   Error checking role data: ${error.message}`);
    }

    console.log('\n✅ SBI database audit completed!');

  } catch (error) {
    console.error('❌ Error during SBI database audit:', error);
  } finally {
    await sbiPrisma.$disconnect();
  }
}

// Run the audit
auditSbiDatabase();
