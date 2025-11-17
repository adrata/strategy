import { PrismaClient } from '@prisma/client';
import { generateCompanySummary } from './validate-and-ensure-summaries';

const prisma = new PrismaClient();

async function regenerateSummary() {
  const SOUTHERN_COMPANY_ID = '01K9QD2ST0C0TTG34EMRD3M69H';
  
  console.log('🔄 REGENERATING SOUTHERN COMPANY SUMMARY');
  console.log('================================================================================\n');
  
  // Get company data
  const company = await prisma.companies.findUnique({
    where: { id: SOUTHERN_COMPANY_ID },
    select: {
      id: true,
      name: true,
      industry: true,
      website: true,
      linkedinUrl: true,
      hqCity: true,
      hqState: true,
      city: true,
      state: true,
      address: true,
      employeeCount: true,
      size: true,
      revenue: true,
      foundedYear: true,
      isPublic: true,
      relationshipType: true,
      priority: true,
    },
  });
  
  if (!company) {
    console.log('❌ Company not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📊 Company: ${company.name}`);
  console.log(`   Industry: ${company.industry || 'N/A'}`);
  console.log(`   Employee Count: ${company.employeeCount || 'N/A'}`);
  console.log(`   Website: ${company.website || 'N/A'}`);
  console.log('');
  
  // Clear existing summary
  await prisma.companies.update({
    where: { id: SOUTHERN_COMPANY_ID },
    data: {
      descriptionEnriched: null,
    },
  });
  
  console.log('✅ Cleared existing summary');
  console.log('🤖 Generating new summary...\n');
  
  // Generate new summary
  const summary = await generateCompanySummary(company);
  
  if (summary) {
    await prisma.companies.update({
      where: { id: SOUTHERN_COMPANY_ID },
      data: {
        descriptionEnriched: summary,
        updatedAt: new Date(),
        customFields: {
          ...((company as any).customFields || {}),
          aiSummaryGeneratedAt: new Date().toISOString(),
          aiSummaryModel: 'claude-sonnet-4-20250514',
          aiSummarySource: 'regenerate-southern-summary-script',
        },
      },
    });
    
    console.log('✅ Successfully generated and saved summary:');
    console.log(`\n${summary}\n`);
  } else {
    console.log('❌ Failed to generate summary (validation failed or no API key)');
  }
  
  await prisma.$disconnect();
}

regenerateSummary();

