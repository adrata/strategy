#!/usr/bin/env node

/**
 * Verify Noel's Companies Count and Main Seller Assignment
 * 
 * Confirms that Noel has 80 companies assigned as main seller
 * in the Notary Everyday workspace.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n============================================================');
  console.log('   VERIFY NOEL COMPANIES COUNT');
  console.log('============================================================\n');

  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Find Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Find Noel user
    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });

    if (!noel) {
      throw new Error('Noel user not found!');
    }
    console.log(`✅ Found Noel: ${noel.name || noel.email} (${noel.id})\n`);

    // Count companies assigned to Noel
    const companyCount = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: noel.id,
        deletedAt: null
      }
    });

    console.log(`📊 Company Count: ${companyCount}`);
    console.log(`🎯 Expected: 80\n`);

    if (companyCount === 80) {
      console.log('✅ SUCCESS: Noel has exactly 80 companies as main seller!\n');
    } else if (companyCount > 80) {
      console.log(`⚠️  WARNING: Noel has ${companyCount} companies (expected 80)`);
      console.log(`   This is ${companyCount - 80} more than expected.\n`);
    } else {
      console.log(`❌ ISSUE: Noel has only ${companyCount} companies (expected 80)`);
      console.log(`   Missing ${80 - companyCount} companies.\n`);
    }

    // Get breakdown by industry/vertical
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: noel.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        industry: true,
        customFields: true
      },
      orderBy: { industry: 'asc' }
    });

    // Group by industry
    const byIndustry = {};
    companies.forEach(company => {
      const industry = company.industry || 'Unknown';
      const vertical = company.customFields?.vertical || 'N/A';
      const key = `${industry} (${vertical})`;
      if (!byIndustry[key]) {
        byIndustry[key] = [];
      }
      byIndustry[key].push(company.name);
    });

    console.log('📋 Breakdown by Industry/Vertical:');
    console.log('━'.repeat(70));
    Object.keys(byIndustry).sort().forEach(key => {
      console.log(`   ${key}: ${byIndustry[key].length} companies`);
    });
    console.log('━'.repeat(70));
    console.log(`   Total: ${companies.length} companies\n`);

    // Show sample companies
    console.log('📋 Sample Companies (first 10):');
    companies.slice(0, 10).forEach((company, index) => {
      const vertical = company.customFields?.vertical || 'N/A';
      console.log(`   ${index + 1}. ${company.name} - ${company.industry || 'Unknown'} (${vertical})`);
    });
    if (companies.length > 10) {
      console.log(`   ... and ${companies.length - 10} more\n`);
    }

    // Verify main seller assignment
    const companiesWithoutMainSeller = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: null,
        deletedAt: null
      }
    });

    const companiesWithOtherMainSeller = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: { not: null, not: noel.id },
        deletedAt: null
      }
    });

    console.log('🔍 Additional Verification:');
    console.log(`   Companies without main seller: ${companiesWithoutMainSeller}`);
    console.log(`   Companies with other main seller: ${companiesWithOtherMainSeller}`);
    console.log(`   Companies with Noel as main seller: ${companyCount}\n`);

    if (companyCount === 80 && companiesWithoutMainSeller === 0) {
      console.log('✅ All checks passed! Noel is correctly assigned as main seller for 80 companies.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
