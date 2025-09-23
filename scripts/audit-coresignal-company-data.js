#!/usr/bin/env node

/**
 * 🔍 AUDIT CORESIGNAL COMPANY DATA
 * 
 * This script audits what CoreSignal company data we already have
 * and what we can enrich for the Overview tab fields:
 * - Description
 * - Company Name  
 * - Website
 * - Size
 * 
 * For TOP Engineering Plus workspace companies.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function auditCoreSignalCompanyData() {
  console.log('🔍 AUDITING CORESIGNAL COMPANY DATA');
  console.log('===================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get all companies in TOP workspace
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
        tags: true,
        customFields: true
      }
    });

    console.log(`📊 TOTAL COMPANIES: ${companies.length.toLocaleString()}\n`);

    // 1. CHECK CURRENT DATA COVERAGE
    console.log('📋 CURRENT DATA COVERAGE');
    console.log('========================\n');

    const currentCoverage = {
      'Company Name': companies.filter(c => c.name && c.name.trim() !== '').length,
      'Description': companies.filter(c => c.description && c.description.trim() !== '').length,
      'Website': companies.filter(c => c.website && c.website.trim() !== '').length,
      'Size': companies.filter(c => c.size && c.size.trim() !== '').length
    };

    console.log('📊 CURRENT OVERVIEW TAB COVERAGE:');
    Object.entries(currentCoverage).forEach(([field, count]) => {
      const percentage = ((count / companies.length) * 100).toFixed(1);
      const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
      console.log(`   ${status} ${field}: ${count.toLocaleString()}/${companies.length.toLocaleString()} (${percentage}%)`);
    });

    // 2. CHECK FOR EXISTING CORESIGNAL DATA
    console.log('\n🔍 CHECKING FOR EXISTING CORESIGNAL DATA');
    console.log('========================================\n');

    // Check if companies have CoreSignal data in customFields
    const companiesWithCoreSignalData = companies.filter(c => {
      if (!c.customFields || typeof c.customFields !== 'object') return false;
      
      const customFields = c.customFields;
      return (
        customFields.coresignalData ||
        customFields.coresignalCompanyId ||
        customFields.coresignalEnrichment ||
        customFields.employeeCount ||
        customFields.revenueData ||
        customFields.companyDescription ||
        customFields.foundedYear ||
        customFields.companySize
      );
    });

    console.log(`📊 COMPANIES WITH CORESIGNAL DATA: ${companiesWithCoreSignalData.length}/${companies.length} (${((companiesWithCoreSignalData.length / companies.length) * 100).toFixed(1)}%)\n`);

    if (companiesWithCoreSignalData.length > 0) {
      console.log('📋 SAMPLE COMPANIES WITH CORESIGNAL DATA:');
      companiesWithCoreSignalData.slice(0, 5).forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name}`);
        console.log(`      Custom Fields: ${Object.keys(company.customFields || {}).join(', ')}`);
        console.log('');
      });
    }

    // 3. ANALYZE WHAT CORESIGNAL DATA WE CAN GET
    console.log('🌟 CORESIGNAL DATA AVAILABLE FOR ENRICHMENT');
    console.log('==========================================\n');

    console.log('📊 CORESIGNAL CAN PROVIDE:');
    console.log('   ✅ Company Descriptions (from company profiles)');
    console.log('   ✅ Employee Count & Size Ranges (current + historical)');
    console.log('   ✅ Revenue Data (annual revenue ranges)');
    console.log('   ✅ Founded Year (company founding information)');
    console.log('   ✅ Industry Classifications (NAICS/SIC codes)');
    console.log('   ✅ Headquarters Location (country, region)');
    console.log('   ✅ Growth Metrics (employee count changes)');
    console.log('   ✅ Executive Movements (arrivals/departures)');
    console.log('   ✅ Hiring Activity (active job postings)\n');

    // 4. IDENTIFY COMPANIES NEEDING ENRICHMENT
    console.log('🎯 COMPANIES NEEDING ENRICHMENT');
    console.log('==============================\n');

    const companiesNeedingEnrichment = companies.filter(c => 
      !c.description || c.description.trim() === '' ||
      !c.size || c.size.trim() === ''
    );

    console.log(`📊 COMPANIES NEEDING ENRICHMENT: ${companiesNeedingEnrichment.length}/${companies.length} (${((companiesNeedingEnrichment.length / companies.length) * 100).toFixed(1)}%)\n`);

    // Break down by specific needs
    const needsDescription = companies.filter(c => !c.description || c.description.trim() === '');
    const needsSize = companies.filter(c => !c.size || c.size.trim() === '');
    const needsWebsite = companies.filter(c => !c.website || c.website.trim() === '');

    console.log('📋 ENRICHMENT NEEDS BREAKDOWN:');
    console.log(`   📝 Need Description: ${needsDescription.length} companies`);
    console.log(`   👥 Need Size: ${needsSize.length} companies`);
    console.log(`   🌐 Need Website: ${needsWebsite.length} companies\n`);

    // 5. SAMPLE COMPANIES FOR ENRICHMENT
    console.log('📋 SAMPLE COMPANIES FOR ENRICHMENT');
    console.log('==================================\n');

    const sampleCompanies = companiesNeedingEnrichment.slice(0, 10);
    sampleCompanies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name}`);
      console.log(`      Current: ${company.description ? '✅' : '❌'} Description, ${company.size ? '✅' : '❌'} Size, ${company.website ? '✅' : '❌'} Website`);
      console.log(`      Industry: ${company.industry || 'Unknown'}`);
      console.log('');
    });

    // 6. CORESIGNAL ENRICHMENT STRATEGY
    console.log('🚀 CORESIGNAL ENRICHMENT STRATEGY');
    console.log('=================================\n');

    console.log('🎯 ENRICHMENT PRIORITIES:');
    console.log('   1. 🔧 HIGH PRIORITY: Companies with websites but missing descriptions/size');
    console.log('   2. 📊 MEDIUM PRIORITY: Companies with industry data but missing other fields');
    console.log('   3. 🔍 LOW PRIORITY: Companies with minimal existing data\n');

    // Identify high priority companies (have website, missing description/size)
    const highPriorityCompanies = companies.filter(c => 
      c.website && c.website.trim() !== '' &&
      (!c.description || c.description.trim() === '' || !c.size || c.size.trim() === '')
    );

    console.log(`📊 HIGH PRIORITY COMPANIES: ${highPriorityCompanies.length} companies`);
    console.log('   (Have website, missing description/size - easiest to enrich)\n');

    // 7. IMPLEMENTATION PLAN
    console.log('💡 IMPLEMENTATION PLAN');
    console.log('======================\n');

    console.log('🔧 PHASE 1: CORE ENRICHMENT (High Priority)');
    console.log(`   • Target: ${highPriorityCompanies.length} companies with websites`);
    console.log('   • Use CoreSignal company search by website domain');
    console.log('   • Extract: Description, Size, Founded Year, Revenue\n');

    console.log('🔧 PHASE 2: BROAD ENRICHMENT (Medium Priority)');
    console.log(`   • Target: ${companiesNeedingEnrichment.length - highPriorityCompanies.length} remaining companies`);
    console.log('   • Use CoreSignal company search by name + industry');
    console.log('   • Extract: All available company data\n');

    console.log('🔧 PHASE 3: VALIDATION & CLEANUP');
    console.log('   • Validate enriched data accuracy');
    console.log('   • Update company records with enriched data');
    console.log('   • Verify Overview tab displays correctly\n');

    // 8. ESTIMATED RESULTS
    console.log('📈 ESTIMATED RESULTS AFTER ENRICHMENT');
    console.log('====================================\n');

    const estimatedCoverage = {
      'Company Name': companies.length, // Already 100%
      'Description': Math.min(companies.length, companies.length * 0.85), // Estimate 85% coverage
      'Website': companies.length * 0.95, // Estimate 95% coverage (some companies may not have websites)
      'Size': Math.min(companies.length, companies.length * 0.80) // Estimate 80% coverage
    };

    console.log('📊 ESTIMATED COVERAGE AFTER ENRICHMENT:');
    Object.entries(estimatedCoverage).forEach(([field, count]) => {
      const percentage = ((count / companies.length) * 100).toFixed(1);
      const currentPercentage = ((currentCoverage[field] / companies.length) * 100).toFixed(1);
      const improvement = (percentage - currentPercentage).toFixed(1);
      console.log(`   ${field}: ${count.toLocaleString()}/${companies.length.toLocaleString()} (${percentage}%) [+${improvement}%]`);
    });

    const estimatedOverallCoverage = Object.values(estimatedCoverage).reduce((sum, count) => sum + count, 0) / (Object.keys(estimatedCoverage).length * companies.length) * 100;
    const currentOverallCoverage = Object.values(currentCoverage).reduce((sum, count) => sum + count, 0) / (Object.keys(currentCoverage).length * companies.length) * 100;
    const overallImprovement = (estimatedOverallCoverage - currentOverallCoverage).toFixed(1);

    console.log(`\n🎯 OVERALL COVERAGE IMPROVEMENT: ${currentOverallCoverage.toFixed(1)}% → ${estimatedOverallCoverage.toFixed(1)}% [+${overallImprovement}%]\n`);

    // 9. NEXT STEPS
    console.log('🎯 NEXT STEPS');
    console.log('=============\n');

    console.log('1. 🔧 IMPLEMENT CORESIGNAL ENRICHMENT:');
    console.log('   • Use existing CoreSignal integration');
    console.log('   • Start with high-priority companies');
    console.log('   • Batch process for efficiency\n');

    console.log('2. 📊 MONITOR ENRICHMENT PROGRESS:');
    console.log('   • Track coverage improvements');
    console.log('   • Validate data quality');
    console.log('   • Update Overview tab display\n');

    console.log('3. 🎯 ACHIEVE FULL COVERAGE:');
    console.log('   • Target: 100% coverage for all Overview fields');
    console.log('   • Use multiple data sources if needed');
    console.log('   • Implement ongoing enrichment workflows\n');

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditCoreSignalCompanyData().catch(console.error);
