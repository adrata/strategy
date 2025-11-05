#!/usr/bin/env node

/**
 * Analyze Dan's Companies - Extract matching criteria
 * This script queries the database for Dan's companies and analyzes their attributes
 * to identify patterns for finding similar companies
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function analyzeDanCompanies() {
  console.log('🔍 Analyzing Dan\'s Companies\n');
  console.log('═'.repeat(60));

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Find Dan's user
    const danUser = await prisma.users.findUnique({
      where: { id: DAN_USER_ID },
      select: { id: true, name: true, email: true }
    });

    if (!danUser) {
      console.error('❌ Dan user not found');
      process.exit(1);
    }

    console.log(`👤 User: ${danUser.name} (${danUser.email})\n`);

    // Get Dan's companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        mainSellerId: DAN_USER_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        industry: true,
        sector: true,
        country: true,
        state: true,
        city: true,
        employeeCount: true,
        revenue: true,
        description: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${companies.length} companies assigned to Dan\n`);

    if (companies.length === 0) {
      console.log('⚠️  No companies found. Cannot determine criteria.');
      await prisma.$disconnect();
      return;
    }

    // Analyze patterns
    console.log('📋 COMPANY ANALYSIS');
    console.log('═'.repeat(60));

    // Countries
    const countries = companies
      .map(c => c.country)
      .filter(Boolean)
      .map(c => c.toLowerCase());
    const countryCounts = {};
    countries.forEach(country => {
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    console.log('\n🌍 Countries:');
    Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([country, count]) => {
        console.log(`   ${country}: ${count} companies`);
      });

    // Industries
    const industries = companies
      .map(c => c.industry)
      .filter(Boolean);
    const industryCounts = {};
    industries.forEach(industry => {
      industryCounts[industry] = (industryCounts[industry] || 0) + 1;
    });
    console.log('\n🏭 Industries:');
    Object.entries(industryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([industry, count]) => {
        console.log(`   ${industry}: ${count} companies`);
      });

    // Employee count ranges
    const employeeCounts = companies
      .map(c => c.employeeCount)
      .filter(Boolean)
      .sort((a, b) => a - b);
    if (employeeCounts.length > 0) {
      console.log('\n👥 Employee Count Range:');
      console.log(`   Min: ${employeeCounts[0]}`);
      console.log(`   Max: ${employeeCounts[employeeCounts.length - 1]}`);
      console.log(`   Median: ${employeeCounts[Math.floor(employeeCounts.length / 2)]}`);
      console.log(`   Average: ${Math.round(employeeCounts.reduce((a, b) => a + b, 0) / employeeCounts.length)}`);
    }

    // Companies with LinkedIn
    const withLinkedIn = companies.filter(c => c.linkedinUrl).length;
    console.log(`\n🔗 Companies with LinkedIn: ${withLinkedIn}/${companies.length}`);

    // Companies with websites
    const withWebsite = companies.filter(c => c.website).length;
    console.log(`🌐 Companies with Website: ${withWebsite}/${companies.length}`);

    // List all companies
    console.log('\n📋 All Companies:');
    console.log('─'.repeat(60));
    companies.forEach((company, index) => {
      console.log(`\n${index + 1}. ${company.name}`);
      console.log(`   Industry: ${company.industry || 'N/A'}`);
      console.log(`   Country: ${company.country || 'N/A'}`);
      console.log(`   Employees: ${company.employeeCount || 'N/A'}`);
      console.log(`   Website: ${company.website || 'N/A'}`);
      console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
    });

    // Summary criteria
    console.log('\n\n🎯 IDENTIFIED CRITERIA FOR SIMILAR COMPANIES');
    console.log('═'.repeat(60));
    console.log(`✅ Country: ${Object.keys(countryCounts)[0] || 'USA'}`);
    console.log(`✅ Primary Industry: ${Object.keys(industryCounts)[0] || 'Software'}`);
    console.log(`✅ Employee Range: ${employeeCounts[0] || 'N/A'} - ${employeeCounts[employeeCounts.length - 1] || 'N/A'}`);
    console.log(`✅ Must have: Website and LinkedIn URL`);
    console.log(`❌ Exclude: Marketing/Sales software, Adrata competitors`);

    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeDanCompanies().catch(console.error);

