import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSouthernCompanyData() {
  const SOUTHERN_COMPANY_ID = '01K9QD2ST0C0TTG34EMRD3M69H';
  
  console.log('🔧 FIXING SOUTHERN COMPANY DATA');
  console.log('================================================================================\n');

  // Get current data
  const company = await prisma.companies.findUnique({
    where: { id: SOUTHERN_COMPANY_ID },
    select: {
      id: true,
      name: true,
      industry: true,
      employeeCount: true,
    },
  });

  if (!company) {
    console.log('❌ Company not found');
    await prisma.$disconnect();
    return;
  }

  console.log('📊 CURRENT DATA:');
  console.log(`  Industry: ${company.industry}`);
  console.log(`  Employee Count: ${company.employeeCount}`);
  console.log('');

  // Southern Company is a major U.S. electric utility
  // Based on public information:
  // - Industry: Electric Utilities / Utilities
  // - Employee Count: ~27,000+ (but we'll set to null if we're not certain, or use a reasonable estimate)
  // - Is Public: Yes (NYSE: SO)
  
  const updates: any = {
    industry: 'Utilities',
    industryOverride: 'Utilities', // Set override to prevent it from being overwritten
    sector: 'Energy',
    employeeCount: null, // Set to null rather than guessing - better to be unknown than wrong
    isPublic: true,
    size: 'Large', // Based on being a major utility
    updatedAt: new Date(),
    customFields: {
      ...((company as any).customFields || {}),
      dataCorrection: {
        correctedAt: new Date().toISOString(),
        reason: 'Corrected industry and employee count - was incorrectly set as Transportation with 2 employees',
        correctedBy: 'fix-southern-company-data-script',
        originalIndustry: company.industry,
        originalEmployeeCount: company.employeeCount,
      },
    },
  };

  console.log('📝 PROPOSED UPDATES:');
  console.log(`  Industry: ${updates.industry}`);
  console.log(`  Industry Override: ${updates.industryOverride}`);
  console.log(`  Sector: ${updates.sector}`);
  console.log(`  Employee Count: ${updates.employeeCount} (null - unknown rather than incorrect)`);
  console.log(`  Is Public: ${updates.isPublic}`);
  console.log(`  Size: ${updates.size}`);
  console.log('');

  // Ask for confirmation (in a real script, you might want to add a --confirm flag)
  console.log('⚠️  This will update the company record. Proceeding...\n');

  await prisma.companies.update({
    where: { id: SOUTHERN_COMPANY_ID },
    data: updates,
  });

  console.log('✅ Successfully updated Southern Company data');
  console.log('');
  console.log('📊 UPDATED DATA:');
  const updated = await prisma.companies.findUnique({
    where: { id: SOUTHERN_COMPANY_ID },
    select: {
      industry: true,
      industryOverride: true,
      sector: true,
      employeeCount: true,
      isPublic: true,
      size: true,
    },
  });
  
  if (updated) {
    console.log(`  Industry: ${updated.industry}`);
    console.log(`  Industry Override: ${updated.industryOverride}`);
    console.log(`  Sector: ${updated.sector}`);
    console.log(`  Employee Count: ${updated.employeeCount || 'null'}`);
    console.log(`  Is Public: ${updated.isPublic}`);
    console.log(`  Size: ${updated.size}`);
  }

  console.log('\n💡 Next Steps:');
  console.log('  1. Regenerate the company summary using the intelligence API');
  console.log('  2. The summary should now correctly describe Southern Company as a major utility');

  await prisma.$disconnect();
}

fixSouthernCompanyData();

