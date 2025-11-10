/**
 * Audit Top-Temp Workspace Against CSV
 * 
 * This script audits the top-temp workspace against final_top - Sheet1.csv to:
 * 1. Check if all companies and people from CSV are uploaded
 * 2. Verify all people are properly associated with companies
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

// Configuration
const CSV_FILE = 'final_top - Sheet1.csv';
const WORKSPACE_SLUG = 'top-temp';

class TopTempAuditor {
  constructor() {
    this.workspace = null;
    this.csvData = {
      companies: new Map(), // name -> row
      people: new Map(),    // email -> row
      companyOnlyEntries: [] // companies without people
    };
    this.dbData = {
      companies: new Map(), // name -> company
      people: new Map()    // email -> person
    };
    this.results = {
      companies: {
        inCsv: 0,
        inDb: 0,
        missing: [],
        extra: []
      },
      people: {
        inCsv: 0,
        inDb: 0,
        missing: [],
        extra: [],
        unassociated: [] // people without company association
      },
      associations: {
        totalPeople: 0,
        associated: 0,
        unassociated: 0,
        wrongCompany: []
      }
    };
  }

  async execute() {
    try {
      console.log('🔍 AUDITING TOP-TEMP WORKSPACE\n');
      console.log('='.repeat(60));

      // Step 1: Get workspace
      await this.getWorkspace();

      // Step 2: Parse CSV
      await this.parseCSV();

      // Step 3: Query database
      await this.queryDatabase();

      // Step 4: Compare data
      await this.compareData();

      // Step 5: Check associations
      await this.checkAssociations();

      // Step 6: Print report
      this.printReport();

    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async getWorkspace() {
    console.log('\n🏢 Getting workspace...');
    this.workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!this.workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`✅ Found workspace: ${this.workspace.name} (${this.workspace.id})\n`);
  }

  async parseCSV() {
    console.log('📄 Parsing CSV file...\n');

    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`CSV file not found: ${CSV_FILE}`);
    }

    const rows = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          console.log(`✅ Parsed ${rows.length} rows from CSV\n`);

          // Separate companies and people
          for (const row of rows) {
            const name = (row.Name || '').trim();
            const company = (row.Company || '').trim();
            const email = (row.Email || '').trim().toLowerCase();
            const isTop = name.toLowerCase() === 'top' || company.toLowerCase() === 'top';

            if (isTop) {
              continue; // Skip TOP
            }

            // Company: Name == Company AND Email is empty
            const isCompany = name === company && (!email || email === '');
            
            // Person: Name != Company AND Email is present
            const isPerson = name !== company && email !== '' && email;

            if (isCompany) {
              const normalizedName = name.toLowerCase();
              this.csvData.companies.set(normalizedName, {
                name: name,
                row: row
              });
              this.results.companies.inCsv++;
            } else if (isPerson) {
              this.csvData.people.set(email, {
                name: name,
                company: company,
                email: email,
                row: row
              });
              this.results.people.inCsv++;
            } else if (name === company && email) {
              // Edge case: Name == Company but has email - treat as person
              this.csvData.people.set(email, {
                name: name,
                company: company,
                email: email,
                row: row
              });
              this.results.people.inCsv++;
            }
          }

          console.log(`   Companies in CSV: ${this.results.companies.inCsv}`);
          console.log(`   People in CSV: ${this.results.people.inCsv}\n`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async queryDatabase() {
    console.log('🗄️  Querying database...\n');

    // Get all companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true
      }
    });

    for (const company of companies) {
      const normalizedName = company.name.toLowerCase();
      this.dbData.companies.set(normalizedName, company);
      this.results.companies.inDb++;
    }

    // Get all people
    const people = await prisma.people.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    for (const person of people) {
      if (person.email) {
        const email = person.email.toLowerCase();
        this.dbData.people.set(email, person);
        this.results.people.inDb++;
      }
    }

    console.log(`   Companies in DB: ${this.results.companies.inDb}`);
    console.log(`   People in DB: ${this.results.people.inDb}\n`);
  }

  async compareData() {
    console.log('🔍 Comparing CSV vs Database...\n');

    // Find missing companies
    for (const [normalizedName, csvCompany] of this.csvData.companies) {
      if (!this.dbData.companies.has(normalizedName)) {
        this.results.companies.missing.push(csvCompany.name);
      }
    }

    // Find extra companies (in DB but not in CSV)
    for (const [normalizedName, dbCompany] of this.dbData.companies) {
      if (!this.csvData.companies.has(normalizedName)) {
        this.results.companies.extra.push(dbCompany.name);
      }
    }

    // Find missing people
    for (const [email, csvPerson] of this.csvData.people) {
      if (!this.dbData.people.has(email)) {
        this.results.people.missing.push({
          name: csvPerson.name,
          email: email,
          company: csvPerson.company
        });
      }
    }

    // Find extra people (in DB but not in CSV)
    for (const [email, dbPerson] of this.dbData.people) {
      if (!this.csvData.people.has(email)) {
        this.results.people.extra.push({
          name: dbPerson.fullName,
          email: email,
          company: dbPerson.company?.name || 'N/A'
        });
      }
    }

    console.log(`   Missing companies: ${this.results.companies.missing.length}`);
    console.log(`   Extra companies: ${this.results.companies.extra.length}`);
    console.log(`   Missing people: ${this.results.people.missing.length}`);
    console.log(`   Extra people: ${this.results.people.extra.length}\n`);
  }

  async checkAssociations() {
    console.log('🔗 Checking people-company associations...\n');

    // Check all people in database
    for (const [email, person] of this.dbData.people) {
      this.results.associations.totalPeople++;

      if (!person.companyId || !person.company) {
        this.results.associations.unassociated++;
        this.results.people.unassociated.push({
          name: person.fullName,
          email: email
        });
      } else {
        this.results.associations.associated++;

        // Check if the association is correct based on CSV
        const csvPerson = this.csvData.people.get(email);
        if (csvPerson) {
          const csvCompanyName = (csvPerson.company || '').trim().toLowerCase();
          const dbCompanyName = person.company.name.toLowerCase();

          if (csvCompanyName && csvCompanyName !== dbCompanyName) {
            this.results.associations.wrongCompany.push({
              name: person.fullName,
              email: email,
              csvCompany: csvPerson.company,
              dbCompany: person.company.name
            });
          }
        }
      }
    }

    console.log(`   Total people: ${this.results.associations.totalPeople}`);
    console.log(`   Associated: ${this.results.associations.associated}`);
    console.log(`   Unassociated: ${this.results.associations.unassociated}`);
    console.log(`   Wrong company: ${this.results.associations.wrongCompany.length}\n`);
  }

  printReport() {
    console.log('='.repeat(60));
    console.log('📊 AUDIT REPORT');
    console.log('='.repeat(60));
    console.log(`Workspace: ${this.workspace.name} (${this.workspace.slug})`);
    console.log(`Workspace ID: ${this.workspace.id}\n`);

    // Companies section
    console.log('🏢 COMPANIES');
    console.log('-'.repeat(60));
    console.log(`CSV: ${this.results.companies.inCsv}`);
    console.log(`Database: ${this.results.companies.inDb}`);
    console.log(`Missing from DB: ${this.results.companies.missing.length}`);
    console.log(`Extra in DB: ${this.results.companies.extra.length}`);

    if (this.results.companies.missing.length > 0) {
      console.log(`\n❌ Missing Companies (${this.results.companies.missing.length}):`);
      this.results.companies.missing.slice(0, 20).forEach((name, idx) => {
        console.log(`   ${idx + 1}. ${name}`);
      });
      if (this.results.companies.missing.length > 20) {
        console.log(`   ... and ${this.results.companies.missing.length - 20} more`);
      }
    }

    if (this.results.companies.extra.length > 0) {
      console.log(`\n⚠️  Extra Companies in DB (${this.results.companies.extra.length}):`);
      this.results.companies.extra.slice(0, 20).forEach((name, idx) => {
        console.log(`   ${idx + 1}. ${name}`);
      });
      if (this.results.companies.extra.length > 20) {
        console.log(`   ... and ${this.results.companies.extra.length - 20} more`);
      }
    }

    // People section
    console.log('\n👤 PEOPLE');
    console.log('-'.repeat(60));
    console.log(`CSV: ${this.results.people.inCsv}`);
    console.log(`Database: ${this.results.people.inDb}`);
    console.log(`Missing from DB: ${this.results.people.missing.length}`);
    console.log(`Extra in DB: ${this.results.people.extra.length}`);

    if (this.results.people.missing.length > 0) {
      console.log(`\n❌ Missing People (${this.results.people.missing.length}):`);
      this.results.people.missing.slice(0, 20).forEach((person, idx) => {
        console.log(`   ${idx + 1}. ${person.name} (${person.email}) - Company: ${person.company || 'N/A'}`);
      });
      if (this.results.people.missing.length > 20) {
        console.log(`   ... and ${this.results.people.missing.length - 20} more`);
      }
    }

    if (this.results.people.extra.length > 0) {
      console.log(`\n⚠️  Extra People in DB (${this.results.people.extra.length}):`);
      this.results.people.extra.slice(0, 20).forEach((person, idx) => {
        console.log(`   ${idx + 1}. ${person.name} (${person.email}) - Company: ${person.company}`);
      });
      if (this.results.people.extra.length > 20) {
        console.log(`   ... and ${this.results.people.extra.length - 20} more`);
      }
    }

    // Associations section
    console.log('\n🔗 PEOPLE-COMPANY ASSOCIATIONS');
    console.log('-'.repeat(60));
    console.log(`Total people: ${this.results.associations.totalPeople}`);
    console.log(`Associated: ${this.results.associations.associated} (${((this.results.associations.associated / this.results.associations.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`Unassociated: ${this.results.associations.unassociated} (${((this.results.associations.unassociated / this.results.associations.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`Wrong company: ${this.results.associations.wrongCompany.length}`);

    if (this.results.people.unassociated.length > 0) {
      console.log(`\n❌ Unassociated People (${this.results.people.unassociated.length}):`);
      this.results.people.unassociated.slice(0, 20).forEach((person, idx) => {
        console.log(`   ${idx + 1}. ${person.name} (${person.email})`);
      });
      if (this.results.people.unassociated.length > 20) {
        console.log(`   ... and ${this.results.people.unassociated.length - 20} more`);
      }
    }

    if (this.results.associations.wrongCompany.length > 0) {
      console.log(`\n⚠️  People with Wrong Company (${this.results.associations.wrongCompany.length}):`);
      this.results.associations.wrongCompany.slice(0, 20).forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue.name} (${issue.email})`);
        console.log(`      CSV: ${issue.csvCompany}`);
        console.log(`      DB: ${issue.dbCompany}`);
      });
      if (this.results.associations.wrongCompany.length > 20) {
        console.log(`   ... and ${this.results.associations.wrongCompany.length - 20} more`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));

    const allCompaniesUploaded = this.results.companies.missing.length === 0;
    const allPeopleUploaded = this.results.people.missing.length === 0;
    const allPeopleAssociated = this.results.associations.unassociated === 0;

    console.log(`✅ All companies uploaded: ${allCompaniesUploaded ? 'YES' : 'NO'}`);
    console.log(`✅ All people uploaded: ${allPeopleUploaded ? 'YES' : 'NO'}`);
    console.log(`✅ All people associated: ${allPeopleAssociated ? 'YES' : 'NO'}`);

    if (!allCompaniesUploaded || !allPeopleUploaded || !allPeopleAssociated) {
      console.log('\n⚠️  ACTION REQUIRED:');
      if (!allCompaniesUploaded) {
        console.log(`   - ${this.results.companies.missing.length} companies need to be uploaded`);
      }
      if (!allPeopleUploaded) {
        console.log(`   - ${this.results.people.missing.length} people need to be uploaded`);
      }
      if (!allPeopleAssociated) {
        console.log(`   - ${this.results.associations.unassociated} people need company associations`);
      }
    } else {
      console.log('\n✅ All data is uploaded and properly associated!');
    }

    console.log('='.repeat(60));
  }
}

// Run the audit
async function main() {
  const auditor = new TopTempAuditor();
  await auditor.execute();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Audit completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Audit failed:', error);
      process.exit(1);
    });
}

module.exports = TopTempAuditor;

