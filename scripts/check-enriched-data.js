const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEnrichedData() {
  try {
    const company = await prisma.companies.findFirst({
      where: { 
        workspaceId: '01K7464TNANHQXPCZT1FYX205V', 
        mainSellerId: '01K7B327HWN9G6KGWA97S1TK43' 
      },
      select: { 
        name: true, 
        customFields: true, 
        descriptionEnriched: true, 
        industry: true, 
        employeeCount: true, 
        linkedinUrl: true,
        website: true,
        domain: true,
        foundedYear: true,
        dataQualityScore: true
      }
    });

    if (company) {
      console.log('Company:', company.name);
      console.log('Description:', company.descriptionEnriched?.substring(0, 200) + '...');
      console.log('Industry:', company.industry);
      console.log('Employee Count:', company.employeeCount);
      console.log('LinkedIn:', company.linkedinUrl);
      console.log('Website:', company.website);
      console.log('Domain:', company.domain);
      console.log('Founded Year:', company.foundedYear);
      console.log('Data Quality Score:', company.dataQualityScore);
      console.log('Custom Fields Keys:', Object.keys(company.customFields || {}));
      
      if (company.customFields?.coresignalData) {
        const coresignal = company.customFields.coresignalData;
        console.log('\nCoresignal Data Available:');
        console.log('- Company Name:', coresignal.name || coresignal.company_name);
        console.log('- Industry:', coresignal.industry);
        console.log('- Employee Count:', coresignal.employees_count);
        console.log('- Size Range:', coresignal.size_range);
        console.log('- Founded Year:', coresignal.founded_year);
        console.log('- LinkedIn URL:', coresignal.linkedin_url);
        console.log('- Website:', coresignal.website);
        console.log('- Description:', coresignal.description?.substring(0, 200) + '...');
        console.log('- HQ City:', coresignal.hq_city);
        console.log('- HQ State:', coresignal.hq_state);
        console.log('- HQ Country:', coresignal.hq_country);
        console.log('- Revenue Annual:', coresignal.revenue_annual);
        console.log('- Stock Symbol:', coresignal.stock_ticker);
        console.log('- Is Public:', coresignal.is_public);
      }
    } else {
      console.log('No companies found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnrichedData();
