#!/usr/bin/env node

/**
 * 🔍 SBI DATA AUDIT SCRIPT
 * 
 * Audits the current database for SBI-related data
 * and identifies what needs to be migrated
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require"
    }
  }
});

async function auditSbiData() {
  try {
    console.log('🔍 Starting SBI data audit...\n');

    // 1. Check for SBI-related companies
    console.log('📊 COMPANIES AUDIT:');
    const totalCompanies = await prisma.companies.count();
    console.log(`   Total companies: ${totalCompanies}`);

    // Look for companies with SBI-related fields or data
    const sbiCompanies = await prisma.companies.findMany({
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
      }
    });

    console.log(`   SBI-related companies: ${sbiCompanies.length}`);
    if (sbiCompanies.length > 0) {
      console.log('   Sample SBI companies:');
      sbiCompanies.slice(0, 5).forEach(company => {
        console.log(`     - ${company.name} (${company.industry}) - ${company.createdAt}`);
      });
    }

    // 2. Check for SBI-related people
    console.log('\n👥 PEOPLE AUDIT:');
    const totalPeople = await prisma.people.count();
    console.log(`   Total people: ${totalPeople}`);

    const sbiPeople = await prisma.people.findMany({
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
        source: true,
        customFields: true,
        createdAt: true
      }
    });

    console.log(`   SBI-related people: ${sbiPeople.length}`);
    if (sbiPeople.length > 0) {
      console.log('   Sample SBI people:');
      sbiPeople.slice(0, 5).forEach(person => {
        console.log(`     - ${person.fullName} (${person.title}) - ${person.source} - ${person.createdAt}`);
      });
    }

    // 3. Check for SBI-related custom fields
    console.log('\n🔧 CUSTOM FIELDS AUDIT:');
    const companiesWithCustomFields = await prisma.companies.count({
      where: {
        customFields: { not: null }
      }
    });
    console.log(`   Companies with custom fields: ${companiesWithCustomFields}`);

    const peopleWithCustomFields = await prisma.people.count({
      where: {
        customFields: { not: null }
      }
    });
    console.log(`   People with custom fields: ${peopleWithCustomFields}`);

    // 4. Check for SBI-related actions
    console.log('\n📝 ACTIONS AUDIT:');
    const sbiActions = await prisma.actions.count({
      where: {
        OR: [
          { subject: { contains: 'SBI', mode: 'insensitive' } },
          { description: { contains: 'SBI', mode: 'insensitive' } }
        ]
      }
    });
    console.log(`   SBI-related actions: ${sbiActions}`);

    // 5. Check for workspaces that might contain SBI data
    console.log('\n🏢 WORKSPACES AUDIT:');
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            companies: true,
            people: true
          }
        }
      }
    });

    console.log(`   Total workspaces: ${workspaces.length}`);
    workspaces.forEach(workspace => {
      console.log(`     - ${workspace.name} (${workspace.slug}): ${workspace._count.companies} companies, ${workspace._count.people} people`);
    });

    // 6. Look for any SBI-specific data patterns
    console.log('\n🔍 SBI DATA PATTERNS:');
    
    // Check for companies with confidence scores (SBI feature)
    const companiesWithConfidence = await prisma.companies.findMany({
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

    // Check for people with role data (SBI feature)
    const peopleWithRoles = await prisma.people.findMany({
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

    console.log('\n✅ SBI data audit completed!');
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`   Total companies: ${totalCompanies}`);
    console.log(`   Total people: ${totalPeople}`);
    console.log(`   SBI companies found: ${sbiCompanies.length}`);
    console.log(`   SBI people found: ${sbiPeople.length}`);
    console.log(`   Companies with custom fields: ${companiesWithCustomFields}`);
    console.log(`   People with custom fields: ${peopleWithCustomFields}`);

    if (sbiCompanies.length === 0 && sbiPeople.length === 0) {
      console.log('\n⚠️  No SBI data found in current database.');
      console.log('   This suggests SBI data might be in a different database instance.');
      console.log('   Need to check other database connections or old database instances.');
    }

  } catch (error) {
    console.error('❌ Error during SBI data audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditSbiData();
