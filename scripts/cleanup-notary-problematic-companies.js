#!/usr/bin/env node

/**
 * CLEANUP NOTARY EVERYDAY PROBLEMATIC COMPANIES
 * 
 * Identifies and soft-deletes problematic companies with placeholder/invalid names
 * and their associated people from the Notary Everyday workspace.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

class NotaryCleanupService {
  constructor() {
    this.workspaceId = null;
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

  identifyProblematicCompanies(companies) {
    console.log('\n🔍 Identifying problematic companies...');
    
    const suspiciousPatterns = [
      /^Company [A-Z0-9]{8}$/i,  // "Company JQMQ91P9"
      /^[A-Z0-9]{8}$/,            // Just 8 random chars
      /^[A-Z]{1,3}$/,             // Very short acronyms with no data
      /test|placeholder|dummy|sample/i
    ];

    const problematicCompanies = companies.filter(company => {
      // Check if name matches any suspicious pattern
      const matchesPattern = suspiciousPatterns.some(pattern => pattern.test(company.name));
      
      // Check if it has no meaningful data
      const hasNoData = !company.website && !company.domain && !company.description;
      
      // Check if name is very short (less than 4 chars) and has no data
      const tooShort = company.name.length < 4 && hasNoData;
      
      return matchesPattern || tooShort;
    });

    console.log(`   Found ${problematicCompanies.length} problematic companies out of ${companies.length} total`);
    return problematicCompanies;
  }

  async getCompaniesWithPeople() {
    console.log('\n📊 Getting companies with people counts...');
    
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
        description: true,
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

  async softDeleteCompanyAndPeople(company) {
    console.log(`\n🗑️  Soft deleting: ${company.name} (${company._count.people} people)`);
    
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Soft delete all associated people
        if (company._count.people > 0) {
          const deletedPeople = await tx.people.findMany({
            where: {
              companyId: company.id,
              deletedAt: null
            },
            select: {
              id: true,
              fullName: true,
              firstName: true,
              lastName: true
            }
          });

          await tx.people.updateMany({
            where: {
              companyId: company.id,
              deletedAt: null
            },
            data: {
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          });

          // Record deleted people
          this.results.peopleDeleted.push(...deletedPeople.map(person => ({
            id: person.id,
            fullName: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
            companyId: company.id,
            companyName: company.name
          })));

          console.log(`   ✅ Soft deleted ${deletedPeople.length} people`);
        }

        // 2. Soft delete the company
        await tx.companies.update({
          where: {
            id: company.id
          },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Record deleted company
        this.results.companiesDeleted.push({
          id: company.id,
          name: company.name,
          website: company.website,
          domain: company.domain,
          peopleCount: company._count.people,
          deletedAt: new Date().toISOString()
        });

        console.log(`   ✅ Soft deleted company: ${company.name}`);
      });

      return true;
    } catch (error) {
      console.error(`   ❌ Failed to delete company ${company.name}:`, error.message);
      this.results.errors.push({
        companyId: company.id,
        companyName: company.name,
        error: error.message
      });
      return false;
    }
  }

  async executeCleanup() {
    try {
      console.log('🚀 Starting Notary Everyday cleanup process...\n');
      
      // 1. Find workspace
      await this.findNotaryEverydayWorkspace();
      
      // 2. Get all companies
      const companies = await this.getCompaniesWithPeople();
      
      // 3. Identify problematic companies
      const problematicCompanies = this.identifyProblematicCompanies(companies);
      
      if (problematicCompanies.length === 0) {
        console.log('\n✅ No problematic companies found!');
        return;
      }

      // 4. Display what will be deleted
      console.log('\n📋 COMPANIES TO BE SOFT DELETED:');
      console.log('=====================================');
      
      problematicCompanies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Website: ${company.website || 'none'}`);
        console.log(`   Domain: ${company.domain || 'none'}`);
        console.log(`   People: ${company._count.people}`);
        console.log('');
      });

      // 5. Confirm deletion
      console.log(`\n⚠️  About to soft delete ${problematicCompanies.length} companies and their associated people.`);
      console.log('This operation is reversible (soft delete only).\n');

      // 6. Execute deletions
      let successCount = 0;
      for (const company of problematicCompanies) {
        const success = await this.softDeleteCompanyAndPeople(company);
        if (success) {
          successCount++;
        }
      }

      // 7. Update summary
      this.results.summary = {
        totalCompaniesDeleted: this.results.companiesDeleted.length,
        totalPeopleDeleted: this.results.peopleDeleted.length,
        companiesWithPeople: this.results.companiesDeleted.filter(c => c.peopleCount > 0).length,
        companiesWithoutPeople: this.results.companiesDeleted.filter(c => c.peopleCount === 0).length,
        errors: this.results.errors.length
      };

      // 8. Generate report
      await this.generateReport();

      // 9. Display final summary
      console.log('\n📊 CLEANUP SUMMARY:');
      console.log('===================');
      console.log(`✅ Companies soft deleted: ${this.results.summary.totalCompaniesDeleted}`);
      console.log(`✅ People soft deleted: ${this.results.summary.totalPeopleDeleted}`);
      console.log(`✅ Companies with people: ${this.results.summary.companiesWithPeople}`);
      console.log(`✅ Companies without people: ${this.results.summary.companiesWithoutPeople}`);
      console.log(`❌ Errors: ${this.results.summary.errors}`);
      
      if (this.results.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        this.results.errors.forEach(error => {
          console.log(`   - ${error.companyName}: ${error.error}`);
        });
      }

      console.log('\n✅ Cleanup completed successfully!');
      console.log(`📄 Report saved to: docs/reports/notary-cleanup-report.json`);

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      this.results.errors.push({
        type: 'general',
        error: error.message
      });
      throw error;
    }
  }

  async generateReport() {
    console.log('\n📄 Generating cleanup report...');
    
    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'docs', 'reports');
    try {
      await fs.access(reportsDir);
    } catch {
      await fs.mkdir(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, 'notary-cleanup-report.json');
    
    const report = {
      ...this.results,
      generatedAt: new Date().toISOString(),
      operation: 'soft_delete_cleanup',
      workspace: this.results.workspace
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`   ✅ Report saved to: ${reportPath}`);
  }
}

async function main() {
  const cleanupService = new NotaryCleanupService();
  
  try {
    await cleanupService.executeCleanup();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
main();
