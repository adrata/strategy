#!/usr/bin/env node

/**
 * REMOVE NOTARY JSON IMPORTS
 * 
 * Removes all people and companies that were imported from data_notary.json
 * from the Notary Everyday workspace database
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

class NotaryJsonRemovalService {
  constructor() {
    this.workspaceId = null;
    this.workspace = null;
    this.results = {
      timestamp: new Date().toISOString(),
      workspace: null,
      peopleRemoved: [],
      companiesRemoved: [],
      errors: [],
      summary: {
        totalPeopleRemoved: 0,
        totalCompaniesRemoved: 0,
        errors: 0
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

  getJsonPeopleEmails() {
    // List of emails from the data_notary.json file that we identified in the audit
    const jsonPeopleEmails = [
      'mba@meadowlarktitle.com',
      'ra@remedialinfotech.com',
      'aacker@dbello.com',
      'bayleigh.ackman@qualia.com',
      'carmen.adams@fnf.com',
      'Tadams@certifID.com',
      'Adeel.Ahmad@visionet.com',
      'ealbrecht@security1st.com',
      'AAlessandro@catic.com',
      'aallard@oldrepublictitle.com'
    ];

    console.log(`📧 Identified ${jsonPeopleEmails.length} email addresses from JSON file`);
    return jsonPeopleEmails;
  }

  async findPeopleFromJson() {
    console.log('\n🔍 Finding people imported from JSON file...');
    
    const jsonEmails = this.getJsonPeopleEmails();
    
    const people = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { email: { in: jsonEmails } },
          { workEmail: { in: jsonEmails } },
          { personalEmail: { in: jsonEmails } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`   ✅ Found ${people.length} people from JSON file in database`);
    
    if (people.length > 0) {
      console.log('\n   📋 People to be removed:');
      people.forEach((person, index) => {
        const email = person.email || person.workEmail || person.personalEmail;
        console.log(`   ${index + 1}. ${person.fullName} - ${email}`);
        console.log(`      Company: ${person.company?.name || 'No company'}`);
      });
    }

    return people;
  }

  async findCompaniesFromJson() {
    console.log('\n🏢 Finding companies associated with JSON people...');
    
    const jsonEmails = this.getJsonPeopleEmails();
    
    // Get companies that have people from the JSON file
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        people: {
          some: {
            deletedAt: null,
            OR: [
              { email: { in: jsonEmails } },
              { workEmail: { in: jsonEmails } },
              { personalEmail: { in: jsonEmails } }
            ]
          }
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true,
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null,
                OR: [
                  { email: { in: jsonEmails } },
                  { workEmail: { in: jsonEmails } },
                  { personalEmail: { in: jsonEmails } }
                ]
              }
            }
          }
        }
      }
    });

    console.log(`   ✅ Found ${companies.length} companies with JSON people`);
    
    if (companies.length > 0) {
      console.log('\n   📋 Companies to be removed:');
      companies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (${company._count.people} JSON people)`);
        console.log(`      Website: ${company.website || 'none'}`);
      });
    }

    return companies;
  }

  async removePeopleAndCompanies(people, companies) {
    console.log('\n🗑️  Removing people and companies from JSON import...');
    
    let peopleRemoved = 0;
    let companiesRemoved = 0;

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Soft delete all people from JSON file
        console.log('\n   👥 Removing people...');
        for (const person of people) {
          try {
            await tx.people.update({
              where: { id: person.id },
              data: {
                deletedAt: new Date(),
                updatedAt: new Date()
              }
            });

            this.results.peopleRemoved.push({
              id: person.id,
              fullName: person.fullName,
              email: person.email || person.workEmail || person.personalEmail,
              companyId: person.companyId,
              companyName: person.company?.name,
              removedAt: new Date().toISOString()
            });

            peopleRemoved++;
            console.log(`   ✅ Removed: ${person.fullName}`);
          } catch (error) {
            console.error(`   ❌ Failed to remove ${person.fullName}:`, error.message);
            this.results.errors.push({
              type: 'person_removal',
              personId: person.id,
              personName: person.fullName,
              error: error.message
            });
          }
        }

        // 2. Soft delete companies that only had JSON people
        console.log('\n   🏢 Removing companies...');
        for (const company of companies) {
          try {
            // Check if company has any remaining active people
            const remainingPeople = await tx.people.count({
              where: {
                companyId: company.id,
                deletedAt: null
              }
            });

            if (remainingPeople === 0) {
              // Company has no remaining people, safe to delete
              await tx.companies.update({
                where: { id: company.id },
                data: {
                  deletedAt: new Date(),
                  updatedAt: new Date()
                }
              });

              this.results.companiesRemoved.push({
                id: company.id,
                name: company.name,
                website: company.website,
                domain: company.domain,
                jsonPeopleCount: company._count.people,
                removedAt: new Date().toISOString()
              });

              companiesRemoved++;
              console.log(`   ✅ Removed company: ${company.name}`);
            } else {
              console.log(`   ⚠️  Keeping company: ${company.name} (${remainingPeople} remaining people)`);
            }
          } catch (error) {
            console.error(`   ❌ Failed to remove company ${company.name}:`, error.message);
            this.results.errors.push({
              type: 'company_removal',
              companyId: company.id,
              companyName: company.name,
              error: error.message
            });
          }
        }
      });

      this.results.summary = {
        totalPeopleRemoved: peopleRemoved,
        totalCompaniesRemoved: companiesRemoved,
        errors: this.results.errors.length
      };

      console.log(`\n   ✅ Transaction completed successfully`);
      console.log(`   👥 People removed: ${peopleRemoved}`);
      console.log(`   🏢 Companies removed: ${companiesRemoved}`);
      console.log(`   ❌ Errors: ${this.results.errors.length}`);

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      this.results.errors.push({
        type: 'transaction',
        error: error.message
      });
      throw error;
    }
  }

  async generateReport() {
    console.log('\n📄 Generating removal report...');
    
    const report = {
      ...this.results,
      generatedAt: new Date().toISOString(),
      operation: 'remove_json_imports'
    };

    // Ensure reports directory exists
    const reportsDir = 'docs/reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = `${reportsDir}/notary-json-removal-report.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`   ✅ Report saved to: ${reportPath}`);

    return report;
  }

  async executeRemoval() {
    try {
      console.log('🚀 Starting removal of JSON imports from Notary Everyday workspace...\n');
      
      // 1. Find workspace
      await this.findNotaryEverydayWorkspace();
      
      // 2. Find people from JSON file
      const people = await this.findPeopleFromJson();
      
      if (people.length === 0) {
        console.log('\n✅ No people from JSON file found in database!');
        return;
      }

      // 3. Find companies associated with JSON people
      const companies = await this.findCompaniesFromJson();
      
      // 4. Confirm removal
      console.log('\n⚠️  CONFIRMATION REQUIRED:');
      console.log('========================');
      console.log(`About to remove:`);
      console.log(`   👥 ${people.length} people from JSON file`);
      console.log(`   🏢 ${companies.length} companies (if no other people remain)`);
      console.log(`\nThis operation will soft delete these records (reversible).`);
      console.log(`\nProceeding with removal...\n`);

      // 5. Remove people and companies
      await this.removePeopleAndCompanies(people, companies);
      
      // 6. Generate report
      await this.generateReport();
      
      // 7. Display final summary
      console.log('\n📊 REMOVAL SUMMARY:');
      console.log('===================');
      console.log(`✅ People removed: ${this.results.summary.totalPeopleRemoved}`);
      console.log(`✅ Companies removed: ${this.results.summary.totalCompaniesRemoved}`);
      console.log(`❌ Errors: ${this.results.summary.errors}`);
      
      if (this.results.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        this.results.errors.forEach(error => {
          console.log(`   - ${error.type}: ${error.error}`);
        });
      }

      console.log('\n✅ JSON imports removal completed successfully!');
      console.log(`📄 Detailed report saved to: docs/reports/notary-json-removal-report.json`);

    } catch (error) {
      console.error('❌ Removal failed:', error);
      throw error;
    }
  }
}

async function main() {
  const removalService = new NotaryJsonRemovalService();
  
  try {
    await removalService.executeRemoval();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the removal
main();
