#!/usr/bin/env node

/**
 * Check Current Company Names in Database
 * 
 * Verifies the current state of company names after cleanup
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentCompanyNames() {
  try {
    console.log('🔍 Checking current company names in database...\n');
    
    // Find the Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Notary Everyday',
          mode: 'insensitive'
        }
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Get sample companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id
      },
      select: {
        id: true,
        name: true,
        domain: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 30
    });

    console.log(`📊 Sample of ${companies.length} company names from database:`);
    console.log('='.repeat(60));
    
    companies.forEach((company, index) => {
      console.log(`${index + 1}. "${company.name}"`);
      if (company.domain) {
        console.log(`    Domain: ${company.domain}`);
      }
    });

    // Check for any remaining all-caps names
    const allCapsCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        name: {
          mode: 'insensitive',
          equals: prisma.companies.fields.name
        }
      },
      select: {
        id: true,
        name: true
      },
      take: 10
    });

    // Filter for actual all-caps names
    const actualAllCaps = allCapsCompanies.filter(company => 
      /^[A-Z\s&.,]+$/.test(company.name) && company.name.length > 3
    );

    if (actualAllCaps.length > 0) {
      console.log('\n⚠️  Remaining all-caps names:');
      console.log('='.repeat(60));
      actualAllCaps.forEach((company, index) => {
        console.log(`${index + 1}. "${company.name}"`);
      });
    } else {
      console.log('\n✅ No all-caps names found!');
    }

    // Check for long names
    const longNames = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        name: {
          not: null
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    const actualLongNames = longNames.filter(company => 
      company.name && company.name.length > 80
    );

    if (actualLongNames.length > 0) {
      console.log('\n⚠️  Remaining long names (>80 chars):');
      console.log('='.repeat(60));
      actualLongNames.forEach((company, index) => {
        console.log(`${index + 1}. [${company.name.length} chars] "${company.name}"`);
      });
    } else {
      console.log('\n✅ No long names found!');
    }

    console.log('\n✅ Database check complete!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentCompanyNames();
