/**
 * Audit company intelligence data in database
 * Check Southern Company and similar companies
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditCompanyIntelligence() {
  const targetCompanyId = '01K9QD2ST0C0TTG34EMRD3M69H';
  const targetCompanyName = 'Southern Company';

  try {
    console.log('🔍 AUDITING COMPANY INTELLIGENCE DATA\n');
    console.log('='.repeat(80));

    // Get target company
    const targetCompany = await prisma.companies.findUnique({
      where: { id: targetCompanyId },
      select: {
        id: true,
        name: true,
        industry: true,
        workspaceId: true,
        customFields: true,
        descriptionEnriched: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!targetCompany) {
      console.log('❌ Target company not found');
      return;
    }

    console.log(`\n📊 TARGET COMPANY: ${targetCompany.name}`);
    console.log(`   ID: ${targetCompany.id}`);
    console.log(`   Industry: ${targetCompany.industry || 'N/A'}`);
    console.log(`   Workspace: ${targetCompany.workspaceId}`);
    console.log(`   Has descriptionEnriched: ${!!targetCompany.descriptionEnriched}`);
    console.log(`   Description length: ${targetCompany.descriptionEnriched?.length || 0}`);

    const targetCustomFields = targetCompany.customFields as any;
    console.log(`\n   CustomFields keys: ${targetCustomFields ? Object.keys(targetCustomFields).join(', ') : 'none'}`);
    console.log(`   Has strategyData: ${!!targetCustomFields?.strategyData}`);
    console.log(`   Has intelligence: ${!!targetCustomFields?.intelligence}`);
    console.log(`   Has intelligenceVersion: ${targetCustomFields?.intelligenceVersion || 'N/A'}`);

    // Find similar companies in the same workspace
    console.log(`\n\n🔍 FINDING SIMILAR COMPANIES (same workspace, same industry if available)...`);
    
    const similarCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: targetCompany.workspaceId,
        deletedAt: null,
        ...(targetCompany.industry ? { industry: targetCompany.industry } : {})
      },
      select: {
        id: true,
        name: true,
        industry: true,
        customFields: true,
        descriptionEnriched: true,
        createdAt: true,
        updatedAt: true
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    });

    console.log(`\n📊 Found ${similarCompanies.length} similar companies\n`);

    let companiesWithStrategy = 0;
    let companiesWithIntelligence = 0;
    let companiesWithDescription = 0;

    similarCompanies.forEach((company, index) => {
      const customFields = company.customFields as any;
      const hasStrategy = !!customFields?.strategyData;
      const hasIntelligence = !!customFields?.intelligence;
      const hasDescription = !!company.descriptionEnriched;

      if (hasStrategy) companiesWithStrategy++;
      if (hasIntelligence) companiesWithIntelligence++;
      if (hasDescription) companiesWithDescription++;

      const isTarget = company.id === targetCompanyId;
      const marker = isTarget ? '🎯' : '  ';

      console.log(`${marker} ${index + 1}. ${company.name}`);
      console.log(`     ID: ${company.id}`);
      console.log(`     Industry: ${company.industry || 'N/A'}`);
      console.log(`     Has descriptionEnriched: ${hasDescription} (${company.descriptionEnriched?.length || 0} chars)`);
      console.log(`     Has strategyData: ${hasStrategy}`);
      console.log(`     Has intelligence: ${hasIntelligence}`);
      if (customFields) {
        console.log(`     CustomFields keys: ${Object.keys(customFields).join(', ')}`);
        if (customFields.strategyData) {
          console.log(`     Strategy generated: ${customFields.strategyData.strategyGeneratedAt || 'N/A'}`);
          console.log(`     Strategy archetype: ${customFields.strategyData.archetypeName || 'N/A'}`);
        }
        if (customFields.intelligence) {
          console.log(`     Intelligence version: ${customFields.intelligenceVersion || 'N/A'}`);
        }
      }
      console.log('');
    });

    console.log('\n📈 SUMMARY:');
    console.log(`   Total companies checked: ${similarCompanies.length}`);
    console.log(`   Companies with strategyData: ${companiesWithStrategy} (${Math.round(companiesWithStrategy / similarCompanies.length * 100)}%)`);
    console.log(`   Companies with intelligence: ${companiesWithIntelligence} (${Math.round(companiesWithIntelligence / similarCompanies.length * 100)}%)`);
    console.log(`   Companies with descriptionEnriched: ${companiesWithDescription} (${Math.round(companiesWithDescription / similarCompanies.length * 100)}%)`);

    // Check all companies in workspace for overall stats
    console.log('\n\n🌍 WORKSPACE-WIDE STATS:');
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: targetCompany.workspaceId,
        deletedAt: null
      },
      select: {
        customFields: true,
        descriptionEnriched: true
      }
    });

    const totalCompanies = allCompanies.length;
    const withStrategy = allCompanies.filter(c => {
      const cf = c.customFields as any;
      return !!cf?.strategyData;
    }).length;
    const withIntelligence = allCompanies.filter(c => {
      const cf = c.customFields as any;
      return !!cf?.intelligence;
    }).length;
    const withDescription = allCompanies.filter(c => !!c.descriptionEnriched).length;

    console.log(`   Total companies in workspace: ${totalCompanies}`);
    console.log(`   With strategyData: ${withStrategy} (${Math.round(withStrategy / totalCompanies * 100)}%)`);
    console.log(`   With intelligence: ${withIntelligence} (${Math.round(withIntelligence / totalCompanies * 100)}%)`);
    console.log(`   With descriptionEnriched: ${withDescription} (${Math.round(withDescription / totalCompanies * 100)}%)`);

    // Check if there's a pattern - maybe only certain companies have it
    if (withStrategy > 0 && !targetCustomFields?.strategyData) {
      console.log('\n⚠️  PATTERN DETECTED:');
      console.log('   Some companies in this workspace have strategyData, but Southern Company does not.');
      console.log('   This suggests the data should be generated via batch process.');
    }

  } catch (error) {
    console.error('❌ Error auditing company intelligence:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditCompanyIntelligence();

