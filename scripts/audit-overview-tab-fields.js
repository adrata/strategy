#!/usr/bin/env node

/**
 * 🔍 AUDIT OVERVIEW TAB SPECIFIC FIELDS
 * 
 * This script audits the specific fields you want for the Overview tab:
 * 1. Description
 * 2. Company Name
 * 3. Website
 * 4. Size
 * 
 * For TOP Engineering Plus workspace companies.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function auditOverviewTabFields() {
  console.log('🔍 AUDITING OVERVIEW TAB SPECIFIC FIELDS');
  console.log('========================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get all companies in TOP workspace with the specific fields you want
    const companies = await prisma.companies.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        size: true,
        industry: true,
        tags: true
      }
    });

    console.log(`📊 TOTAL COMPANIES: ${companies.length.toLocaleString()}\n`);

    // 1. OVERVIEW TAB SPECIFIC FIELD COVERAGE
    console.log('📋 OVERVIEW TAB FIELD COVERAGE');
    console.log('==============================\n');

    const overviewFields = {
      'Company Name': companies.filter(c => c.name && c.name.trim() !== '').length,
      'Description': companies.filter(c => c.description && c.description.trim() !== '').length,
      'Website': companies.filter(c => c.website && c.website.trim() !== '').length,
      'Size': companies.filter(c => c.size && c.size.trim() !== '').length
    };

    console.log('📊 YOUR SPECIFIC OVERVIEW FIELDS:');
    Object.entries(overviewFields).forEach(([field, count]) => {
      const percentage = ((count / companies.length) * 100).toFixed(1);
      const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
      console.log(`   ${status} ${field}: ${count.toLocaleString()}/${companies.length.toLocaleString()} (${percentage}%)`);
    });

    // Calculate overall coverage for your specific fields
    const totalFields = Object.keys(overviewFields).length;
    const totalCoverage = Object.values(overviewFields).reduce((sum, count) => sum + count, 0);
    const overallCoverage = (totalCoverage / (totalFields * companies.length)) * 100;
    
    console.log(`\n📊 OVERALL OVERVIEW COVERAGE: ${overallCoverage.toFixed(1)}%\n`);

    // 2. DETAILED ANALYSIS BY FIELD
    console.log('🔍 DETAILED FIELD ANALYSIS');
    console.log('==========================\n');

    // Company Name Analysis
    const companiesWithoutName = companies.filter(c => !c.name || c.name.trim() === '');
    console.log(`📝 COMPANY NAME:`);
    console.log(`   ✅ Complete: ${overviewFields['Company Name']} companies`);
    console.log(`   ❌ Missing: ${companiesWithoutName.length} companies\n`);

    // Description Analysis
    const companiesWithoutDescription = companies.filter(c => !c.description || c.description.trim() === '');
    const companiesWithDescription = companies.filter(c => c.description && c.description.trim() !== '');
    console.log(`📝 DESCRIPTION:`);
    console.log(`   ✅ Complete: ${overviewFields['Description']} companies`);
    console.log(`   ❌ Missing: ${companiesWithoutDescription.length} companies`);
    
    if (companiesWithDescription.length > 0) {
      console.log(`   📋 Sample descriptions:`);
      companiesWithDescription.slice(0, 3).forEach((company, index) => {
        const desc = company.description.length > 100 ? 
          company.description.substring(0, 100) + '...' : 
          company.description;
        console.log(`      ${index + 1}. ${company.name}: "${desc}"`);
      });
    }
    console.log('');

    // Website Analysis
    const companiesWithoutWebsite = companies.filter(c => !c.website || c.website.trim() === '');
    const companiesWithWebsite = companies.filter(c => c.website && c.website.trim() !== '');
    console.log(`🌐 WEBSITE:`);
    console.log(`   ✅ Complete: ${overviewFields['Website']} companies`);
    console.log(`   ❌ Missing: ${companiesWithoutWebsite.length} companies`);
    
    if (companiesWithWebsite.length > 0) {
      console.log(`   📋 Sample websites:`);
      companiesWithWebsite.slice(0, 5).forEach((company, index) => {
        console.log(`      ${index + 1}. ${company.name}: ${company.website}`);
      });
    }
    console.log('');

    // Size Analysis
    const companiesWithoutSize = companies.filter(c => !c.size || c.size.trim() === '');
    const companiesWithSize = companies.filter(c => c.size && c.size.trim() !== '');
    console.log(`👥 SIZE:`);
    console.log(`   ✅ Complete: ${overviewFields['Size']} companies`);
    console.log(`   ❌ Missing: ${companiesWithoutSize.length} companies`);
    
    if (companiesWithSize.length > 0) {
      console.log(`   📋 Sample sizes:`);
      companiesWithSize.slice(0, 5).forEach((company, index) => {
        console.log(`      ${index + 1}. ${company.name}: ${company.size}`);
      });
    }
    console.log('');

    // 3. COMPANIES WITH COMPLETE OVERVIEW DATA
    console.log('✅ COMPANIES WITH COMPLETE OVERVIEW DATA');
    console.log('=======================================\n');

    const completeCompanies = companies.filter(c => 
      c.name && c.name.trim() !== '' &&
      c.description && c.description.trim() !== '' &&
      c.website && c.website.trim() !== '' &&
      c.size && c.size.trim() !== ''
    );

    console.log(`📊 COMPLETE OVERVIEW DATA: ${completeCompanies.length}/${companies.length} companies (${((completeCompanies.length / companies.length) * 100).toFixed(1)}%)\n`);

    if (completeCompanies.length > 0) {
      console.log('📋 COMPANIES WITH ALL OVERVIEW FIELDS:');
      completeCompanies.slice(0, 10).forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name}`);
        console.log(`      Description: ${company.description.substring(0, 80)}...`);
        console.log(`      Website: ${company.website}`);
        console.log(`      Size: ${company.size}`);
        console.log('');
      });
    }

    // 4. COMPANIES MISSING SPECIFIC FIELDS
    console.log('❌ COMPANIES MISSING SPECIFIC FIELDS');
    console.log('===================================\n');

    const missingFields = {
      'Missing Description': companiesWithoutDescription,
      'Missing Website': companiesWithoutWebsite,
      'Missing Size': companiesWithoutSize
    };

    Object.entries(missingFields).forEach(([field, companiesList]) => {
      if (companiesList.length > 0) {
        console.log(`📋 ${field.toUpperCase()} (${companiesList.length} companies):`);
        companiesList.slice(0, 5).forEach((company, index) => {
          console.log(`   ${index + 1}. ${company.name}`);
        });
        if (companiesList.length > 5) {
          console.log(`   ... and ${companiesList.length - 5} more`);
        }
        console.log('');
      }
    });

    // 5. RECOMMENDATIONS
    console.log('💡 RECOMMENDATIONS');
    console.log('==================\n');

    console.log('🎯 PRIORITY ACTIONS:');
    
    if (companiesWithoutDescription.length > 0) {
      console.log(`   1. 🔧 ADD DESCRIPTIONS: ${companiesWithoutDescription.length} companies need descriptions`);
    }
    
    if (companiesWithoutWebsite.length > 0) {
      console.log(`   2. 🌐 ADD WEBSITES: ${companiesWithoutWebsite.length} companies need websites`);
    }
    
    if (companiesWithoutSize.length > 0) {
      console.log(`   3. 👥 ADD SIZES: ${companiesWithoutSize.length} companies need size information`);
    }

    console.log('\n📊 DATA ENRICHMENT STRATEGY:');
    console.log('   1. 🔍 WEB SCRAPING: Extract descriptions from company websites');
    console.log('   2. 📊 API INTEGRATION: Use business APIs for size and description data');
    console.log('   3. 🏷️ MANUAL REVIEW: Review and enhance existing descriptions');
    console.log('   4. 📈 PROGRESSIVE ENRICHMENT: Focus on high-priority companies first\n');

    // 6. FINAL ASSESSMENT
    console.log('📈 FINAL ASSESSMENT');
    console.log('==================\n');
    
    const fieldScores = Object.entries(overviewFields).map(([field, count]) => ({
      field,
      score: (count / companies.length) * 100
    }));

    console.log('📊 FIELD SCORES:');
    fieldScores.forEach(({ field, score }) => {
      const status = score >= 80 ? '✅' : score >= 50 ? '⚠️' : '❌';
      console.log(`   ${status} ${field}: ${score.toFixed(1)}%`);
    });

    console.log(`\n🎯 OVERALL OVERVIEW TAB READINESS: ${overallCoverage.toFixed(1)}%`);
    
    if (overallCoverage >= 80) {
      console.log('   ✅ EXCELLENT: Overview tab is well-populated');
    } else if (overallCoverage >= 60) {
      console.log('   ⚠️  GOOD: Overview tab has decent coverage');
    } else if (overallCoverage >= 40) {
      console.log('   ⚠️  FAIR: Overview tab needs improvement');
    } else {
      console.log('   ❌ POOR: Overview tab needs significant work');
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditOverviewTabFields().catch(console.error);
