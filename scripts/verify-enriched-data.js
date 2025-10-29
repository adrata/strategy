const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyEnrichedData() {
  const danUserId = '01K7B327HWN9G6KGWA97S1TK43';
  const adrataWorkspaceId = '01K7464TNANHQXPCZT1FYX205V';

  console.log('🔍 Verifying Enriched Company Data for Dan in Adrata Workspace');
  console.log('================================================================\n');

  const companies = await prisma.companies.findMany({
    where: {
      workspaceId: adrataWorkspaceId,
      mainSellerId: danUserId
    },
    select: {
      id: true,
      name: true,
      description: true,
      descriptionEnriched: true,
      website: true,
      domain: true,
      email: true,
      phone: true,
      linkedinUrl: true,
      twitterUrl: true,
      facebookUrl: true,
      address: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
      industry: true,
      sector: true,
      size: true,
      revenue: true,
      employeeCount: true,
      foundedYear: true,
      isPublic: true,
      dataQualityScore: true,
      dataSources: true,
      lastVerified: true,
      customFields: true
    },
    orderBy: { name: 'asc' }
  });

  console.log(`📊 Found ${companies.length} companies total\n`);

  let enrichedCount = 0;
  let partiallyEnrichedCount = 0;
  let notEnrichedCount = 0;

  for (const company of companies) {
    const hasCustomFields = company.customFields && Object.keys(company.customFields).length > 0;
    const hasMainFields = company.descriptionEnriched || company.employeeCount || company.industry || company.linkedinUrl;
    const hasCoresignalData = company.customFields?.coresignalData;
    const hasPerplexityData = company.customFields?.perplexityData;
    const hasEnrichmentSource = company.dataSources && company.dataSources.length > 0;
    
    let status = '';
    if (hasMainFields && (hasCoresignalData || hasPerplexityData || hasEnrichmentSource)) {
      status = '✅ FULLY ENRICHED';
      enrichedCount++;
    } else if (hasMainFields || hasCustomFields) {
      status = '⚠️ PARTIALLY ENRICHED';
      partiallyEnrichedCount++;
    } else {
      status = '❌ NOT ENRICHED';
      notEnrichedCount++;
    }

    console.log(`${status} - ${company.name}`);
    console.log(`   Description: ${company.descriptionEnriched ? 'Yes' : 'No'} (${company.descriptionEnriched?.length || 0} chars)`);
    console.log(`   Employee Count: ${company.employeeCount || 'N/A'}`);
    console.log(`   Industry: ${company.industry || 'N/A'}`);
    console.log(`   LinkedIn: ${company.linkedinUrl ? 'Yes' : 'No'}`);
    console.log(`   Data Quality: ${company.dataQualityScore || 'N/A'}`);
    console.log(`   Sources: ${company.dataSources?.join(', ') || 'N/A'}`);
    console.log(`   Coresignal Data: ${hasCoresignalData ? 'Yes' : 'No'}`);
    console.log(`   Perplexity Data: ${hasPerplexityData ? 'Yes' : 'No'}`);
    console.log('');
  }

  console.log('📈 SUMMARY:');
  console.log(`✅ Fully Enriched: ${enrichedCount}`);
  console.log(`⚠️ Partially Enriched: ${partiallyEnrichedCount}`);
  console.log(`❌ Not Enriched: ${notEnrichedCount}`);
  console.log(`📊 Total: ${companies.length}`);

  await prisma.$disconnect();
}

verifyEnrichedData().catch(console.error);
