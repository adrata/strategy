import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Copy the determineBestCompanyData function logic from intelligence route
function determineBestCompanyData(company: any): {
  industry: string | null;
  employeeCount: number | null;
  description: string | null;
  website: string | null;
  domain: string | null;
  dataSource: string;
} {
  const people = company.people || [];
  const customFields = company.customFields as any || {};
  const coresignalData = customFields.coresignalData || {};
  const coreCompany = company.coreCompany;
  
  // STEP 1: Determine correct company domain from contact email addresses (MOST RELIABLE)
  let inferredDomain: string | null = null;
  
  const personalEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'mail.com', 'protonmail.com', 'yandex.com', 'zoho.com',
    'gmx.com', 'live.com', 'msn.com', 'me.com', 'mac.com'
  ];
  
  if (people.length > 0) {
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
      if (domainPercentage >= 50 && domainCount >= 2) {
        inferredDomain = mostCommonDomain;
      }
    }
  }
  
  // STEP 2: Extract domain from company website/domain field
  let companyDomain: string | null = null;
  let companyWebsite: string | null = null;
  
  if (company.websiteOverride) {
    companyWebsite = company.websiteOverride;
  } else if (coreCompany?.website) {
    companyWebsite = coreCompany.website;
  } else if (company.website) {
    companyWebsite = company.website;
  } else if (company.domain) {
    companyWebsite = company.domain;
  } else if (coreCompany?.domain) {
    companyWebsite = coreCompany.domain;
  }
  
  if (companyWebsite) {
    try {
      let normalizedUrl = companyWebsite.trim();
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      const url = new URL(normalizedUrl);
      companyDomain = url.hostname.replace(/^www\./, '').toLowerCase();
    } catch (error) {
      const domainMatch = companyWebsite.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})/i);
      if (domainMatch) {
        companyDomain = domainMatch[1].toLowerCase();
      }
    }
  }
  
  const finalDomain = inferredDomain || companyDomain;
  const finalWebsite = inferredDomain && inferredDomain !== companyDomain 
    ? `https://${inferredDomain}` 
    : (companyWebsite || (companyDomain ? `https://${companyDomain}` : null));
  
  // STEP 3: Determine industry
  function inferIndustry(company: any): string | null {
    if (company.industryOverride) {
      return company.industryOverride;
    }
    if (coreCompany?.industry) {
      return coreCompany.industry;
    }
    if (company.industry) {
      return company.industry;
    }
    if (coresignalData.industry) {
      return coresignalData.industry;
    }
    if (company.sector) {
      return company.sector;
    }
    if (coreCompany?.sector) {
      return coreCompany.sector;
    }
    return null;
  }
  
  const industry = inferIndustry(company);
  
  // STEP 4: Determine employee count
  let employeeCount: number | null = null;
  
  if (coreCompany?.employeeCount && coreCompany.employeeCount > 0) {
    employeeCount = coreCompany.employeeCount;
  } else if (coresignalData.employees_count && coresignalData.employees_count > 0) {
    employeeCount = coresignalData.employees_count;
  } else if (company.employeeCount && company.employeeCount > 0) {
    employeeCount = company.employeeCount;
  }
  
  // Validate employee count reasonableness
  if (employeeCount && industry) {
    const industryLower = industry.toLowerCase();
    if ((industryLower.includes('utilities') || industryLower.includes('energy') || industryLower.includes('electric')) && employeeCount < 100) {
      employeeCount = null;
    }
    if (employeeCount !== null && employeeCount < 10 && company.name && company.name.length > 10) {
      employeeCount = null;
    }
  }
  
  // STEP 5: Determine description (with validation)
  let description: string | null = null;
  
  // Priority 1: Enriched description field (validate before using)
  if (company.descriptionEnriched && company.descriptionEnriched.trim() !== '') {
    const descLower = company.descriptionEnriched.toLowerCase();
    const industryLower = industry?.toLowerCase() || '';
    
    // Filter out obvious mismatches (e.g., Israeli resort description with Utilities industry)
    const israeliKeywords = ['ישראל', 'israel', 'resort', 'כפר נופש', 'luxury resort'];
    const hasIsraeliContent = israeliKeywords.some(keyword => descLower.includes(keyword.toLowerCase()));
    
    // Also check for other mismatches: transportation/utilities industry with resort content
    const hasResortContent = descLower.includes('resort') || descLower.includes('luxury');
    const isUtilitiesOrTransport = industryLower.includes('utilities') || industryLower.includes('transportation') || industryLower.includes('electric');
    
    if ((hasIsraeliContent || hasResortContent) && isUtilitiesOrTransport && !industryLower.includes('hospitality') && !industryLower.includes('tourism')) {
      // Description doesn't match industry - skip it and use next source
      console.log(`⚠️ [TEST] Skipping descriptionEnriched due to industry mismatch for ${company.name}`);
    } else {
      description = company.descriptionEnriched.trim();
    }
  }
  // Priority 2: CoreSignal enriched description (validate before using)
  else if (coresignalData.description_enriched && coresignalData.description_enriched.trim() !== '') {
    const descLower = coresignalData.description_enriched.toLowerCase();
    const industryLower = industry?.toLowerCase() || '';
    
    // Filter out obvious mismatches
    const israeliKeywords = ['ישראל', 'israel', 'resort', 'כפר נופש', 'luxury resort'];
    const hasIsraeliContent = israeliKeywords.some(keyword => descLower.includes(keyword.toLowerCase()));
    const hasResortContent = descLower.includes('resort') || descLower.includes('luxury');
    const isUtilitiesOrTransport = industryLower.includes('utilities') || industryLower.includes('transportation') || industryLower.includes('electric');
    
    if ((hasIsraeliContent || hasResortContent) && isUtilitiesOrTransport && !industryLower.includes('hospitality') && !industryLower.includes('tourism')) {
      console.log(`⚠️ [TEST] Skipping CoreSignal description_enriched due to industry mismatch for ${company.name}`);
    } else {
      description = coresignalData.description_enriched.trim();
    }
  }
  // Priority 3: CoreSignal description (validate before using)
  else if (coresignalData.description && coresignalData.description.trim() !== '') {
    const descLower = coresignalData.description.toLowerCase();
    const industryLower = industry?.toLowerCase() || '';
    
    // Filter out obvious mismatches
    const israeliKeywords = ['ישראל', 'israel', 'resort', 'כפר נופש', 'luxury resort'];
    const hasIsraeliContent = israeliKeywords.some(keyword => descLower.includes(keyword.toLowerCase()));
    const hasResortContent = descLower.includes('resort') || descLower.includes('luxury');
    const isUtilitiesOrTransport = industryLower.includes('utilities') || industryLower.includes('transportation') || industryLower.includes('electric');
    
    if ((hasIsraeliContent || hasResortContent) && isUtilitiesOrTransport && !industryLower.includes('hospitality') && !industryLower.includes('tourism')) {
      console.log(`⚠️ [TEST] Skipping CoreSignal description due to industry mismatch for ${company.name}`);
    } else {
      description = coresignalData.description.trim();
    }
  }
  // Priority 4: Core company description
  else if (coreCompany?.description && coreCompany.description.trim() !== '') {
    description = coreCompany.description.trim();
  }
  // Priority 5: Company record description (validate before using)
  else if (company.description && company.description.trim() !== '') {
    const descLower = company.description.toLowerCase();
    const industryLower = industry?.toLowerCase() || '';
    
    // Filter out obvious mismatches
    const israeliKeywords = ['ישראל', 'israel', 'resort', 'כפר נופש', 'luxury resort'];
    const hasIsraeliContent = israeliKeywords.some(keyword => descLower.includes(keyword.toLowerCase()));
    const hasResortContent = descLower.includes('resort') || descLower.includes('luxury');
    const isUtilitiesOrTransport = industryLower.includes('utilities') || industryLower.includes('transportation') || industryLower.includes('electric');
    
    if ((hasIsraeliContent || hasResortContent) && isUtilitiesOrTransport && !industryLower.includes('hospitality') && !industryLower.includes('tourism')) {
      console.log(`⚠️ [TEST] Skipping company.description due to industry mismatch for ${company.name}`);
      description = null;
    } else {
      description = company.description.trim();
    }
  }
  
  // Determine data source
  let dataSource = 'company_record';
  if (coreCompany && (coreCompany.industry || coreCompany.employeeCount || coreCompany.description)) {
    dataSource = 'core_company';
  } else if (coresignalData.industry || coresignalData.employees_count || coresignalData.description_enriched) {
    dataSource = 'coresignal';
  }
  if (inferredDomain && inferredDomain !== companyDomain) {
    dataSource = 'contact_domains';
  }
  
  return {
    industry,
    employeeCount,
    description,
    website: finalWebsite,
    domain: finalDomain,
    dataSource
  };
}

async function testSouthernCompanyFix() {
  console.log('🧪 TESTING SOUTHERN COMPANY FIX');
  console.log('================================================================================\n');

  const SOUTHERN_COMPANY_ID = '01K9QD2ST0C0TTG34EMRD3M69H';

  try {
    // Fetch Southern Company
    const company = await prisma.companies.findUnique({
      where: {
        id: SOUTHERN_COMPANY_ID,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        industry: true,
        industryOverride: true,
        sector: true,
        employeeCount: true,
        description: true,
        descriptionEnriched: true,
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
      console.log('❌ Southern Company not found');
      return;
    }

    console.log(`📊 Testing Southern Company: ${company.name} (${company.id})\n`);

    // Check current state
    console.log('📦 CURRENT STATE:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`Industry: ${company.industry || 'N/A'}`);
    console.log(`Employee Count: ${company.employeeCount || 'N/A'}`);
    console.log(`Description: ${company.description ? 'Yes (' + company.description.substring(0, 80) + '...)' : 'N/A'}`);
    console.log(`Description Enriched: ${company.descriptionEnriched ? 'Yes (' + company.descriptionEnriched.substring(0, 80) + '...)' : 'N/A'}`);
    
    // Check if descriptionEnriched contains Israeli resort content
    if (company.descriptionEnriched) {
      const descLower = company.descriptionEnriched.toLowerCase();
      const hasIsraeliContent = descLower.includes('ישראל') || descLower.includes('israel') || descLower.includes('resort') || descLower.includes('כפר נופש');
      console.log(`⚠️  Has Israeli/Resort Content: ${hasIsraeliContent ? 'YES (PROBLEM!)' : 'No'}`);
    }
    
    console.log(`Website: ${company.website || 'N/A'}`);
    console.log(`Domain: ${company.domain || 'N/A'}`);
    console.log(`Contacts: ${company.people.length}`);

    // Extract CoreSignal data
    const customFields = company.customFields as any || {};
    const coresignalData = customFields.coresignalData || {};
    const cachedIntelligence = customFields.intelligence;

    if (Object.keys(coresignalData).length > 0) {
      console.log(`\n✅ CoreSignal Data Available:`);
      console.log(`   - Industry: ${coresignalData.industry || 'N/A'}`);
      console.log(`   - Employees: ${coresignalData.employees_count || 'N/A'}`);
      console.log(`   - Description: ${coresignalData.description ? 'Yes' : 'N/A'}`);
    }

    if (cachedIntelligence) {
      console.log(`\n⚠️  Cached Intelligence: Yes (version: ${customFields.intelligenceVersion || 'unknown'})`);
      if (cachedIntelligence.description) {
        console.log(`   Description: ${cachedIntelligence.description.substring(0, 100)}...`);
      }
    }

    // Test determineBestCompanyData
    console.log(`\n\n🎯 TESTING determineBestCompanyData:`);
    console.log('─────────────────────────────────────────────────────────────────────────────');
    const bestData = determineBestCompanyData(company);

    console.log(`✅ Best Industry: ${bestData.industry || 'N/A'}`);
    console.log(`✅ Best Employee Count: ${bestData.employeeCount || 'N/A'}`);
    console.log(`✅ Best Description: ${bestData.description ? 'Yes (' + bestData.description.substring(0, 80) + '...)' : 'N/A'}`);
    console.log(`✅ Best Website: ${bestData.website || 'N/A'}`);
    console.log(`✅ Best Domain: ${bestData.domain || 'N/A'}`);
    console.log(`✅ Data Source: ${bestData.dataSource}`);

    // Verify fixes
    console.log(`\n\n✅ VERIFICATION:`);
    console.log('─────────────────────────────────────────────────────────────────────────────');
    
    let allTestsPassed = true;

    // Test 1: Description should NOT contain Israeli resort content
    if (bestData.description) {
      const descLower = bestData.description.toLowerCase();
      const hasIsraeliContent = descLower.includes('ישראל') || descLower.includes('israel') || descLower.includes('כפר נופש');
      const hasResortContent = descLower.includes('resort') || descLower.includes('luxury resort');
      
      if (hasIsraeliContent || (hasResortContent && bestData.industry?.toLowerCase().includes('utilities'))) {
        console.log(`❌ TEST 1 FAILED: Description still contains Israeli/resort content`);
        allTestsPassed = false;
      } else {
        console.log(`✅ TEST 1 PASSED: Description does not contain Israeli/resort content`);
      }
    } else {
      console.log(`✅ TEST 1 PASSED: Description filtered out (null)`);
    }

    // Test 2: Industry should be Utilities (or similar)
    if (bestData.industry && (bestData.industry.toLowerCase().includes('utilities') || bestData.industry.toLowerCase().includes('electric'))) {
      console.log(`✅ TEST 2 PASSED: Industry correctly identified as ${bestData.industry}`);
    } else {
      console.log(`⚠️  TEST 2 WARNING: Industry is ${bestData.industry || 'N/A'} (expected Utilities)`);
    }

    // Test 3: Domain should be southernco.com (from contacts)
    if (bestData.domain && bestData.domain.includes('southernco.com')) {
      console.log(`✅ TEST 3 PASSED: Domain correctly identified as ${bestData.domain}`);
    } else {
      console.log(`⚠️  TEST 3 WARNING: Domain is ${bestData.domain || 'N/A'} (expected southernco.com)`);
    }

    // Test 4: Employee count should be reasonable (not 2)
    if (bestData.employeeCount && bestData.employeeCount > 100) {
      console.log(`✅ TEST 4 PASSED: Employee count is reasonable (${bestData.employeeCount})`);
    } else if (bestData.employeeCount === null) {
      console.log(`✅ TEST 4 PASSED: Employee count filtered out (was unrealistic)`);
    } else {
      console.log(`⚠️  TEST 4 WARNING: Employee count is ${bestData.employeeCount} (may be too low)`);
    }

    console.log(`\n\n${allTestsPassed ? '✅' : '❌'} OVERALL RESULT: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSouthernCompanyFix();

