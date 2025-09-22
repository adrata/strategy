/**
 * 🌐 EXTRACT WEBSITES FROM CSV AND UPDATE COMPANIES
 * 
 * This script extracts website data from the Capsule contacts CSV
 * and updates companies in the database with the correct websites
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

class WebsiteExtractor {
  constructor() {
    this.prisma = new PrismaClient();
    this.correctWorkspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.websiteMap = new Map();
    this.stats = {
      totalOrganizations: 0,
      withWebsites: 0,
      companiesUpdated: 0,
      companiesNotFound: 0,
      errors: 0
    };
  }

  async execute() {
    console.log('🌐 EXTRACTING WEBSITES FROM CSV AND UPDATING COMPANIES');
    console.log('=====================================================');
    console.log('');

    try {
      // Step 1: Parse CSV and extract website data
      await this.parseCSV();
      
      // Step 2: Update companies in database
      await this.updateCompanies();
      
      // Step 3: Generate report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Website extraction failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async parseCSV() {
    console.log('📄 STEP 1: Parsing CSV file...');
    console.log('');

    return new Promise((resolve, reject) => {
      const csvFile = 'Exported Capsule Contacts 2025-08-29.xlsx - contacts.csv';
      
      if (!fs.existsSync(csvFile)) {
        reject(new Error(`CSV file not found: ${csvFile}`));
        return;
      }

      fs.createReadStream(csvFile)
        .pipe(csv())
        .on('data', (row) => {
          // Only process Organization records
          if (row.Type === 'Organization') {
            this.stats.totalOrganizations++;
            
            const companyName = row.Name || row.Organization;
            const website = row.Website;
            
            if (companyName && website && website.trim() !== '') {
              // Clean up website URL
              let cleanWebsite = website.trim();
              if (!cleanWebsite.startsWith('http')) {
                cleanWebsite = `https://${cleanWebsite}`;
              }
              
              this.websiteMap.set(companyName.toLowerCase(), cleanWebsite);
              this.stats.withWebsites++;
              
              console.log(`   📊 Found: ${companyName} → ${cleanWebsite}`);
            }
          }
        })
        .on('end', () => {
          console.log(`📊 CSV parsing complete:`);
          console.log(`   📄 Total organizations: ${this.stats.totalOrganizations}`);
          console.log(`   🌐 Organizations with websites: ${this.stats.withWebsites}`);
          console.log(`   📈 Website coverage: ${((this.stats.withWebsites / this.stats.totalOrganizations) * 100).toFixed(1)}%`);
          console.log('');
          resolve();
        })
        .on('error', reject);
    });
  }

  async updateCompanies() {
    console.log('💾 STEP 2: Updating companies in database...');
    console.log('');

    // Get all companies in the workspace
    const companies = await this.prisma.companies.findMany({
      where: { 
        workspaceId: this.correctWorkspaceId
      },
      select: {
        id: true,
        name: true,
        website: true
      }
    });

    console.log(`🔍 Found ${companies.length} companies in database`);
    console.log('');

    for (const company of companies) {
      try {
        // Try to find website in our map
        const websiteKey = company.name.toLowerCase();
        const website = this.websiteMap.get(websiteKey);
        
        if (website && (!company.website || company.website !== website)) {
          // Update company with website from CSV
          await this.prisma.companies.update({
            where: { id: company.id },
            data: { 
              website,
              updatedAt: new Date()
            },
            select: { id: true }
          });
          
          this.stats.companiesUpdated++;
          console.log(`   ✅ Updated: ${company.name} → ${website}`);
        } else if (!website) {
          this.stats.companiesNotFound++;
          console.log(`   ⚠️ No website found for: ${company.name}`);
        } else {
          console.log(`   ℹ️ Already has website: ${company.name}`);
        }
        
      } catch (error) {
        this.stats.errors++;
        console.log(`   ❌ Error updating ${company.name}: ${error.message}`);
      }
    }

    console.log('');
  }

  async generateReport() {
    console.log('📊 STEP 3: Generating report...');
    console.log('');

    // Check final website coverage
    const companiesWithWebsites = await this.prisma.companies.count({
      where: { 
        workspaceId: this.correctWorkspaceId,
        website: { not: null }
      }
    });

    const totalCompanies = await this.prisma.companies.count({
      where: { workspaceId: this.correctWorkspaceId }
    });

    console.log('📈 WEBSITE EXTRACTION REPORT:');
    console.log('=============================');
    console.log(`📄 Organizations in CSV: ${this.stats.totalOrganizations}`);
    console.log(`🌐 Organizations with websites in CSV: ${this.stats.withWebsites}`);
    console.log(`💾 Companies updated in database: ${this.stats.companiesUpdated}`);
    console.log(`⚠️ Companies not found in CSV: ${this.stats.companiesNotFound}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log('');
    console.log('📊 FINAL DATABASE STATS:');
    console.log(`🏢 Total companies in workspace: ${totalCompanies}`);
    console.log(`🌐 Companies with websites: ${companiesWithWebsites}`);
    console.log(`📈 Website coverage: ${((companiesWithWebsites / totalCompanies) * 100).toFixed(1)}%`);
    console.log('');
    console.log('✅ Website extraction complete!');
    console.log('Companies now have proper website data for CoreSignal enrichment.');
  }
}

// Run the extraction
async function main() {
  const extractor = new WebsiteExtractor();
  await extractor.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WebsiteExtractor;
