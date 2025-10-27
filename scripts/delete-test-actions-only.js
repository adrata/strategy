#!/usr/bin/env node

/**
 * 🗑️ DELETE TEST ACTIONS ONLY SCRIPT
 * 
 * Deletes only actions that contain "test" or "Test" in their subject/description
 * 
 * Usage: node scripts/delete-test-actions-only.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

class TestActionsCleanup {
  constructor() {
    this.workspaceId = null;
    this.results = {
      workspace: null,
      found: 0,
      deleted: 0,
      errors: []
    };
  }

  async run() {
    console.log('🗑️ Starting Test Actions Cleanup...\n');
    
    try {
      await this.findNotaryEverydayWorkspace();
      await this.findTestActions();
      await this.deleteTestActions();
      this.generateReport();
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      this.results.errors.push(`Cleanup error: ${error.message}`);
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

  async findTestActions() {
    console.log('🔍 Finding test actions...');
    
    // Find actions that contain "test" in subject or description
    const testActions = await prisma.actions.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { subject: { contains: 'test', mode: 'insensitive' } },
          { subject: { contains: 'Test', mode: 'insensitive' } },
          { description: { contains: 'test', mode: 'insensitive' } },
          { description: { contains: 'Test', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        type: true,
        subject: true,
        description: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    this.results.found = testActions.length;
    console.log(`   Found ${testActions.length} test actions:`);
    
    testActions.forEach((action, index) => {
      console.log(`   ${index + 1}. [${action.type}] ${action.subject || action.description || 'No subject'} (${action.createdAt.toISOString().split('T')[0]})`);
    });
    
    console.log('');
  }

  async deleteTestActions() {
    console.log('🗑️ Deleting test actions...');
    
    if (this.results.found === 0) {
      console.log('   No test actions found to delete\n');
      return;
    }

    // Soft delete test actions
    const deleteResult = await prisma.actions.updateMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { subject: { contains: 'test', mode: 'insensitive' } },
          { subject: { contains: 'Test', mode: 'insensitive' } },
          { description: { contains: 'test', mode: 'insensitive' } },
          { description: { contains: 'Test', mode: 'insensitive' } }
        ]
      },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });

    this.results.deleted = deleteResult.count;
    console.log(`   ✅ Soft deleted ${deleteResult.count} test actions\n`);
  }

  generateReport() {
    console.log('📋 TEST ACTIONS CLEANUP REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n🏢 Workspace: ${this.results.workspace.name} (${this.results.workspace.id})`);
    
    console.log(`\n🔍 Search Results:`);
    console.log(`   Test actions found: ${this.results.found}`);
    
    console.log(`\n🗑️ Deletion Results:`);
    console.log(`   Test actions deleted: ${this.results.deleted}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.results.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run the cleanup
const cleanup = new TestActionsCleanup();
cleanup.run().catch(console.error);
