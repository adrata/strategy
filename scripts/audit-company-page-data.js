#!/usr/bin/env node

/**
 * 🔍 AUDIT COMPANY PAGE DATA
 * 
 * This script audits the data coverage for company pages, specifically:
 * 1. Overview tab data coverage
 * 2. Intelligence tab data coverage
 * 
 * For TOP Engineering Plus workspace companies.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function auditCompanyPageData() {
  console.log('🔍 AUDITING COMPANY PAGE DATA COVERAGE');
  console.log('======================================\n');
  
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
        industry: true,
        size: true,
        revenue: true,
        website: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        sector: true,
        accountType: true,
        tags: true,
        customFields: true,
        createdAt: true,
        updatedAt: true,
        businessChallenges: true,
        businessPriorities: true,
        marketPosition: true,
        growthPotential: true
      }
    });

    console.log(`📊 TOTAL COMPANIES: ${companies.length.toLocaleString()}\n`);

    // 1. OVERVIEW TAB DATA COVERAGE ANALYSIS
    console.log('📋 1. OVERVIEW TAB DATA COVERAGE');
    console.log('================================\n');

    const overviewFields = {
      'Company Name': companies.filter(c => c.name && c.name.trim() !== '').length,
      'Industry': companies.filter(c => c.industry && c.industry.trim() !== '').length,
      'Company Size': companies.filter(c => c.size && c.size.trim() !== '').length,
      'Revenue': companies.filter(c => c.revenue && c.revenue > 0).length,
      'Website': companies.filter(c => c.website && c.website.trim() !== '').length,
      'Description': companies.filter(c => c.description && c.description.trim() !== '').length,
      'Address': companies.filter(c => c.address && c.address.trim() !== '').length,
      'City': companies.filter(c => c.city && c.city.trim() !== '').length,
      'State': companies.filter(c => c.state && c.state.trim() !== '').length,
      'Country': companies.filter(c => c.country && c.country.trim() !== '').length,
      'Sector': companies.filter(c => c.sector && c.sector.trim() !== '').length,
      'Account Type': companies.filter(c => c.accountType && c.accountType.trim() !== '').length,
      'Tags': companies.filter(c => c.tags && c.tags.length > 0).length,
      'Custom Fields': companies.filter(c => c.customFields && Object.keys(c.customFields).length > 0).length
    };

    console.log('📊 OVERVIEW TAB FIELD COVERAGE:');
    Object.entries(overviewFields).forEach(([field, count]) => {
      const percentage = ((count / companies.length) * 100).toFixed(1);
      const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
      console.log(`   ${status} ${field}: ${count.toLocaleString()}/${companies.length.toLocaleString()} (${percentage}%)`);
    });

    // Calculate overall overview coverage
    const overviewCoverage = Object.values(overviewFields).reduce((sum, count) => sum + count, 0) / (Object.keys(overviewFields).length * companies.length) * 100;
    console.log(`\n📊 OVERALL OVERVIEW COVERAGE: ${overviewCoverage.toFixed(1)}%\n`);

    // 2. INTELLIGENCE TAB DATA COVERAGE ANALYSIS
    console.log('🧠 2. INTELLIGENCE TAB DATA COVERAGE');
    console.log('===================================\n');

    // Get buyer groups for intelligence analysis
    const buyerGroups = await prisma.buyer_groups.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: {
        id: true,
        companyId: true,
        name: true,
        description: true,
        purpose: true,
        status: true,
        priority: true,
        estimatedValue: true,
        budget: true,
        timeline: true,
        decisionProcess: true,
        notes: true,
        tags: true,
        customFields: true,
        _count: {
          select: {
            people: true
          }
        }
      }
    });

    // Get people in buyer groups for intelligence analysis
    const peopleInBuyerGroups = await prisma.buyerGroupToPerson.findMany({
      where: {
        buyerGroup: {
          workspaceId: TOP_WORKSPACE_ID
        }
      },
      select: {
        buyerGroupId: true,
        personId: true,
        role: true,
        influence: true,
        isPrimary: true,
        notes: true
      }
    });

    // Get opportunities for intelligence analysis
    const opportunities = await prisma.opportunities.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: {
        id: true,
        accountId: true,
        name: true,
        stage: true,
        amount: true,
        probability: true,
        expectedCloseDate: true,
        description: true,
        notes: true
      }
    });

    console.log('📊 INTELLIGENCE DATA AVAILABILITY:');
    console.log(`   Companies with Buyer Groups: ${new Set(buyerGroups.map(bg => bg.companyId)).size.toLocaleString()}`);
    console.log(`   Total Buyer Groups: ${buyerGroups.length.toLocaleString()}`);
    console.log(`   People in Buyer Groups: ${peopleInBuyerGroups.length.toLocaleString()}`);
    console.log(`   Total Opportunities: ${opportunities.length.toLocaleString()}\n`);

    // Intelligence field coverage
    const intelligenceFields = {
      'Buyer Group Analysis': new Set(buyerGroups.map(bg => bg.companyId)).size,
      'Decision Makers': peopleInBuyerGroups.filter(p => p.role === 'Decision Maker').length,
      'High Influence Contacts': peopleInBuyerGroups.filter(p => p.influence === 'High').length,
      'Primary Contacts': peopleInBuyerGroups.filter(p => p.isPrimary).length,
      'Active Opportunities': opportunities.filter(o => o.stage && o.stage !== 'closed').length,
      'Opportunity Value': opportunities.filter(o => o.amount && o.amount > 0).length,
      'Sales Pipeline Data': opportunities.length
    };

    console.log('📊 INTELLIGENCE FIELD COVERAGE:');
    Object.entries(intelligenceFields).forEach(([field, count]) => {
      const percentage = companies.length > 0 ? ((count / companies.length) * 100).toFixed(1) : '0.0';
      const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
      console.log(`   ${status} ${field}: ${count.toLocaleString()}/${companies.length.toLocaleString()} (${percentage}%)`);
    });

    // Calculate overall intelligence coverage
    const intelligenceCoverage = Object.values(intelligenceFields).reduce((sum, count) => sum + count, 0) / (Object.keys(intelligenceFields).length * companies.length) * 100;
    console.log(`\n📊 OVERALL INTELLIGENCE COVERAGE: ${intelligenceCoverage.toFixed(1)}%\n`);

    // 3. DETAILED ANALYSIS BY COMPANY
    console.log('🏢 3. TOP 10 COMPANIES DATA ANALYSIS');
    console.log('===================================\n');

    // Get companies with most buyer group people
    const companiesWithBuyerGroups = companies.map(company => {
      const companyBuyerGroups = buyerGroups.filter(bg => bg.companyId === company.id);
      const totalPeople = companyBuyerGroups.reduce((sum, bg) => sum + bg._count.people, 0);
      const companyOpportunities = opportunities.filter(o => o.accountId === company.id);
      
      return {
        ...company,
        buyerGroupsCount: companyBuyerGroups.length,
        peopleInBuyerGroups: totalPeople,
        opportunitiesCount: companyOpportunities.length,
        totalOpportunityValue: companyOpportunities.reduce((sum, o) => sum + (o.amount || 0), 0)
      };
    }).sort((a, b) => b.peopleInBuyerGroups - a.peopleInBuyerGroups);

    console.log('📈 TOP 10 COMPANIES BY BUYER GROUP SIZE:');
    companiesWithBuyerGroups.slice(0, 10).forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name}`);
      console.log(`      Overview: ${company.industry ? '✅' : '❌'} Industry, ${company.size ? '✅' : '❌'} Size, ${company.revenue ? '✅' : '❌'} Revenue`);
      console.log(`      Intelligence: ${company.buyerGroupsCount} buyer groups, ${company.peopleInBuyerGroups} people, ${company.opportunitiesCount} opportunities`);
      console.log('');
    });

    // 4. MISSING DATA ANALYSIS
    console.log('❌ 4. MISSING DATA ANALYSIS');
    console.log('===========================\n');

    const missingData = {
      'No Industry': companies.filter(c => !c.industry || c.industry.trim() === '').length,
      'No Company Size': companies.filter(c => !c.size || c.size.trim() === '').length,
      'No Revenue': companies.filter(c => !c.revenue || c.revenue <= 0).length,
      'No Website': companies.filter(c => !c.website || c.website.trim() === '').length,
      'No Description': companies.filter(c => !c.description || c.description.trim() === '').length,
      'No Buyer Groups': companies.filter(c => !buyerGroups.some(bg => bg.companyId === c.id)).length,
      'No Opportunities': companies.filter(c => !opportunities.some(o => o.accountId === c.id)).length
    };

    console.log('📊 COMPANIES WITH MISSING DATA:');
    Object.entries(missingData).forEach(([field, count]) => {
      const percentage = ((count / companies.length) * 100).toFixed(1);
      console.log(`   ${field}: ${count.toLocaleString()} companies (${percentage}%)`);
    });

    // 5. RECOMMENDATIONS
    console.log('\n💡 5. RECOMMENDATIONS');
    console.log('====================\n');

    console.log('🎯 OVERVIEW TAB IMPROVEMENTS:');
    if (overviewCoverage < 80) {
      console.log('   1. 🔧 ENRICH COMPANY DATA: Fill missing industry, employee count, revenue fields');
      console.log('   2. 📊 IMPLEMENT DATA ENRICHMENT: Use APIs to populate missing company information');
      console.log('   3. 🏷️ ADD TAGS: Categorize companies with relevant tags');
    } else {
      console.log('   ✅ Overview tab data coverage is excellent!');
    }

    console.log('\n🧠 INTELLIGENCE TAB IMPROVEMENTS:');
    if (intelligenceCoverage < 80) {
      console.log('   1. 🔗 CREATE BUYER GROUPS: Ensure all companies have buyer groups');
      console.log('   2. 👥 ADD PEOPLE: Populate buyer groups with relevant contacts');
      console.log('   3. 🎯 CREATE OPPORTUNITIES: Generate opportunities for qualified prospects');
      console.log('   4. 📈 TRACK SALES PIPELINE: Monitor opportunity progression');
    } else {
      console.log('   ✅ Intelligence tab data coverage is excellent!');
    }

    console.log('\n📊 OVERALL ASSESSMENT:');
    if (overviewCoverage >= 80 && intelligenceCoverage >= 80) {
      console.log('   ✅ EXCELLENT: Both tabs have comprehensive data coverage');
    } else if (overviewCoverage >= 60 && intelligenceCoverage >= 60) {
      console.log('   ⚠️  GOOD: Data coverage is adequate but could be improved');
    } else {
      console.log('   ❌ NEEDS IMPROVEMENT: Significant data gaps in both tabs');
    }

    console.log(`\n📈 FINAL SCORES:`);
    console.log(`   Overview Tab: ${overviewCoverage.toFixed(1)}%`);
    console.log(`   Intelligence Tab: ${intelligenceCoverage.toFixed(1)}%`);
    console.log(`   Overall: ${((overviewCoverage + intelligenceCoverage) / 2).toFixed(1)}%\n`);

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditCompanyPageData().catch(console.error);
