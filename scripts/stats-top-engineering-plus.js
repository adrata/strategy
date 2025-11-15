#!/usr/bin/env node

/**
 * TOP Engineering Plus Statistics
 * 
 * Provides comprehensive statistics about:
 * 1. Total people and companies
 * 2. People found via buyer group analysis
 * 3. People added from email analysis
 * 4. Originally uploaded people/companies
 * 
 * Usage:
 *   node scripts/stats-top-engineering-plus.js
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

const WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class TopEngineeringPlusStats {
  constructor() {
    this.stats = {
      companies: {
        total: 0,
        active: 0,
        fromEmailAnalysis: 0,
        originallyUploaded: 0,
        withBuyerGroups: 0
      },
      people: {
        total: 0,
        active: 0,
        fromEmailAnalysis: 0,
        fromBuyerGroups: 0,
        originallyUploaded: 0,
        withBuyerGroupRole: 0
      }
    };
  }

  log(message, level = 'info') {
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  async execute() {
    try {
      this.log('TOP ENGINEERING PLUS STATISTICS', 'info');
      this.log('='.repeat(70), 'info');
      this.log('', 'info');

      await this.calculateStats();
      this.generateReport();

    } catch (error) {
      this.log(`Stats calculation failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  }

  async calculateStats() {
    // 1. Total Companies
    this.log('Calculating company statistics...', 'info');
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: WORKSPACE_ID
      },
      select: {
        id: true,
        name: true,
        deletedAt: true,
        tags: true,
        customFields: true
      }
    });

    this.stats.companies.total = allCompanies.length;
    this.stats.companies.active = allCompanies.filter(c => !c.deletedAt).length;

    // Companies from email analysis (tagged with 'from-email-analysis')
    this.stats.companies.fromEmailAnalysis = allCompanies.filter(c => 
      c.tags && Array.isArray(c.tags) && c.tags.includes('from-email-analysis')
    ).length;

    // Companies with buyer groups
    const companiesWithBuyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: WORKSPACE_ID
      },
      select: {
        companyId: true
      },
      distinct: ['companyId']
    });

    this.stats.companies.withBuyerGroups = companiesWithBuyerGroups.length;

    // Originally uploaded = total - from email analysis
    this.stats.companies.originallyUploaded = 
      this.stats.companies.active - this.stats.companies.fromEmailAnalysis;

    this.log(`Companies: ${this.stats.companies.active} active`, 'info');
    this.log('', 'info');

    // 2. Total People
    this.log('Calculating people statistics...', 'info');
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: WORKSPACE_ID
      },
      select: {
        id: true,
        fullName: true,
        deletedAt: true,
        tags: true,
        customFields: true,
        buyerGroupRole: true
      }
    });

    this.stats.people.total = allPeople.length;
    const activePeople = allPeople.filter(p => !p.deletedAt);
    this.stats.people.active = activePeople.length;

    // People from email analysis (tagged with 'from-email-analysis') - ACTIVE ONLY
    this.stats.people.fromEmailAnalysis = activePeople.filter(p => 
      p.tags && Array.isArray(p.tags) && p.tags.includes('from-email-analysis')
    ).length;

    // People found via buyer groups (have buyerGroupRole set in people table) - ACTIVE ONLY
    // The buyer group pipeline sets buyerGroupRole on people records
    const peopleFromBuyerGroups = activePeople.filter(p => 
      p.buyerGroupRole !== null && p.buyerGroupRole !== undefined
    );

    this.stats.people.fromBuyerGroups = peopleFromBuyerGroups.length;

    // People with buyer group role assigned - ACTIVE ONLY
    this.stats.people.withBuyerGroupRole = activePeople.filter(p => 
      p.buyerGroupRole !== null && p.buyerGroupRole !== undefined
    ).length;

    // Originally uploaded = total - from email analysis
    this.stats.people.originallyUploaded = 
      this.stats.people.active - this.stats.people.fromEmailAnalysis;

    this.log(`People: ${this.stats.people.active} active`, 'info');
    this.log('', 'info');

    // Additional analysis: People from buyer groups that were NOT from email analysis - ACTIVE ONLY
    const peopleFromBuyerGroupsNotEmail = activePeople.filter(p => 
      p.buyerGroupRole !== null && p.buyerGroupRole !== undefined &&
      (!p.tags || !Array.isArray(p.tags) || !p.tags.includes('from-email-analysis'))
    ).length;

    this.stats.people.fromBuyerGroupsOnly = peopleFromBuyerGroupsNotEmail;
  }

  generateReport() {
    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('TOP ENGINEERING PLUS STATISTICS', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    // 1. Total Companies and People
    this.log('1. TOTAL PEOPLE AND COMPANIES IN TOP:', 'info');
    this.log(`   Companies: ${this.stats.companies.active} active (${this.stats.companies.total} total)`, 'info');
    this.log(`   People: ${this.stats.people.active} active (${this.stats.people.total} total)`, 'info');
    this.log('', 'info');

    // 2. People found via buyer groups
    this.log('2. PEOPLE FOUND VIA BUYER GROUP ANALYSIS:', 'info');
    this.log(`   Total people in buyer groups: ${this.stats.people.fromBuyerGroups}`, 'success');
    this.log(`   People with buyer group role: ${this.stats.people.withBuyerGroupRole}`, 'info');
    this.log(`   People from buyer groups (not from email): ${this.stats.people.fromBuyerGroupsOnly}`, 'info');
    this.log('', 'info');

    // 3. People added from email analysis
    this.log('3. PEOPLE ADDED FROM EMAIL ANALYSIS:', 'info');
    this.log(`   People added: ${this.stats.people.fromEmailAnalysis}`, 'success');
    this.log(`   Companies added: ${this.stats.companies.fromEmailAnalysis}`, 'success');
    
    // Check how many of the email-analysis people are in buyer groups
    const emailAnalysisPeopleInBuyerGroups = this.stats.people.fromEmailAnalysis > 0 
      ? Math.min(this.stats.people.fromEmailAnalysis, this.stats.people.fromBuyerGroups)
      : 0;
    
    if (this.stats.people.fromEmailAnalysis > 0) {
      this.log(`   People from email analysis in buyer groups: ${emailAnalysisPeopleInBuyerGroups}`, 'info');
    }
    this.log('', 'info');

    // 4. Originally uploaded
    this.log('4. ORIGINALLY UPLOADED (BEFORE EMAIL ANALYSIS):', 'info');
    this.log(`   Companies: ${this.stats.companies.originallyUploaded}`, 'info');
    this.log(`   People: ${this.stats.people.originallyUploaded}`, 'info');
    this.log('', 'info');

    // Summary breakdown
    this.log('='.repeat(70), 'info');
    this.log('BREAKDOWN:', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    this.log('COMPANIES:', 'info');
    this.log(`  Total active: ${this.stats.companies.active}`, 'info');
    this.log(`  Originally uploaded: ${this.stats.companies.originallyUploaded} (${((this.stats.companies.originallyUploaded / this.stats.companies.active) * 100).toFixed(2)}%)`, 'info');
    this.log(`  Added from email analysis: ${this.stats.companies.fromEmailAnalysis} (${((this.stats.companies.fromEmailAnalysis / this.stats.companies.active) * 100).toFixed(2)}%)`, 'success');
    this.log(`  Companies with buyer groups: ${this.stats.companies.withBuyerGroups}`, 'info');
    this.log('', 'info');

    this.log('PEOPLE:', 'info');
    this.log(`  Total active: ${this.stats.people.active}`, 'info');
    this.log(`  Originally uploaded: ${this.stats.people.originallyUploaded} (${((this.stats.people.originallyUploaded / this.stats.people.active) * 100).toFixed(2)}%)`, 'info');
    this.log(`  Added from email analysis: ${this.stats.people.fromEmailAnalysis} (${((this.stats.people.fromEmailAnalysis / this.stats.people.active) * 100).toFixed(2)}%)`, 'success');
    this.log(`  Found via buyer groups: ${this.stats.people.fromBuyerGroups} (${((this.stats.people.fromBuyerGroups / this.stats.people.active) * 100).toFixed(2)}%)`, 'success');
    this.log(`  With buyer group role: ${this.stats.people.withBuyerGroupRole} (${((this.stats.people.withBuyerGroupRole / this.stats.people.active) * 100).toFixed(2)}%)`, 'info');
    this.log('', 'info');

    // Answer the questions directly
    this.log('='.repeat(70), 'info');
    this.log('ANSWERS TO YOUR QUESTIONS:', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    this.log('1. Total people, companies in TOP:', 'info');
    this.log(`   ✅ Companies: ${this.stats.companies.active}`, 'success');
    this.log(`   ✅ People: ${this.stats.people.active}`, 'success');
    this.log('', 'info');

    this.log('2. How many people did WE find via buyer group?', 'info');
    this.log(`   ✅ ${this.stats.people.fromBuyerGroups} people found via buyer group analysis`, 'success');
    this.log(`      (${this.stats.people.fromBuyerGroupsOnly} were NOT from email analysis)`, 'info');
    this.log('', 'info');

    this.log('3. How many people did we add and find buyer groups via email?', 'info');
    this.log(`   ✅ ${this.stats.people.fromEmailAnalysis} people added from email analysis`, 'success');
    this.log(`   ✅ ${this.stats.companies.fromEmailAnalysis} companies added from email analysis`, 'success');
    this.log(`   ✅ ${this.stats.companies.withBuyerGroups} companies have buyer groups`, 'info');
    this.log('', 'info');

    this.log('4. How many were just originally uploaded?', 'info');
    this.log(`   ✅ Companies: ${this.stats.companies.originallyUploaded} originally uploaded`, 'info');
    this.log(`   ✅ People: ${this.stats.people.originallyUploaded} originally uploaded`, 'info');
    this.log('', 'info');

    this.log('='.repeat(70), 'info');
    this.log('Statistics complete', 'success');
  }
}

// Main execution
async function main() {
  const stats = new TopEngineeringPlusStats();

  try {
    await stats.execute();
    process.exit(0);
  } catch (error) {
    console.error('Stats calculation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TopEngineeringPlusStats;

