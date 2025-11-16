/**
 * Ensure Best Database Data - Master Workflow
 * 
 * This comprehensive script ensures your database has the best possible data by:
 * 1. Auditing current data quality
 * 2. Syncing best available data from all sources to database records
 * 3. Regenerating intelligence with improved data
 * 
 * This ensures:
 * - Database records use the most reliable data sources
 * - Contact email domains update company domains
 * - Core company data is synced to workspace records
 * - CoreSignal data fills missing fields
 * - Intelligence uses the best available data
 * 
 * Usage:
 *   npx tsx scripts/ensure-best-database-data.ts [--workspace-id=WORKSPACE_ID] [--limit=N] [--skip-audit] [--skip-sync] [--skip-regenerate]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WorkflowStats {
  audit: {
    totalCompanies: number;
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
    criticalIssues: number;
  };
  sync: {
    companiesUpdated: number;
    fieldsUpdated: {
      industry: number;
      employeeCount: number;
      website: number;
      domain: number;
      description: number;
    };
  };
  regenerate: {
    companiesRegenerated: number;
    errors: number;
  };
}

async function ensureBestDatabaseData(
  workspaceId?: string,
  limit?: number,
  options: {
    skipAudit?: boolean;
    skipSync?: boolean;
    skipRegenerate?: boolean;
  } = {}
) {
  console.log('🎯 ENSURING BEST DATABASE DATA');
  console.log('='.repeat(80));
  console.log('\n📋 This workflow will:');
  console.log('   1. Audit current data quality');
  console.log('   2. Sync best available data to database records');
  console.log('   3. Regenerate intelligence with improved data\n');

  if (workspaceId) {
    console.log(`🎯 Workspace: ${workspaceId}\n`);
  }
  if (limit) {
    console.log(`📊 Limit: ${limit} companies\n`);
  }

  const stats: WorkflowStats = {
    audit: {
      totalCompanies: 0,
      highQuality: 0,
      mediumQuality: 0,
      lowQuality: 0,
      criticalIssues: 0
    },
    sync: {
      companiesUpdated: 0,
      fieldsUpdated: {
        industry: 0,
        employeeCount: 0,
        website: 0,
        domain: 0,
        description: 0
      }
    },
    regenerate: {
      companiesRegenerated: 0,
      errors: 0
    }
  };

  try {
    // STEP 1: Audit Data Quality
    if (!options.skipAudit) {
      console.log('\n' + '='.repeat(80));
      console.log('STEP 1: AUDITING DATA QUALITY');
      console.log('='.repeat(80) + '\n');

      const companies = await prisma.companies.findMany({
        where: {
          deletedAt: null,
          ...(workspaceId ? { workspaceId } : {})
        },
        select: {
          id: true,
          name: true,
          industry: true,
          employeeCount: true,
          website: true,
          domain: true,
          description: true,
          customFields: true,
          coreCompanyId: true,
          people: {
            where: { deletedAt: null },
            select: {
              email: true,
              workEmail: true
            },
            take: 50
          }
        },
        ...(limit ? { take: limit } : {})
      });

      stats.audit.totalCompanies = companies.length;
      let totalCompleteness = 0;

      for (const company of companies) {
        let score = 0;
        if (company.industry) score += 20;
        if (company.employeeCount) score += 20;
        if (company.website || company.domain) score += 15;
        if (company.description) score += 15;
        if (company.coreCompanyId) score += 10;
        if ((company.customFields as any)?.coresignalData) score += 10;
        if (company.people && company.people.length > 0) score += 10;

        totalCompleteness += score;

        if (score >= 80) stats.audit.highQuality++;
        else if (score >= 50) stats.audit.mediumQuality++;
        else stats.audit.lowQuality++;

        if (score < 50 || (!company.industry && !company.employeeCount)) {
          stats.audit.criticalIssues++;
        }
      }

      const avgCompleteness = totalCompleteness / companies.length;
      console.log(`📊 Data Quality Summary:`);
      console.log(`   Total Companies: ${stats.audit.totalCompanies}`);
      console.log(`   High Quality (≥80%): ${stats.audit.highQuality} (${((stats.audit.highQuality / stats.audit.totalCompanies) * 100).toFixed(1)}%)`);
      console.log(`   Medium Quality (50-79%): ${stats.audit.mediumQuality} (${((stats.audit.mediumQuality / stats.audit.totalCompanies) * 100).toFixed(1)}%)`);
      console.log(`   Low Quality (<50%): ${stats.audit.lowQuality} (${((stats.audit.lowQuality / stats.audit.totalCompanies) * 100).toFixed(1)}%)`);
      console.log(`   Critical Issues: ${stats.audit.criticalIssues} (${((stats.audit.criticalIssues / stats.audit.totalCompanies) * 100).toFixed(1)}%)`);
      console.log(`   Average Completeness: ${avgCompleteness.toFixed(1)}%\n`);
    }

    // STEP 2: Sync Best Data to Database
    if (!options.skipSync) {
      console.log('\n' + '='.repeat(80));
      console.log('STEP 2: SYNCING BEST DATA TO DATABASE');
      console.log('='.repeat(80) + '\n');

      // Import sync function logic (simplified version)
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
              industry: true,
              employeeCount: true,
              website: true,
              domain: true,
              description: true
            }
          },
          people: {
            where: { deletedAt: null },
            select: {
              email: true,
              workEmail: true
            },
            take: 50
          }
        },
        ...(limit ? { take: limit } : {})
      });

      console.log(`📊 Syncing best data for ${companies.length} companies...\n`);

      let processed = 0;
      for (const company of companies) {
        try {
          // Determine best data (simplified - full logic in sync script)
          const customFields = company.customFields as any || {};
          const coresignalData = customFields.coresignalData || {};
          const coreCompany = company.coreCompany;

          // Determine best industry
          let bestIndustry = company.industryOverride || coreCompany?.industry || company.industry || coresignalData.industry || company.sector;

          // Determine best employee count
          let bestEmployeeCount = coreCompany?.employeeCount || coresignalData.employees_count || company.employeeCount;

          // Determine best website/domain from contacts
          let bestDomain = company.domain;
          let bestWebsite = company.websiteOverride || company.website;
          
          if (company.people && company.people.length > 0) {
            const contactDomains = company.people
              .map((p: any) => {
                const emailAddr = p.workEmail || p.email;
                return emailAddr ? emailAddr.split('@')[1]?.toLowerCase() : null;
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
                bestDomain = mostCommonDomain;
                if (!bestWebsite || !bestWebsite.includes(mostCommonDomain)) {
                  bestWebsite = `https://${mostCommonDomain}`;
                }
              }
            }
          }

          // Determine best description
          let bestDescription = company.descriptionEnriched || coresignalData.description_enriched || coresignalData.description || coreCompany?.description || company.description;

          // Build updates
          const updates: any = {};
          if (bestIndustry && bestIndustry !== company.industry && !company.industryOverride) {
            updates.industry = bestIndustry;
            stats.sync.fieldsUpdated.industry++;
          }
          if (bestEmployeeCount && bestEmployeeCount !== company.employeeCount) {
            updates.employeeCount = bestEmployeeCount;
            stats.sync.fieldsUpdated.employeeCount++;
          }
          if (bestWebsite && bestWebsite !== company.website && !company.websiteOverride) {
            updates.website = bestWebsite;
            stats.sync.fieldsUpdated.website++;
          }
          if (bestDomain && bestDomain !== company.domain) {
            updates.domain = bestDomain;
            stats.sync.fieldsUpdated.domain++;
          }
          if (bestDescription && !company.descriptionEnriched && bestDescription !== company.description) {
            updates.description = bestDescription;
            stats.sync.fieldsUpdated.description++;
          }

          if (Object.keys(updates).length > 0) {
            await prisma.companies.update({
              where: { id: company.id },
              data: {
                ...updates,
                updatedAt: new Date()
              }
            });

            processed++;
            if (processed % 10 === 0) {
              process.stdout.write(`\r   Processed: ${processed}/${companies.length}`);
            }

            stats.sync.companiesUpdated++;
          }
        } catch (error) {
          console.error(`\n   ❌ Error syncing ${company.name}:`, error);
        }
      }

      console.log(`\n\n✅ Synced best data for ${stats.sync.companiesUpdated} companies`);
      console.log(`   Fields updated:`);
      console.log(`      Industry: ${stats.sync.fieldsUpdated.industry}`);
      console.log(`      Employee Count: ${stats.sync.fieldsUpdated.employeeCount}`);
      console.log(`      Website: ${stats.sync.fieldsUpdated.website}`);
      console.log(`      Domain: ${stats.sync.fieldsUpdated.domain}`);
      console.log(`      Description: ${stats.sync.fieldsUpdated.description}\n`);
    }

    // STEP 3: Regenerate Intelligence
    if (!options.skipRegenerate) {
      console.log('\n' + '='.repeat(80));
      console.log('STEP 3: REGENERATING INTELLIGENCE');
      console.log('='.repeat(80) + '\n');

      const companies = await prisma.companies.findMany({
        where: {
          deletedAt: null,
          ...(workspaceId ? { workspaceId } : {})
        },
        select: {
          id: true,
          customFields: true
        },
        ...(limit ? { take: limit } : {})
      });

      console.log(`🔄 Clearing cached intelligence for ${companies.length} companies...\n`);

      let processed = 0;
      for (const company of companies) {
        try {
          const customFields = (company.customFields as any) || {};
          if (customFields.intelligence) {
            delete customFields.intelligence;
            delete customFields.intelligenceVersion;
            delete customFields.intelligenceGeneratedAt;

            await prisma.companies.update({
              where: { id: company.id },
              data: {
                customFields: customFields,
                descriptionEnriched: null,
                updatedAt: new Date()
              }
            });

            processed++;
            if (processed % 10 === 0) {
              process.stdout.write(`\r   Processed: ${processed}/${companies.length}`);
            }

            stats.regenerate.companiesRegenerated++;
          }
        } catch (error) {
          console.error(`\n   ❌ Error regenerating ${company.id}:`, error);
          stats.regenerate.errors++;
        }
      }

      console.log(`\n\n✅ Cleared cached intelligence for ${stats.regenerate.companiesRegenerated} companies`);
      console.log(`   Intelligence will regenerate automatically when companies are viewed\n`);
    }

    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ WORKFLOW COMPLETE');
    console.log('='.repeat(80) + '\n');
    console.log('📊 Final Statistics:');
    console.log(`   Companies Audited: ${stats.audit.totalCompanies}`);
    console.log(`   Companies Updated: ${stats.sync.companiesUpdated}`);
    console.log(`   Intelligence Cleared: ${stats.regenerate.companiesRegenerated}`);
    console.log(`   Total Fields Updated: ${Object.values(stats.sync.fieldsUpdated).reduce((a, b) => a + b, 0)}\n`);

  } catch (error) {
    console.error('❌ Error during workflow:', error);
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
const skipAudit = args.includes('--skip-audit');
const skipSync = args.includes('--skip-sync');
const skipRegenerate = args.includes('--skip-regenerate');
const limit = limitArg ? parseInt(limitArg, 10) : undefined;

ensureBestDatabaseData(workspaceIdArg, limit, { skipAudit, skipSync, skipRegenerate })
  .then((stats) => {
    console.log('\n✅ All done! Your database now has the best available data.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

