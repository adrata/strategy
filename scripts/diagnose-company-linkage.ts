#!/usr/bin/env ts-node
/**
 * Diagnostic script to assess scope of missing companyId linkages
 * 
 * This script identifies people records that have company names but are missing
 * the companyId foreign key, which prevents them from appearing in company tabs.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DiagnosticResult {
  totalPeople: number;
  peopleWithCompanyId: number;
  peopleWithoutCompanyId: number;
  matchable: {
    viaCurrentCompany: number;
    viaEnrichedData: number;
    viaCoresignalData: number;
    total: number;
    examples: Array<{
      id: string;
      fullName: string;
      companyName: string;
      source: string;
    }>;
  };
  nonMatchable: {
    total: number;
    examples: Array<{
      id: string;
      fullName: string;
      reason: string;
    }>;
  };
}

async function diagnoseCompanyLinkage(workspaceId: string): Promise<DiagnosticResult> {
  console.log(`\n🔍 [DIAGNOSTIC] Starting analysis for workspace: ${workspaceId}\n`);

  // Get total people count
  const totalPeople = await prisma.people.count({
    where: {
      workspaceId,
      deletedAt: null,
    },
  });

  // Get people with companyId
  const peopleWithCompanyId = await prisma.people.count({
    where: {
      workspaceId,
      deletedAt: null,
      companyId: { not: null },
    },
  });

  const peopleWithoutCompanyId = totalPeople - peopleWithCompanyId;

  console.log(`📊 [OVERVIEW]`);
  console.log(`   Total people: ${totalPeople}`);
  console.log(`   With companyId: ${peopleWithCompanyId} (${((peopleWithCompanyId / totalPeople) * 100).toFixed(1)}%)`);
  console.log(`   Without companyId: ${peopleWithoutCompanyId} (${((peopleWithoutCompanyId / totalPeople) * 100).toFixed(1)}%)\n`);

  // Get people without companyId but with potential company names
  const peopleWithoutCompanyIdFull = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      companyId: null,
    },
    select: {
      id: true,
      fullName: true,
      currentCompany: true,
      enrichedData: true,
      coresignalData: true,
      customFields: true,
    },
  });

  console.log(`🔍 [ANALYZING] ${peopleWithoutCompanyIdFull.length} people without companyId...\n`);

  const matchable = {
    viaCurrentCompany: 0,
    viaEnrichedData: 0,
    viaCoresignalData: 0,
    total: 0,
    examples: [] as Array<{ id: string; fullName: string; companyName: string; source: string }>,
  };

  const nonMatchable = {
    total: 0,
    examples: [] as Array<{ id: string; fullName: string; reason: string }>,
  };

  for (const person of peopleWithoutCompanyIdFull) {
    let companyName: string | null = null;
    let source: string | null = null;

    // Check currentCompany field
    if (person.currentCompany && person.currentCompany.trim() !== '') {
      companyName = person.currentCompany;
      source = 'currentCompany';
      matchable.viaCurrentCompany++;
    }
    // Check enrichedData
    else if (person.enrichedData && typeof person.enrichedData === 'object') {
      const enriched = person.enrichedData as any;
      if (enriched.overview?.companyName) {
        companyName = enriched.overview.companyName;
        source = 'enrichedData.overview.companyName';
        matchable.viaEnrichedData++;
      } else if (enriched.company) {
        companyName = enriched.company;
        source = 'enrichedData.company';
        matchable.viaEnrichedData++;
      }
    }
    // Check coresignalData
    else if (person.coresignalData && typeof person.coresignalData === 'object') {
      const coresignal = person.coresignalData as any;
      if (coresignal.company) {
        companyName = coresignal.company;
        source = 'coresignalData.company';
        matchable.viaCoresignalData++;
      } else if (coresignal.current_company) {
        companyName = coresignal.current_company;
        source = 'coresignalData.current_company';
        matchable.viaCoresignalData++;
      }
    }

    if (companyName && source) {
      matchable.total++;
      if (matchable.examples.length < 10) {
        matchable.examples.push({
          id: person.id,
          fullName: person.fullName,
          companyName,
          source,
        });
      }
    } else {
      nonMatchable.total++;
      if (nonMatchable.examples.length < 10) {
        nonMatchable.examples.push({
          id: person.id,
          fullName: person.fullName,
          reason: 'No company name found in any field',
        });
      }
    }
  }

  console.log(`✅ [MATCHABLE RECORDS] ${matchable.total} people with company names`);
  console.log(`   Via currentCompany: ${matchable.viaCurrentCompany}`);
  console.log(`   Via enrichedData: ${matchable.viaEnrichedData}`);
  console.log(`   Via coresignalData: ${matchable.viaCoresignalData}\n`);

  if (matchable.examples.length > 0) {
    console.log(`   Examples:`);
    matchable.examples.forEach((example, i) => {
      console.log(`   ${i + 1}. ${example.fullName} → "${example.companyName}" (${example.source})`);
    });
    console.log();
  }

  console.log(`❌ [NON-MATCHABLE RECORDS] ${nonMatchable.total} people without company names\n`);

  if (nonMatchable.examples.length > 0) {
    console.log(`   Examples:`);
    nonMatchable.examples.forEach((example, i) => {
      console.log(`   ${i + 1}. ${example.fullName} - ${example.reason}`);
    });
    console.log();
  }

  // Get list of all companies in the workspace for matching reference
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  console.log(`🏢 [COMPANIES] ${companies.length} companies available for matching\n`);

  // Summary
  console.log(`📋 [SUMMARY]`);
  console.log(`   Fix Potential: ${matchable.total} people can be linked to companies`);
  console.log(`   Impact: ${((matchable.total / peopleWithoutCompanyId) * 100).toFixed(1)}% of unlinked people are fixable`);
  console.log(`   Companies Available: ${companies.length} companies for fuzzy matching\n`);

  return {
    totalPeople,
    peopleWithCompanyId,
    peopleWithoutCompanyId,
    matchable,
    nonMatchable,
  };
}

async function main() {
  const workspaceId = process.argv[2] || '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Default to toptemp workspace

  console.log(`🚀 [DIAGNOSTIC] Company Linkage Analysis`);
  console.log(`📋 [CONFIG] Workspace ID: ${workspaceId}\n`);

  try {
    const result = await diagnoseCompanyLinkage(workspaceId);

    console.log(`✅ [DIAGNOSTIC] Analysis completed successfully!`);
    console.log(`\n💡 [RECOMMENDATION] Run fix script to link ${result.matchable.total} people to companies\n`);

    process.exit(0);
  } catch (error) {
    console.error(`❌ [DIAGNOSTIC] Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this is the main module
main();

export { diagnoseCompanyLinkage };

