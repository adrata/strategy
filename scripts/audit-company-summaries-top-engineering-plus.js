#!/usr/bin/env node

/**
 * Audit Company Summaries in TOP Engineering Plus
 * 
 * Checks how many companies have descriptionEnriched (company summaries)
 * after the transfer from top-temp to TOP Engineering Plus.
 * 
 * Usage:
 *   node scripts/audit-company-summaries-top-engineering-plus.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Workspace IDs
const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';
const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

async function auditCompanySummaries() {
  console.log('🔍 Auditing Company Summaries in TOP Engineering Plus');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Get all companies in TOP Engineering Plus
    const topEngineeringPlusCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        description: true,
        descriptionEnriched: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Total companies in TOP Engineering Plus: ${topEngineeringPlusCompanies.length}`);
    console.log('');

    // Analyze descriptionEnriched field
    const withDescriptionEnriched = topEngineeringPlusCompanies.filter(
      c => c.descriptionEnriched && c.descriptionEnriched.trim() !== ''
    );
    const withoutDescriptionEnriched = topEngineeringPlusCompanies.filter(
      c => !c.descriptionEnriched || c.descriptionEnriched.trim() === ''
    );

    const withDescription = topEngineeringPlusCompanies.filter(
      c => c.description && c.description.trim() !== ''
    );
    const withBoth = topEngineeringPlusCompanies.filter(
      c => (c.description && c.description.trim() !== '') && 
           (c.descriptionEnriched && c.descriptionEnriched.trim() !== '')
    );
    const withNeither = topEngineeringPlusCompanies.filter(
      c => (!c.description || c.description.trim() === '') && 
           (!c.descriptionEnriched || c.descriptionEnriched.trim() === '')
    );

    console.log('📈 Company Summary Statistics:');
    console.log('-'.repeat(70));
    console.log(`✅ Companies WITH descriptionEnriched: ${withDescriptionEnriched.length} (${((withDescriptionEnriched.length / topEngineeringPlusCompanies.length) * 100).toFixed(2)}%)`);
    console.log(`❌ Companies WITHOUT descriptionEnriched: ${withoutDescriptionEnriched.length} (${((withoutDescriptionEnriched.length / topEngineeringPlusCompanies.length) * 100).toFixed(2)}%)`);
    console.log('');
    console.log(`📝 Companies with description field: ${withDescription.length} (${((withDescription.length / topEngineeringPlusCompanies.length) * 100).toFixed(2)}%)`);
    console.log(`📝 Companies with BOTH description and descriptionEnriched: ${withBoth.length} (${((withBoth.length / topEngineeringPlusCompanies.length) * 100).toFixed(2)}%)`);
    console.log(`⚠️  Companies with NEITHER description nor descriptionEnriched: ${withNeither.length} (${((withNeither.length / topEngineeringPlusCompanies.length) * 100).toFixed(2)}%)`);
    console.log('');

    // Check top-temp for comparison (if still exists)
    const topTempCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        descriptionEnriched: true
      }
    });

    const topTempWithDescriptionEnriched = topTempCompanies.filter(
      c => c.descriptionEnriched && c.descriptionEnriched.trim() !== ''
    );

    console.log('📊 Comparison with top-temp (source data):');
    console.log('-'.repeat(70));
    console.log(`Top-temp companies (non-deleted): ${topTempCompanies.length}`);
    console.log(`Top-temp companies WITH descriptionEnriched: ${topTempWithDescriptionEnriched.length} (${topTempCompanies.length > 0 ? ((topTempWithDescriptionEnriched.length / topTempCompanies.length) * 100).toFixed(2) : 0}%)`);
    console.log('');

    // Expected from transfer readiness doc: 389 companies (97.49%)
    const expectedWithDescriptionEnriched = 389;
    const expectedPercentage = 97.49;
    
    console.log('🎯 Expected vs Actual:');
    console.log('-'.repeat(70));
    console.log(`Expected from transfer audit: ${expectedWithDescriptionEnriched} companies with descriptionEnriched (${expectedPercentage}%)`);
    console.log(`Actual in TOP Engineering Plus: ${withDescriptionEnriched.length} companies with descriptionEnriched (${((withDescriptionEnriched.length / topEngineeringPlusCompanies.length) * 100).toFixed(2)}%)`);
    
    if (withDescriptionEnriched.length < expectedWithDescriptionEnriched) {
      const missing = expectedWithDescriptionEnriched - withDescriptionEnriched.length;
      console.log(`⚠️  WARNING: ${missing} companies are missing descriptionEnriched that should have it!`);
    } else {
      console.log(`✅ All expected companies have descriptionEnriched`);
    }
    console.log('');

    // Show sample companies without descriptionEnriched
    if (withoutDescriptionEnriched.length > 0) {
      console.log('📋 Sample companies WITHOUT descriptionEnriched (first 20):');
      console.log('-'.repeat(70));
      withoutDescriptionEnriched.slice(0, 20).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name} (ID: ${company.id})`);
        console.log(`   Has description: ${company.description ? 'Yes' : 'No'}`);
        console.log(`   Updated: ${company.updatedAt}`);
        console.log('');
      });
      
      if (withoutDescriptionEnriched.length > 20) {
        console.log(`... and ${withoutDescriptionEnriched.length - 20} more companies without descriptionEnriched`);
      }
      console.log('');
    }

    // Show sample companies with descriptionEnriched
    if (withDescriptionEnriched.length > 0) {
      console.log('✅ Sample companies WITH descriptionEnriched (first 5):');
      console.log('-'.repeat(70));
      withDescriptionEnriched.slice(0, 5).forEach((company, index) => {
        const preview = company.descriptionEnriched.substring(0, 150);
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   Preview: ${preview}...`);
        console.log(`   Length: ${company.descriptionEnriched.length} characters`);
        console.log('');
      });
      console.log('');
    }

    // Check if companies were transferred correctly by comparing IDs
    console.log('🔍 Checking if transfer preserved descriptionEnriched:');
    console.log('-'.repeat(70));
    
    // Get a sample of companies from both workspaces to compare
    const sampleTopTemp = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        descriptionEnriched: { not: null }
      },
      select: {
        id: true,
        name: true,
        descriptionEnriched: true
      },
      take: 10
    });

    const sampleTopEngineeringPlus = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        id: { in: sampleTopTemp.map(c => c.id) }
      },
      select: {
        id: true,
        name: true,
        descriptionEnriched: true
      }
    });

    console.log(`Found ${sampleTopEngineeringPlus.length} matching companies by ID`);
    
    let preservedCount = 0;
    let lostCount = 0;
    
    sampleTopTemp.forEach(tempCompany => {
      const engPlusCompany = sampleTopEngineeringPlus.find(c => c.id === tempCompany.id);
      if (engPlusCompany) {
        if (tempCompany.descriptionEnriched && engPlusCompany.descriptionEnriched) {
          preservedCount++;
        } else if (tempCompany.descriptionEnriched && !engPlusCompany.descriptionEnriched) {
          lostCount++;
          console.log(`⚠️  Lost descriptionEnriched: ${tempCompany.name} (ID: ${tempCompany.id})`);
        }
      }
    });

    console.log(`Preserved: ${preservedCount}, Lost: ${lostCount}`);
    console.log('');

    // Summary
    console.log('='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total companies: ${topEngineeringPlusCompanies.length}`);
    console.log(`With descriptionEnriched: ${withDescriptionEnriched.length} (${((withDescriptionEnriched.length / topEngineeringPlusCompanies.length) * 100).toFixed(2)}%)`);
    console.log(`Without descriptionEnriched: ${withoutDescriptionEnriched.length} (${((withoutDescriptionEnriched.length / topEngineeringPlusCompanies.length) * 100).toFixed(2)}%)`);
    
    if (withDescriptionEnriched.length < expectedWithDescriptionEnriched) {
      console.log('');
      console.log('⚠️  ISSUE DETECTED: Fewer companies have descriptionEnriched than expected!');
      console.log(`   Expected: ${expectedWithDescriptionEnriched}`);
      console.log(`   Actual: ${withDescriptionEnriched.length}`);
      console.log(`   Missing: ${expectedWithDescriptionEnriched - withDescriptionEnriched.length}`);
    } else {
      console.log('');
      console.log('✅ Company summaries appear to be transferred correctly');
    }

  } catch (error) {
    console.error('❌ Error auditing company summaries:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
if (require.main === module) {
  auditCompanySummaries()
    .then(() => {
      console.log('');
      console.log('✅ Audit complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

module.exports = { auditCompanySummaries };

