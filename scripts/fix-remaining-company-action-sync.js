/**
 * 🔧 FIX: Update Remaining Company Action Sync Issues
 * 
 * This script fixes the remaining 9 companies by updating actions to have
 * the correct companyId based on the person's current companyId.
 * 
 * Usage:
 *   node scripts/fix-remaining-company-action-sync.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class FixRemainingCompanyActionSync {
  constructor() {
    this.stats = {
      actionsUpdated: 0,
      companiesFixed: 0,
      errors: []
    };
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async run() {
    try {
      this.log('FIXING REMAINING COMPANY ACTION SYNC ISSUES', 'info');
      this.log('='.repeat(60), 'info');
      
      await this.fixCompanyActions();
      
      this.printSummary();
    } catch (error) {
      this.log(`Error during fix: ${error.message}`, 'error');
      console.error(error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async fixCompanyActions() {
    this.log('\n🔧 Fixing Company Actions', 'info');
    
    // Get companies with people actions but no direct actions
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        people: {
          some: {
            deletedAt: null,
            actions: {
              some: {
                deletedAt: null,
                status: 'COMPLETED'
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            actions: {
              where: {
                deletedAt: null,
                status: 'COMPLETED'
              }
            }
          }
        }
      }
    });

    // Filter to companies with no direct COMPLETED actions
    const problemCompanies = companies.filter(c => c._count.actions === 0);
    
    this.log(`Found ${problemCompanies.length} companies to fix`, 'info');

    for (const company of problemCompanies) {
      try {
        this.log(`\n🏢 Fixing: ${company.name}`, 'info');
        
        // Get all people in this company with actions
        const people = await prisma.people.findMany({
          where: {
            workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
            companyId: company.id,
            deletedAt: null,
            actions: {
              some: {
                deletedAt: null,
                status: 'COMPLETED'
              }
            }
          },
          select: {
            id: true,
            fullName: true,
            companyId: true
          }
        });

        this.log(`  Found ${people.length} people with actions`, 'info');

        let totalUpdated = 0;
        
        for (const person of people) {
          // Get actions for this person that don't have the correct companyId
          // Include all statuses, not just COMPLETED, to catch data_update actions
          const actionsToFix = await prisma.actions.findMany({
            where: {
              workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
              personId: person.id,
              deletedAt: null,
              status: 'COMPLETED', // Keep COMPLETED filter for now
              OR: [
                { companyId: null },
                { companyId: { not: company.id } }
              ]
            },
            select: {
              id: true,
              type: true,
              companyId: true,
              status: true
            }
          });

          if (actionsToFix.length > 0) {
            // Update all actions to have the correct companyId
            const result = await prisma.actions.updateMany({
              where: {
                id: { in: actionsToFix.map(a => a.id) }
              },
              data: {
                companyId: company.id
              }
            });

            totalUpdated += result.count;
            this.log(`    Updated ${result.count} actions for ${person.fullName}`, 'success');
            
            // Show breakdown
            const nullCount = actionsToFix.filter(a => !a.companyId).length;
            const wrongCount = actionsToFix.filter(a => a.companyId && a.companyId !== company.id).length;
            if (nullCount > 0) {
              this.log(`      - ${nullCount} actions had null companyId`, 'info');
            }
            if (wrongCount > 0) {
              this.log(`      - ${wrongCount} actions had wrong companyId`, 'warn');
            }
          }
        }

        if (totalUpdated > 0) {
          this.stats.actionsUpdated += totalUpdated;
          this.stats.companiesFixed++;
          this.log(`  ✅ Fixed ${totalUpdated} actions for ${company.name}`, 'success');
        } else {
          this.log(`  ℹ️  No actions to fix for ${company.name}`, 'info');
        }
      } catch (error) {
        this.stats.errors.push({
          type: 'fix_company',
          companyId: company.id,
          name: company.name,
          error: error.message
        });
        this.log(`  ❌ Failed to fix ${company.name}: ${error.message}`, 'error');
      }
    }
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('FIX SUMMARY', 'info');
    this.log('='.repeat(60), 'info');
    
    this.log(`\n✅ Actions updated: ${this.stats.actionsUpdated}`, 'success');
    this.log(`✅ Companies fixed: ${this.stats.companiesFixed}`, 'success');
    
    if (this.stats.errors.length > 0) {
      this.log(`\n⚠️  Errors: ${this.stats.errors.length}`, 'warn');
      this.stats.errors.forEach((error, idx) => {
        this.log(`  ${idx + 1}. ${error.name}: ${error.error}`, 'warn');
      });
    }
  }
}

// Run the fix
if (require.main === module) {
  const fix = new FixRemainingCompanyActionSync();
  fix.run().catch(console.error);
}

module.exports = FixRemainingCompanyActionSync;

