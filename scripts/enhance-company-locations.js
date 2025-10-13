#!/usr/bin/env node

/**
 * 🗺️ ENHANCE COMPANY LOCATIONS
 * 
 * This script extracts location information from people data to enhance
 * companies that were created during the linking process but lack location data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CompanyLocationEnhancer {
  constructor() {
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
    this.results = {
      companiesProcessed: 0,
      companiesEnhanced: 0,
      locationUpdates: 0,
      errors: []
    };
  }

  async getCompaniesWithoutLocation() {
    console.log('🔍 Finding companies without location data...');
    
    const companiesWithoutLocation = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        AND: [
          { city: null },
          { state: null },
          { country: null }
        ]
      },
      select: {
        id: true,
        name: true,
        industry: true,
        customFields: true
      }
    });

    console.log(`   📊 Found ${companiesWithoutLocation.length} companies without location data`);
    return companiesWithoutLocation;
  }

  async getPeopleForCompany(companyId) {
    return await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        companyId: companyId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        enrichedData: true,
        coresignalData: true,
        customFields: true
      }
    });
  }

  extractLocationFromPerson(person) {
    const location = {
      city: null,
      state: null,
      country: null
    };

    // Try to extract from enrichedData
    if (person.enrichedData?.intelligence?.location) {
      const locationStr = person.enrichedData.intelligence.location;
      // Parse location string (e.g., "Florida", "California", "New York")
      if (locationStr) {
        location.state = locationStr;
        location.country = 'United States'; // Default for Notary Everyday
      }
    }

    // Try to extract from customFields.enrichedData
    if (person.customFields?.enrichedData?.intelligence?.location) {
      const locationStr = person.customFields.enrichedData.intelligence.location;
      if (locationStr) {
        location.state = locationStr;
        location.country = 'United States';
      }
    }

    // Try to extract from coresignalData
    if (person.coresignalData?.location) {
      const locationStr = person.coresignalData.location;
      if (locationStr) {
        location.state = locationStr;
        location.country = 'United States';
      }
    }

    return location;
  }

  async enhanceCompanyLocation(company) {
    console.log(`\n🏢 Processing: ${company.name}`);
    
    try {
      const people = await this.getPeopleForCompany(company.id);
      
      if (people.length === 0) {
        console.log(`   ⚠️  No people found for this company`);
        return;
      }

      console.log(`   👥 Found ${people.length} people linked to this company`);

      // Extract location from all people
      const locations = people.map(person => this.extractLocationFromPerson(person));
      
      // Find the most common location
      const stateCounts = {};
      const countryCounts = {};
      
      locations.forEach(loc => {
        if (loc.state) {
          stateCounts[loc.state] = (stateCounts[loc.state] || 0) + 1;
        }
        if (loc.country) {
          countryCounts[loc.country] = (countryCounts[loc.country] || 0) + 1;
        }
      });

      const mostCommonState = Object.entries(stateCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      const mostCommonCountry = Object.entries(countryCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];

      if (mostCommonState || mostCommonCountry) {
        // Update company with location data
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            state: mostCommonState,
            country: mostCommonCountry || 'United States',
            customFields: {
              ...company.customFields,
              locationEnhanced: true,
              locationEnhancedAt: new Date().toISOString(),
              locationSource: 'people_data',
              locationConfidence: mostCommonState ? 'high' : 'medium'
            }
          }
        });

        this.results.companiesEnhanced++;
        this.results.locationUpdates++;
        
        console.log(`   ✅ Enhanced with location: ${mostCommonState || 'No state'}, ${mostCommonCountry || 'United States'}`);
      } else {
        console.log(`   ⚠️  No location data found in people records`);
      }

      this.results.companiesProcessed++;

    } catch (error) {
      console.error(`   ❌ Error processing company: ${error.message}`);
      this.results.errors.push(`Error processing ${company.name}: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 LOCATION ENHANCEMENT REPORT');
    console.log('='.repeat(50));
    console.log(`Companies processed: ${this.results.companiesProcessed}`);
    console.log(`Companies enhanced: ${this.results.companiesEnhanced}`);
    console.log(`Location updates: ${this.results.locationUpdates}`);
    console.log(`Errors: ${this.results.errors.length}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Check final location coverage
    const totalCompanies = await prisma.companies.count({
      where: { workspaceId: this.workspaceId }
    });
    
    const companiesWithState = await prisma.companies.count({
      where: { 
        workspaceId: this.workspaceId,
        state: { not: null }
      }
    });

    console.log(`\n📈 FINAL LOCATION COVERAGE:`);
    console.log(`Total companies: ${totalCompanies}`);
    console.log(`Companies with state: ${companiesWithState} (${((companiesWithState/totalCompanies)*100).toFixed(1)}%)`);
  }

  async run() {
    try {
      console.log('🗺️ ENHANCING COMPANY LOCATIONS FROM PEOPLE DATA');
      console.log('='.repeat(60));
      
      const companiesWithoutLocation = await this.getCompaniesWithoutLocation();
      
      if (companiesWithoutLocation.length === 0) {
        console.log('✅ All companies already have location data!');
        return;
      }

      // Process companies in batches
      const batchSize = 10;
      for (let i = 0; i < companiesWithoutLocation.length; i += batchSize) {
        const batch = companiesWithoutLocation.slice(i, i + batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(companiesWithoutLocation.length / batchSize)}`);
        
        for (const company of batch) {
          await this.enhanceCompanyLocation(company);
        }
      }

      await this.generateReport();
      console.log('\n🎉 Location enhancement completed!');
      
    } catch (error) {
      console.error('❌ Fatal error during location enhancement:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the script
if (require.main === module) {
  const enhancer = new CompanyLocationEnhancer();
  enhancer.run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = CompanyLocationEnhancer;
