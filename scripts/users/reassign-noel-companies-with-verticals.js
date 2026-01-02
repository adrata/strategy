#!/usr/bin/env node

/**
 * Reassign Noel's Companies in Notary Everyday Workspace
 * 
 * 1. Unassigns Noel as main seller from existing companies
 * 2. Adds new companies from CSV data with proper vertical/industry mapping
 * 
 * Usage: node scripts/users/reassign-noel-companies-with-verticals.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CSV data provided by user
const companiesData = [
  { company_name: 'Jewelers Mutual Group', vertical: 'insurance_claims_smb', domain: 'jewelersmutual.com', employee_count: 700, revenue_printed: '455M', company_city: 'Neenah', company_state: 'Wisconsin' },
  { company_name: 'Clearcover', vertical: 'insurance_claims_smb', domain: 'clearcover.com', employee_count: 330, revenue_printed: '144M', company_city: 'Chicago', company_state: 'Illinois' },
  { company_name: 'CU Direct', vertical: 'auto_lenders_smb', domain: 'origence.com', employee_count: 240, revenue_printed: '100M', company_city: 'Ontario', company_state: 'California' },
  { company_name: '700Credit', vertical: 'auto_lenders_smb', domain: '700credit.com', employee_count: 120, revenue_printed: '300M', company_city: 'Southfield', company_state: 'Michigan' },
  { company_name: 'RouteOne', vertical: 'auto_lenders_smb', domain: 'routeone.com', employee_count: 470, revenue_printed: '150M', company_city: 'Farmington Hills', company_state: 'Michigan' },
  { company_name: 'AmeriTrust Financial Technologies Inc. (TSXV:AMT) (OTCQB:AMTFF)', vertical: 'insurance_claims_smb', domain: 'ameritrust.com', employee_count: 17, revenue_printed: '2M', company_city: 'Burlington', company_state: 'Ontario' },
  { company_name: 'IMT Insurance', vertical: 'insurance_claims_smb', domain: 'imtins.com', employee_count: 280, revenue_printed: '37M', company_city: 'West Des Moines', company_state: 'Iowa' },
  { company_name: 'Openly', vertical: 'insurance_claims_smb', domain: 'openly.com', employee_count: 360, revenue_printed: '48.8M', company_city: 'Boston', company_state: 'Massachusetts' },
  { company_name: 'D&H Alternative Risk Solutions, Inc.', vertical: 'insurance_claims_smb', domain: 'risksolutions.com', employee_count: 21, revenue_printed: '', company_city: 'Newton', company_state: 'New Jersey' },
  { company_name: 'Tractable', vertical: 'insurance_claims_smb', domain: 'tractable.ai', employee_count: 250, revenue_printed: '21M', company_city: 'London', company_state: 'England' },
  { company_name: 'AUTOPAY', vertical: 'auto_lenders_smb', domain: 'autopay.com', employee_count: 260, revenue_printed: '48.9M', company_city: 'Denver', company_state: 'Colorado' },
  { company_name: 'OpenRoad Lending', vertical: 'auto_lenders_smb', domain: 'openroadlending.com', employee_count: 84, revenue_printed: '4.4M', company_city: 'Fort Worth', company_state: 'Texas' },
  { company_name: 'Mike Albert Fleet Solutions', vertical: 'auto_lenders_smb', domain: 'mikealbert.com', employee_count: 230, revenue_printed: '35M', company_city: 'Cincinnati', company_state: 'Ohio' },
  { company_name: 'LHPH Capital', vertical: 'auto_lenders_smb', domain: 'lhph.com', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'Trust & Will', vertical: 'estate_planning_smb', domain: 'trustandwill.com', employee_count: 100, revenue_printed: '32M', company_city: 'San Diego', company_state: 'California' },
  { company_name: 'Ethos', vertical: 'estate_planning_smb', domain: 'ethos.com', employee_count: 860, revenue_printed: '110M', company_city: 'Austin', company_state: 'Texas' },
  { company_name: 'LawDepot', vertical: 'estate_planning_smb', domain: 'lawdepot.com', employee_count: 200, revenue_printed: '35M', company_city: 'Edmonton', company_state: 'Alberta' },
  { company_name: 'Wealth.com', vertical: 'estate_planning_smb', domain: 'wealth.com', employee_count: 73, revenue_printed: '1M', company_city: 'Tempe', company_state: 'Arizona' },
  { company_name: 'Trilogy Investment Company, LLC', vertical: 'insurance_claims_smb', domain: 'trilogyic.com', employee_count: 34, revenue_printed: '', company_city: 'Alpharetta', company_state: 'Georgia' },
  { company_name: 'Marley', vertical: 'insurance_claims_smb', domain: 'marley.co.uk', employee_count: 230, revenue_printed: '23M', company_city: 'Burton upon Trent', company_state: 'England' },
  { company_name: 'Wellthy', vertical: 'estate_planning_smb', domain: 'wellthy.com', employee_count: 280, revenue_printed: '25M', company_city: 'New York', company_state: 'New York' },
  { company_name: 'Bestow', vertical: 'estate_planning_smb', domain: 'bestow.com', employee_count: 160, revenue_printed: '100M', company_city: 'Dallas', company_state: 'Texas' },
  { company_name: 'Rocket Lawyer', vertical: 'estate_planning_smb', domain: 'rocketlawyer.com', employee_count: 330, revenue_printed: '73.8M', company_city: 'San Francisco', company_state: 'California' },
  { company_name: 'LegalNature', vertical: 'estate_planning_smb', domain: 'legalnature.com', employee_count: 10, revenue_printed: '', company_city: 'San Jose', company_state: 'California' },
  { company_name: 'Everdays', vertical: 'estate_planning_smb', domain: 'everdays.com', employee_count: 23, revenue_printed: '', company_city: 'Southfield', company_state: 'Michigan' },
  { company_name: 'Caribou Financial, Inc.', vertical: 'auto_lenders_smb', domain: 'caribou.com', employee_count: 300, revenue_printed: '45M', company_city: 'Denver', company_state: 'Colorado' },
  { company_name: 'Cinfed Credit Union', vertical: 'credit_unions_smb', domain: 'cinfed.com', employee_count: 95, revenue_printed: '15.2M', company_city: 'Cincinnati', company_state: 'Ohio' },
  { company_name: 'Wescom Financial', vertical: 'credit_unions_smb', domain: 'wescom.org', employee_count: 890, revenue_printed: '10M', company_city: 'Pasadena', company_state: 'California' },
  { company_name: 'CLARITY CREDIT UNION', vertical: 'credit_unions_smb', domain: 'claritycu.com', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'FreeWill', vertical: 'estate_planning_smb', domain: 'freewill.com', employee_count: 260, revenue_printed: '40.4M', company_city: 'New York', company_state: 'New York' },
  { company_name: 'Everplans', vertical: 'estate_planning_smb', domain: 'everplans.com', employee_count: 16, revenue_printed: '11.5M', company_city: 'New York', company_state: 'New York' },
  { company_name: 'GYST (Get Your Sh*t Together)', vertical: 'estate_planning_smb', domain: 'letsgyst.com', employee_count: 6, revenue_printed: '', company_city: 'Seattle', company_state: 'Washington' },
  { company_name: 'Policygenius', vertical: 'estate_planning_smb', domain: 'policygenius.com', employee_count: 150, revenue_printed: '60M', company_city: 'Topeka', company_state: 'Kansas' },
  { company_name: 'Wealthbox', vertical: 'estate_planning_smb', domain: 'wealthbox.com', employee_count: 140, revenue_printed: '10.5M', company_city: 'Providence', company_state: 'Rhode Island' },
  { company_name: 'FundCount', vertical: 'estate_planning_smb', domain: 'fundcount.com', employee_count: 60, revenue_printed: '11.3M', company_city: '', company_state: 'Christ Church' },
  { company_name: 'WealthCounsel, LLC', vertical: 'estate_planning_smb', domain: 'wealthcounsel.com', employee_count: 150, revenue_printed: '74.3M', company_city: 'Jersey City', company_state: 'New Jersey' },
  { company_name: 'Lendbuzz', vertical: 'auto_lenders_smb', domain: 'lendbuzz.com', employee_count: 370, revenue_printed: '200M', company_city: 'Boston', company_state: 'Massachusetts' },
  { company_name: 'MoneyMinder', vertical: 'estate_planning_smb', domain: 'moneyminder.com', employee_count: 8, revenue_printed: '', company_city: 'Bellingham', company_state: 'Washington' },
  { company_name: 'MetLife Legal Plans', vertical: 'estate_planning_smb', domain: 'legalplans.com', employee_count: 300, revenue_printed: '45.9M', company_city: 'Cleveland', company_state: 'Ohio' },
  { company_name: 'RightCapital', vertical: 'estate_planning_smb', domain: 'rightcapital.com', employee_count: 160, revenue_printed: '8M', company_city: 'Shelton', company_state: 'Connecticut' },
  { company_name: 'Veridian Credit Union', vertical: 'credit_unions_smb', domain: 'veridiancu.org', employee_count: 600, revenue_printed: '117.0M', company_city: 'Waterloo', company_state: 'Iowa' },
  { company_name: 'Bellco Credit Union', vertical: 'credit_unions_smb', domain: 'bellco.org', employee_count: 370, revenue_printed: '412M', company_city: 'Greenwood Village', company_state: 'Colorado' },
  { company_name: 'Provident Credit Union', vertical: 'credit_unions_smb', domain: 'providentcu.org', employee_count: 400, revenue_printed: '145.1M', company_city: 'Redwood City', company_state: 'California' },
  { company_name: 'Elevations Credit Union', vertical: 'credit_unions_smb', domain: 'elevationscu.com', employee_count: 600, revenue_printed: '141.7M', company_city: 'Boulder', company_state: 'Colorado' },
  { company_name: 'Chartway Credit Union', vertical: 'credit_unions_smb', domain: 'chartway.com', employee_count: 860, revenue_printed: '294M', company_city: 'Virginia Beach', company_state: 'Virginia' },
  { company_name: 'Rivermark Community Credit Union', vertical: 'credit_unions_smb', domain: 'rivermarkcu.org', employee_count: 390, revenue_printed: '81.4M', company_city: 'Oregon City', company_state: 'Oregon' },
  { company_name: 'Cal Coast Credit Union', vertical: 'credit_unions_smb', domain: 'calcoastcu.org', employee_count: 450, revenue_printed: '133.4M', company_city: 'San Diego', company_state: 'California' },
  { company_name: 'Trellance Cooperative Holdings, Inc.', vertical: 'credit_unions_smb', domain: 'trellance.com', employee_count: 190, revenue_printed: '59.7M', company_city: 'Tampa', company_state: 'Florida' },
  { company_name: 'Connexus Credit Union', vertical: 'credit_unions_smb', domain: 'connexuscu.org', employee_count: 650, revenue_printed: '392.5M', company_city: 'Wausau', company_state: 'Wisconsin' },
  { company_name: 'Patelco Credit Union', vertical: 'credit_unions_smb', domain: 'patelco.org', employee_count: 970, revenue_printed: '445.1M', company_city: 'Dublin', company_state: 'California' },
  { company_name: 'American Claims Management', vertical: 'insurance_claims_smb', domain: 'acmclaims.com', employee_count: 170, revenue_printed: '44.2M', company_city: 'San Diego', company_state: 'California' },
  { company_name: 'Technology Credit Union (Tech CU)', vertical: 'credit_unions_smb', domain: 'techcu.com', employee_count: 350, revenue_printed: '235.3M', company_city: 'San Jose', company_state: 'California' },
  { company_name: 'Schools Federal Credit Union', vertical: 'credit_unions_smb', domain: 'schoolsfcu.org', employee_count: 24, revenue_printed: '4.0M', company_city: 'Torrance', company_state: 'California' },
  { company_name: 'CU*Answers', vertical: 'credit_unions_smb', domain: 'cuanswers.com', employee_count: 320, revenue_printed: '15.9M', company_city: 'Grand Rapids', company_state: 'Michigan' },
  { company_name: 'Grow Financial Federal Credit Union', vertical: 'credit_unions_smb', domain: 'growfinancial.org', employee_count: 560, revenue_printed: '143.6M', company_city: 'Tampa', company_state: 'Florida' },
  { company_name: "America's Credit Unions", vertical: 'credit_unions_smb', domain: 'americascreditunions.org', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'Posh', vertical: 'credit_unions_smb', domain: 'posh.ai', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'Eglin Federal Credit Union', vertical: 'credit_unions_smb', domain: 'eglinfcu.org', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'NET Credit Union', vertical: 'credit_unions_smb', domain: 'netcreditunion.com', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'RateGenius', vertical: 'auto_lenders_smb', domain: 'rategenius.com', employee_count: 150, revenue_printed: '48M', company_city: 'Austin', company_state: 'Texas' },
  { company_name: 'Clutch', vertical: 'auto_lenders_smb', domain: 'withclutch.com', employee_count: 260, revenue_printed: '', company_city: 'San Francisco', company_state: 'California' },
  { company_name: 'Directive', vertical: 'estate_planning_smb', domain: 'directive.com', employee_count: 30, revenue_printed: '5.2M', company_city: 'Oneonta', company_state: 'New York' },
  { company_name: 'New York Credit Union Association', vertical: 'credit_unions_smb', domain: 'nycua.org', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'Palisades Credit Union', vertical: 'credit_unions_smb', domain: 'palisadesfcu.org', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'Gateway One Lending & Finance', vertical: 'auto_lenders_smb', domain: 'gatewayonelending.com', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'Community Credit Union', vertical: 'credit_unions_smb', domain: 'communitycu.com', employee_count: 88, revenue_printed: '', company_city: 'La Crosse', company_state: 'Wisconsin' },
  { company_name: 'Hiway Credit Union', vertical: 'credit_unions_smb', domain: 'hiway.org', employee_count: 98, revenue_printed: '94.6M', company_city: 'Saint Paul', company_state: 'Minnesota' },
  { company_name: 'State Department Federal Credit Union', vertical: 'credit_unions_smb', domain: 'sdfcu.org', employee_count: 200, revenue_printed: '44.4M', company_city: 'Alexandria', company_state: 'Virginia' },
  { company_name: 'Tricolor Auto Group, LLC', vertical: 'auto_lenders_smb', domain: 'tricolor.com', employee_count: 360, revenue_printed: '62.3M', company_city: 'Irving', company_state: 'Texas' },
  { company_name: 'FLEX Credit Union Technology', vertical: 'credit_unions_smb', domain: 'flexcutech.com', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'Gulf & Fraser', vertical: 'credit_unions_smb', domain: 'gulfandfraser.com', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'Motorists Mutual Insurance Company', vertical: 'insurance_claims_smb', domain: 'motoristsgroup.com', employee_count: 21, revenue_printed: '', company_city: 'Columbus', company_state: 'Ohio' },
  { company_name: 'CUMIS', vertical: 'credit_unions_smb', domain: 'cumis.com', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'FormSwift (Acquired By Dropbox)', vertical: 'estate_planning_smb', domain: 'formswift.com', employee_count: 12, revenue_printed: '12.5M', company_city: 'San Francisco', company_state: 'California' },
  { company_name: 'Nolo', vertical: 'estate_planning_smb', domain: 'nolo.com', employee_count: 150, revenue_printed: '35M', company_city: 'Pleasanton', company_state: 'California' },
  { company_name: 'VAPR Federal Credit Union', vertical: 'credit_unions_smb', domain: 'vaprfcu.com', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'Ettinger Law Firm', vertical: 'estate_planning_smb', domain: 'trustlaw.com', employee_count: 23, revenue_printed: '8.1M', company_city: 'Albany', company_state: 'New York' },
  { company_name: 'Golden West Technologies', vertical: 'credit_unions_smb', domain: 'gwtis.com', employee_count: 110, revenue_printed: '19.6M', company_city: 'Rapid City', company_state: 'South Dakota' },
  { company_name: 'NAFCU (National Association of Federally-Insured Credit Unions)', vertical: 'credit_unions_smb', domain: '', employee_count: null, revenue_printed: '', company_city: '', company_state: '' },
  { company_name: 'BCI Financial, a division of Ion Bank', vertical: 'auto_lenders_smb', domain: 'bcifinancial.com', employee_count: null, revenue_printed: '', company_city: '', company_state: '' }
].filter(c => c.company_name && c.company_name.trim() !== ''); // Filter out empty rows

/**
 * Convert revenue string to decimal (e.g., "455M" -> 455000000)
 */
function parseRevenue(revenueStr) {
  if (!revenueStr || revenueStr.trim() === '') return null;
  
  const cleaned = revenueStr.trim().toUpperCase();
  const match = cleaned.match(/^([\d.]+)([KMB]?)$/);
  
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const multiplier = match[2];
  
  if (multiplier === 'K') return value * 1000;
  if (multiplier === 'M') return value * 1000000;
  if (multiplier === 'B') return value * 1000000000;
  
  return value;
}

/**
 * Map vertical to industry name
 */
function mapVerticalToIndustry(vertical) {
  const mapping = {
    'insurance_claims_smb': 'Insurance Claims',
    'auto_lenders_smb': 'Auto Lending',
    'estate_planning_smb': 'Estate Planning',
    'credit_unions_smb': 'Credit Union'
  };
  
  return mapping[vertical] || vertical;
}

async function main() {
  console.log('\n============================================================');
  console.log('   REASSIGN NOEL COMPANIES WITH VERTICALS');
  console.log('============================================================\n');

  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Find Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }
    console.log(`Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Find Noel user
    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });

    if (!noel) {
      throw new Error('Noel user not found!');
    }
    console.log(`Found Noel: ${noel.name || noel.email} (${noel.id})\n`);

    // Step 1: Unassign Noel from existing companies
    console.log('Step 1: Unassigning Noel from existing companies...');
    const unassignResult = await prisma.companies.updateMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: noel.id,
        deletedAt: null
      },
      data: {
        mainSellerId: null
      }
    });
    console.log(`✅ Unassigned Noel from ${unassignResult.count} existing companies\n`);

    // Step 2: Add new companies
    console.log('Step 2: Adding new companies...');
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const companyData of companiesData) {
      try {
        // Check if company already exists by name or domain
        const existing = await prisma.companies.findFirst({
          where: {
            workspaceId: workspace.id,
            OR: [
              { name: { equals: companyData.company_name, mode: 'insensitive' } },
              ...(companyData.domain ? [{ domain: { equals: companyData.domain, mode: 'insensitive' } }] : [])
            ],
            deletedAt: null
          }
        });

        const revenue = parseRevenue(companyData.revenue_printed);
        const industry = mapVerticalToIndustry(companyData.vertical);
        const website = companyData.domain ? `https://${companyData.domain}` : null;

        const companyPayload = {
          workspaceId: workspace.id,
          name: companyData.company_name,
          domain: companyData.domain || null,
          website: website,
          industry: industry,
          city: companyData.company_city || null,
          state: companyData.company_state || null,
          employeeCount: companyData.employee_count || null,
          revenue: revenue ? revenue : null,
          currency: 'USD',
          mainSellerId: noel.id,
          status: 'ACTIVE',
          priority: 'MEDIUM',
          customFields: {
            vertical: companyData.vertical,
            originalRevenue: companyData.revenue_printed || null
          }
        };

        if (existing) {
          // Update existing company
          await prisma.companies.update({
            where: { id: existing.id },
            data: {
              ...companyPayload,
              updatedAt: new Date()
            }
          });
          updated++;
          console.log(`  ✓ Updated: ${companyData.company_name}`);
        } else {
          // Create new company
          await prisma.companies.create({
            data: companyPayload
          });
          created++;
          console.log(`  + Created: ${companyData.company_name} (${industry})`);
        }
      } catch (error) {
        skipped++;
        console.error(`  ✗ Error with ${companyData.company_name}: ${error.message}`);
      }
    }

    console.log(`\n✅ Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total processed: ${companiesData.length}\n`);

    // Step 3: Verify final count
    const finalCount = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: noel.id,
        deletedAt: null
      }
    });

    console.log(`✅ Noel now has ${finalCount} companies as main seller\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
