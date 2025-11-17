import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function investigateSouthernCompany() {
  const SOUTHERN_COMPANY_ID = '01K9QD2ST0C0TTG34EMRD3M69H';
  
  console.log('🔍 INVESTIGATING SOUTHERN COMPANY DATA');
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
      coreCompany: {
        select: {
          id: true,
          name: true,
          industry: true,
          sector: true,
          employeeCount: true,
          description: true,
          website: true,
          domain: true,
          dataQualityScore: true,
          dataSources: true,
          lastVerified: true,
        }
      },
      people: {
        where: { deletedAt: null },
        select: {
          id: true,
          email: true,
          workEmail: true,
          jobTitle: true,
        },
        take: 20,
      },
    },
  });

  if (!company) {
    console.log('❌ Company not found');
    await prisma.$disconnect();
    return;
  }

  console.log('📊 COMPANY RECORD DATA:');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log(`Name: ${company.name}`);
  console.log(`Industry: ${company.industry || 'N/A'}`);
  console.log(`Industry Override: ${company.industryOverride || 'N/A'}`);
  console.log(`Sector: ${company.sector || 'N/A'}`);
  console.log(`Employee Count: ${company.employeeCount || 'N/A'}`);
  console.log(`Size: ${company.size || 'N/A'}`);
  console.log(`Revenue: ${company.revenue ? `$${company.revenue.toLocaleString()}` : 'N/A'}`);
  console.log(`Website: ${company.website || 'N/A'}`);
  console.log(`Website Override: ${company.websiteOverride || 'N/A'}`);
  console.log(`Domain: ${company.domain || 'N/A'}`);
  console.log(`LinkedIn: ${company.linkedinUrl || 'N/A'}`);
  console.log(`Location: ${company.hqCity || company.city || 'N/A'}, ${company.hqState || company.state || 'N/A'}, ${company.country || 'N/A'}`);
  console.log(`Founded: ${company.foundedYear || 'N/A'}`);
  console.log(`Public: ${company.isPublic !== null ? company.isPublic : 'N/A'}`);
  console.log(`Core Company ID: ${company.coreCompanyId || 'N/A'}`);

  console.log('\n📦 CORE COMPANY DATA (if linked):');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  if (company.coreCompany) {
    console.log(`Name: ${company.coreCompany.name}`);
    console.log(`Industry: ${company.coreCompany.industry || 'N/A'}`);
    console.log(`Sector: ${company.coreCompany.sector || 'N/A'}`);
    console.log(`Employee Count: ${company.coreCompany.employeeCount || 'N/A'}`);
    console.log(`Description: ${company.coreCompany.description ? company.coreCompany.description.substring(0, 200) + '...' : 'N/A'}`);
    console.log(`Website: ${company.coreCompany.website || 'N/A'}`);
    console.log(`Domain: ${company.coreCompany.domain || 'N/A'}`);
    console.log(`Data Quality Score: ${company.coreCompany.dataQualityScore || 'N/A'}`);
    console.log(`Data Sources: ${company.coreCompany.dataSources ? JSON.stringify(company.coreCompany.dataSources) : 'N/A'}`);
    console.log(`Last Verified: ${company.coreCompany.lastVerified || 'N/A'}`);
  } else {
    console.log('No core company linked');
  }

  console.log('\n📧 CONTACT EMAIL DOMAINS:');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  const emailDomains = company.people
    .map(p => {
      const email = p.workEmail || p.email;
      if (!email) return null;
      return email.split('@')[1]?.toLowerCase();
    })
    .filter(Boolean) as string[];
  
  const domainCounts = emailDomains.reduce((acc: Record<string, number>, domain: string) => {
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Domain frequencies:');
  Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count} contact(s)`);
    });

  console.log('\n🔍 CORESIGNAL DATA (from customFields):');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  const customFields = company.customFields as any || {};
  const coresignalData = customFields.coresignalData || {};
  
  if (Object.keys(coresignalData).length > 0) {
    console.log(`Industry: ${coresignalData.industry || 'N/A'}`);
    console.log(`Sector: ${coresignalData.sector || 'N/A'}`);
    console.log(`Employee Count: ${coresignalData.employees_count || coresignalData.employee_count || 'N/A'}`);
    console.log(`Revenue: ${coresignalData.revenue ? `$${coresignalData.revenue.toLocaleString()}` : 'N/A'}`);
    console.log(`Description: ${coresignalData.description ? coresignalData.description.substring(0, 200) + '...' : 'N/A'}`);
    console.log(`Website: ${coresignalData.website || 'N/A'}`);
    console.log(`Domain: ${coresignalData.domain || 'N/A'}`);
    console.log(`Founded Year: ${coresignalData.founded_year || 'N/A'}`);
    console.log(`Is Public: ${coresignalData.is_public !== undefined ? coresignalData.is_public : 'N/A'}`);
  } else {
    console.log('No CoreSignal data found');
  }

  console.log('\n📊 DATA ANALYSIS:');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  
  // Check for data inconsistencies
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check industry
  const expectedIndustry = 'Utilities' || 'Energy' || 'Electric Utilities';
  const currentIndustry = company.industry?.toLowerCase() || '';
  if (currentIndustry.includes('transportation') || currentIndustry.includes('logistics')) {
    issues.push(`❌ Industry is "${company.industry}" but should be Utilities/Energy`);
    recommendations.push(`Update industry to "Utilities" or "Electric Utilities"`);
  }
  
  // Check employee count
  if (company.employeeCount === 2) {
    issues.push(`❌ Employee count is 2, which is incorrect for a major utility company`);
    recommendations.push(`Update employee count to actual value (likely 20,000+) or null if unknown`);
  }
  
  // Check domain vs data
  if (company.domain === 'southernco.com' || company.website?.includes('southernco.com')) {
    if (company.employeeCount === 2 || currentIndustry.includes('transportation')) {
      issues.push(`❌ Domain is correct (southernco.com) but data doesn't match major utility company`);
      recommendations.push(`Data should reflect that this is Southern Company, a major U.S. electric utility`);
    }
  }
  
  // Check for better data sources
  if (company.coreCompany && company.coreCompany.industry) {
    const coreIndustry = company.coreCompany.industry.toLowerCase();
    if (coreIndustry.includes('utilities') || coreIndustry.includes('energy') || coreIndustry.includes('electric')) {
      if (!currentIndustry.includes('utilities') && !currentIndustry.includes('energy')) {
        issues.push(`⚠️  Core company has correct industry (${company.coreCompany.industry}) but company record doesn't`);
        recommendations.push(`Update company.industry from coreCompany.industry: "${company.coreCompany.industry}"`);
      }
    }
    if (company.coreCompany.employeeCount && company.coreCompany.employeeCount > 100) {
      if (company.employeeCount === 2) {
        issues.push(`⚠️  Core company has employee count ${company.coreCompany.employeeCount} but company record has 2`);
        recommendations.push(`Update company.employeeCount from coreCompany.employeeCount: ${company.coreCompany.employeeCount}`);
      }
    }
  }
  
  if (coresignalData.industry) {
    const csIndustry = coresignalData.industry.toLowerCase();
    if (csIndustry.includes('utilities') || csIndustry.includes('energy') || csIndustry.includes('electric')) {
      if (!currentIndustry.includes('utilities') && !currentIndustry.includes('energy')) {
        issues.push(`⚠️  CoreSignal has correct industry (${coresignalData.industry}) but company record doesn't`);
        recommendations.push(`Update company.industry from CoreSignal: "${coresignalData.industry}"`);
      }
    }
    const csEmployees = coresignalData.employees_count || coresignalData.employee_count;
    if (csEmployees && csEmployees > 100) {
      if (company.employeeCount === 2) {
        issues.push(`⚠️  CoreSignal has employee count ${csEmployees} but company record has 2`);
        recommendations.push(`Update company.employeeCount from CoreSignal: ${csEmployees}`);
      }
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ No data issues detected');
  } else {
    console.log('ISSUES FOUND:');
    issues.forEach(issue => console.log(`  ${issue}`));
  }
  
  if (recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    recommendations.forEach(rec => console.log(`  • ${rec}`));
  }

  console.log('\n📋 SUMMARY:');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log(`Domain: ${company.domain || company.website || 'N/A'}`);
  console.log(`Current Industry: ${company.industry || 'N/A'}`);
  console.log(`Current Employee Count: ${company.employeeCount || 'N/A'}`);
  console.log(`Best Available Industry: ${company.coreCompany?.industry || coresignalData.industry || company.industry || 'N/A'}`);
  console.log(`Best Available Employee Count: ${company.coreCompany?.employeeCount || coresignalData.employees_count || coresignalData.employee_count || company.employeeCount || 'N/A'}`);
  
  const needsUpdate = issues.length > 0;
  console.log(`\n${needsUpdate ? '❌ DATA NEEDS UPDATE' : '✅ DATA LOOKS GOOD'}`);

  await prisma.$disconnect();
}

investigateSouthernCompany();

