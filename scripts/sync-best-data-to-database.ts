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
  if (people.length > 0) {
    const contactDomains = people
      .map((person: any) => {
        const emailAddr = person.workEmail || person.email;
        if (!emailAddr) return null;
        return emailAddr.split('@')[1]?.toLowerCase();
      })
      .filter(Boolean) as string[];
    
    if (contactDomains.length > 0) {
      const domainCounts = contactDomains.reduce((acc: Record<string, number>, domain: string) => {
        acc[domain] = (acc[domain] || 0) + 1;
        return acc;
      }, {});
      
      const mostCommonDomain = Object.entries(domainCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      
      const domainPercentage = (domainCounts[mostCommonDomain] / contactDomains.length) * 100;
      if (domainPercentage >= 50) {
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
    const companies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
        ...(workspaceId ? { workspaceId } : {})
      },
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

    for (const company of companies) {
      try {
        const bestData = determineBestCompanyData(company);
        const updates: any = {};
        let hasUpdates = false;

        // Update industry if better data available
        if (bestData.industry && bestData.industry !== company.industry && !company.industryOverride) {
          updates.industry = bestData.industry;
          stats.fieldsUpdated.industry++;
          hasUpdates = true;
        }

        // Update employee count if better data available
        if (bestData.employeeCount !== null && bestData.employeeCount !== company.employeeCount) {
          updates.employeeCount = bestData.employeeCount;
          stats.fieldsUpdated.employeeCount++;
          hasUpdates = true;
        }

        // Update website if better data available
        if (bestData.website && bestData.website !== company.website && !company.websiteOverride) {
          updates.website = bestData.website;
          stats.fieldsUpdated.website++;
          hasUpdates = true;
        }

        // Update domain if better data available
        if (bestData.domain && bestData.domain !== company.domain) {
          updates.domain = bestData.domain;
          stats.fieldsUpdated.domain++;
          hasUpdates = true;
        }

        // Update description if better data available (but not if we have descriptionEnriched)
        if (bestData.description && !company.descriptionEnriched && bestData.description !== company.description) {
          updates.description = bestData.description;
          stats.fieldsUpdated.description++;
          hasUpdates = true;
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

