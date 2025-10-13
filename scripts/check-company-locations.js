#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompanyLocations() {
  try {
    console.log('🏢 CHECKING COMPANY LOCATION DATA FOR NOTARY EVERYDAY...\n');
    
    // Get all companies in the Notary Everyday workspace
    const companies = await prisma.companies.findMany({
      where: { workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1' },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        country: true,
        address: true,
        postalCode: true,
        industry: true,
        customFields: true
      }
    });
    
    console.log(`📊 Total companies: ${companies.length}\n`);
    
    // Analyze location data coverage
    const locationStats = {
      total: companies.length,
      hasCity: 0,
      hasState: 0,
      hasCountry: 0,
      hasAddress: 0,
      hasPostalCode: 0,
      hasAnyLocation: 0,
      hasCompleteLocation: 0
    };
    
    companies.forEach(company => {
      if (company.city) locationStats.hasCity++;
      if (company.state) locationStats.hasState++;
      if (company.country) locationStats.hasCountry++;
      if (company.address) locationStats.hasAddress++;
      if (company.postalCode) locationStats.hasPostalCode++;
      
      if (company.city || company.state || company.country || company.address) {
        locationStats.hasAnyLocation++;
      }
      
      if (company.city && company.state && company.country) {
        locationStats.hasCompleteLocation++;
      }
    });
    
    console.log('📍 LOCATION DATA COVERAGE:');
    console.log('='.repeat(50));
    console.log(`Total Companies: ${locationStats.total}`);
    console.log(`Has City: ${locationStats.hasCity} (${((locationStats.hasCity/locationStats.total)*100).toFixed(1)}%)`);
    console.log(`Has State: ${locationStats.hasState} (${((locationStats.hasState/locationStats.total)*100).toFixed(1)}%)`);
    console.log(`Has Country: ${locationStats.hasCountry} (${((locationStats.hasCountry/locationStats.total)*100).toFixed(1)}%)`);
    console.log(`Has Address: ${locationStats.hasAddress} (${((locationStats.hasAddress/locationStats.total)*100).toFixed(1)}%)`);
    console.log(`Has Postal Code: ${locationStats.hasPostalCode} (${((locationStats.hasPostalCode/locationStats.total)*100).toFixed(1)}%)`);
    console.log(`Has Any Location: ${locationStats.hasAnyLocation} (${((locationStats.hasAnyLocation/locationStats.total)*100).toFixed(1)}%)`);
    console.log(`Has Complete Location: ${locationStats.hasCompleteLocation} (${((locationStats.hasCompleteLocation/locationStats.total)*100).toFixed(1)}%)`);
    
    // Show state distribution
    const stateCounts = {};
    companies.forEach(company => {
      if (company.state) {
        stateCounts[company.state] = (stateCounts[company.state] || 0) + 1;
      }
    });
    
    console.log('\n🗺️ STATE DISTRIBUTION:');
    console.log('='.repeat(50));
    const sortedStates = Object.entries(stateCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);
    
    sortedStates.forEach(([state, count]) => {
      console.log(`${state}: ${count} companies`);
    });
    
    // Show companies with no location data
    const companiesWithoutLocation = companies.filter(company => 
      !company.city && !company.state && !company.country && !company.address
    );
    
    console.log(`\n❌ COMPANIES WITHOUT LOCATION DATA: ${companiesWithoutLocation.length}`);
    if (companiesWithoutLocation.length > 0) {
      console.log('Sample companies without location:');
      companiesWithoutLocation.slice(0, 10).forEach((company, i) => {
        console.log(`${i+1}. ${company.name} (${company.industry || 'No industry'})`);
      });
    }
    
    // Show companies with state data
    const companiesWithState = companies.filter(company => company.state);
    console.log(`\n✅ COMPANIES WITH STATE DATA: ${companiesWithState.length}`);
    if (companiesWithState.length > 0) {
      console.log('Sample companies with state:');
      companiesWithState.slice(0, 10).forEach((company, i) => {
        console.log(`${i+1}. ${company.name} - ${company.city || 'No city'}, ${company.state}`);
      });
    }
    
    // Check if our newly created companies have location data
    const newlyCreatedCompanies = companies.filter(company => 
      company.customFields && 
      (company.customFields.createdFrom === 'improved_people_linking' || 
       company.customFields.createdFrom === 'final_linkage_push' ||
       company.customFields.createdFrom === 'people_linking')
    );
    
    console.log(`\n🆕 NEWLY CREATED COMPANIES: ${newlyCreatedCompanies.length}`);
    const newlyCreatedWithLocation = newlyCreatedCompanies.filter(company => 
      company.city || company.state || company.country
    );
    console.log(`Newly created with location: ${newlyCreatedWithLocation.length} (${((newlyCreatedWithLocation.length/newlyCreatedCompanies.length)*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompanyLocations();
