/**
 * Audit Company Data Quality
 * 
 * This script audits company data quality and identifies:
 * - Companies with missing critical fields
 * - Companies with conflicting data sources
 * - Companies that could benefit from data sync
 * - Data completeness scores
 * 
 * Usage:
 *   npx tsx scripts/audit-data-quality.ts [--workspace-id=WORKSPACE_ID] [--limit=N]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QualityAudit {
  companyId: string;
  companyName: string;
  issues: string[];
  missingFields: string[];
  conflictingData: string[];
  completenessScore: number;
  dataSourceQuality: {
    hasCoreCompany: boolean;
    hasCoreSignal: boolean;
    hasContacts: boolean;
    contactDomainConsensus: number;
  };
}

interface AuditStats {
  totalCompanies: number;
  companiesAudited: number;
  highQuality: number;
  mediumQuality: number;
  lowQuality: number;
  criticalIssues: number;
  averageCompleteness: number;
}

async function auditDataQuality(workspaceId?: string, limit?: number) {
  console.log('🔍 AUDITING COMPANY DATA QUALITY');
  console.log('='.repeat(80));
  console.log('\n📋 Analyzing data quality across all sources:\n');

  if (workspaceId) {
    console.log(`🎯 Workspace: ${workspaceId}\n`);
  }
  if (limit) {
    console.log(`📊 Limit: ${limit} companies\n`);
  }

  const stats: AuditStats = {
    totalCompanies: 0,
    companiesAudited: 0,
    highQuality: 0,
    mediumQuality: 0,
    lowQuality: 0,
    criticalIssues: 0,
    averageCompleteness: 0
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
            industry: true,
            employeeCount: true,
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

    console.log('🔍 Auditing data quality...\n');
    const audits: QualityAudit[] = [];
    let totalCompleteness = 0;

    for (const company of companies) {
      const audit: QualityAudit = {
        companyId: company.id,
        companyName: company.name,
        issues: [],
        missingFields: [],
        conflictingData: [],
        completenessScore: 0,
        dataSourceQuality: {
          hasCoreCompany: !!company.coreCompany,
          hasCoreSignal: !!(company.customFields as any)?.coresignalData,
          hasContacts: (company.people?.length || 0) > 0,
          contactDomainConsensus: 0
        }
      };

      // Check for missing critical fields
      if (!company.industry && !company.industryOverride) audit.missingFields.push('industry');
      if (!company.employeeCount) audit.missingFields.push('employeeCount');
      if (!company.website && !company.websiteOverride && !company.domain) audit.missingFields.push('website/domain');
      if (!company.description && !company.descriptionEnriched) audit.missingFields.push('description');

      // Check contact domain consensus
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

          audit.dataSourceQuality.contactDomainConsensus = 
            (domainCounts[mostCommonDomain] / contactDomains.length) * 100;

          // Check for domain conflicts
          if (company.domain || company.website) {
            const companyDomain = company.domain || 
              (company.website ? new URL(company.website.replace(/^https?:\/\//, 'https://')).hostname.replace(/^www\./, '') : null);
            
            if (companyDomain && mostCommonDomain && companyDomain !== mostCommonDomain) {
              audit.conflictingData.push(`Contact domains (${mostCommonDomain}) don't match company domain (${companyDomain})`);
            }
          }
        }
      }

      // Check for data conflicts
      const customFields = company.customFields as any;
      const coresignalData = customFields?.coresignalData || {};

      if (company.industry && coresignalData.industry && 
          company.industry.toLowerCase() !== coresignalData.industry.toLowerCase()) {
        audit.conflictingData.push(`Industry mismatch: ${company.industry} vs CoreSignal ${coresignalData.industry}`);
      }

      if (company.employeeCount && coresignalData.employees_count && 
          Math.abs(company.employeeCount - coresignalData.employees_count) > company.employeeCount * 0.5) {
        audit.conflictingData.push(`Employee count mismatch: ${company.employeeCount} vs CoreSignal ${coresignalData.employees_count}`);
      }

      // Calculate completeness score (0-100)
      let score = 0;
      if (company.industry || company.industryOverride) score += 20;
      if (company.employeeCount) score += 20;
      if (company.website || company.domain || company.websiteOverride) score += 15;
      if (company.description || company.descriptionEnriched) score += 15;
      if (audit.dataSourceQuality.hasCoreCompany) score += 10;
      if (audit.dataSourceQuality.hasCoreSignal) score += 10;
      if (audit.dataSourceQuality.hasContacts) score += 10;

      audit.completenessScore = score;
      totalCompleteness += score;

      // Categorize quality
      if (score >= 80) {
        stats.highQuality++;
      } else if (score >= 50) {
        stats.mediumQuality++;
      } else {
        stats.lowQuality++;
      }

      if (audit.conflictingData.length > 0 || audit.missingFields.length >= 3) {
        stats.criticalIssues++;
      }

      audits.push(audit);
      stats.companiesAudited++;
    }

    stats.averageCompleteness = totalCompleteness / companies.length;

    // Report findings
    console.log('📊 DATA QUALITY REPORT\n');
    console.log(`Total Companies: ${stats.totalCompanies}`);
    console.log(`High Quality (≥80%): ${stats.highQuality} (${((stats.highQuality / stats.totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`Medium Quality (50-79%): ${stats.mediumQuality} (${((stats.mediumQuality / stats.totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`Low Quality (<50%): ${stats.lowQuality} (${((stats.lowQuality / stats.totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`Critical Issues: ${stats.criticalIssues} (${((stats.criticalIssues / stats.totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`Average Completeness: ${stats.averageCompleteness.toFixed(1)}%\n`);

    // Show companies with critical issues
    const criticalCompanies = audits.filter(a => a.conflictingData.length > 0 || a.missingFields.length >= 3);
    if (criticalCompanies.length > 0) {
      console.log(`\n⚠️  COMPANIES WITH CRITICAL ISSUES (${criticalCompanies.length}):\n`);
      criticalCompanies.slice(0, 10).forEach((audit, idx) => {
        console.log(`${idx + 1}. ${audit.companyName} (${audit.completenessScore}% complete)`);
        if (audit.missingFields.length > 0) {
          console.log(`   Missing: ${audit.missingFields.join(', ')}`);
        }
        if (audit.conflictingData.length > 0) {
          console.log(`   Conflicts: ${audit.conflictingData.join('; ')}`);
        }
        console.log('');
      });
      if (criticalCompanies.length > 10) {
        console.log(`   ... and ${criticalCompanies.length - 10} more\n`);
      }
    }

    // Show companies that could benefit from sync
    const needsSync = audits.filter(a => 
      a.completenessScore < 80 && 
      (a.dataSourceQuality.hasCoreCompany || a.dataSourceQuality.hasCoreSignal || a.dataSourceQuality.hasContacts)
    );
    if (needsSync.length > 0) {
      console.log(`\n🔄 COMPANIES THAT COULD BENEFIT FROM DATA SYNC (${needsSync.length}):\n`);
      console.log(`   Run: npx tsx scripts/sync-best-data-to-database.ts${workspaceId ? ` --workspace-id=${workspaceId}` : ''}\n`);
    }

  } catch (error) {
    console.error('❌ Error during audit:', error);
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
const limit = limitArg ? parseInt(limitArg, 10) : undefined;

auditDataQuality(workspaceIdArg, limit)
  .then((stats) => {
    if (stats) {
      console.log('\n✅ Audit complete!\n');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

