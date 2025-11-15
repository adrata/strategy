#!/usr/bin/env node

/**
 * User Statistics for TOP Engineering Plus
 * 
 * Provides statistics about:
 * 1. Total users in the workspace
 * 2. Main seller user ID for most companies/people
 * 
 * Usage:
 *   node scripts/user-stats-top-engineering-plus.js
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

// Track if we're already disconnecting to prevent double disconnects
let isDisconnecting = false;

// Safe disconnect function that prevents UV_HANDLE_CLOSING errors
async function safeDisconnect() {
  if (isDisconnecting) {
    return; // Already disconnecting, skip
  }
  
  isDisconnecting = true;
  
  try {
    if (prisma) {
      await prisma.$disconnect();
    }
  } catch (error) {
    // Ignore disconnect errors if already disconnected
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('already been disconnected') && 
        !errorMessage.includes('UV_HANDLE_CLOSING')) {
      console.warn('⚠️  [PRISMA] Disconnect warning:', errorMessage);
    }
  } finally {
    isDisconnecting = false;
  }
}

class UserStats {
  constructor() {
    this.stats = {
      users: {
        total: 0,
        active: 0,
        list: [],
        byRole: {}
      },
      companies: {
        byMainSeller: {},
        total: 0
      },
      people: {
        byUserId: {},
        byMainSeller: {},
        total: 0
      }
    };
  }

  log(message, level = 'info') {
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  async execute() {
    try {
      this.log('USER STATISTICS FOR TOP ENGINEERING PLUS', 'info');
      this.log('='.repeat(70), 'info');
      this.log('', 'info');

      await this.calculateStats();
      this.generateReport();

    } catch (error) {
      this.log(`Stats calculation failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      await safeDisconnect();
    }
  }

  async calculateStats() {
    // 1. Get all users in the workspace
    this.log('Fetching workspace users...', 'info');
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: WORKSPACE_ID,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        }
      }
    });

    this.stats.users.total = workspaceUsers.length;
    this.stats.users.active = workspaceUsers.filter(wu => wu.isActive).length;
    this.stats.users.list = workspaceUsers.map(wu => ({
      id: wu.user.id,
      name: wu.user.name,
      email: wu.user.email,
      username: wu.user.username,
      role: wu.role
    }));

    // Count users by role
    for (const wu of workspaceUsers) {
      const role = wu.role || 'UNKNOWN';
      this.stats.users.byRole[role] = (this.stats.users.byRole[role] || 0) + 1;
    }

    this.log(`Found ${this.stats.users.total} users in workspace`, 'info');
    this.log('', 'info');

    // 2. Count companies by mainSellerId
    this.log('Analyzing company ownership...', 'info');
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        mainSellerId: true
      }
    });

    // Count companies by mainSellerId
    this.stats.companies.total = companies.length;
    for (const company of companies) {
      const sellerId = company.mainSellerId || 'unassigned';
      this.stats.companies.byMainSeller[sellerId] = (this.stats.companies.byMainSeller[sellerId] || 0) + 1;
    }

    this.log(`Analyzed ${companies.length} companies`, 'info');
    this.log('', 'info');

    // 3. Count people by mainSellerId and userId
    this.log('Analyzing people ownership...', 'info');
    const people = await prisma.people.findMany({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        userId: true,
        mainSellerId: true
      }
    });

    // Count people by mainSellerId (primary) and userId (legacy)
    this.stats.people.total = people.length;
    for (const person of people) {
      const sellerId = person.mainSellerId || 'unassigned';
      this.stats.people.byMainSeller[sellerId] = (this.stats.people.byMainSeller[sellerId] || 0) + 1;
      
      // Also track by userId for comparison
      const userId = person.userId || 'unassigned';
      this.stats.people.byUserId[userId] = (this.stats.people.byUserId[userId] || 0) + 1;
    }

    this.log(`Analyzed ${people.length} people`, 'info');
    this.log('', 'info');
  }

  generateReport() {
    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('USER STATISTICS', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    // 1. Total Users
    this.log('1. TOTAL USERS IN WORKSPACE:', 'info');
    this.log(`   Total users: ${this.stats.users.total}`, 'success');
    this.log(`   Active users: ${this.stats.users.active}`, 'info');
    this.log('', 'info');

    if (this.stats.users.list.length > 0) {
      this.log('   User List:', 'info');
      for (const user of this.stats.users.list) {
        this.log(`     - ${user.name} (${user.email}) [${user.username || 'no username'}] - ${user.role}`, 'info');
      }
      this.log('', 'info');
      
      // Role breakdown
      this.log('   Role Breakdown:', 'info');
      const roleEntries = Object.entries(this.stats.users.byRole).sort((a, b) => b[1] - a[1]);
      for (const [role, count] of roleEntries) {
        const percentage = ((count / this.stats.users.total) * 100).toFixed(1);
        this.log(`     - ${role}: ${count} (${percentage}%)`, 'info');
      }
      this.log('', 'info');
    }

    // 2. Main Seller for Companies
    this.log('2. MAIN SELLER FOR COMPANIES:', 'info');
    const companyEntries = Object.entries(this.stats.companies.byMainSeller)
      .sort((a, b) => b[1] - a[1]);

    if (companyEntries.length === 0) {
      this.log('   No companies found', 'warn');
    } else {
      const totalCompanies = this.stats.companies.total;
      for (const [sellerId, count] of companyEntries.slice(0, 10)) {
        const user = this.stats.users.list.find(u => u.id === sellerId);
        const userName = user ? `${user.name} (${user.email})` : (sellerId === 'unassigned' ? 'Unassigned' : sellerId);
        const percentage = ((count / totalCompanies) * 100).toFixed(1);
        this.log(`   ${userName}: ${count} companies (${percentage}%)`, 'info');
      }
      
      const topSeller = companyEntries[0];
      if (topSeller && topSeller[0] !== 'unassigned') {
        const topUser = this.stats.users.list.find(u => u.id === topSeller[0]);
        const topUserName = topUser ? `${topUser.name} (${topUser.email})` : topSeller[0];
        const percentage = ((topSeller[1] / totalCompanies) * 100).toFixed(1);
        this.log('', 'info');
        this.log(`   ✅ Main seller: ${topUserName}`, 'success');
        this.log(`      User ID: ${topSeller[0]}`, 'info');
        this.log(`      Companies: ${topSeller[1]} (${percentage}% of total)`, 'info');
      }
    }
    this.log('', 'info');

    // 3. Main Seller for People (using mainSellerId)
    this.log('3. MAIN SELLER FOR PEOPLE:', 'info');
    const peopleEntries = Object.entries(this.stats.people.byMainSeller)
      .sort((a, b) => b[1] - a[1]);

    if (peopleEntries.length === 0) {
      this.log('   No people found', 'warn');
    } else {
      const totalPeople = this.stats.people.total;
      for (const [sellerId, count] of peopleEntries.slice(0, 10)) {
        const user = this.stats.users.list.find(u => u.id === sellerId);
        const userName = user ? `${user.name} (${user.email})` : (sellerId === 'unassigned' ? 'Unassigned' : sellerId);
        const percentage = ((count / totalPeople) * 100).toFixed(1);
        this.log(`   ${userName}: ${count} people (${percentage}%)`, 'info');
      }
      
      const topSeller = peopleEntries[0];
      if (topSeller && topSeller[0] !== 'unassigned') {
        const topUser = this.stats.users.list.find(u => u.id === topSeller[0]);
        const topUserName = topUser ? `${topUser.name} (${topUser.email})` : topSeller[0];
        const percentage = ((topSeller[1] / totalPeople) * 100).toFixed(1);
        this.log('', 'info');
        this.log(`   ✅ Main seller: ${topUserName}`, 'success');
        this.log(`      User ID: ${topSeller[0]}`, 'info');
        this.log(`      People: ${topSeller[1]} (${percentage}% of total)`, 'info');
      }
    }
    this.log('', 'info');

    // Summary
    this.log('='.repeat(70), 'info');
    this.log('SUMMARY:', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    const totalCompanies = this.stats.companies.total;
    const totalPeople = this.stats.people.total;
    const unassignedCompanies = this.stats.companies.byMainSeller['unassigned'] || 0;
    const unassignedPeople = this.stats.people.byMainSeller['unassigned'] || 0;
    const assignedCompanies = totalCompanies - unassignedCompanies;
    const assignedPeople = totalPeople - unassignedPeople;

    this.log(`Total Users: ${this.stats.users.total}`, 'info');
    this.log(`Total Companies: ${totalCompanies} (${assignedCompanies} assigned, ${unassignedCompanies} unassigned)`, 'info');
    this.log(`Total People: ${totalPeople} (${assignedPeople} assigned, ${unassignedPeople} unassigned)`, 'info');
    this.log('', 'info');
    
    // Identify overall main seller (combining companies and people)
    const combinedSellers = {};
    for (const [sellerId, count] of Object.entries(this.stats.companies.byMainSeller)) {
      if (sellerId !== 'unassigned') {
        combinedSellers[sellerId] = (combinedSellers[sellerId] || 0) + count;
      }
    }
    for (const [sellerId, count] of Object.entries(this.stats.people.byMainSeller)) {
      if (sellerId !== 'unassigned') {
        combinedSellers[sellerId] = (combinedSellers[sellerId] || 0) + count;
      }
    }
    
    const combinedEntries = Object.entries(combinedSellers).sort((a, b) => b[1] - a[1]);
    if (combinedEntries.length > 0) {
      const overallMainSeller = combinedEntries[0];
      const overallUser = this.stats.users.list.find(u => u.id === overallMainSeller[0]);
      const overallUserName = overallUser ? `${overallUser.name} (${overallUser.email})` : overallMainSeller[0];
      this.log('', 'info');
      this.log('🎯 OVERALL MAIN SELLER (Combined Companies + People):', 'info');
      this.log(`   ${overallUserName}`, 'success');
      this.log(`   Total Records: ${overallMainSeller[1]}`, 'info');
      this.log(`   - Companies: ${this.stats.companies.byMainSeller[overallMainSeller[0]] || 0}`, 'info');
      this.log(`   - People: ${this.stats.people.byMainSeller[overallMainSeller[0]] || 0}`, 'info');
    }
    this.log('', 'info');

    this.log('='.repeat(70), 'info');
    this.log('Statistics complete', 'success');
  }
}

// Main execution
async function main() {
  const stats = new UserStats();

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

module.exports = UserStats;
