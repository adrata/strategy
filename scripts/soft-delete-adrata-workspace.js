#!/usr/bin/env node

/**
 * SOFT DELETE ADRATA WORKSPACE DATA
 * 
 * Soft deletes all companies and people in the adrata workspace
 * by setting their deletedAt timestamp. This preserves data for
 * potential recovery while removing it from active queries.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

class AdrataSoftDeleteService {
  constructor() {
    this.workspaceId = '01K7464TNANHQXPCZT1FYX205V';
    this.workspace = null;
    this.results = {
      timestamp: new Date().toISOString(),
      workspace: null,
      companiesDeleted: [],
      peopleDeleted: [],
      errors: [],
      summary: {
        totalCompaniesDeleted: 0,
        totalPeopleDeleted: 0,
        companiesWithPeople: 0,
        companiesWithoutPeople: 0
      }
    };
  }

  async findAdrataWorkspace() {
    console.log('🔍 Finding Adrata workspace...');
    
    this.workspace = await prisma.workspaces.findUnique({
      where: { id: this.workspaceId },
      select: { id: true, name: true, slug: true, createdAt: true }
    });
    
    if (!this.workspace) {
      throw new Error(`Adrata workspace not found with ID: ${this.workspaceId}`);
    }

    this.results.workspace = {
      id: this.workspace.id,
      name: this.workspace.name,
      slug: this.workspace.slug,
      createdAt: this.workspace.createdAt
    };
    
    console.log(`✅ Found workspace: ${this.workspace.name} (${this.workspace.id})`);
    return this.workspace;
  }

  async getCurrentCounts() {
    console.log('\n📊 Getting current data counts...');
    
    const [companyCount, peopleCount] = await Promise.all([
      prisma.companies.count({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null
        }
      }),
      prisma.people.count({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null
        }
      })
    ]);

    console.log(`   Active Companies: ${companyCount}`);
    console.log(`   Active People: ${peopleCount}`);
    
    return { companyCount, peopleCount };
  }

  async getCompaniesWithPeople() {
    console.log('\n📋 Getting companies with people counts...');
    
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true,
        industry: true,
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`   Found ${companies.length} active companies`);
    return companies;
  }

  async getPeople() {
    console.log('\n👥 Getting people data...');
    
    const people = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        jobTitle: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    console.log(`   Found ${people.length} active people`);
    return people;
  }

  async softDeleteAllData() {
    console.log('\n🗑️  Starting soft delete operation...');
    
    try {
      await prisma.$transaction(async (tx) => {
        const now = new Date();
        
        // 1. Soft delete all people first
        console.log('   Soft deleting people...');
        const peopleResult = await tx.people.updateMany({
          where: {
            workspaceId: this.workspaceId,
            deletedAt: null
          },
          data: {
            deletedAt: now,
            updatedAt: now
          }
        });
        
        console.log(`   ✅ Soft deleted ${peopleResult.count} people`);
        
        // 2. Soft delete all companies
        console.log('   Soft deleting companies...');
        const companiesResult = await tx.companies.updateMany({
          where: {
            workspaceId: this.workspaceId,
            deletedAt: null
          },
          data: {
            deletedAt: now,
            updatedAt: now
          }
        });
        
        console.log(`   ✅ Soft deleted ${companiesResult.count} companies`);
        
        // Store counts for summary
        this.results.summary.totalCompaniesDeleted = companiesResult.count;
        this.results.summary.totalPeopleDeleted = peopleResult.count;
      });

      return true;
    } catch (error) {
      console.error(`   ❌ Failed to soft delete data:`, error.message);
      this.results.errors.push({
        type: 'transaction_error',
        error: error.message
      });
      return false;
    }
  }

  async populateDeletedRecords() {
    console.log('\n📝 Populating deleted records list...');
    
    try {
      // Get all companies that were just soft deleted
      const deletedCompanies = await prisma.companies.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: { not: null }
        },
        select: {
          id: true,
          name: true,
          website: true,
          domain: true,
          industry: true,
          deletedAt: true,
          _count: {
            select: {
              people: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Get all people that were just soft deleted
      const deletedPeople = await prisma.people.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: { not: null }
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          jobTitle: true,
          companyId: true,
          deletedAt: true,
          company: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          fullName: 'asc'
        }
      });

      // Populate results
      this.results.companiesDeleted = deletedCompanies.map(company => ({
        id: company.id,
        name: company.name,
        website: company.website,
        domain: company.domain,
        industry: company.industry,
        peopleCount: company._count.people,
        deletedAt: company.deletedAt?.toISOString()
      }));

      this.results.peopleDeleted = deletedPeople.map(person => ({
        id: person.id,
        fullName: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
        email: person.email,
        jobTitle: person.jobTitle,
        companyId: person.companyId,
        companyName: person.company?.name,
        deletedAt: person.deletedAt?.toISOString()
      }));

      // Update summary
      this.results.summary.companiesWithPeople = this.results.companiesDeleted.filter(c => c.peopleCount > 0).length;
      this.results.summary.companiesWithoutPeople = this.results.companiesDeleted.filter(c => c.peopleCount === 0).length;

      console.log(`   ✅ Recorded ${this.results.companiesDeleted.length} deleted companies`);
      console.log(`   ✅ Recorded ${this.results.peopleDeleted.length} deleted people`);

    } catch (error) {
      console.error(`   ❌ Failed to populate deleted records:`, error.message);
      this.results.errors.push({
        type: 'populate_records_error',
        error: error.message
      });
    }
  }

  async generateReport() {
    console.log('\n📄 Generating soft delete report...');
    
    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'docs', 'reports');
    try {
      await fs.access(reportsDir);
    } catch {
      await fs.mkdir(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, 'adrata-workspace-soft-delete-report.json');
    
    const report = {
      ...this.results,
      generatedAt: new Date().toISOString(),
      operation: 'soft_delete_all_workspace_data',
      workspace: this.results.workspace
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`   ✅ Report saved to: ${reportPath}`);
  }

  async executeSoftDelete() {
    try {
      console.log('🚀 Starting Adrata workspace soft delete process...\n');
      
      // 1. Find workspace
      await this.findAdrataWorkspace();
      
      // 2. Get current counts
      const { companyCount, peopleCount } = await this.getCurrentCounts();
      
      if (companyCount === 0 && peopleCount === 0) {
        console.log('\n✅ No active data found in workspace. Nothing to delete.');
        return;
      }

      // 3. Get detailed data for reporting
      const companies = await this.getCompaniesWithPeople();
      const people = await this.getPeople();

      // 4. Display what will be deleted
      console.log('\n📋 DATA TO BE SOFT DELETED:');
      console.log('=====================================');
      console.log(`Companies: ${companyCount}`);
      console.log(`People: ${peopleCount}`);
      console.log(`Companies with people: ${companies.filter(c => c._count.people > 0).length}`);
      console.log(`Companies without people: ${companies.filter(c => c._count.people === 0).length}`);

      // 5. Confirm deletion
      console.log(`\n⚠️  About to soft delete ALL data in the Adrata workspace.`);
      console.log('This operation is reversible (soft delete only).\n');

      // 6. Execute soft deletion
      const success = await this.softDeleteAllData();
      
      if (!success) {
        throw new Error('Soft delete operation failed');
      }

      // 7. Populate deleted records for reporting
      await this.populateDeletedRecords();

      // 8. Generate report
      await this.generateReport();

      // 9. Display final summary
      console.log('\n📊 SOFT DELETE SUMMARY:');
      console.log('========================');
      console.log(`✅ Companies soft deleted: ${this.results.summary.totalCompaniesDeleted}`);
      console.log(`✅ People soft deleted: ${this.results.summary.totalPeopleDeleted}`);
      console.log(`✅ Companies with people: ${this.results.summary.companiesWithPeople}`);
      console.log(`✅ Companies without people: ${this.results.summary.companiesWithoutPeople}`);
      console.log(`❌ Errors: ${this.results.errors.length}`);
      
      if (this.results.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        this.results.errors.forEach(error => {
          console.log(`   - ${error.type}: ${error.error}`);
        });
      }

      console.log('\n✅ Soft delete completed successfully!');
      console.log(`📄 Report saved to: docs/reports/adrata-workspace-soft-delete-report.json`);

    } catch (error) {
      console.error('❌ Soft delete failed:', error);
      this.results.errors.push({
        type: 'general',
        error: error.message
      });
      throw error;
    }
  }
}

async function main() {
  const softDeleteService = new AdrataSoftDeleteService();
  
  try {
    await softDeleteService.executeSoftDelete();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the soft delete
main();
