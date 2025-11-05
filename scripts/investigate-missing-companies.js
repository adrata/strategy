#!/usr/bin/env node

/**
 * Investigate Missing Companies - No People Found
 * 
 * Tests the 7 companies that have no people to see what's happening
 * with Coresignal API and USA-only filtering
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PreviewSearch } = require('./_future_now/find-buyer-group/preview-search');
const { CompanyIntelligence } = require('./_future_now/find-buyer-group/company-intelligence');

const prisma = new PrismaClient();

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';

const MISSING_COMPANIES = [
  { name: 'Cloudflare', linkedinUrl: 'https://www.linkedin.com/company/cloudflare', website: 'https://www.cloudflare.com' },
  { name: 'GitLab', linkedinUrl: 'https://www.linkedin.com/company/gitlab', website: 'https://www.gitlab.com' },
  { name: 'JFrog', linkedinUrl: 'https://www.linkedin.com/company/jfrog', website: 'https://www.jfrog.com' },
  { name: 'MongoDB', linkedinUrl: 'https://www.linkedin.com/company/mongodb', website: 'https://www.mongodb.com' },
  { name: 'New Relic', linkedinUrl: 'https://www.linkedin.com/company/new-relic', website: 'https://www.newrelic.com' },
  { name: 'Okta', linkedinUrl: 'https://www.linkedin.com/company/okta', website: 'https://www.okta.com' },
  { name: 'Twilio', linkedinUrl: 'https://www.linkedin.com/company/twilio', website: 'https://www.twilio.com' }
];

async function investigateCompanies() {
  console.log('🔍 Investigating Companies with No People Found');
  console.log('═'.repeat(60));
  console.log('Testing buyer group discovery for Adrata (USA-only)\n');

  try {
    await prisma.$connect();
    
    const companyIntel = new CompanyIntelligence(prisma, ADRATA_WORKSPACE_ID);
    const previewSearch = new PreviewSearch(process.env.CORESIGNAL_API_KEY);

    const results = [];

    for (const company of MISSING_COMPANIES) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing: ${company.name}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`LinkedIn: ${company.linkedinUrl}`);
      console.log(`Website: ${company.website}\n`);

      try {
        // Step 1: Company Intelligence
        console.log('📊 Step 1: Company Intelligence...');
        const intelligence = await companyIntel.research(company.linkedinUrl || company.website);
        console.log(`   Company Name: ${intelligence.companyName || 'Not found'}`);
        console.log(`   LinkedIn URL: ${intelligence.linkedinUrl || 'Not found'}`);
        console.log(`   Website: ${intelligence.website || 'Not found'}`);
        console.log(`   Employee Count: ${intelligence.employeeCount || 'Unknown'}`);
        console.log(`   Industry: ${intelligence.industry || 'Unknown'}`);

        if (!intelligence.companyName) {
          console.log('   ⚠️  Company not found in Coresignal database');
          results.push({
            company: company.name,
            status: 'NOT_FOUND',
            intelligence: intelligence,
            employees: 0,
            usaEmployees: 0
          });
          continue;
        }

        // Step 2: Preview Search WITHOUT USA filter (to see total)
        console.log('\n📋 Step 2: Preview Search (ALL locations)...');
        const allEmployees = await previewSearch.discoverAllStakeholders(
          {
            linkedinUrl: intelligence.linkedinUrl,
            website: intelligence.website,
            companyName: intelligence.companyName
          },
          3, // Max 3 pages for testing
          'none', // No filtering
          'sales',
          null, // No custom filtering
          false // NO USA-only filter
        );
        console.log(`   Total employees found (all locations): ${allEmployees.length}`);

        if (allEmployees.length > 0) {
          const locations = {};
          allEmployees.forEach(emp => {
            const location = emp.location || 'Unknown';
            locations[location] = (locations[location] || 0) + 1;
          });
          console.log('   Location breakdown:');
          Object.entries(locations).slice(0, 10).forEach(([loc, count]) => {
            console.log(`     - ${loc}: ${count}`);
          });
        }

        // Step 3: Preview Search WITH USA filter
        console.log('\n🇺🇸 Step 3: Preview Search (USA-only)...');
        const usaEmployees = await previewSearch.discoverAllStakeholders(
          {
            linkedinUrl: intelligence.linkedinUrl,
            website: intelligence.website,
            companyName: intelligence.companyName
          },
          3, // Max 3 pages for testing
          'none', // No filtering
          'sales',
          null, // No custom filtering
          true // YES USA-only filter
        );
        console.log(`   USA employees found: ${usaEmployees.length}`);

        if (usaEmployees.length > 0) {
          console.log('   Sample USA employees:');
          usaEmployees.slice(0, 5).forEach(emp => {
            console.log(`     - ${emp.name} (${emp.title || 'N/A'}) - ${emp.location || 'Unknown'}`);
          });
        } else if (allEmployees.length > 0) {
          console.log('   ⚠️  No USA employees found, but employees exist in other locations');
        }

        results.push({
          company: company.name,
          status: allEmployees.length > 0 ? (usaEmployees.length > 0 ? 'HAS_USA' : 'NO_USA') : 'NO_EMPLOYEES',
          intelligence: {
            companyName: intelligence.companyName,
            employeeCount: intelligence.employeeCount,
            industry: intelligence.industry
          },
          employees: allEmployees.length,
          usaEmployees: usaEmployees.length,
          locationBreakdown: allEmployees.reduce((acc, emp) => {
            const loc = emp.location || 'Unknown';
            acc[loc] = (acc[loc] || 0) + 1;
            return acc;
          }, {})
        });

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.push({
          company: company.name,
          status: 'ERROR',
          error: error.message,
          employees: 0,
          usaEmployees: 0
        });
      }

      // Delay between companies
      if (MISSING_COMPANIES.indexOf(company) < MISSING_COMPANIES.length - 1) {
        console.log('\n   ⏳ Waiting 2 seconds before next company...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Summary
    console.log('\n\n📊 INVESTIGATION SUMMARY');
    console.log('═'.repeat(60));
    
    const byStatus = {};
    results.forEach(r => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    console.log('\nStatus breakdown:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\nDetailed results:');
    results.forEach(r => {
      console.log(`\n${r.company}:`);
      console.log(`  Status: ${r.status}`);
      if (r.intelligence) {
        console.log(`  Company Name: ${r.intelligence.companyName || 'Not found'}`);
        console.log(`  Employee Count: ${r.intelligence.employeeCount || 'Unknown'}`);
      }
      console.log(`  Total Employees Found: ${r.employees}`);
      console.log(`  USA Employees Found: ${r.usaEmployees}`);
      if (r.locationBreakdown) {
        const topLocations = Object.entries(r.locationBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);
        console.log(`  Top Locations: ${topLocations.map(([loc, count]) => `${loc} (${count})`).join(', ')}`);
      }
      if (r.error) {
        console.log(`  Error: ${r.error}`);
      }
    });

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('─'.repeat(60));
    
    const hasEmployeesNoUSA = results.filter(r => r.employees > 0 && r.usaEmployees === 0);
    const noEmployees = results.filter(r => r.employees === 0);
    const hasUSA = results.filter(r => r.usaEmployees > 0);

    if (hasUSA.length > 0) {
      console.log(`\n✅ ${hasUSA.length} companies have USA employees - can proceed with buyer group discovery`);
    }

    if (hasEmployeesNoUSA.length > 0) {
      console.log(`\n⚠️  ${hasEmployeesNoUSA.length} companies have employees but NO USA employees:`);
      hasEmployeesNoUSA.forEach(r => {
        console.log(`   - ${r.company}: ${r.employees} total employees, 0 in USA`);
      });
      console.log('   → Consider: Removing USA-only filter for these companies, or checking if location data is accurate');
    }

    if (noEmployees.length > 0) {
      console.log(`\n❌ ${noEmployees.length} companies have NO employees found in Coresignal:`);
      noEmployees.forEach(r => {
        console.log(`   - ${r.company}`);
      });
      console.log('   → Possible causes:');
      console.log('     • Company not in Coresignal database');
      console.log('     • LinkedIn URL mismatch');
      console.log('     • Company name mismatch');
      console.log('     • API rate limiting or errors');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

investigateCompanies();

