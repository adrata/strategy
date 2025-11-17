import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySouthernCompanyData() {
  const SOUTHERN_COMPANY_ID = '01K9QD2ST0C0TTG34EMRD3M69H';
  
  console.log('🔍 VERIFYING SOUTHERN COMPANY DATA');
  console.log('================================================================================\n');

  const company = await prisma.companies.findUnique({
    where: { id: SOUTHERN_COMPANY_ID },
    select: {
      id: true,
      name: true,
      industry: true,
      industryOverride: true,
      sector: true,
      employeeCount: true,
      size: true,
      revenue: true,
      description: true,
      descriptionEnriched: true,
      website: true,
      websiteOverride: true,
      domain: true,
      linkedinUrl: true,
      city: true,
      state: true,
      country: true,
      hqCity: true,
      hqState: true,
      foundedYear: true,
      isPublic: true,
      customFields: true,
      coreCompanyId: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  if (!company) {
    console.log('❌ Company not found');
    await prisma.$disconnect();
    return;
  }

  // Output as JSON for easy review
  const dataToReview = {
    id: company.id,
    name: company.name,
    industry: company.industry,
    industryOverride: company.industryOverride,
    sector: company.sector,
    employeeCount: company.employeeCount,
    size: company.size,
    revenue: company.revenue,
    isPublic: company.isPublic,
    website: company.website,
    websiteOverride: company.websiteOverride,
    domain: company.domain,
    description: company.description,
    descriptionEnriched: company.descriptionEnriched ? company.descriptionEnriched.substring(0, 300) + '...' : null,
    location: {
      city: company.city,
      state: company.state,
      country: company.country,
      hqCity: company.hqCity,
      hqState: company.hqState,
    },
    foundedYear: company.foundedYear,
    linkedinUrl: company.linkedinUrl,
    coreCompanyId: company.coreCompanyId,
    updatedAt: company.updatedAt,
    createdAt: company.createdAt,
  };

  console.log('📊 CURRENT DATA (JSON):');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log(JSON.stringify(dataToReview, null, 2));

  console.log('\n✅ VALIDATION CHECK:');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  
  const checks = {
    industry: {
      value: company.industry,
      expected: 'Utilities',
      status: company.industry === 'Utilities' ? '✅' : '❌',
    },
    industryOverride: {
      value: company.industryOverride,
      expected: 'Utilities',
      status: company.industryOverride === 'Utilities' ? '✅' : '❌',
    },
    sector: {
      value: company.sector,
      expected: 'Energy',
      status: company.sector === 'Energy' ? '✅' : '❌',
    },
    employeeCount: {
      value: company.employeeCount,
      expected: 'null (or reasonable number)',
      status: company.employeeCount === null || (company.employeeCount && company.employeeCount > 100) ? '✅' : '❌',
    },
    isPublic: {
      value: company.isPublic,
      expected: true,
      status: company.isPublic === true ? '✅' : '❌',
    },
    size: {
      value: company.size,
      expected: 'Large',
      status: company.size === 'Large' ? '✅' : '❌',
    },
    domain: {
      value: company.domain,
      expected: 'southernco.com',
      status: company.domain === 'southernco.com' ? '✅' : '❌',
    },
    descriptionEnriched: {
      value: company.descriptionEnriched ? 'Present' : 'Missing',
      expected: 'Present with correct content',
      status: company.descriptionEnriched && 
              !company.descriptionEnriched.toLowerCase().includes('small') &&
              !company.descriptionEnriched.toLowerCase().includes('2 employees') &&
              (company.descriptionEnriched.toLowerCase().includes('utility') || 
               company.descriptionEnriched.toLowerCase().includes('electric')) ? '✅' : '❌',
    },
  };

  Object.entries(checks).forEach(([key, check]) => {
    console.log(`${check.status} ${key}: ${JSON.stringify(check.value)} (expected: ${check.expected})`);
  });

  const allPassed = Object.values(checks).every(check => check.status === '✅');
  console.log(`\n${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);

  await prisma.$disconnect();
}

verifySouthernCompanyData().catch(console.error);

