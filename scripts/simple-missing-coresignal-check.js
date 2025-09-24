const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMissingCoreSignal() {
  try {
    console.log('🔍 CHECKING MISSING CORESIGNAL DATA');
    console.log('===================================');

    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Get all companies
    const allCompanies = await prisma.companies.findMany({
      where: { workspaceId: workspaceId },
      select: {
        id: true,
        name: true,
        website: true,
        customFields: true,
        updatedAt: true
      }
    });

    console.log(`\n📊 TOTAL COMPANIES: ${allCompanies.length}`);

    // Analyze CoreSignal data
    let withCoreSignal = 0;
    let withoutCoreSignal = 0;
    let withCustomFields = 0;
    let withoutCustomFields = 0;
    let withErrors = 0;

    const missingCoreSignal = [];
    const withErrorsList = [];

    allCompanies.forEach(company => {
      if (company.customFields) {
        withCustomFields++;
        
        if (company.customFields.coresignalData) {
          withCoreSignal++;
        } else {
          withoutCoreSignal++;
          missingCoreSignal.push(company);
        }

        if (company.customFields.enrichmentError) {
          withErrors++;
          withErrorsList.push(company);
        }
      } else {
        withoutCustomFields++;
        missingCoreSignal.push(company);
      }
    });

    console.log(`\n📊 BREAKDOWN:`);
    console.log(`Companies with customFields: ${withCustomFields}`);
    console.log(`Companies without customFields: ${withoutCustomFields}`);
    console.log(`Companies with CoreSignal: ${withCoreSignal}`);
    console.log(`Companies without CoreSignal: ${withoutCoreSignal}`);
    console.log(`Companies with errors: ${withErrors}`);

    console.log(`\n🔍 FIRST 10 COMPANIES WITHOUT CORESIGNAL:`);
    missingCoreSignal.slice(0, 10).forEach((company, i) => {
      console.log(`\n${i+1}. ${company.name}`);
      console.log(`   Website: ${company.website || 'No website'}`);
      console.log(`   Has customFields: ${company.customFields ? 'Yes' : 'No'}`);
      if (company.customFields) {
        console.log(`   Has CoreSignal: ${company.customFields.coresignalData ? 'Yes' : 'No'}`);
        console.log(`   Last enriched: ${company.customFields.lastEnrichedAt || 'Never'}`);
        if (company.customFields.enrichmentError) {
          console.log(`   Error: ${company.customFields.enrichmentError}`);
        }
      }
    });

    if (withErrorsList.length > 0) {
      console.log(`\n❌ COMPANIES WITH ENRICHMENT ERRORS:`);
      withErrorsList.slice(0, 5).forEach((company, i) => {
        console.log(`\n${i+1}. ${company.name}`);
        console.log(`   Error: ${company.customFields.enrichmentError}`);
      });
    }

    // Check if the script is still running
    const recentCompanies = allCompanies
      .filter(c => c.customFields?.lastEnrichedAt)
      .sort((a, b) => new Date(b.customFields.lastEnrichedAt) - new Date(a.customFields.lastEnrichedAt))
      .slice(0, 5);

    console.log(`\n🕒 RECENT ENRICHMENT ACTIVITY:`);
    recentCompanies.forEach((company, i) => {
      console.log(`${i+1}. ${company.name} - ${company.customFields.lastEnrichedAt}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingCoreSignal();
