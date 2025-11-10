/**
 * Fix Top-Temp Data from CSV
 * Compares database with final_top - Sheet1.csv and ensures:
 * 1. Victoria is set as mainSellerId for all records (unless Main_Seller specifies otherwise)
 * 2. Notes are properly synced
 * 3. Last_Action dates are properly synced
 * 4. Status is set to LEAD for newly uploaded records
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

const CSV_FILE = 'final_top - Sheet1.csv';
const WORKSPACE_SLUG = 'top-temp';

// Temp users configuration
const TEMP_USERS = [
  { name: 'Victoria Leland', username: 'temp-victoria', email: 'temp-victoria@top-temp.com' },
  { name: 'Justin Bedard', username: 'temp-justin', email: 'temp-justin@top-temp.com' },
  { name: 'Judy Wigginton', username: 'temp-judy', email: 'temp-judy@top-temp.com' },
  { name: 'Hilary Tristan', username: 'temp-hilary', email: 'temp-hilary@top-temp.com' }
];

class TopTempDataFixer {
  constructor() {
    this.workspace = null;
    this.sellerMap = new Map(); // Maps Main_Seller name to user ID
    this.companyMap = new Map(); // Maps company name to company ID
    this.stats = {
      companiesFixed: 0,
      peopleFixed: 0,
      companiesCreated: 0,
      peopleCreated: 0,
      companiesStatusUpdated: 0,
      peopleStatusUpdated: 0,
      errors: 0
    };
  }

  async execute() {
    try {
      console.log('🔧 FIXING TOP-TEMP DATA FROM CSV\n');
      console.log('='.repeat(60));

      // Step 1: Get workspace
      await this.getWorkspace();

      // Step 2: Create/get temp users and build seller map
      await this.createTempUsers();

      // Step 3: Parse CSV
      const rows = await this.parseCSV();

      // Step 4: Build company map from database
      await this.buildCompanyMap();

      // Step 5: Process companies
      await this.processCompanies(rows);

      // Step 6: Process people
      await this.processPeople(rows);

      // Summary
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

  async createTempUsers() {
    console.log('👥 Creating/getting temp users...\n');

    for (const userConfig of TEMP_USERS) {
      let user = await prisma.users.findFirst({
        where: {
          OR: [
            { email: userConfig.email },
            { username: userConfig.username }
          ]
        }
      });

      if (!user) {
        console.log(`   ⚠️  User not found: ${userConfig.name} (${userConfig.email})`);
        continue;
      }

      this.sellerMap.set(userConfig.name, user.id);
      console.log(`   ✅ ${userConfig.name}: ${user.id}`);
    }

    // Map empty Main_Seller to Victoria Leland
    const victoriaId = this.sellerMap.get('Victoria Leland');
    if (victoriaId) {
      this.sellerMap.set('', victoriaId);
      this.sellerMap.set(null, victoriaId);
    }

    console.log('');
  }

  async parseCSV() {
    console.log('📄 Parsing CSV...\n');
    const csvPath = path.join(process.cwd(), CSV_FILE);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    const rows = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          console.log(`   ✅ Parsed ${rows.length} rows\n`);
          resolve(rows);
        })
        .on('error', reject);
    });
  }

  async buildCompanyMap() {
    console.log('🏢 Building company map from database...\n');
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null
      },
      select: { id: true, name: true }
    });

    for (const company of companies) {
      this.companyMap.set(company.name.toLowerCase().trim(), company.id);
    }

    console.log(`   ✅ Mapped ${companies.length} companies\n`);
  }

  parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null;
    
    try {
      // Handle formats like "1/17/2024", "8/16/2024", etc.
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0]) - 1; // JavaScript months are 0-indexed
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
      }
    } catch (error) {
      console.warn(`   ⚠️  Could not parse date: ${dateStr}`);
    }
    
    return null;
  }

  async processCompanies(rows) {
    console.log('🏢 Processing companies...\n');

    // Filter company rows (Name == Company and no Email)
    const companyRows = rows.filter(row => {
      const name = (row.Name || '').trim();
      const company = (row.Company || '').trim();
      const email = (row.Email || '').trim();
      
      // Company criteria: Name equals Company AND no email
      return name === company && (!email || email === '');
    });

    console.log(`   Found ${companyRows.length} company rows\n`);

    for (const row of companyRows) {
      try {
        const companyName = (row.Name || '').trim();
        if (!companyName) continue;

        const mainSeller = (row.Main_Seller || '').trim() || 'Victoria Leland';
        const sellerId = this.sellerMap.get(mainSeller) || this.sellerMap.get('Victoria Leland');
        
        if (!sellerId) {
          console.log(`   ⚠️  No seller ID found for: ${mainSeller}, skipping ${companyName}`);
          continue;
        }

        // Find company in database
        let company = await prisma.companies.findFirst({
          where: {
            workspaceId: this.workspace.id,
            name: {
              equals: companyName,
              mode: 'insensitive'
            },
            deletedAt: null
          }
        });

        const notes = (row.Notes || '').trim() || null;
        const lastActionDate = this.parseDate(row.Last_Action);
        const createdAt = this.parseDate(row.Created);

        // Determine status - default to LEAD for new records
        let status = 'LEAD';
        if (company) {
          // Keep existing status if it's more advanced than LEAD
          if (company.status && ['PROSPECT', 'OPPORTUNITY', 'CLIENT'].includes(company.status)) {
            status = company.status;
          }
        }

        const updateData = {
          mainSellerId: sellerId,
          notes: notes,
          lastActionDate: lastActionDate,
          updatedAt: new Date(),
          status: status
        };

        if (createdAt) {
          updateData.createdAt = createdAt;
        }

        if (company) {
          // Update existing company
          const needsUpdate = 
            company.mainSellerId !== sellerId ||
            company.notes !== notes ||
            (company.lastActionDate?.getTime() !== lastActionDate?.getTime()) ||
            company.status !== status;

          if (needsUpdate) {
            await prisma.companies.update({
              where: { id: company.id },
              data: updateData
            });
            this.stats.companiesFixed++;
            if (company.status !== status) {
              this.stats.companiesStatusUpdated++;
            }
            console.log(`   ✅ Fixed: ${companyName}`);
          }
        } else {
          // Create new company if it doesn't exist
          const companyData = {
            name: companyName,
            address: (row.Street || '').trim() || null,
            city: (row.City || '').trim() || null,
            state: (row.State || '').trim() || null,
            postalCode: (row.Zipcode || '').trim() || null,
            country: (row['Mailing Country'] || '').trim() || null,
            mainSellerId: sellerId,
            workspaceId: this.workspace.id,
            notes: notes,
            lastActionDate: lastActionDate,
            status: status,
            createdAt: createdAt || new Date(),
            updatedAt: new Date()
          };

          company = await prisma.companies.create({
            data: companyData
          });
          this.stats.companiesCreated++;
          this.companyMap.set(companyName.toLowerCase().trim(), company.id);
          console.log(`   ✅ Created: ${companyName}`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing company ${row.Name}:`, error.message);
        this.stats.errors++;
      }
    }

    console.log(`\n✅ Companies processed: ${this.stats.companiesFixed} fixed, ${this.stats.companiesCreated} created\n`);
  }

  async processPeople(rows) {
    console.log('👤 Processing people...\n');

    // Filter people rows (Name != Company and Email is present)
    const peopleRows = rows.filter(row => {
      const name = (row.Name || '').trim();
      const company = (row.Company || '').trim();
      const email = (row.Email || '').trim();
      
      // Person criteria: Name does NOT equal Company AND Email is present
      const isPerson = name !== company && email !== '' && email;
      return isPerson;
    });

    console.log(`   Found ${peopleRows.length} people rows\n`);

    for (const row of peopleRows) {
      try {
        const fullName = (row.Name || '').trim();
        const email = (row.Email || '').trim().toLowerCase();
        const companyName = (row.Company || '').trim();

        if (!fullName || !email) {
          continue;
        }

        const mainSeller = (row.Main_Seller || '').trim() || 'Victoria Leland';
        const sellerId = this.sellerMap.get(mainSeller) || this.sellerMap.get('Victoria Leland');
        
        if (!sellerId) {
          console.log(`   ⚠️  No seller ID found for: ${mainSeller}, skipping ${fullName}`);
          continue;
        }

        // Find company ID
        let companyId = null;
        if (companyName) {
          companyId = this.companyMap.get(companyName.toLowerCase().trim());
        }

        // Find person in database
        let person = await prisma.people.findFirst({
          where: {
            workspaceId: this.workspace.id,
            email: {
              equals: email,
              mode: 'insensitive'
            },
            deletedAt: null
          }
        });

        const { firstName, lastName } = this.parseName(fullName);
        const notes = (row.Notes || '').trim() || null;
        const lastActionDate = this.parseDate(row.Last_Action);
        const createdAt = this.parseDate(row.Created);

        // Determine status - default to LEAD for new records
        let status = 'LEAD';
        if (person) {
          // Keep existing status if it's more advanced than LEAD
          if (person.status && ['PROSPECT', 'OPPORTUNITY', 'CLIENT'].includes(person.status)) {
            status = person.status;
          }
        }

        const updateData = {
          mainSellerId: sellerId,
          companyId: companyId,
          firstName: firstName,
          lastName: lastName,
          fullName: fullName,
          email: email,
          workEmail: email,
          jobTitle: (row.Title || '').trim() || null,
          phone: (row.Phone_Number || '').trim() || null,
          workPhone: (row.Work_Phone || '').trim() || null,
          mobilePhone: (row.Mobile_Phone || '').trim() || null,
          address: (row.Street || '').trim() || null,
          city: (row.City || '').trim() || null,
          state: (row.State || '').trim() || null,
          postalCode: (row.Zipcode || '').trim() || null,
          country: (row['Mailing Country'] || '').trim() || null,
          notes: notes,
          lastActionDate: lastActionDate,
          updatedAt: new Date(),
          status: status
        };

        if (createdAt) {
          updateData.createdAt = createdAt;
        }

        if (person) {
          // Update existing person
          const needsUpdate = 
            person.mainSellerId !== sellerId ||
            person.companyId !== companyId ||
            person.notes !== notes ||
            (person.lastActionDate?.getTime() !== lastActionDate?.getTime()) ||
            person.status !== status;

          if (needsUpdate) {
            await prisma.people.update({
              where: { id: person.id },
              data: updateData
            });
            this.stats.peopleFixed++;
            if (person.status !== status) {
              this.stats.peopleStatusUpdated++;
            }
            console.log(`   ✅ Fixed: ${fullName} (${email})`);
          }
        } else {
          // Create new person if it doesn't exist
          person = await prisma.people.create({
            data: updateData
          });
          this.stats.peopleCreated++;
          console.log(`   ✅ Created: ${fullName} (${email})`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing person ${row.Name}:`, error.message);
        this.stats.errors++;
      }
    }

    console.log(`\n✅ People processed: ${this.stats.peopleFixed} fixed, ${this.stats.peopleCreated} created\n`);
  }

  parseName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return { firstName, lastName };
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Companies fixed: ${this.stats.companiesFixed}`);
    console.log(`   Companies created: ${this.stats.companiesCreated}`);
    console.log(`   Companies status updated: ${this.stats.companiesStatusUpdated}`);
    console.log(`   People fixed: ${this.stats.peopleFixed}`);
    console.log(`   People created: ${this.stats.peopleCreated}`);
    console.log(`   People status updated: ${this.stats.peopleStatusUpdated}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log('='.repeat(60));
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new TopTempDataFixer();
  fixer.execute()
    .then(() => {
      console.log('\n✅ Data fix complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Data fix failed:', error);
      process.exit(1);
    });
}

module.exports = TopTempDataFixer;

