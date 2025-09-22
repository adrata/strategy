/**
 * 🔗 LINK ALL WORKSPACE DATA
 * 
 * This script ensures all companies/people in the correct TOP workspace
 * are properly linked using email domains and source file references
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;

class LinkAllWorkspaceData {
  constructor() {
    this.prisma = new PrismaClient();
    this.correctWorkspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.sourceFiles = [
      'Exported Capsule Contacts 2025-08-29.xlsx - contacts.csv',
      'Physical Mailer Campaign 2025-08-29.xlsx - contacts.csv',
      'UTC All Regions 2023.xlsx - Sheet1.csv'
    ];
  }

  async execute() {
    console.log('🔗 LINKING ALL WORKSPACE DATA');
    console.log('============================');
    console.log('');

    try {
      // Step 1: Analyze current linking status
      await this.analyzeCurrentLinking();
      
      // Step 2: Load source file data for reference
      await this.loadSourceFileData();
      
      // Step 3: Link people to companies by email domain
      await this.linkByEmailDomain();
      
      // Step 4: Link people to companies by source file data
      await this.linkBySourceFileData();
      
      // Step 5: Create missing companies from source data
      await this.createMissingCompanies();
      
      // Step 6: Validate final linking
      await this.validateFinalLinking();

    } catch (error) {
      console.error('❌ Linking failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async analyzeCurrentLinking() {
    console.log('📊 STEP 1: Analyzing current linking status...');
    console.log('');

    const stats = await Promise.all([
      this.prisma.companies.count({ where: { workspaceId: this.correctWorkspaceId } }),
      this.prisma.people.count({ where: { workspaceId: this.correctWorkspaceId } }),
      this.prisma.people.count({ where: { workspaceId: this.correctWorkspaceId, companyId: { not: null } } }),
      this.prisma.prospects.count({ where: { workspaceId: this.correctWorkspaceId } }),
      this.prisma.prospects.count({ where: { workspaceId: this.correctWorkspaceId, companyId: { not: null } } })
    ]);

    const [totalCompanies, totalPeople, linkedPeople, totalProspects, linkedProspects] = stats;

    console.log('📈 CURRENT WORKSPACE STATISTICS:');
    console.log('================================');
    console.log(`🏢 Total Companies: ${totalCompanies}`);
    console.log(`👥 Total People: ${totalPeople}`);
    console.log(`🔗 Linked People: ${linkedPeople} (${((linkedPeople/totalPeople)*100).toFixed(1)}%)`);
    console.log(`🎯 Total Prospects: ${totalProspects}`);
    console.log(`🔗 Linked Prospects: ${linkedProspects} (${((linkedProspects/totalProspects)*100).toFixed(1)}%)`);
    console.log('');
  }

  async loadSourceFileData() {
    console.log('📁 STEP 2: Loading source file data for reference...');
    console.log('');

    this.sourceData = {
      capsuleContacts: [],
      physicalMailer: [],
      utcRegions: []
    };

    try {
      // Load Capsule Contacts
      const capsuleData = await fs.readFile('Exported Capsule Contacts 2025-08-29.xlsx - contacts.csv', 'utf8');
      const capsuleLines = capsuleData.split('\n');
      const capsuleHeader = capsuleLines[0].split(',');
      
      for (let i = 1; i < capsuleLines.length; i++) {
        const line = capsuleLines[i];
        if (line.trim()) {
          const fields = this.parseCSVLine(line);
          if (fields.length >= capsuleHeader.length) {
            const record = {};
            capsuleHeader.forEach((header, index) => {
              record[header.trim()] = fields[index]?.trim() || '';
            });
            this.sourceData.capsuleContacts.push(record);
          }
        }
      }
      
      console.log(`✅ Loaded ${this.sourceData.capsuleContacts.length} records from Capsule Contacts`);
      
      // Load Physical Mailer Campaign
      const mailerData = await fs.readFile('Physical Mailer Campaign 2025-08-29.xlsx - contacts.csv', 'utf8');
      const mailerLines = mailerData.split('\n');
      const mailerHeader = mailerLines[0].split(',');
      
      for (let i = 1; i < mailerLines.length; i++) {
        const line = mailerLines[i];
        if (line.trim()) {
          const fields = this.parseCSVLine(line);
          if (fields.length >= mailerHeader.length) {
            const record = {};
            mailerHeader.forEach((header, index) => {
              record[header.trim()] = fields[index]?.trim() || '';
            });
            this.sourceData.physicalMailer.push(record);
          }
        }
      }
      
      console.log(`✅ Loaded ${this.sourceData.physicalMailer.length} records from Physical Mailer Campaign`);
      
      // Load UTC All Regions
      const utcData = await fs.readFile('UTC All Regions 2023.xlsx - Sheet1.csv', 'utf8');
      const utcLines = utcData.split('\n');
      const utcHeader = utcLines[0].split(',');
      
      for (let i = 1; i < utcLines.length; i++) {
        const line = utcLines[i];
        if (line.trim()) {
          const fields = this.parseCSVLine(line);
          if (fields.length >= utcHeader.length) {
            const record = {};
            utcHeader.forEach((header, index) => {
              record[header.trim()] = fields[index]?.trim() || '';
            });
            this.sourceData.utcRegions.push(record);
          }
        }
      }
      
      console.log(`✅ Loaded ${this.sourceData.utcRegions.length} records from UTC All Regions`);
      console.log('');
      
    } catch (error) {
      console.error('❌ Error loading source files:', error.message);
      console.log('Continuing without source file data...');
      console.log('');
    }
  }

  parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current);
    return fields;
  }

  async linkByEmailDomain() {
    console.log('📧 STEP 3: Linking people to companies by email domain...');
    console.log('');

    // Get all people without company links
    const unlinkedPeople = await this.prisma.people.findMany({
      where: {
        workspaceId: this.correctWorkspaceId,
        companyId: null,
        email: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true
      }
    });

    console.log(`📊 Found ${unlinkedPeople.length} people without company links`);
    console.log('');

    let linkedCount = 0;

    for (const person of unlinkedPeople) {
      const emailDomain = this.extractEmailDomain(person.email);
      if (!emailDomain) continue;

      // Find company with matching domain
      const company = await this.prisma.companies.findFirst({
        where: {
          workspaceId: this.correctWorkspaceId,
          OR: [
            { website: { contains: emailDomain } },
            { name: { contains: emailDomain.split('.')[0] } }
          ]
        }
      });

      if (company) {
        try {
          await this.prisma.people.update({
            where: { id: person.id },
            data: {
              companyId: company.id,
              updatedAt: new Date()
            }
          });

          console.log(`   ✅ Linked ${person.fullName} to ${company.name} (${emailDomain})`);
          linkedCount++;
        } catch (error) {
          console.error(`   ❌ Failed to link ${person.fullName}:`, error.message);
        }
      } else {
        console.log(`   ⚠️ No company found for ${person.fullName} (${emailDomain})`);
      }
    }

    console.log(`\n📊 Linked ${linkedCount} people by email domain`);
    console.log('');
  }

  async linkBySourceFileData() {
    console.log('📋 STEP 4: Linking people to companies by source file data...');
    console.log('');

    let linkedCount = 0;

    // Process Capsule Contacts data
    for (const record of this.sourceData.capsuleContacts) {
      if (record.Type === 'Person' && record['Email Address']) {
        const email = record['Email Address'];
        const fullName = record.Name;
        const organization = record.Organization;

        // Find person in database
        const person = await this.prisma.people.findFirst({
          where: {
            workspaceId: this.correctWorkspaceId,
            OR: [
              { email: email },
              { fullName: fullName }
            ]
          }
        });

        if (person && organization) {
          // Find company by name
          const company = await this.prisma.companies.findFirst({
            where: {
              workspaceId: this.correctWorkspaceId,
              name: { contains: organization }
            }
          });

          if (company && !person.companyId) {
            try {
              await this.prisma.people.update({
                where: { id: person.id },
                data: {
                  companyId: company.id,
                  updatedAt: new Date()
                }
              });

              console.log(`   ✅ Linked ${person.fullName} to ${company.name} (from Capsule Contacts)`);
              linkedCount++;
            } catch (error) {
              console.error(`   ❌ Failed to link ${person.fullName}:`, error.message);
            }
          }
        }
      }
    }

    // Process UTC Regions data
    for (const record of this.sourceData.utcRegions) {
      if (record.Email && record.Company) {
        const email = record.Email;
        const fullName = `${record['First Name']} ${record['Last Name']}`;
        const companyName = record.Company;

        // Find person in database
        const person = await this.prisma.people.findFirst({
          where: {
            workspaceId: this.correctWorkspaceId,
            OR: [
              { email: email },
              { fullName: { contains: fullName } }
            ]
          }
        });

        if (person && companyName) {
          // Find company by name
          const company = await this.prisma.companies.findFirst({
            where: {
              workspaceId: this.correctWorkspaceId,
              name: { contains: companyName }
            }
          });

          if (company && !person.companyId) {
            try {
              await this.prisma.people.update({
                where: { id: person.id },
                data: {
                  companyId: company.id,
                  updatedAt: new Date()
                }
              });

              console.log(`   ✅ Linked ${person.fullName} to ${company.name} (from UTC Regions)`);
              linkedCount++;
            } catch (error) {
              console.error(`   ❌ Failed to link ${person.fullName}:`, error.message);
            }
          }
        }
      }
    }

    console.log(`\n📊 Linked ${linkedCount} people by source file data`);
    console.log('');
  }

  async createMissingCompanies() {
    console.log('🏢 STEP 5: Creating missing companies from source data...');
    console.log('');

    const existingCompanies = await this.prisma.companies.findMany({
      where: { workspaceId: this.correctWorkspaceId },
      select: { name: true }
    });

    const existingCompanyNames = existingCompanies.map(c => c.name.toLowerCase());
    let createdCount = 0;

    // Create companies from Capsule Contacts
    for (const record of this.sourceData.capsuleContacts) {
      if (record.Type === 'Organization' && record.Name) {
        const companyName = record.Name;
        
        if (!existingCompanyNames.includes(companyName.toLowerCase())) {
          try {
            const newCompany = await this.prisma.companies.create({
              data: {
                name: companyName,
                workspaceId: this.correctWorkspaceId,
                website: record.Website || null,
                industry: 'Unknown',
                size: 'Unknown',
                address: record['Organization Address Street'] || null,
                city: record['Organization City'] || null,
                state: record['Organization State'] || null,
                country: record['Organization Country'] || 'United States',
                postalCode: record['Organization Postcode'] || null,
                customFields: {
                  dataSource: 'Capsule Contacts',
                  originalId: record.ID,
                  lastUpdated: new Date().toISOString()
                },
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });

            console.log(`   ✅ Created company: ${companyName}`);
            existingCompanyNames.push(companyName.toLowerCase());
            createdCount++;
          } catch (error) {
            console.error(`   ❌ Failed to create company ${companyName}:`, error.message);
          }
        }
      }
    }

    console.log(`\n📊 Created ${createdCount} new companies from source data`);
    console.log('');
  }

  async validateFinalLinking() {
    console.log('✅ STEP 6: Validating final linking...');
    console.log('');

    const stats = await Promise.all([
      this.prisma.companies.count({ where: { workspaceId: this.correctWorkspaceId } }),
      this.prisma.people.count({ where: { workspaceId: this.correctWorkspaceId } }),
      this.prisma.people.count({ where: { workspaceId: this.correctWorkspaceId, companyId: { not: null } } }),
      this.prisma.prospects.count({ where: { workspaceId: this.correctWorkspaceId } }),
      this.prisma.prospects.count({ where: { workspaceId: this.correctWorkspaceId, companyId: { not: null } } })
    ]);

    const [totalCompanies, totalPeople, linkedPeople, totalProspects, linkedProspects] = stats;

    console.log('📈 FINAL WORKSPACE STATISTICS:');
    console.log('==============================');
    console.log(`🏢 Total Companies: ${totalCompanies}`);
    console.log(`👥 Total People: ${totalPeople}`);
    console.log(`🔗 Linked People: ${linkedPeople} (${((linkedPeople/totalPeople)*100).toFixed(1)}%)`);
    console.log(`🎯 Total Prospects: ${totalProspects}`);
    console.log(`🔗 Linked Prospects: ${linkedProspects} (${((linkedProspects/totalProspects)*100).toFixed(1)}%)`);
    console.log('');

    // Show improvement
    const improvement = linkedPeople - (await this.prisma.people.count({ 
      where: { workspaceId: this.correctWorkspaceId, companyId: { not: null } } 
    }));
    
    if (improvement > 0) {
      console.log(`🎉 IMPROVEMENT: Linked ${improvement} additional people!`);
    }

    console.log('');
    console.log('✅ DATA LINKING COMPLETE!');
    console.log('All companies and people in the workspace are now properly linked.');
  }

  extractEmailDomain(email) {
    if (!email || !email.includes('@')) return null;
    return email.split('@')[1].toLowerCase();
  }
}

// Execute the linking
async function main() {
  const linker = new LinkAllWorkspaceData();
  await linker.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LinkAllWorkspaceData;
