#!/usr/bin/env node

/**
 * 🔍 DEBUG TOP ENGINEERING ISSUES
 * 
 * Debugs the foreign key constraint issues in TOP Engineering Plus migration
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

async function debugTopEngineeringIssues() {
  try {
    console.log('🔍 Debugging TOP Engineering Plus issues...\n');
    
    // Connect to both databases
    await sbiPrisma.$connect();
    await newPrisma.$connect();
    console.log('✅ Connected to both databases!\n');

    // 1. Find TOP Engineering Plus workspace in SBI database
    console.log('📋 FINDING TOP ENGINEERING PLUS WORKSPACE:');
    const sbiWorkspace = await sbiPrisma.$queryRaw`
      SELECT id, name, slug, timezone, description, "createdAt", "updatedAt"
      FROM workspaces 
      WHERE name ILIKE '%top engineering plus%'
      LIMIT 1;
    `;
    
    if (!sbiWorkspace || sbiWorkspace.length === 0) {
      throw new Error('TOP Engineering Plus workspace not found in SBI database!');
    }
    
    console.log(`✅ Found SBI workspace: ${sbiWorkspace[0].name} (${sbiWorkspace[0].id})\n`);

    // 2. Check companies in SBI database
    console.log('🏢 CHECKING COMPANIES IN SBI DATABASE:');
    const sbiCompanies = await sbiPrisma.$queryRaw`
      SELECT id, name, "workspaceId" FROM companies 
      WHERE "workspaceId" = ${sbiWorkspace[0].id}
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`   Found ${sbiCompanies.length} companies in SBI database`);
    
    // Show first 5 companies
    console.log('   First 5 companies:');
    sbiCompanies.slice(0, 5).forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.id})`);
    });

    // 3. Check people in SBI database
    console.log('\n👥 CHECKING PEOPLE IN SBI DATABASE:');
    const sbiPeople = await sbiPrisma.$queryRaw`
      SELECT id, "fullName", "companyId", "workspaceId" FROM people 
      WHERE "workspaceId" = ${sbiWorkspace[0].id}
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`   Found ${sbiPeople.length} people in SBI database`);
    
    // Check how many people have companyId references
    const peopleWithCompanyId = sbiPeople.filter(person => person.companyId);
    const peopleWithoutCompanyId = sbiPeople.filter(person => !person.companyId);
    
    console.log(`   People with companyId: ${peopleWithCompanyId.length}`);
    console.log(`   People without companyId: ${peopleWithoutCompanyId.length}`);
    
    // Check for orphaned company references
    const companyIds = sbiCompanies.map(c => c.id);
    const orphanedPeople = peopleWithCompanyId.filter(person => !companyIds.includes(person.companyId));
    
    console.log(`   People with orphaned company references: ${orphanedPeople.length}`);
    
    if (orphanedPeople.length > 0) {
      console.log('   First 5 orphaned people:');
      orphanedPeople.slice(0, 5).forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.fullName} -> companyId: ${person.companyId}`);
      });
    }

    // 4. Check what's in the new database
    console.log('\n📊 CHECKING NEW DATABASE:');
    const newWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'TOP Engineering Plus',
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
      
      console.log(`   New workspace: ${newWorkspace.name} (${newWorkspace.id})`);
      console.log(`   Companies in new database: ${newCompanies}`);
      console.log(`   People in new database: ${newPeople}`);
    } else {
      console.log('   No TOP Engineering Plus workspace found in new database');
    }

    // 5. Sample some problematic people
    console.log('\n🔍 SAMPLE PROBLEMATIC PEOPLE:');
    const samplePeople = sbiPeople.slice(0, 10);
    for (const person of samplePeople) {
      if (person.companyId) {
        const companyExists = sbiCompanies.find(c => c.id === person.companyId);
        console.log(`   ${person.fullName}: companyId ${person.companyId} ${companyExists ? '✅' : '❌'}`);
      } else {
        console.log(`   ${person.fullName}: no companyId`);
      }
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await sbiPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

// Run the debug
debugTopEngineeringIssues();
