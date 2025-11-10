/**
 * Audit and Fix Top-Temp Data Integrity
 * Compares database records to CSV source and fixes discrepancies
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Configuration
const CSV_FILE = 'final_top - Sheet1.csv';
const WORKSPACE_SLUG = 'top-temp';

// Temp users configuration
const TEMP_USERS = [
  { name: 'Victoria Leland', username: 'temp-victoria', email: 'temp-victoria@top-temp.com' },
  { name: 'Justin Bedard', username: 'temp-justin', email: 'temp-justin@top-temp.com' },
  { name: 'Judy Wigginton', username: 'temp-judy', email: 'temp-judy@top-temp.com' },
  { name: 'Hilary Tristan', username: 'temp-hilary', email: 'temp-hilary@top-temp.com' }
];

class TopTempDataAuditor {
  constructor() {
    this.workspace = null;
    this.sellerMap = new Map();
    this.csvData = {
      companies: new Map(), // company name -> row data
      people: new Map()     // email -> row data
    };
    this.stats = {
      companiesChecked: 0,
      companiesFixed: 0,
      companiesCreated: 0,
      peopleChecked: 0,
      peopleFixed: 0,
      peopleCreated: 0,
      fixesByField: {
        mainSellerId: 0,
        notes: 0,
        lastActionDate: 0,
        status: 0
      },
      errors: []
    };
  }

  async execute() {
    try {
      console.log('🔍 Starting Top-Temp Data Audit and Fix\n');
      console.log('='.repeat(60));

      // Step 1: Get workspace
      await this.getWorkspace();

      // Step 2: Build seller map
      await this.buildSellerMap();

      // Step 3: Parse CSV
      await this.parseCSV();

      // Step 4: Audit and fix companies
      await this.auditAndFixCompanies();

      // Step 5: Audit and fix people
      await this.auditAndFixPeople();

      // Step 6: Print summary
      this.printSummary();

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

  async buildSellerMap() {
    console.log('👥 Building seller map...\n');

    for (const userConfig of TEMP_USERS) {
      try {
        const user = await prisma.users.findUnique({
          where: { email: userConfig.email },
          select: { id: true, name: true, email: true }
        });

        if (user) {
          this.sellerMap.set(userConfig.name, user.id);
          console.log(`   ✅ Mapped: ${userConfig.name} -> ${user.id}`);
        } else {
          console.log(`   ⚠️  User not found: ${userConfig.name} (${userConfig.email})`);
        }
      } catch (error) {
        console.error(`   ❌ Error finding user ${userConfig.name}:`, error.message);
        this.stats.errors.push({ type: 'seller_map', error: error.message });
      }
    }

    // Map empty Main_Seller to Victoria Leland
    const victoriaId = this.sellerMap.get('Victoria Leland');
    if (victoriaId) {
      this.sellerMap.set('', victoriaId);
      this.sellerMap.set(null, victoriaId);
    }

    console.log(`\n✅ Seller map ready (${this.sellerMap.size} entries)\n`);
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
          console.log(`✅ Parsed ${rows.length} rows from CSV`);

          // Organize CSV data by type
          for (const row of rows) {
            const name = (row.Name || '').trim();
            const company = (row.Company || '').trim();
            const email = (row.Email || '').trim();
            const isTop = name.toLowerCase() === 'top' || company.toLowerCase() === 'top';

            if (isTop) {
              continue; // Skip TOP
            }

            // Company: Name == Company AND Email is empty
            const isCompany = name === company && (!email || email === '');
            
            // Person: Name != Company AND Email is present
            const isPerson = name !== company && email !== '' && email;

            if (isCompany) {
              this.csvData.companies.set(name.toLowerCase(), row);
            } else if (isPerson) {
              this.csvData.people.set(email.toLowerCase(), row);
            }
          }

          console.log(`   Companies in CSV: ${this.csvData.companies.size}`);
          console.log(`   People in CSV: ${this.csvData.people.size}\n`);
          resolve();
        })
        .on('error', reject);
    });
  }

  parseDate(dateString) {
    if (!dateString || dateString.trim() === '') {
      return null;
    }

    // Parse MM/DD/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (isNaN(month) || isNaN(day) || isNaN(year)) {
        return null;
      }

      return new Date(year, month, day);
    }

    return null;
  }

  determineStatus(notes, lastActionDate) {
    if (!notes || notes.trim() === '') {
      return 'LEAD';
    }

    const notesLower = notes.toLowerCase();
    
    // PROSPECT indicators
    const prospectIndicators = [
      'talked to',
      'conversation',
      'spoke with',
      'meeting',
      'met with',
      'lengthy conversations',
      'discussed',
      'reviewed',
      'messaged',
      'contacted',
      'called',
      'emailed'
    ];

    const hasProspectIndicator = prospectIndicators.some(indicator => 
      notesLower.includes(indicator)
    );

    // If has relationship language OR (has lastActionDate AND relationship language)
    if (hasProspectIndicator) {
      return 'PROSPECT';
    }

    // Default to LEAD
    return 'LEAD';
  }

  async auditAndFixCompanies() {
    console.log('🏢 Auditing and fixing companies...\n');

    // Get all companies from database
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null
      }
    });

    console.log(`   Found ${companies.length} companies in database\n`);

    for (const company of companies) {
      try {
        this.stats.companiesChecked++;

        const csvRow = this.csvData.companies.get(company.name.toLowerCase());
        
        if (!csvRow) {
          // Company not in CSV - check if mainSellerId is set
          if (!company.mainSellerId) {
            const victoriaId = this.sellerMap.get('Victoria Leland');
            if (victoriaId) {
              await prisma.companies.update({
                where: { id: company.id },
                data: {
                  mainSellerId: victoriaId,
                  updatedAt: new Date()
                }
              });
              this.stats.companiesFixed++;
              this.stats.fixesByField.mainSellerId++;
              console.log(`   🔧 Fixed mainSellerId for company not in CSV: ${company.name}`);
            }
          }
          continue;
        }

        // Compare and fix
        const needsUpdate = {};
        const mainSeller = (csvRow.Main_Seller || '').trim() || '';
        const sellerId = this.sellerMap.get(mainSeller) || this.sellerMap.get('Victoria Leland');

        // Check mainSellerId
        if (company.mainSellerId !== sellerId) {
          needsUpdate.mainSellerId = sellerId;
        }

        // Check notes
        const csvNotes = (csvRow.Notes || '').trim() || null;
        const dbNotes = company.notes || null;
        if (csvNotes && csvNotes !== dbNotes) {
          needsUpdate.notes = csvNotes;
        }

        // Check lastActionDate
        const csvLastAction = this.parseDate(csvRow.Last_Action);
        if (csvLastAction) {
          const dbLastAction = company.lastActionDate;
          if (!dbLastAction || dbLastAction.getTime() !== csvLastAction.getTime()) {
            needsUpdate.lastActionDate = csvLastAction;
          }
        }

        // Check status
        const csvStatus = this.determineStatus(csvNotes, csvLastAction);
        if (company.status !== csvStatus) {
          needsUpdate.status = csvStatus;
        }

        // Apply fixes
        if (Object.keys(needsUpdate).length > 0) {
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              ...needsUpdate,
              updatedAt: new Date()
            }
          });

          this.stats.companiesFixed++;
          if (needsUpdate.mainSellerId) this.stats.fixesByField.mainSellerId++;
          if (needsUpdate.notes) this.stats.fixesByField.notes++;
          if (needsUpdate.lastActionDate) this.stats.fixesByField.lastActionDate++;
          if (needsUpdate.status) this.stats.fixesByField.status++;

          const fixes = Object.keys(needsUpdate).join(', ');
          console.log(`   🔧 Fixed ${company.name}: ${fixes}`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing company ${company.name}:`, error.message);
        this.stats.errors.push({ type: 'company', name: company.name, error: error.message });
      }
    }

    // Check for companies in CSV that don't exist in database
    for (const [companyNameLower, csvRow] of this.csvData.companies.entries()) {
      const companyName = csvRow.Name || csvRow.Company;
      const existingCompany = companies.find(c => 
        c.name.toLowerCase() === companyNameLower
      );

      if (!existingCompany) {
        // Company exists in CSV but not in database - create it
        try {
          const mainSeller = (csvRow.Main_Seller || '').trim() || '';
          const sellerId = this.sellerMap.get(mainSeller) || this.sellerMap.get('Victoria Leland');
          const csvNotes = (csvRow.Notes || '').trim() || null;
          const csvLastAction = this.parseDate(csvRow.Last_Action);
          const csvStatus = this.determineStatus(csvNotes, csvLastAction);

          await prisma.companies.create({
            data: {
              workspaceId: this.workspace.id,
              name: companyName,
              address: (csvRow.Street || '').trim() || null,
              city: (csvRow.City || '').trim() || null,
              state: (csvRow.State || '').trim() || null,
              postalCode: (csvRow.Zipcode || '').trim() || null,
              country: (csvRow['Mailing Country'] || '').trim() || null,
              mainSellerId: sellerId,
              status: csvStatus,
              notes: csvNotes,
              lastActionDate: csvLastAction
            }
          });

          this.stats.companiesCreated++;
          console.log(`   ✅ Created missing company: ${companyName}`);
        } catch (error) {
          console.error(`   ❌ Error creating company ${companyName}:`, error.message);
          this.stats.errors.push({ type: 'company_create', name: companyName, error: error.message });
        }
      }
    }

    console.log(`\n✅ Companies audit complete\n`);
  }

  async auditAndFixPeople() {
    console.log('👤 Auditing and fixing people...\n');

    // Get all people from database
    const people = await prisma.people.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null
      }
    });

    console.log(`   Found ${people.length} people in database\n`);

    for (const person of people) {
      try {
        this.stats.peopleChecked++;

        if (!person.email) {
          // Person without email - check if mainSellerId is set
          if (!person.mainSellerId) {
            const victoriaId = this.sellerMap.get('Victoria Leland');
            if (victoriaId) {
              await prisma.people.update({
                where: { id: person.id },
                data: {
                  mainSellerId: victoriaId,
                  updatedAt: new Date()
                }
              });
              this.stats.peopleFixed++;
              this.stats.fixesByField.mainSellerId++;
              console.log(`   🔧 Fixed mainSellerId for person without email: ${person.fullName || person.firstName}`);
            }
          }
          continue;
        }

        const csvRow = this.csvData.people.get(person.email.toLowerCase());
        
        if (!csvRow) {
          // Person not in CSV - check if mainSellerId is set
          if (!person.mainSellerId) {
            const victoriaId = this.sellerMap.get('Victoria Leland');
            if (victoriaId) {
              await prisma.people.update({
                where: { id: person.id },
                data: {
                  mainSellerId: victoriaId,
                  updatedAt: new Date()
                }
              });
              this.stats.peopleFixed++;
              this.stats.fixesByField.mainSellerId++;
              console.log(`   🔧 Fixed mainSellerId for person not in CSV: ${person.fullName || person.firstName}`);
            }
          }
          continue;
        }

        // Compare and fix
        const needsUpdate = {};
        const mainSeller = (csvRow.Main_Seller || '').trim() || '';
        const sellerId = this.sellerMap.get(mainSeller) || this.sellerMap.get('Victoria Leland');

        // Check mainSellerId
        if (person.mainSellerId !== sellerId) {
          needsUpdate.mainSellerId = sellerId;
        }

        // Check notes
        const csvNotes = (csvRow.Notes || '').trim() || null;
        const dbNotes = person.notes || null;
        if (csvNotes && csvNotes !== dbNotes) {
          needsUpdate.notes = csvNotes;
        }

        // Check lastActionDate
        const csvLastAction = this.parseDate(csvRow.Last_Action);
        if (csvLastAction) {
          const dbLastAction = person.lastActionDate;
          if (!dbLastAction || dbLastAction.getTime() !== csvLastAction.getTime()) {
            needsUpdate.lastActionDate = csvLastAction;
          }
        }

        // Check status
        const csvStatus = this.determineStatus(csvNotes, csvLastAction);
        if (person.status !== csvStatus) {
          needsUpdate.status = csvStatus;
        }

        // Apply fixes
        if (Object.keys(needsUpdate).length > 0) {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              ...needsUpdate,
              updatedAt: new Date()
            }
          });

          this.stats.peopleFixed++;
          if (needsUpdate.mainSellerId) this.stats.fixesByField.mainSellerId++;
          if (needsUpdate.notes) this.stats.fixesByField.notes++;
          if (needsUpdate.lastActionDate) this.stats.fixesByField.lastActionDate++;
          if (needsUpdate.status) this.stats.fixesByField.status++;

          const fixes = Object.keys(needsUpdate).join(', ');
          console.log(`   🔧 Fixed ${person.fullName || person.email}: ${fixes}`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing person ${person.fullName || person.email}:`, error.message);
        this.stats.errors.push({ type: 'person', name: person.fullName || person.email, error: error.message });
      }
    }

    // Check for people in CSV that don't exist in database
    for (const [emailLower, csvRow] of this.csvData.people.entries()) {
      const email = csvRow.Email.trim().toLowerCase();
      const existingPerson = people.find(p => 
        p.email && p.email.toLowerCase() === emailLower
      );

      if (!existingPerson) {
        // Person exists in CSV but not in database - create it
        try {
          const fullName = (csvRow.Name || '').trim();
          const companyName = (csvRow.Company || '').trim();
          
          if (!fullName || !email) {
            continue; // Skip invalid rows
          }

          // Find company ID
          let companyId = null;
          if (companyName) {
            const company = await prisma.companies.findFirst({
              where: {
                workspaceId: this.workspace.id,
                name: { equals: companyName, mode: 'insensitive' },
                deletedAt: null
              }
            });
            if (company) {
              companyId = company.id;
            }
          }

          const nameParts = fullName.trim().split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const mainSeller = (csvRow.Main_Seller || '').trim() || '';
          const sellerId = this.sellerMap.get(mainSeller) || this.sellerMap.get('Victoria Leland');
          const csvNotes = (csvRow.Notes || '').trim() || null;
          const csvLastAction = this.parseDate(csvRow.Last_Action);
          const csvStatus = this.determineStatus(csvNotes, csvLastAction);

          await prisma.people.create({
            data: {
              workspaceId: this.workspace.id,
              companyId: companyId,
              firstName: firstName,
              lastName: lastName,
              fullName: fullName,
              email: email,
              workEmail: email,
              jobTitle: (csvRow.Title || '').trim() || null,
              phone: (csvRow.Phone_Number || '').trim() || null,
              workPhone: (csvRow.Work_Phone || '').trim() || null,
              mobilePhone: (csvRow.Mobile_Phone || '').trim() || null,
              address: (csvRow.Street || '').trim() || null,
              city: (csvRow.City || '').trim() || null,
              state: (csvRow.State || '').trim() || null,
              postalCode: (csvRow.Zipcode || '').trim() || null,
              country: (csvRow['Mailing Country'] || '').trim() || null,
              mainSellerId: sellerId,
              status: csvStatus,
              notes: csvNotes,
              lastActionDate: csvLastAction,
              createdAt: this.parseDate(csvRow.Created) || new Date()
            }
          });

          this.stats.peopleCreated++;
          console.log(`   ✅ Created missing person: ${fullName} (${email})`);
        } catch (error) {
          console.error(`   ❌ Error creating person ${csvRow.Name}:`, error.message);
          this.stats.errors.push({ type: 'person_create', name: csvRow.Name, error: error.message });
        }
      }
    }

    console.log(`\n✅ People audit complete\n`);
  }

  printSummary() {
    console.log('='.repeat(60));
    console.log('📊 AUDIT AND FIX SUMMARY');
    console.log('='.repeat(60));
    console.log(`Workspace: ${this.workspace.name} (${this.workspace.slug})`);
    console.log('');
    console.log('Companies:');
    console.log(`  Checked: ${this.stats.companiesChecked}`);
    console.log(`  Fixed: ${this.stats.companiesFixed}`);
    console.log(`  Created: ${this.stats.companiesCreated}`);
    console.log('');
    console.log('People:');
    console.log(`  Checked: ${this.stats.peopleChecked}`);
    console.log(`  Fixed: ${this.stats.peopleFixed}`);
    console.log(`  Created: ${this.stats.peopleCreated}`);
    console.log('');
    console.log('Fixes by Field:');
    console.log(`  mainSellerId: ${this.stats.fixesByField.mainSellerId}`);
    console.log(`  notes: ${this.stats.fixesByField.notes}`);
    console.log(`  lastActionDate: ${this.stats.fixesByField.lastActionDate}`);
    console.log(`  status: ${this.stats.fixesByField.status}`);
    console.log('');
    console.log(`Errors: ${this.stats.errors.length}`);
    if (this.stats.errors.length > 0) {
      console.log('');
      console.log('Error Details:');
      this.stats.errors.slice(0, 10).forEach((error, idx) => {
        console.log(`  ${idx + 1}. [${error.type}] ${error.name || 'N/A'}: ${error.error}`);
      });
      if (this.stats.errors.length > 10) {
        console.log(`  ... and ${this.stats.errors.length - 10} more errors`);
      }
    }
    console.log('='.repeat(60));
    console.log('✅ Audit and fix complete!\n');
  }
}

// Run the audit
async function main() {
  const auditor = new TopTempDataAuditor();
  await auditor.execute();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = TopTempDataAuditor;

