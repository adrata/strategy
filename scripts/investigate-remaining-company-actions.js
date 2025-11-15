/**
 * 🔍 INVESTIGATE: Remaining Companies Without Direct Actions
 * 
 * This script investigates why 9 companies still show no direct actions
 * even though their people have actions.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class InvestigateRemainingCompanyActions {
  constructor() {
    this.results = {};
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async run() {
    try {
      this.log('INVESTIGATING REMAINING COMPANIES WITHOUT DIRECT ACTIONS', 'info');
      this.log('='.repeat(60), 'info');
      
      await this.investigateCompanies();
      
      this.printSummary();
    } catch (error) {
      this.log(`Error during investigation: ${error.message}`, 'error');
      console.error(error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async investigateCompanies() {
    this.log('\n🏢 Investigating Companies', 'info');
    
    // Get all companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null
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
            },
            people: {
              where: {
                deletedAt: null,
                actions: {
                  some: {
                    deletedAt: null,
                    status: 'COMPLETED'
                  }
                }
              }
            }
          }
        }
      }
    });

    // Find companies with people actions but no direct actions
    const problemCompanies = companies.filter(c => 
      c._count.people > 0 && c._count.actions === 0
    );

    this.log(`Found ${problemCompanies.length} companies with people actions but no direct actions`, 'info');

    for (const company of problemCompanies) {
      this.log(`\n📊 Investigating: ${company.name}`, 'info');
      this.log(`  Direct COMPLETED actions: ${company._count.actions}`, 'info');
      this.log(`  People with COMPLETED actions: ${company._count.people}`, 'info');

      // Get all actions for this company (any status)
      const allCompanyActions = await prisma.actions.findMany({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          companyId: company.id,
          deletedAt: null
        },
        select: {
          id: true,
          type: true,
          status: true,
          personId: true,
          completedAt: true,
          createdAt: true
        }
      });

      this.log(`  Total actions (any status): ${allCompanyActions.length}`, 'info');
      
      if (allCompanyActions.length > 0) {
        const statusBreakdown = {};
        for (const action of allCompanyActions) {
          statusBreakdown[action.status] = (statusBreakdown[action.status] || 0) + 1;
        }
        this.log(`  Status breakdown:`, 'info');
        for (const [status, count] of Object.entries(statusBreakdown)) {
          this.log(`    ${status}: ${count}`, status === 'COMPLETED' ? 'success' : 'warn');
        }
      }

      // Get people with actions
      const peopleWithActions = await prisma.people.findMany({
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
          companyId: true,
          _count: {
            select: {
              actions: {
                where: {
                  deletedAt: null,
                  status: 'COMPLETED'
                }
              }
            }
          },
          actions: {
            where: {
              deletedAt: null,
              status: 'COMPLETED'
            },
            select: {
              id: true,
              type: true,
              companyId: true,
              personId: true,
              completedAt: true
            },
            take: 5
          }
        }
      });

      this.log(`  People with COMPLETED actions: ${peopleWithActions.length}`, 'info');
      
      for (const person of peopleWithActions) {
        this.log(`    ${person.fullName}:`, 'info');
        this.log(`      Total COMPLETED actions: ${person._count.actions}`, 'info');
        
        // Check if person's actions have companyId
        const actionsWithCompany = person.actions.filter(a => a.companyId === company.id);
        const actionsWithoutCompany = person.actions.filter(a => !a.companyId || a.companyId !== company.id);
        
        this.log(`      Actions with companyId=${company.id}: ${actionsWithCompany.length}`, actionsWithCompany.length > 0 ? 'success' : 'warn');
        this.log(`      Actions without companyId or wrong companyId: ${actionsWithoutCompany.length}`, actionsWithoutCompany.length > 0 ? 'warn' : 'info');
        
        if (actionsWithoutCompany.length > 0) {
          this.log(`      Sample actions without companyId:`, 'warn');
          for (const action of actionsWithoutCompany.slice(0, 3)) {
            this.log(`        - ${action.type} (companyId: ${action.companyId || 'null'})`, 'warn');
          }
        }
      }

      // Check if there are actions with companyId but wrong status
      const nonCompletedActions = allCompanyActions.filter(a => a.status !== 'COMPLETED');
      if (nonCompletedActions.length > 0) {
        this.log(`  ⚠️  Found ${nonCompletedActions.length} actions with companyId but not COMPLETED status`, 'warn');
        const statusCounts = {};
        for (const action of nonCompletedActions) {
          statusCounts[action.status] = (statusCounts[action.status] || 0) + 1;
        }
        for (const [status, count] of Object.entries(statusCounts)) {
          this.log(`    ${status}: ${count}`, 'warn');
        }
      }

      this.results[company.id] = {
        name: company.name,
        directCompletedActions: company._count.actions,
        totalActions: allCompanyActions.length,
        peopleWithActions: peopleWithActions.length,
        peopleDetails: peopleWithActions.map(p => ({
          name: p.fullName,
          totalActions: p._count.actions,
          actionsWithCompany: p.actions.filter(a => a.companyId === company.id).length,
          actionsWithoutCompany: p.actions.filter(a => !a.companyId || a.companyId !== company.id).length
        }))
      };
    }
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('INVESTIGATION SUMMARY', 'info');
    this.log('='.repeat(60), 'info');
    
    const companies = Object.values(this.results);
    
    this.log(`\n📊 Companies Investigated: ${companies.length}`, 'info');
    
    for (const company of companies) {
      this.log(`\n🏢 ${company.name}:`, 'info');
      this.log(`  Direct COMPLETED actions: ${company.directCompletedActions}`, company.directCompletedActions > 0 ? 'success' : 'warn');
      this.log(`  Total actions (any status): ${company.totalActions}`, 'info');
      this.log(`  People with COMPLETED actions: ${company.peopleWithActions}`, 'info');
      
      const totalActionsFromPeople = company.peopleDetails.reduce((sum, p) => sum + p.totalActions, 0);
      const actionsWithCompany = company.peopleDetails.reduce((sum, p) => sum + p.actionsWithCompany, 0);
      const actionsWithoutCompany = company.peopleDetails.reduce((sum, p) => sum + p.actionsWithoutCompany, 0);
      
      this.log(`  Total actions from people: ${totalActionsFromPeople}`, 'info');
      this.log(`  Actions with companyId: ${actionsWithCompany}`, actionsWithCompany > 0 ? 'success' : 'warn');
      this.log(`  Actions without companyId: ${actionsWithoutCompany}`, actionsWithoutCompany > 0 ? 'warn' : 'info');
      
      if (actionsWithoutCompany > 0) {
        this.log(`  ⚠️  ISSUE: ${actionsWithoutCompany} actions from people don't have companyId set`, 'warn');
      }
      
      if (company.totalActions > 0 && company.directCompletedActions === 0) {
        this.log(`  ⚠️  ISSUE: Company has ${company.totalActions} actions but none are COMPLETED status`, 'warn');
      }
    }
    
    this.log(`\n✅ Recommendations:`, 'success');
    this.log(`  1. Update actions to include companyId for people in these companies`, 'info');
    this.log(`  2. Update action status to COMPLETED if they should be counted`, 'info');
    this.log(`  3. Check if actions were created before people were linked to companies`, 'info');
  }
}

// Run the investigation
if (require.main === module) {
  const investigation = new InvestigateRemainingCompanyActions();
  investigation.run().catch(console.error);
}

module.exports = InvestigateRemainingCompanyActions;

