import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
  
  console.log('🔍 CHECKING FOR DUPLICATE SOUTHERN COMPANY RECORDS');
  console.log('================================================================================\n');

  // Find all companies with "Southern" in the name
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId: TOP_WORKSPACE_ID,
      deletedAt: null,
      name: {
        contains: 'Southern',
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      name: true,
      industry: true,
      employeeCount: true,
      domain: true,
      website: true,
      description: true,
      descriptionEnriched: true,
      createdAt: true,
      updatedAt: true,
      customFields: true,
      coreCompanyId: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`📊 Found ${companies.length} companies with "Southern" in the name:\n`);

  companies.forEach((company, index) => {
    console.log(`${index + 1}. ${company.name} (ID: ${company.id})`);
    console.log(`   Industry: ${company.industry || 'N/A'}`);
    console.log(`   Employee Count: ${company.employeeCount || 'N/A'}`);
    console.log(`   Domain: ${company.domain || 'N/A'}`);
    console.log(`   Website: ${company.website || 'N/A'}`);
    console.log(`   Has Description: ${company.description ? 'Yes' : 'No'}`);
    console.log(`   Has Description Enriched: ${company.descriptionEnriched ? 'Yes' : 'No'}`);
    console.log(`   Core Company ID: ${company.coreCompanyId || 'N/A'}`);
    console.log(`   Created: ${company.createdAt}`);
    console.log(`   Updated: ${company.updatedAt}`);
    console.log('');
  });

  // Check for exact name matches
  const nameGroups = companies.reduce((acc: Record<string, any[]>, company) => {
    const normalizedName = company.name.toLowerCase().trim();
    if (!acc[normalizedName]) {
      acc[normalizedName] = [];
    }
    acc[normalizedName].push(company);
    return acc;
  }, {});

  const duplicates = Object.entries(nameGroups).filter(([_, group]) => group.length > 1);

  if (duplicates.length > 0) {
    console.log('⚠️  DUPLICATE NAMES FOUND:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    duplicates.forEach(([name, group]) => {
      console.log(`\n"${name}" appears ${group.length} times:`);
      group.forEach((company, idx) => {
        console.log(`  ${idx + 1}. ID: ${company.id}`);
        console.log(`     Industry: ${company.industry || 'N/A'}`);
        console.log(`     Employee Count: ${company.employeeCount || 'N/A'}`);
        console.log(`     Domain: ${company.domain || 'N/A'}`);
        console.log(`     Created: ${company.createdAt}`);
      });
    });
  } else {
    console.log('✅ No exact duplicate names found');
  }

  // Check for domain-based duplicates (southernco.com)
  const southerncoCompanies = companies.filter(c => 
    c.domain?.includes('southernco.com') || 
    c.website?.includes('southernco.com')
  );

  if (southerncoCompanies.length > 1) {
    console.log('\n⚠️  MULTIPLE COMPANIES WITH southernco.com DOMAIN:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    southerncoCompanies.forEach((company, idx) => {
      console.log(`${idx + 1}. ${company.name} (ID: ${company.id})`);
      console.log(`   Industry: ${company.industry || 'N/A'}`);
      console.log(`   Employee Count: ${company.employeeCount || 'N/A'}`);
    });
  } else if (southerncoCompanies.length === 1) {
    console.log(`\n✅ Only one company with southernco.com domain: ${southerncoCompanies[0].name}`);
  } else {
    console.log('\n⚠️  No companies found with southernco.com domain');
  }

  // Check for the specific ID we've been working with
  const targetId = '01K9QD2ST0C0TTG34EMRD3M69H';
  const targetCompany = companies.find(c => c.id === targetId);
  
  if (targetCompany) {
    console.log(`\n📌 TARGET COMPANY (${targetId}):`);
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`Name: ${targetCompany.name}`);
    console.log(`Industry: ${targetCompany.industry || 'N/A'}`);
    console.log(`Employee Count: ${targetCompany.employeeCount || 'N/A'}`);
    console.log(`Domain: ${targetCompany.domain || 'N/A'}`);
    
    // Check if there are other companies that might be the "real" one
    const otherSouthernCompanies = companies.filter(c => 
      c.id !== targetId && 
      (c.domain?.includes('southernco.com') || c.name.toLowerCase() === 'southern company')
    );
    
    if (otherSouthernCompanies.length > 0) {
      console.log(`\n⚠️  FOUND OTHER POTENTIAL SOUTHERN COMPANY RECORDS:`);
      otherSouthernCompanies.forEach(c => {
        console.log(`  - ${c.name} (ID: ${c.id})`);
        console.log(`    Industry: ${c.industry || 'N/A'}`);
        console.log(`    Employee Count: ${c.employeeCount || 'N/A'}`);
      });
    }
  }

  await prisma.$disconnect();
}

checkDuplicates();

