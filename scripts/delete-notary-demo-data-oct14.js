#!/usr/bin/env node

/**
 * DELETE NOTARY DEMO DATA - OCTOBER 14, 2025
 * 
 * Removes all people, companies, and actions created on October 14, 2025
 * from the Notary Everyday workspace database, including related records.
 * Generates a backup report before deletion.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class NotaryDemoDataCleanup {
  constructor() {
    this.workspaceId = null;
    this.workspace = null;
    this.targetDate = new Date('2025-10-14T00:00:00.000Z');
    this.endDate = new Date('2025-10-15T00:00:00.000Z');
    this.results = {
      timestamp: new Date().toISOString(),
      targetDate: this.targetDate.toISOString(),
      workspace: null,
      backup: {
        people: [],
        companies: [],
        actions: [],
        personCoSellers: [],
        relatedActions: []
      },
      deletion: {
        peopleDeleted: 0,
        companiesDeleted: 0,
        actionsDeleted: 0,
        personCoSellersDeleted: 0,
        relatedActionsDeleted: 0
      },
      errors: [],
      summary: {
        totalRecordsDeleted: 0,
        errors: 0,
        success: false
      }
    };
  }

  async findNotaryEverydayWorkspace() {
    console.log('🔍 Finding Notary Everyday workspace...');
    
    this.workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!this.workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    this.workspaceId = this.workspace.id;
    this.results.workspace = {
      id: this.workspace.id,
      name: this.workspace.name,
      slug: this.workspace.slug
    };
    
    console.log(`✅ Found workspace: ${this.workspace.name} (${this.workspace.id})`);
    return this.workspace;
  }

  async generateBackupReport() {
    console.log('\n📊 Generating backup report for October 14, 2025 records...');
    
    try {
      // Find people created on October 14, 2025
      const people = await prisma.people.findMany({
        where: {
          workspaceId: this.workspaceId,
          createdAt: {
            gte: this.targetDate,
            lt: this.endDate
          },
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          workEmail: true,
          jobTitle: true,
          companyId: true,
          createdAt: true,
          status: true
        }
      });

      // Find companies created on October 14, 2025
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: this.workspaceId,
          createdAt: {
            gte: this.targetDate,
            lt: this.endDate
          },
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          legalName: true,
          website: true,
          email: true,
          industry: true,
          createdAt: true,
          status: true
        }
      });

      // Find actions created on October 14, 2025
      const actions = await prisma.actions.findMany({
        where: {
          workspaceId: this.workspaceId,
          createdAt: {
            gte: this.targetDate,
            lt: this.endDate
          },
          deletedAt: null
        },
        select: {
          id: true,
          type: true,
          subject: true,
          description: true,
          status: true,
          companyId: true,
          personId: true,
          createdAt: true
        }
      });

      // Find person_co_sellers for people created on October 14, 2025
      const personCoSellers = await prisma.person_co_sellers.findMany({
        where: {
          person: {
            workspaceId: this.workspaceId,
            createdAt: {
              gte: this.targetDate,
              lt: this.endDate
            },
            deletedAt: null
          }
        },
        select: {
          id: true,
          personId: true,
          userId: true,
          createdAt: true
        }
      });

      // Find actions related to people/companies created on October 14, 2025
      const peopleIds = people.map(p => p.id);
      const companyIds = companies.map(c => c.id);
      
      const relatedActions = await prisma.actions.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          OR: [
            { personId: { in: peopleIds } },
            { companyId: { in: companyIds } }
          ]
        },
        select: {
          id: true,
          type: true,
          subject: true,
          description: true,
          status: true,
          companyId: true,
          personId: true,
          createdAt: true
        }
      });

      // Store backup data
      this.results.backup.people = people;
      this.results.backup.companies = companies;
      this.results.backup.actions = actions;
      this.results.backup.personCoSellers = personCoSellers;
      this.results.backup.relatedActions = relatedActions;

      console.log(`📋 Backup Report Summary:`);
      console.log(`   👥 People: ${people.length}`);
      console.log(`   🏢 Companies: ${companies.length}`);
      console.log(`   📝 Actions: ${actions.length}`);
      console.log(`   🤝 Person Co-Sellers: ${personCoSellers.length}`);
      console.log(`   🔗 Related Actions: ${relatedActions.length}`);

      return {
        people,
        companies,
        actions,
        personCoSellers,
        relatedActions
      };

    } catch (error) {
      console.error('❌ Error generating backup report:', error);
      this.results.errors.push({
        step: 'backup_report',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async deleteDemoData() {
    console.log('\n🗑️  Starting deletion of demo data...');
    
    try {
      await prisma.$transaction(async (tx) => {
        // Delete person_co_sellers first (foreign key constraint)
        if (this.results.backup.personCoSellers.length > 0) {
          console.log('   🗑️  Deleting person co-sellers...');
          const personCoSellerIds = this.results.backup.personCoSellers.map(p => p.id);
          await tx.person_co_sellers.deleteMany({
            where: { id: { in: personCoSellerIds } }
          });
          this.results.deletion.personCoSellersDeleted = personCoSellerIds.length;
        }

        // Delete related actions
        if (this.results.backup.relatedActions.length > 0) {
          console.log('   🗑️  Deleting related actions...');
          const relatedActionIds = this.results.backup.relatedActions.map(a => a.id);
          await tx.actions.deleteMany({
            where: { id: { in: relatedActionIds } }
          });
          this.results.deletion.relatedActionsDeleted = relatedActionIds.length;
        }

        // Delete actions created on October 14, 2025
        if (this.results.backup.actions.length > 0) {
          console.log('   🗑️  Deleting actions created on October 14, 2025...');
          const actionIds = this.results.backup.actions.map(a => a.id);
          await tx.actions.deleteMany({
            where: { id: { in: actionIds } }
          });
          this.results.deletion.actionsDeleted = actionIds.length;
        }

        // Delete people created on October 14, 2025
        if (this.results.backup.people.length > 0) {
          console.log('   🗑️  Deleting people created on October 14, 2025...');
          const peopleIds = this.results.backup.people.map(p => p.id);
          await tx.people.deleteMany({
            where: { id: { in: peopleIds } }
          });
          this.results.deletion.peopleDeleted = peopleIds.length;
        }

        // Delete companies created on October 14, 2025
        if (this.results.backup.companies.length > 0) {
          console.log('   🗑️  Deleting companies created on October 14, 2025...');
          const companyIds = this.results.backup.companies.map(c => c.id);
          await tx.companies.deleteMany({
            where: { id: { in: companyIds } }
          });
          this.results.deletion.companiesDeleted = companyIds.length;
        }
      });

      // Calculate total records deleted
      this.results.deletion.totalRecordsDeleted = 
        this.results.deletion.peopleDeleted +
        this.results.deletion.companiesDeleted +
        this.results.deletion.actionsDeleted +
        this.results.deletion.personCoSellersDeleted +
        this.results.deletion.relatedActionsDeleted;

      this.results.summary.success = true;

      console.log('\n✅ Deletion completed successfully!');
      console.log(`📊 Total records deleted: ${this.results.deletion.totalRecordsDeleted}`);

    } catch (error) {
      console.error('❌ Error during deletion:', error);
      this.results.errors.push({
        step: 'deletion',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      this.results.summary.errors++;
      throw error;
    }
  }

  async saveReport() {
    console.log('\n💾 Saving deletion report...');
    
    try {
      const reportPath = path.join(__dirname, '..', 'docs', 'reports', 'notary-demo-deletion-oct14-report.json');
      
      // Ensure reports directory exists
      const reportsDir = path.dirname(reportPath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`✅ Report saved to: ${reportPath}`);

    } catch (error) {
      console.error('❌ Error saving report:', error);
      this.results.errors.push({
        step: 'save_report',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async run() {
    console.log('🚀 Starting Notary Demo Data Cleanup for October 14, 2025');
    console.log('=' .repeat(60));
    
    try {
      // Step 1: Find workspace
      await this.findNotaryEverydayWorkspace();
      
      // Step 2: Generate backup report
      await this.generateBackupReport();
      
      // Step 3: Delete demo data
      await this.deleteDemoData();
      
      // Step 4: Save report
      await this.saveReport();
      
      console.log('\n🎉 Cleanup completed successfully!');
      console.log('=' .repeat(60));
      console.log(`📊 Final Summary:`);
      console.log(`   👥 People deleted: ${this.results.deletion.peopleDeleted}`);
      console.log(`   🏢 Companies deleted: ${this.results.deletion.companiesDeleted}`);
      console.log(`   📝 Actions deleted: ${this.results.deletion.actionsDeleted}`);
      console.log(`   🤝 Person Co-Sellers deleted: ${this.results.deletion.personCoSellersDeleted}`);
      console.log(`   🔗 Related Actions deleted: ${this.results.deletion.relatedActionsDeleted}`);
      console.log(`   📈 Total records deleted: ${this.results.deletion.totalRecordsDeleted}`);
      console.log(`   ❌ Errors: ${this.results.summary.errors}`);

    } catch (error) {
      console.error('\n💥 Cleanup failed:', error.message);
      this.results.summary.success = false;
      this.results.summary.errors++;
      
      // Still try to save the report with error information
      await this.saveReport();
      
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the cleanup
if (require.main === module) {
  const cleanup = new NotaryDemoDataCleanup();
  cleanup.run().catch(console.error);
}

module.exports = NotaryDemoDataCleanup;
