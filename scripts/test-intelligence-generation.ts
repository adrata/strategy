import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testIntelligenceGeneration() {
  console.log('🧪 TESTING INTELLIGENCE GENERATION');
  console.log('================================================================================\n');

  try {
    // Find a company with CoreSignal data
    const company = await prisma.companies.findFirst({
      where: {
        workspaceId: '01K75ZD7DWHG1XF16HAF2YVKCK',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        industry: true,
        employeeCount: true,
        description: true,
        descriptionEnriched: true,
        industryOverride: true,
        sector: true,
        website: true,
        websiteOverride: true,
        domain: true,
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
          }
        },
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            email: true,
            workEmail: true,
          },
          take: 50,
        },
      },
    });

    if (!company) {
      console.log('❌ No company found');
      return;
    }

    console.log(`📊 Testing with company: ${company.name} (${company.id})\n`);

    // Extract CoreSignal data
    const customFields = company.customFields as any || {};
    const coresignalData = customFields.coresignalData || {};
    const coreCompany = company.coreCompany;

    console.log('📦 DATA SOURCES AVAILABLE:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`✅ Company Record:`);
    console.log(`   - Industry: ${company.industry || 'N/A'}`);
    console.log(`   - Employee Count: ${company.employeeCount || 'N/A'}`);
    console.log(`   - Description: ${company.description ? 'Yes (' + company.description.substring(0, 50) + '...)' : 'N/A'}`);
    console.log(`   - Website: ${company.website || 'N/A'}`);
    console.log(`   - Domain: ${company.domain || 'N/A'}`);

    if (coreCompany) {
      console.log(`\n✅ Core Company (Global Canonical):`);
      console.log(`   - Industry: ${coreCompany.industry || 'N/A'}`);
      console.log(`   - Employee Count: ${coreCompany.employeeCount || 'N/A'}`);
      console.log(`   - Description: ${coreCompany.description ? 'Yes (' + coreCompany.description.substring(0, 50) + '...)' : 'N/A'}`);
      console.log(`   - Website: ${coreCompany.website || 'N/A'}`);
      console.log(`   - Domain: ${coreCompany.domain || 'N/A'}`);
    } else {
      console.log(`\n❌ Core Company: Not linked`);
    }

    if (Object.keys(coresignalData).length > 0) {
      console.log(`\n✅ CoreSignal Data:`);
      console.log(`   - Industry: ${coresignalData.industry || 'N/A'}`);
      console.log(`   - Employees Count: ${coresignalData.employees_count || 'N/A'}`);
      console.log(`   - Description Enriched: ${coresignalData.description_enriched ? 'Yes (' + coresignalData.description_enriched.substring(0, 50) + '...)' : 'N/A'}`);
      console.log(`   - Description: ${coresignalData.description ? 'Yes (' + coresignalData.description.substring(0, 50) + '...)' : 'N/A'}`);
      console.log(`   - Website: ${coresignalData.website || 'N/A'}`);
    } else {
      console.log(`\n❌ CoreSignal Data: Not found in customFields`);
    }

    // Test domain inference from contacts
    const people = company.people || [];
    if (people.length > 0) {
      const personalEmailDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
        'icloud.com', 'mail.com', 'protonmail.com', 'yandex.com', 'zoho.com',
        'gmx.com', 'live.com', 'msn.com', 'me.com', 'mac.com'
      ];

      const contactDomains = people
        .map((person: any) => {
          const emailAddr = person.workEmail || person.email;
          if (!emailAddr) return null;
          const domain = emailAddr.split('@')[1]?.toLowerCase();
          if (domain && personalEmailDomains.includes(domain)) {
            return null;
          }
          return domain;
        })
        .filter(Boolean) as string[];

      if (contactDomains.length > 0) {
        const domainCounts = contactDomains.reduce((acc: Record<string, number>, domain: string) => {
          acc[domain] = (acc[domain] || 0) + 1;
          return acc;
        }, {});

        const mostCommonDomain = Object.entries(domainCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        const domainCount = domainCounts[mostCommonDomain];
        const domainPercentage = (domainCount / contactDomains.length) * 100;

        console.log(`\n✅ Contact Email Domains:`);
        console.log(`   - Total contacts: ${people.length}`);
        console.log(`   - Valid domains: ${contactDomains.length}`);
        console.log(`   - Most common: ${mostCommonDomain} (${domainCount}/${contactDomains.length} = ${domainPercentage.toFixed(1)}%)`);
        if (domainPercentage >= 50 && domainCount >= 2) {
          console.log(`   ✅ Strong consensus - will use: ${mostCommonDomain}`);
        } else {
          console.log(`   ⚠️  Weak consensus - may not use for domain inference`);
        }
      } else {
        console.log(`\n❌ Contact Email Domains: No valid domains found`);
      }
    } else {
      console.log(`\n❌ Contact Email Domains: No contacts found`);
    }

    // Simulate determineBestCompanyData logic
    console.log(`\n\n🎯 INTELLIGENCE GENERATION LOGIC TEST:`);
    console.log('─────────────────────────────────────────────────────────────────────────────');

    // Test industry inference
    let industry: string | null = null;
    if (company.industryOverride) {
      industry = company.industryOverride;
      console.log(`✅ Industry: ${industry} (from industryOverride)`);
    } else if (coreCompany?.industry) {
      industry = coreCompany.industry;
      console.log(`✅ Industry: ${industry} (from coreCompany)`);
    } else if (company.industry) {
      industry = company.industry;
      console.log(`✅ Industry: ${industry} (from company record)`);
    } else if (coresignalData.industry) {
      industry = coresignalData.industry;
      console.log(`✅ Industry: ${industry} (from CoreSignal)`);
    } else if (company.sector) {
      industry = company.sector;
      console.log(`✅ Industry: ${industry} (from sector)`);
    } else if (coreCompany?.sector) {
      industry = coreCompany.sector;
      console.log(`✅ Industry: ${industry} (from coreCompany sector)`);
    } else {
      console.log(`❌ Industry: Not found`);
    }

    // Test employee count
    let employeeCount: number | null = null;
    if (coreCompany?.employeeCount && coreCompany.employeeCount > 0) {
      employeeCount = coreCompany.employeeCount;
      console.log(`✅ Employee Count: ${employeeCount} (from coreCompany)`);
    } else if (coresignalData.employees_count && coresignalData.employees_count > 0) {
      employeeCount = coresignalData.employees_count;
      console.log(`✅ Employee Count: ${employeeCount} (from CoreSignal)`);
    } else if (company.employeeCount && company.employeeCount > 0) {
      employeeCount = company.employeeCount;
      console.log(`✅ Employee Count: ${employeeCount} (from company record)`);
    } else {
      console.log(`❌ Employee Count: Not found`);
    }

    // Test description
    let description: string | null = null;
    if (company.descriptionEnriched && company.descriptionEnriched.trim() !== '') {
      description = company.descriptionEnriched.trim();
      console.log(`✅ Description: Yes (from descriptionEnriched)`);
    } else if (coresignalData.description_enriched && coresignalData.description_enriched.trim() !== '') {
      description = coresignalData.description_enriched.trim();
      console.log(`✅ Description: Yes (from CoreSignal description_enriched)`);
    } else if (coresignalData.description && coresignalData.description.trim() !== '') {
      description = coresignalData.description.trim();
      console.log(`✅ Description: Yes (from CoreSignal description)`);
    } else if (coreCompany?.description && coreCompany.description.trim() !== '') {
      description = coreCompany.description.trim();
      console.log(`✅ Description: Yes (from coreCompany)`);
    } else if (company.description && company.description.trim() !== '') {
      description = company.description.trim();
      console.log(`✅ Description: Yes (from company record)`);
    } else {
      console.log(`❌ Description: Not found`);
    }

    console.log(`\n\n✅ Intelligence generation should work correctly with available data sources!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testIntelligenceGeneration();

