/**
 * Sync Best Available Data to Database Records
 * 
 * This script uses the intelligent data prioritization logic to update
 * company database records with the best available data from all sources:
 * - Contact email domains (most reliable)
 * - Core company data (global canonical)
 * - CoreSignal enrichment data
 * - Override fields (manual corrections)
 * 
 * It ensures database records have the highest quality data available.
 * 
 * Usage:
 *   npx tsx scripts/sync-best-data-to-database.ts [--workspace-id=WORKSPACE_ID] [--limit=N] [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SyncStats {
  totalCompanies: number;
  companiesUpdated: number;
  fieldsUpdated: {
    industry: number;
    employeeCount: number;
    website: number;
    domain: number;
    description: number;
  };
  errors: number;
}

/**
 * Intelligently determine the best available company data from multiple sources
 * (Same logic as intelligence route)
 */
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
  
  // Common personal email domains to exclude
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
        // Filter out personal email domains
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
      
      // Use contact domain if we have strong consensus (at least 50% of contacts)
      // AND we have at least 2 contacts with this domain (to avoid single contact errors)
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
  let industry: string | null = null;
  if (company.industryOverride && company.industryOverride.trim() !== '') {
    industry = company.industryOverride.trim();
  } else if (coreCompany?.industry && coreCompany.industry.trim() !== '') {
    industry = coreCompany.industry.trim();
  } else if (company.industry && company.industry.trim() !== '') {
    industry = company.industry.trim();
  } else if (coresignalData.industry && coresignalData.industry.trim() !== '') {
    industry = coresignalData.industry.trim();
  } else if (company.sector && company.sector.trim() !== '') {
    industry = company.sector.trim();
  } else if (coreCompany?.sector && coreCompany.sector.trim() !== '') {
    industry = coreCompany.sector.trim();
  }
  
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
  
  // STEP 5: Determine description
  let description: string | null = null;
  if (company.descriptionEnriched && company.descriptionEnriched.trim() !== '') {
    description = company.descriptionEnriched.trim();
  } else if (coresignalData.description_enriched && coresignalData.description_enriched.trim() !== '') {
    description = coresignalData.description_enriched.trim();
  } else if (coresignalData.description && coresignalData.description.trim() !== '') {
    description = coresignalData.description.trim();
  } else if (coreCompany?.description && coreCompany.description.trim() !== '') {
    description = coreCompany.description.trim();
  } else if (company.description && company.description.trim() !== '') {
    const descLower = company.description.toLowerCase();
    const industryLower = industry?.toLowerCase() || '';
    const israeliKeywords = ['ישראל', 'israel', 'resort', 'כפר נופש', 'luxury resort'];
    const hasIsraeliContent = israeliKeywords.some(keyword => descLower.includes(keyword.toLowerCase()));
    
    if (!(hasIsraeliContent && !industryLower.includes('hospitality') && !industryLower.includes('tourism') && !industryLower.includes('resort'))) {
      description = company.description.trim();
    }
  }
  
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

async function syncBestDataToDatabase(workspaceId?: string, limit?: number, dryRun: boolean = false) {
  console.log('🔄 SYNCING BEST DATA TO DATABASE');
  console.log('='.repeat(80));
  console.log('\n📋 This will update company database records with best available data from:');
  console.log('   ✅ Contact email domains (most reliable)');
  console.log('   ✅ Core company data (global canonical)');
  console.log('   ✅ CoreSignal enrichment data');
  console.log('   ✅ Override fields (manual corrections)\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be saved\n');
  }

  if (workspaceId) {
    console.log(`🎯 Workspace: ${workspaceId}\n`);
  }
  if (limit) {
    console.log(`📊 Limit: ${limit} companies\n`);
  }

  const stats: SyncStats = {
    totalCompanies: 0,
    companiesUpdated: 0,
    fieldsUpdated: {
      industry: 0,
      employeeCount: 0,
      website: 0,
      domain: 0,
      description: 0
    },
    errors: 0
  };

  try {
    console.log('📊 Fetching companies...\n');
    
    // Exclude demo workspaces
    const demoWorkspaceIds = [
      '01K74N79PCW5W8D9X6EK7KJANM', // demo
      '01K7464TNANHQXPCZT1FYX205V', // adrata (demo)
    ];
    
    const whereClause: any = {
      deletedAt: null,
      workspaceId: {
        notIn: demoWorkspaceIds
      }
    };
    
    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    }
    
    const companies = await prisma.companies.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        industry: true,
        industryOverride: true,
        sector: true,
        employeeCount: true,
        website: true,
        websiteOverride: true,
        domain: true,
        description: true,
        descriptionEnriched: true,
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
            domain: true
          }
        },
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            email: true,
            workEmail: true
          },
          take: 50
        }
      },
      ...(limit ? { take: limit } : {})
    });

    stats.totalCompanies = companies.length;
    console.log(`✅ Found ${stats.totalCompanies} companies\n`);

    if (companies.length === 0) {
      console.log('✅ No companies found!\n');
      return;
    }

    console.log('🔄 Syncing best data to database...\n');
    let processed = 0;
    let debugCount = 0;

    for (const company of companies) {
      try {
        const bestData = determineBestCompanyData(company);
        const updates: any = {};
        let hasUpdates = false;
        
        // Debug: Show first few companies
        if (debugCount < 3) {
          console.log(`\n   🔍 Debug ${company.name}:`);
          console.log(`      Current: industry=${company.industry || 'null'}, domain=${company.domain || 'null'}, website=${company.website || 'null'}`);
          console.log(`      Best: industry=${bestData.industry || 'null'}, domain=${bestData.domain || 'null'}, website=${bestData.website || 'null'}`);
          console.log(`      Source: ${bestData.dataSource}`);
          debugCount++;
        }

        // Update industry if better data available (from CoreSignal or Core Company)
        // Always update if missing, or if source is better (CoreSignal/CoreCompany)
        if (bestData.industry && bestData.industry !== company.industry && !company.industryOverride) {
          const isBetterSource = bestData.dataSource === 'coresignal' || bestData.dataSource === 'core_company';
          // Update if missing OR if source is better (even if current exists)
          if (!company.industry || isBetterSource) {
            updates.industry = bestData.industry;
            stats.fieldsUpdated.industry++;
            hasUpdates = true;
            if (debugCount < 3) {
              console.log(`      → Updating industry: "${company.industry}" → "${bestData.industry}" (source: ${bestData.dataSource})`);
            }
          }
        }

        // Update employee count if better data available
        // Always update if missing, unrealistic, or source is better
        if (bestData.employeeCount !== null && bestData.employeeCount !== company.employeeCount) {
          const isBetterSource = bestData.dataSource === 'coresignal' || bestData.dataSource === 'core_company';
          const currentIsUnrealistic = company.employeeCount !== null && company.employeeCount < 10;
          
          if (!company.employeeCount || currentIsUnrealistic || isBetterSource) {
            updates.employeeCount = bestData.employeeCount;
            stats.fieldsUpdated.employeeCount++;
            hasUpdates = true;
            if (debugCount < 3) {
              console.log(`      → Updating employeeCount: ${company.employeeCount} → ${bestData.employeeCount} (source: ${bestData.dataSource})`);
            }
          }
        }

        // Update website if better data available (especially from contact domains)
        // Normalize URLs for comparison
        const normalizeUrl = (url: string | null) => {
          if (!url) return null;
          return url.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
        };
        
        const currentWebsiteNormalized = normalizeUrl(company.website);
        const bestWebsiteNormalized = normalizeUrl(bestData.website);
        
        if (bestData.website && bestWebsiteNormalized !== currentWebsiteNormalized && !company.websiteOverride) {
          const isContactDomainSource = bestData.dataSource === 'contact_domains';
          
          if (!company.website || isContactDomainSource) {
            updates.website = bestData.website;
            stats.fieldsUpdated.website++;
            hasUpdates = true;
          }
        }

        // Update domain if better data available (especially from contact domains)
        if (bestData.domain && bestData.domain !== company.domain) {
          const isContactDomainSource = bestData.dataSource === 'contact_domains';
          
          if (!company.domain || isContactDomainSource) {
            updates.domain = bestData.domain;
            stats.fieldsUpdated.domain++;
            hasUpdates = true;
          }
        }

        // Validate and clear descriptionEnriched if it contains bad data
        if (company.descriptionEnriched && company.descriptionEnriched.trim() !== '') {
          const descLower = company.descriptionEnriched.toLowerCase();
          const industryLower = bestData.industry?.toLowerCase() || '';
          
          // Check for Israeli/resort content mismatches
          const israeliKeywords = ['ישראל', 'israel', 'resort', 'כפר נופש', 'luxury resort'];
          const hasIsraeliContent = israeliKeywords.some(keyword => descLower.includes(keyword.toLowerCase()));
          const hasResortContent = descLower.includes('resort') || descLower.includes('luxury');
          const isUtilitiesOrTransport = industryLower.includes('utilities') || industryLower.includes('transportation') || industryLower.includes('electric');
          
          if ((hasIsraeliContent || hasResortContent) && isUtilitiesOrTransport && !industryLower.includes('hospitality') && !industryLower.includes('tourism')) {
            // Clear bad descriptionEnriched
            updates.descriptionEnriched = null;
            stats.fieldsUpdated.descriptionEnriched = (stats.fieldsUpdated.descriptionEnriched || 0) + 1;
            hasUpdates = true;
            if (debugCount < 3) {
              console.log(`      → Clearing bad descriptionEnriched (contains Israeli/resort content)`);
            }
          }
        }

        // Update description if better data available (but only if descriptionEnriched was cleared or doesn't exist)
        if (bestData.description && (!company.descriptionEnriched || updates.descriptionEnriched === null) && bestData.description !== company.description) {
          const isBetterSource = bestData.dataSource === 'coresignal' || bestData.dataSource === 'core_company';
          
          if (!company.description || isBetterSource) {
            updates.description = bestData.description;
            stats.fieldsUpdated.description++;
            hasUpdates = true;
          }
        }

        if (hasUpdates) {
          if (!dryRun) {
            await prisma.companies.update({
              where: { id: company.id },
              data: {
                ...updates,
                updatedAt: new Date()
              }
            });
          }

          processed++;
          if (processed % 10 === 0) {
            process.stdout.write(`\r   Processed: ${processed}/${companies.length}`);
          }

          stats.companiesUpdated++;
          
          if (processed <= 5) {
            console.log(`\n   ✅ ${company.name}:`);
            if (updates.industry) console.log(`      Industry: ${company.industry} → ${updates.industry} (${bestData.dataSource})`);
            if (updates.employeeCount) console.log(`      Employee Count: ${company.employeeCount} → ${updates.employeeCount} (${bestData.dataSource})`);
            if (updates.website) console.log(`      Website: ${company.website} → ${updates.website} (${bestData.dataSource})`);
            if (updates.domain) console.log(`      Domain: ${company.domain} → ${updates.domain} (${bestData.dataSource})`);
            if (updates.description) console.log(`      Description: Updated (${bestData.dataSource})`);
            if (updates.descriptionEnriched === null) console.log(`      Description Enriched: Cleared (bad data)`);
          }
        }
      } catch (error) {
        console.error(`\n   ❌ Error syncing ${company.name}:`, error);
        stats.errors++;
      }
    }

    console.log(`\n\n✅ Successfully synced best data for ${stats.companiesUpdated} companies`);
    console.log(`   Fields updated:`);
    console.log(`      Industry: ${stats.fieldsUpdated.industry}`);
    console.log(`      Employee Count: ${stats.fieldsUpdated.employeeCount}`);
    console.log(`      Website: ${stats.fieldsUpdated.website}`);
    console.log(`      Domain: ${stats.fieldsUpdated.domain}`);
    console.log(`      Description: ${stats.fieldsUpdated.description}`);
    if (stats.fieldsUpdated.descriptionEnriched) {
      console.log(`      Description Enriched: ${stats.fieldsUpdated.descriptionEnriched} cleared`);
    }
    console.log(`   Errors: ${stats.errors}\n`);

  } catch (error) {
    console.error('❌ Error during sync:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

// Main execution
const args = process.argv.slice(2);
const workspaceIdArg = args.find(arg => arg.startsWith('--workspace-id='))?.split('=')[1];
const limitArg = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
const dryRun = args.includes('--dry-run');
const limit = limitArg ? parseInt(limitArg, 10) : undefined;

syncBestDataToDatabase(workspaceIdArg, limit, dryRun)
  .then((stats) => {
    if (stats) {
      console.log('\n📊 Final Statistics:');
      console.log(`   Total companies: ${stats.totalCompanies}`);
      console.log(`   Companies updated: ${stats.companiesUpdated}`);
      console.log(`   Errors: ${stats.errors}\n`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

