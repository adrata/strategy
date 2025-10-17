#!/usr/bin/env node

/**
 * 🔄 MIGRATE MISSING ACTIONS SCRIPT
 * 
 * Creates missing actions for existing people and companies in Notary Everyday workspace
 * 
 * Usage: node scripts/migrate-missing-actions.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

class MissingActionsMigration {
  constructor() {
    this.workspaceId = null;
    this.results = {
      workspace: null,
      people: {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: 0
      },
      companies: {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: 0
      },
      errors: []
    };
  }

  async run() {
    console.log('🔄 Starting Missing Actions Migration...\n');
    
    try {
      await this.findNotaryEverydayWorkspace();
      await this.migratePeopleActions();
      await this.migrateCompanyActions();
      this.generateReport();
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.results.errors.push(`Migration error: ${error.message}`);
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

  async migratePeopleActions() {
    console.log('👥 Migrating people actions...');
    
    // Get people without actions
    const peopleWithoutActions = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        actions: {
          none: {
            deletedAt: null
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        createdAt: true,
        mainSellerId: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`   Found ${peopleWithoutActions.length} people without actions`);

    for (const person of peopleWithoutActions) {
      this.results.people.processed++;
      
      try {
        // Create person_created action
        await prisma.actions.create({
          data: {
            type: 'person_created',
            subject: `New person added: ${person.fullName || `${person.firstName} ${person.lastName}`.trim()}`,
            description: `System created new person record for ${person.fullName || `${person.firstName} ${person.lastName}`.trim()}`,
            status: 'COMPLETED',
            priority: 'NORMAL',
            workspaceId: this.workspaceId,
            userId: person.mainSellerId || '01K1VBYZMWTCT09FWEKBDMCXZM', // Default to Dano if no mainSeller
            personId: person.id,
            completedAt: person.createdAt,
            createdAt: person.createdAt,
            updatedAt: new Date()
          }
        });

        this.results.people.created++;
        
        if (this.results.people.processed % 50 === 0) {
          console.log(`   Processed ${this.results.people.processed}/${peopleWithoutActions.length} people...`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create action for person ${person.id}:`, error.message);
        this.results.people.errors++;
      }
    }

    console.log(`   ✅ People migration complete: ${this.results.people.created} actions created\n`);
  }

  async migrateCompanyActions() {
    console.log('🏢 Migrating company actions...');
    
    // Get companies without actions
    const companiesWithoutActions = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        actions: {
          none: {
            deletedAt: null
          }
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        mainSellerId: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`   Found ${companiesWithoutActions.length} companies without actions`);

    for (const company of companiesWithoutActions) {
      this.results.companies.processed++;
      
      try {
        // Create company_created action
        await prisma.actions.create({
          data: {
            type: 'company_created',
            subject: `New company added: ${company.name}`,
            description: `System created new company record for ${company.name}`,
            status: 'COMPLETED',
            priority: 'NORMAL',
            workspaceId: this.workspaceId,
            userId: company.mainSellerId || '01K1VBYZMWTCT09FWEKBDMCXZM', // Default to Dano if no mainSeller
            companyId: company.id,
            completedAt: company.createdAt,
            createdAt: company.createdAt,
            updatedAt: new Date()
          }
        });

        this.results.companies.created++;
        
        if (this.results.companies.processed % 100 === 0) {
          console.log(`   Processed ${this.results.companies.processed}/${companiesWithoutActions.length} companies...`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create action for company ${company.id}:`, error.message);
        this.results.companies.errors++;
      }
    }

    console.log(`   ✅ Company migration complete: ${this.results.companies.created} actions created\n`);
  }

  generateReport() {
    console.log('📋 MIGRATION REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n🏢 Workspace: ${this.results.workspace.name} (${this.results.workspace.id})`);
    
    console.log(`\n👥 People Migration:`);
    console.log(`   Processed: ${this.results.people.processed}`);
    console.log(`   Actions Created: ${this.results.people.created}`);
    console.log(`   Errors: ${this.results.people.errors}`);
    
    console.log(`\n🏢 Companies Migration:`);
    console.log(`   Processed: ${this.results.companies.processed}`);
    console.log(`   Actions Created: ${this.results.companies.created}`);
    console.log(`   Errors: ${this.results.companies.errors}`);
    
    const totalCreated = this.results.people.created + this.results.companies.created;
    const totalErrors = this.results.people.errors + this.results.companies.errors;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Actions Created: ${totalCreated}`);
    console.log(`   Total Errors: ${totalErrors}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Migration Errors:`);
      this.results.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    console.log(`\n💡 Next Steps:`);
    console.log('   1. Run the diagnostic script to verify actions are now present');
    console.log('   2. Test the actions tab in the UI to confirm it loads data');
    console.log('   3. Check that API endpoints return actions for people and companies');
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run the migration
const migration = new MissingActionsMigration();
migration.run().catch(console.error);
