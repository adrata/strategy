#!/usr/bin/env node

/**
 * Audit TOP Engineering Plus Workspace
 * 
 * Audits the current state of TOP Engineering Plus workspace:
 * - Companies and people counts
 * - Whether old or new (transferred) data exists
 * - User creation status
 * 
 * Usage:
 *   node scripts/audit-top-engineering-plus-workspace.js
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

// Expected user mappings from transfer
const EXPECTED_USER_MAPPINGS = {
  'temp-victoria': 'Victoria Leland',
  'temp-justin': 'Justin Bedard',
  'temp-judy': 'Judy Wigginton',
  'temp-hilary': 'Hilary Tristan'
};

class TopEngineeringPlusAudit {
  constructor() {
    this.results = {
      workspace: {
        id: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        name: null
      },
      companies: {
        total: 0,
        active: 0,
        deleted: 0,
        fromTopTemp: 0,
        oldData: 0,
        sample: []
      },
      people: {
        total: 0,
        active: 0,
        deleted: 0,
        fromTopTemp: 0,
        oldData: 0,
        sample: []
      },
      users: {
        total: 0,
        workspaceUsers: 0,
        created: [],
        existing: [],
        mapped: []
      },
      transferStatus: {
        completed: false,
        oldDataRemoved: false
      }
    };
  }

  log(message, level = 'info') {
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  async execute() {
    try {
      this.log('TOP ENGINEERING PLUS WORKSPACE AUDIT', 'info');
      this.log('='.repeat(70), 'info');
      this.log('', 'info');

      // Get workspace info
      await this.getWorkspaceInfo();

      // Audit companies
      await this.auditCompanies();

      // Audit people
      await this.auditPeople();

      // Audit users
      await this.auditUsers();

      // Determine transfer status
      await this.determineTransferStatus();

      // Generate report
      this.generateReport();

    } catch (error) {
      this.log(`Audit failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }
  }

  async getWorkspaceInfo() {
    const workspace = await prisma.workspaces.findUnique({
      where: { id: TOP_ENGINEERING_PLUS_WORKSPACE_ID },
      select: { id: true, name: true, slug: true }
    });

    if (workspace) {
      this.results.workspace.name = workspace.name;
      this.results.workspace.slug = workspace.slug;
      this.log(`Workspace: ${workspace.name} (${workspace.slug})`, 'info');
    } else {
      this.log(`Workspace ${TOP_ENGINEERING_PLUS_WORKSPACE_ID} not found`, 'error');
    }
    this.log('', 'info');
  }

  async auditCompanies() {
    this.log('Auditing Companies', 'info');
    this.log('-'.repeat(70), 'info');

    // Get all companies in TOP Engineering Plus
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
      }
    });

    this.results.companies.total = allCompanies.length;
    this.results.companies.active = allCompanies.filter(c => !c.deletedAt).length;
    this.results.companies.deleted = allCompanies.filter(c => c.deletedAt).length;

    // Get companies that are currently in top-temp (not transferred yet)
    const topTempCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      },
      select: { id: true, name: true }
    });

    // Get companies that are soft-deleted in top-temp (likely transferred)
    const topTempDeletedCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: { not: null }
      },
      select: { id: true, name: true }
    });

    // Check which companies in TOP Engineering Plus match IDs from top-temp (transferred or deleted)
    const topTempAllIds = new Set([
      ...topTempCompanies.map(c => c.id),
      ...topTempDeletedCompanies.map(c => c.id)
    ]);

    // Companies in TOP Engineering Plus that match top-temp IDs are transferred
    const transferredCompanies = allCompanies.filter(c => topTempAllIds.has(c.id));
    this.results.companies.fromTopTemp = transferredCompanies.length;

    // Companies that are NOT from top-temp are "old" data
    this.results.companies.oldData = allCompanies.filter(c => !topTempAllIds.has(c.id)).length;

    // Also check: are there still companies in top-temp that should have been transferred?
    if (topTempCompanies.length > 0) {
      this.log(`⚠️  Warning: ${topTempCompanies.length} companies still in top-temp (not transferred)`, 'warn');
    }

    // Sample companies
    const activeCompanies = allCompanies.filter(c => !c.deletedAt);
    this.results.companies.sample = activeCompanies.slice(0, 5).map(c => ({
      id: c.id,
      name: c.name,
      fromTopTemp: topTempAllIds.has(c.id),
      deletedAt: c.deletedAt
    }));

    this.log(`Total companies: ${this.results.companies.total}`, 'info');
    this.log(`Active companies: ${this.results.companies.active}`, 'info');
    this.log(`Deleted companies: ${this.results.companies.deleted}`, 'info');
    this.log(`Companies from top-temp (transferred): ${this.results.companies.fromTopTemp}`, 'info');
    this.log(`Old companies (not from top-temp): ${this.results.companies.oldData}`, 'info');
    this.log('', 'info');
  }

  async auditPeople() {
    this.log('Auditing People', 'info');
    this.log('-'.repeat(70), 'info');

    // Get all people in TOP Engineering Plus
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
      }
    });

    this.results.people.total = allPeople.length;
    this.results.people.active = allPeople.filter(p => !p.deletedAt).length;
    this.results.people.deleted = allPeople.filter(p => p.deletedAt).length;

    // Get people that are currently in top-temp (not transferred yet)
    const topTempPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      },
      select: { id: true, fullName: true }
    });

    // Get people that are soft-deleted in top-temp (likely transferred)
    const topTempDeletedPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: { not: null }
      },
      select: { id: true, fullName: true }
    });

    // Check which people in TOP Engineering Plus match IDs from top-temp (transferred or deleted)
    const topTempAllIds = new Set([
      ...topTempPeople.map(p => p.id),
      ...topTempDeletedPeople.map(p => p.id)
    ]);

    // People in TOP Engineering Plus that match top-temp IDs are transferred
    const transferredPeople = allPeople.filter(p => topTempAllIds.has(p.id));
    this.results.people.fromTopTemp = transferredPeople.length;

    // People that are NOT from top-temp are "old" data
    this.results.people.oldData = allPeople.filter(p => !topTempAllIds.has(p.id)).length;

    // Also check: are there still people in top-temp that should have been transferred?
    if (topTempPeople.length > 0) {
      this.log(`⚠️  Warning: ${topTempPeople.length} people still in top-temp (not transferred)`, 'warn');
    }

    // Sample people
    const activePeople = allPeople.filter(p => !p.deletedAt);
    this.results.people.sample = activePeople.slice(0, 5).map(p => ({
      id: p.id,
      fullName: p.fullName,
      fromTopTemp: topTempAllIds.has(p.id),
      deletedAt: p.deletedAt
    }));

    this.log(`Total people: ${this.results.people.total}`, 'info');
    this.log(`Active people: ${this.results.people.active}`, 'info');
    this.log(`Deleted people: ${this.results.people.deleted}`, 'info');
    this.log(`People from top-temp (transferred): ${this.results.people.fromTopTemp}`, 'info');
    this.log(`Old people (not from top-temp): ${this.results.people.oldData}`, 'info');
    this.log('', 'info');
  }

  async auditUsers() {
    this.log('Auditing Users', 'info');
    this.log('-'.repeat(70), 'info');

    // Get all users in the system
    const allUsers = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    this.results.users.total = allUsers.length;

    // Get workspace users for TOP Engineering Plus
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            createdAt: true
          }
        }
      }
    });

    this.results.users.workspaceUsers = workspaceUsers.length;

    // Check for users that might have been created during transfer
    // Look for users created recently (within last 7 days) or with temp- prefix
    const recentUsers = allUsers.filter(u => {
      const createdAt = new Date(u.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return createdAt > sevenDaysAgo;
    });

    const tempUsers = allUsers.filter(u => 
      u.username && u.username.startsWith('temp-')
    );

    // Check for mapped users (Victoria, Justin, Judy, Hilary)
    const mappedUsers = workspaceUsers
      .map(wu => wu.user)
      .filter(u => {
        const name = (u.name || '').toLowerCase();
        return name.includes('victoria') || 
               name.includes('justin') || 
               name.includes('judy') || 
               name.includes('hilary');
      });

    this.results.users.created = [...new Set([...recentUsers, ...tempUsers])].map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      username: u.username,
      createdAt: u.createdAt
    }));

    this.results.users.existing = workspaceUsers
      .map(wu => wu.user)
      .filter(u => !this.results.users.created.some(cu => cu.id === u.id))
      .map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        username: u.username
      }));

    this.results.users.mapped = mappedUsers.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      username: u.username
    }));

    this.log(`Total users in system: ${this.results.users.total}`, 'info');
    this.log(`Workspace users: ${this.results.users.workspaceUsers}`, 'info');
    this.log(`Recently created users (last 7 days): ${recentUsers.length}`, 'info');
    this.log(`Temp users (temp- prefix): ${tempUsers.length}`, 'info');
    this.log(`Mapped users (Victoria, Justin, Judy, Hilary): ${this.results.users.mapped.length}`, 'info');
    this.log('', 'info');
  }

  async determineTransferStatus() {
    this.log('Determining Transfer Status', 'info');
    this.log('-'.repeat(70), 'info');

    // Transfer is considered complete if we have transferred data
    this.results.transferStatus.completed = 
      this.results.companies.fromTopTemp > 0 || 
      this.results.people.fromTopTemp > 0;

    // Old data is considered removed if there are no old companies/people
    // OR if old data is soft-deleted
    const oldCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null
      }
    });

    const oldPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null
      }
    });

    // Get all top-temp IDs (including soft-deleted)
    const topTempAllCompanyIds = await prisma.companies.findMany({
      where: { workspaceId: TOP_TEMP_WORKSPACE_ID },
      select: { id: true }
    });
    const topTempCompanyIdSet = new Set(topTempAllCompanyIds.map(c => c.id));

    const topTempAllPeopleIds = await prisma.people.findMany({
      where: { workspaceId: TOP_TEMP_WORKSPACE_ID },
      select: { id: true }
    });
    const topTempPeopleIdSet = new Set(topTempAllPeopleIds.map(p => p.id));

    // Check if any active companies/people are NOT from top-temp
    const activeOldCompanies = oldCompanies.filter(c => !topTempCompanyIdSet.has(c.id));
    const activeOldPeople = oldPeople.filter(p => !topTempPeopleIdSet.has(p.id));

    this.results.transferStatus.oldDataRemoved = 
      activeOldCompanies.length === 0 && 
      activeOldPeople.length === 0;

    this.log(`Transfer completed: ${this.results.transferStatus.completed ? 'YES' : 'NO'}`, 
      this.results.transferStatus.completed ? 'success' : 'warn');
    this.log(`Old data removed: ${this.results.transferStatus.oldDataRemoved ? 'YES' : 'NO'}`, 
      this.results.transferStatus.oldDataRemoved ? 'success' : 'warn');
    if (!this.results.transferStatus.oldDataRemoved) {
      this.log(`Active old companies remaining: ${activeOldCompanies.length}`, 'warn');
      this.log(`Active old people remaining: ${activeOldPeople.length}`, 'warn');
    }
    this.log('', 'info');
  }

  generateReport() {
    this.log('='.repeat(70), 'info');
    this.log('TOP ENGINEERING PLUS WORKSPACE AUDIT SUMMARY', 'info');
    this.log('='.repeat(70), 'info');

    // Workspace Info
    this.log('', 'info');
    this.log('WORKSPACE:', 'info');
    this.log(`  Name: ${this.results.workspace.name || 'Unknown'}`, 'info');
    this.log(`  ID: ${this.results.workspace.id}`, 'info');

    // Companies
    this.log('', 'info');
    this.log('COMPANIES:', 'info');
    this.log(`  Total: ${this.results.companies.total}`, 'info');
    this.log(`  Active: ${this.results.companies.active}`, 'info');
    this.log(`  Deleted: ${this.results.companies.deleted}`, 'info');
    this.log(`  From top-temp (transferred): ${this.results.companies.fromTopTemp}`, 
      this.results.companies.fromTopTemp > 0 ? 'success' : 'warn');
    this.log(`  Old data (not from top-temp): ${this.results.companies.oldData}`, 
      this.results.companies.oldData === 0 ? 'success' : 'warn');

    // People
    this.log('', 'info');
    this.log('PEOPLE:', 'info');
    this.log(`  Total: ${this.results.people.total}`, 'info');
    this.log(`  Active: ${this.results.people.active}`, 'info');
    this.log(`  Deleted: ${this.results.people.deleted}`, 'info');
    this.log(`  From top-temp (transferred): ${this.results.people.fromTopTemp}`, 
      this.results.people.fromTopTemp > 0 ? 'success' : 'warn');
    this.log(`  Old data (not from top-temp): ${this.results.people.oldData}`, 
      this.results.people.oldData === 0 ? 'success' : 'warn');

    // Users
    this.log('', 'info');
    this.log('USERS:', 'info');
    this.log(`  Total users in system: ${this.results.users.total}`, 'info');
    this.log(`  Workspace users: ${this.results.users.workspaceUsers}`, 'info');
    
    if (this.results.users.created.length > 0) {
      this.log(`  Users created (recent/temp): ${this.results.users.created.length}`, 'info');
      this.results.users.created.forEach(u => {
        this.log(`    - ${u.name || u.username || u.email} (${u.username || 'no username'})`, 'info');
      });
    } else {
      this.log(`  Users created: 0 (no new users created)`, 'info');
    }

    if (this.results.users.mapped.length > 0) {
      this.log(`  Mapped users (Victoria, Justin, Judy, Hilary): ${this.results.users.mapped.length}`, 'info');
      this.results.users.mapped.forEach(u => {
        this.log(`    - ${u.name || u.username || u.email}`, 'info');
      });
    }

    // Transfer Status
    this.log('', 'info');
    this.log('TRANSFER STATUS:', 'info');
    this.log(`  Transfer completed: ${this.results.transferStatus.completed ? 'YES' : 'NO'}`, 
      this.results.transferStatus.completed ? 'success' : 'error');
    this.log(`  Old data removed: ${this.results.transferStatus.oldDataRemoved ? 'YES' : 'NO'}`, 
      this.results.transferStatus.oldDataRemoved ? 'success' : 'warn');

    // Answer the questions
    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('ANSWERS TO YOUR QUESTIONS:', 'info');
    this.log('='.repeat(70), 'info');
    
    this.log('', 'info');
    this.log('1. Do we still have the old people and companies or the new transferred data?', 'info');
    if (this.results.companies.fromTopTemp > 0 && this.results.people.fromTopTemp > 0) {
      this.log(`   ✅ You have the NEW transferred data:`, 'success');
      this.log(`      - ${this.results.companies.fromTopTemp} companies from top-temp`, 'success');
      this.log(`      - ${this.results.people.fromTopTemp} people from top-temp`, 'success');
    }
    if (this.results.companies.oldData > 0 || this.results.people.oldData > 0) {
      this.log(`   ⚠️  You also have OLD data remaining:`, 'warn');
      this.log(`      - ${this.results.companies.oldData} old companies`, 'warn');
      this.log(`      - ${this.results.people.oldData} old people`, 'warn');
    } else if (this.results.companies.fromTopTemp > 0 || this.results.people.fromTopTemp > 0) {
      this.log(`   ✅ Only new transferred data exists (old data removed)`, 'success');
    }

    this.log('', 'info');
    this.log('2. Were any users created?', 'info');
    if (this.results.users.created.length > 0) {
      this.log(`   ✅ YES - ${this.results.users.created.length} user(s) created:`, 'success');
      this.results.users.created.forEach(u => {
        this.log(`      - ${u.name || u.username || u.email} (${u.username || 'no username'})`, 'info');
      });
    } else {
      this.log(`   ✅ NO - No new users were created`, 'success');
      this.log(`      Existing users were mapped to top-temp users`, 'info');
    }

    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('Audit complete', 'success');
  }
}

// Main execution
async function main() {
  const audit = new TopEngineeringPlusAudit();
  
  try {
    await audit.execute();
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TopEngineeringPlusAudit;

