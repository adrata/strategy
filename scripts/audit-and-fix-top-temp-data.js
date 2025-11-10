/**
 * Audit and Fix Top-Temp Data Against CSV
 * Compares database records with final_top - Sheet1.csv and fixes:
 * - mainSellerId (should be Victoria unless CSV says otherwise)
 * - Notes
 * - Last_Action dates
 * - All other fields
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

class TopTempDataAuditor {
  constructor() {
    this.workspace = null;
    this.victoriaUserId = null;
    this.sellerMap = new Map(); // Maps Main_Seller name to user ID
    this.csvData = [];
    this.stats = {
      companiesChecked: 0,
      companiesFixed: 0,
      peopleChecked: 0,
      peopleFixed: 0,
      errors: 0
    };
  }

  async execute() {
    try {
      console.log('🔍 AUDITING AND FIXING TOP-TEMP DATA\n');
      console.log('='.repeat(60));

      // Step 1: Get workspace
      await this.getWorkspace();

      // Step 2: Get Victoria's user ID
      await this.getVictoriaUserId();

      // Step 3: Build seller map
      await this.buildSellerMap();

      // Step 4: Parse CSV
      await this.parseCSV();

      // Step 5: Audit and fix companies
      await this.auditAndFixCompanies();

      // Step 6: Audit and fix people
      await this.auditAndFixPeople();

      // Step 7: Set status to LEAD for records without status
      await this.setDefaultStatuses();

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

    console.log(`   ✅ Found workspace: ${this.workspace.name} (${this.workspace.id})`);
  }

  async getVictoriaUserId() {
    console.log('\n👤 Finding Victoria Leland user...');
    
    // Try multiple possible emails
    const possibleEmails = [
      'temp-victoria@top-temp.com',
      'vleland@topengineersplus.com',
      'victoria.leland@topengineersplus.com'
    ];

    for (const email of possibleEmails) {
      const user = await prisma.users.findFirst({
        where: { email: email }
      });

      if (user) {
        this.victoriaUserId = user.id;
        console.log(`   ✅ Found Victoria: ${user.name} (${user.email}) - ID: ${user.id}`);
        return;
      }
    }

    // If not found by email, try by name
    const user = await prisma.users.findFirst({
      where: {
        name: { contains: 'Victoria', mode: 'insensitive' }
      }
    });

    if (user) {
      this.victoriaUserId = user.id;
      console.log(`   ✅ Found Victoria by name: ${user.name} (${user.email}) - ID: ${user.id}`);
      return;
    }

    throw new Error('Victoria Leland user not found');
  }

  async buildSellerMap() {
    console.log('\n👥 Building seller map...');
    
    // Get all users that might be sellers
    const sellerNames = ['Victoria Leland', 'Justin Bedard', 'Judy Wigginton', 'Hilary Tristan'];
    
    for (const sellerName of sellerNames) {
      // Try to find by name
      const user = await prisma.users.findFirst({
        where: {
          OR: [
            { name: { contains: sellerName.split(' ')[0], mode: 'insensitive' } },
            { name: { contains: sellerName.split(' ')[1], mode: 'insensitive' } }
          ]
        }
      });

      if (user) {
        this.sellerMap.set(sellerName, user.id);
        console.log(`   ✅ Mapped "${sellerName}" -> ${user.id} (${user.email})`);
      } else {
        // Default to Victoria if not found
        this.sellerMap.set(sellerName, this.victoriaUserId);
        console.log(`   ⚠️  "${sellerName}" not found, defaulting to Victoria`);
      }
    }

    // Default fallback to Victoria
    this.sellerMap.set('', this.victoriaUserId);
    this.sellerMap.set(null, this.victoriaUserId);
  }

  async parseCSV() {
    console.log('\n📄 Parsing CSV file...');
    
    return new Promise((resolve, reject) => {
      const csvPath = path.join(process.cwd(), CSV_FILE);
      
      if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV file not found: ${csvPath}`);
      }

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          this.csvData.push(row);
        })
        .on('end', () => {
          console.log(`   ✅ Parsed ${this.csvData.length} rows from CSV`);
          resolve();
        })
        .on('error', reject);
    });
  }

  parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null;
    
    // Handle MM/DD/YYYY format
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    
    return null;
  }

  async auditAndFixCompanies() {
    console.log('\n🏢 Auditing and fixing companies...');
    
    // Get all companies from workspace
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null
      }
    });

    console.log(`   Found ${companies.length} companies in database`);

    // Create a map of CSV companies (Name == Company)
    const csvCompanies = new Map();
    for (const row of this.csvData) {
      const name = (row.Name || '').trim();
      const company = (row.Company || '').trim();
      
      // Company row: Name == Company
      if (name && name === company) {
        csvCompanies.set(name.toLowerCase(), row);
      }
    }

    console.log(`   Found ${csvCompanies.size} companies in CSV`);

    for (const company of companies) {
      this.stats.companiesChecked++;
      
      const csvRow = csvCompanies.get(company.name.toLowerCase());
      
      if (!csvRow) {
        // Company not in CSV - might be okay, but check if mainSellerId is set
        if (!company.mainSellerId) {
          console.log(`   🔧 Fixing company without mainSellerId: ${company.name}`);
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              mainSellerId: this.victoriaUserId,
              updatedAt: new Date()
            }
          });
          this.stats.companiesFixed++;
        }
        continue;
      }

      // Compare and fix
      const needsUpdate = {};
      const mainSeller = (csvRow.Main_Seller || '').trim();
      const sellerId = this.sellerMap.get(mainSeller) || this.victoriaUserId;

      // Check mainSellerId
      if (company.mainSellerId !== sellerId) {
        needsUpdate.mainSellerId = sellerId;
      }

      // Check notes (if CSV has notes)
      const csvNotes = (csvRow.Notes || '').trim();
      if (csvNotes && company.notes !== csvNotes) {
        needsUpdate.notes = csvNotes;
      }

      // Check lastActionDate
      const csvLastAction = this.parseDate(csvRow.Last_Action);
      if (csvLastAction) {
        const dbLastAction = company.lastActionDate ? new Date(company.lastActionDate) : null;
        if (!dbLastAction || dbLastAction.getTime() !== csvLastAction.getTime()) {
          needsUpdate.lastActionDate = csvLastAction;
        }
      }

      // Check status - should be LEAD if not set
      if (!company.status || company.status === 'ACTIVE') {
        needsUpdate.status = 'LEAD';
      }

      if (Object.keys(needsUpdate).length > 0) {
        console.log(`   🔧 Fixing company: ${company.name}`);
        console.log(`      Updates: ${Object.keys(needsUpdate).join(', ')}`);
        
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            ...needsUpdate,
            updatedAt: new Date()
          }
        });
        
        this.stats.companiesFixed++;
      }
    }
  }

  async auditAndFixPeople() {
    console.log('\n👤 Auditing and fixing people...');
    
    // Get all people from workspace
    const people = await prisma.people.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null
      }
    });

    console.log(`   Found ${people.length} people in database`);

    // Create a map of CSV people (Name != Company AND has Email)
    const csvPeople = new Map();
    for (const row of this.csvData) {
      const name = (row.Name || '').trim();
      const company = (row.Company || '').trim();
      const email = (row.Email || '').trim().toLowerCase();
      
      // Person row: Name != Company AND has Email
      if (name && name !== company && email) {
        csvPeople.set(email, row);
      }
    }

    console.log(`   Found ${csvPeople.size} people in CSV`);

    for (const person of people) {
      this.stats.peopleChecked++;
      
      if (!person.email) {
        // Person without email - check if mainSellerId is set
        if (!person.mainSellerId) {
          console.log(`   🔧 Fixing person without mainSellerId: ${person.fullName || person.firstName}`);
          await prisma.people.update({
            where: { id: person.id },
            data: {
              mainSellerId: this.victoriaUserId,
              updatedAt: new Date()
            }
          });
          this.stats.peopleFixed++;
        }
        continue;
      }

      const csvRow = csvPeople.get(person.email.toLowerCase());
      
      if (!csvRow) {
        // Person not in CSV - check if mainSellerId is set
        if (!person.mainSellerId) {
          console.log(`   🔧 Fixing person without mainSellerId: ${person.fullName || person.firstName}`);
          await prisma.people.update({
            where: { id: person.id },
            data: {
              mainSellerId: this.victoriaUserId,
              updatedAt: new Date()
            }
          });
          this.stats.peopleFixed++;
        }
        continue;
      }

      // Compare and fix
      const needsUpdate = {};
      const mainSeller = (csvRow.Main_Seller || '').trim();
      const sellerId = this.sellerMap.get(mainSeller) || this.victoriaUserId;

      // Check mainSellerId
      if (person.mainSellerId !== sellerId) {
        needsUpdate.mainSellerId = sellerId;
      }

      // Check notes (if CSV has notes)
      const csvNotes = (csvRow.Notes || '').trim();
      if (csvNotes && person.notes !== csvNotes) {
        needsUpdate.notes = csvNotes;
      }

      // Check lastActionDate
      const csvLastAction = this.parseDate(csvRow.Last_Action);
      if (csvLastAction) {
        const dbLastAction = person.lastActionDate ? new Date(person.lastActionDate) : null;
        if (!dbLastAction || dbLastAction.getTime() !== csvLastAction.getTime()) {
          needsUpdate.lastActionDate = csvLastAction;
        }
      }

      // Check status - should be LEAD if not set
      if (!person.status) {
        needsUpdate.status = 'LEAD';
      }

      if (Object.keys(needsUpdate).length > 0) {
        console.log(`   🔧 Fixing person: ${person.fullName || person.firstName} (${person.email})`);
        console.log(`      Updates: ${Object.keys(needsUpdate).join(', ')}`);
        
        await prisma.people.update({
          where: { id: person.id },
          data: {
            ...needsUpdate,
            updatedAt: new Date()
          }
        });
        
        this.stats.peopleFixed++;
      }
    }
  }

  async setDefaultStatuses() {
    console.log('\n📊 Setting default statuses to LEAD...');
    
    // Update companies without status or with ACTIVE status to LEAD
    const companiesUpdated = await prisma.companies.updateMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null,
        OR: [
          { status: null },
          { status: 'ACTIVE' }
        ]
      },
      data: {
        status: 'LEAD',
        updatedAt: new Date()
      }
    });

    console.log(`   ✅ Updated ${companiesUpdated.count} companies to LEAD status`);

    // Update people without status to LEAD
    const peopleUpdated = await prisma.people.updateMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null,
        status: null
      },
      data: {
        status: 'LEAD',
        updatedAt: new Date()
      }
    });

    console.log(`   ✅ Updated ${peopleUpdated.count} people to LEAD status`);
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Companies checked: ${this.stats.companiesChecked}`);
    console.log(`   Companies fixed: ${this.stats.companiesFixed}`);
    console.log(`   People checked: ${this.stats.peopleChecked}`);
    console.log(`   People fixed: ${this.stats.peopleFixed}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log('');
    console.log('✅ Audit complete!');
  }
}

// Run if called directly
if (require.main === module) {
  const auditor = new TopTempDataAuditor();
  auditor.execute()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = TopTempDataAuditor;

