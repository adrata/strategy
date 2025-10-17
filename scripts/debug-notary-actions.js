#!/usr/bin/env node

/**
 * 🔍 DEBUG NOTARY ACTIONS SCRIPT
 * 
 * Diagnoses why actions aren't loading in the Notary Everyday workspace
 * 
 * Usage: node scripts/debug-notary-actions.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

class NotaryActionsDiagnostic {
  constructor() {
    this.workspaceId = null;
    this.results = {
      workspace: null,
      actions: {
        total: 0,
        byType: {},
        byStatus: {},
        recent: []
      },
      people: {
        total: 0,
        withActions: 0,
        withoutActions: 0,
        samples: []
      },
      companies: {
        total: 0,
        withActions: 0,
        withoutActions: 0,
        samples: []
      },
      issues: []
    };
  }

  async run() {
    console.log('🔍 Starting Notary Actions Diagnostic...\n');
    
    try {
      await this.findNotaryEverydayWorkspace();
      await this.analyzeActions();
      await this.analyzePeople();
      await this.analyzeCompanies();
      await this.checkWorkspaceConsistency();
      this.generateReport();
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      this.results.issues.push(`Diagnostic error: ${error.message}`);
    } finally {
      await prisma.$disconnect();
    }
  }

  async findNotaryEverydayWorkspace() {
    console.log('🔍 Finding Notary Everyday workspace...');
    
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    this.workspaceId = workspace.id;
    this.results.workspace = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug
    };
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
  }

  async analyzeActions() {
    console.log('📊 Analyzing actions...');
    
    // Total actions in workspace
    const totalActions = await prisma.actions.count({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      }
    });
    
    this.results.actions.total = totalActions;
    console.log(`   Total actions: ${totalActions}`);

    // Actions by type
    const actionsByType = await prisma.actions.groupBy({
      by: ['type'],
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      _count: { id: true }
    });

    actionsByType.forEach(group => {
      this.results.actions.byType[group.type] = group._count.id;
      console.log(`   ${group.type}: ${group._count.id}`);
    });

    // Actions by status
    const actionsByStatus = await prisma.actions.groupBy({
      by: ['status'],
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      _count: { id: true }
    });

    actionsByStatus.forEach(group => {
      this.results.actions.byStatus[group.status] = group._count.id;
    });

    // Recent actions (last 10)
    const recentActions = await prisma.actions.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        subject: true,
        status: true,
        createdAt: true,
        personId: true,
        companyId: true
      }
    });

    this.results.actions.recent = recentActions;
    console.log(`   Recent actions: ${recentActions.length} found\n`);
  }

  async analyzePeople() {
    console.log('👥 Analyzing people records...');
    
    // Total people in workspace
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      }
    });
    
    this.results.people.total = totalPeople;
    console.log(`   Total people: ${totalPeople}`);

    // People with actions
    const peopleWithActions = await prisma.people.count({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        actions: {
          some: {
            deletedAt: null
          }
        }
      }
    });

    this.results.people.withActions = peopleWithActions;
    this.results.people.withoutActions = totalPeople - peopleWithActions;
    
    console.log(`   People with actions: ${peopleWithActions}`);
    console.log(`   People without actions: ${totalPeople - peopleWithActions}`);

    // Sample people with their actions
    const samplePeople = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        createdAt: true,
        actions: {
          where: { deletedAt: null },
          select: {
            id: true,
            type: true,
            subject: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    this.results.people.samples = samplePeople;
    
    samplePeople.forEach(person => {
      console.log(`   ${person.fullName || `${person.firstName} ${person.lastName}`}: ${person.actions.length} actions`);
    });
    
    console.log('');
  }

  async analyzeCompanies() {
    console.log('🏢 Analyzing company records...');
    
    // Total companies in workspace
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      }
    });
    
    this.results.companies.total = totalCompanies;
    console.log(`   Total companies: ${totalCompanies}`);

    // Companies with actions
    const companiesWithActions = await prisma.companies.count({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        actions: {
          some: {
            deletedAt: null
          }
        }
      }
    });

    this.results.companies.withActions = companiesWithActions;
    this.results.companies.withoutActions = totalCompanies - companiesWithActions;
    
    console.log(`   Companies with actions: ${companiesWithActions}`);
    console.log(`   Companies without actions: ${totalCompanies - companiesWithActions}`);

    // Sample companies with their actions
    const sampleCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        actions: {
          where: { deletedAt: null },
          select: {
            id: true,
            type: true,
            subject: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    this.results.companies.samples = sampleCompanies;
    
    sampleCompanies.forEach(company => {
      console.log(`   ${company.name}: ${company.actions.length} actions`);
    });
    
    console.log('');
  }

  async checkWorkspaceConsistency() {
    console.log('🔍 Checking workspace consistency...');
    
    // Check for actions with different workspace IDs
    const inconsistentActions = await prisma.actions.findMany({
      where: {
        OR: [
          { personId: { in: await this.getPersonIds() } },
          { companyId: { in: await this.getCompanyIds() } }
        ],
        workspaceId: { not: this.workspaceId },
        deletedAt: null
      },
      select: {
        id: true,
        type: true,
        subject: true,
        workspaceId: true,
        personId: true,
        companyId: true
      }
    });

    if (inconsistentActions.length > 0) {
      this.results.issues.push(`Found ${inconsistentActions.length} actions with wrong workspace ID`);
      console.log(`   ⚠️  Found ${inconsistentActions.length} actions with wrong workspace ID`);
      
      inconsistentActions.slice(0, 3).forEach(action => {
        console.log(`     Action ${action.id}: workspace ${action.workspaceId} (should be ${this.workspaceId})`);
      });
    } else {
      console.log('   ✅ All actions have correct workspace ID');
    }
    
    console.log('');
  }

  async getPersonIds() {
    const people = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      select: { id: true }
    });
    return people.map(p => p.id);
  }

  async getCompanyIds() {
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      select: { id: true }
    });
    return companies.map(c => c.id);
  }

  generateReport() {
    console.log('📋 DIAGNOSTIC REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n🏢 Workspace: ${this.results.workspace.name} (${this.results.workspace.id})`);
    
    console.log(`\n📊 Actions Summary:`);
    console.log(`   Total: ${this.results.actions.total}`);
    console.log(`   By Type:`);
    Object.entries(this.results.actions.byType).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });
    
    console.log(`\n👥 People Summary:`);
    console.log(`   Total: ${this.results.people.total}`);
    console.log(`   With Actions: ${this.results.people.withActions}`);
    console.log(`   Without Actions: ${this.results.people.withoutActions}`);
    
    console.log(`\n🏢 Companies Summary:`);
    console.log(`   Total: ${this.results.companies.total}`);
    console.log(`   With Actions: ${this.results.companies.withActions}`);
    console.log(`   Without Actions: ${this.results.companies.withoutActions}`);
    
    if (this.results.issues.length > 0) {
      console.log(`\n⚠️  Issues Found:`);
      this.results.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    } else {
      console.log(`\n✅ No issues found`);
    }
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    
    if (this.results.actions.total === 0) {
      console.log('   - No actions found. This suggests either:');
      console.log('     a) Records were created before action auto-creation was implemented');
      console.log('     b) There\'s a workspace ID mismatch in the database');
      console.log('     c) Actions were deleted or have wrong workspace ID');
    } else if (this.results.people.withoutActions > 0 || this.results.companies.withoutActions > 0) {
      console.log('   - Some records lack actions. Consider running a migration to create missing actions');
    } else {
      console.log('   - Actions data looks healthy. Issue may be in frontend/API filtering');
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run the diagnostic
const diagnostic = new NotaryActionsDiagnostic();
diagnostic.run().catch(console.error);
