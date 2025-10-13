#!/usr/bin/env node

/**
 * 🔍 CHECK NOTARY EVERYDAY COMPANIES
 * 
 * Investigate why there are no companies in the Notary Everyday workspace
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

async function checkNotaryEverydayCompanies() {
  try {
    console.log('🔍 Checking Notary Everyday companies...\n');
    
    // Connect to both databases
    await sbiPrisma.$connect();
    await newPrisma.$connect();
    console.log('✅ Connected to both databases!\n');

    // 1. Check Notary Everyday workspace in new database
    console.log('📋 CHECKING NOTARY EVERYDAY WORKSPACE:');
    
    const notaryWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Notary Everyday',
          mode: 'insensitive'
        }
      }
    });
    
    if (!notaryWorkspace) {
      throw new Error('Notary Everyday workspace not found!');
    }
    
    console.log(`✅ Found workspace: ${notaryWorkspace.name} (${notaryWorkspace.id})\n`);

    // 2. Check companies in new database
    console.log('🏢 CHECKING COMPANIES IN NEW DATABASE:');
    
    const newCompanies = await newPrisma.companies.findMany({
      where: {
        workspaceId: notaryWorkspace.id
      }
    });
    
    console.log(`   Found ${newCompanies.length} companies in new database`);
    
    if (newCompanies.length > 0) {
      console.log('   Sample companies:');
      newCompanies.slice(0, 3).forEach(company => {
        console.log(`   - ${company.name} (${company.id})`);
      });
    }

    // 3. Check companies in SBI database for Notary Everyday workspace
    console.log('\n🏢 CHECKING COMPANIES IN SBI DATABASE:');
    
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
    
    console.log(`✅ Found SBI workspace: ${sbiWorkspace[0].name} (${sbiWorkspace[0].id})`);
    
    const sbiCompanies = await sbiPrisma.$queryRaw`
      SELECT id, name, "workspaceId", "createdAt"
      FROM companies 
      WHERE "workspaceId" = ${sbiWorkspace[0].id}
      ORDER BY "createdAt" DESC
      LIMIT 10;
    `;
    
    console.log(`   Found ${sbiCompanies.length} companies in SBI database`);
    
    if (sbiCompanies.length > 0) {
      console.log('   Sample companies:');
      sbiCompanies.slice(0, 3).forEach(company => {
        console.log(`   - ${company.name} (${company.id})`);
      });
    }

    // 4. Check if companies were migrated but to wrong workspace
    console.log('\n🔍 CHECKING FOR MIGRATED COMPANIES IN OTHER WORKSPACES:');
    
    const allNewCompanies = await newPrisma.companies.findMany({
      where: {
        name: {
          contains: 'Notary',
          mode: 'insensitive'
        }
      },
      include: {
        workspace: true
      }
    });
    
    console.log(`   Found ${allNewCompanies.length} companies with "Notary" in name`);
    
    if (allNewCompanies.length > 0) {
      console.log('   Companies found:');
      allNewCompanies.forEach(company => {
        console.log(`   - ${company.name} in workspace: ${company.workspace.name} (${company.workspace.id})`);
      });
    }

    // 5. Check migration script logs
    console.log('\n📝 MIGRATION ANALYSIS:');
    console.log('   The migration script should have migrated companies from SBI database.');
    console.log('   If no companies were found, it could mean:');
    console.log('   1. Companies in SBI database have no customFields data');
    console.log('   2. Companies were filtered out during migration');
    console.log('   3. Migration script had an error with company data');

  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    await sbiPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

// Run the check
checkNotaryEverydayCompanies();
