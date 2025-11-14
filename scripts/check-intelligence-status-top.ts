/**
 * Check Intelligence Status for TOP Workspace
 * 
 * Quick check to see how many companies have intelligence data
 */

import { prisma } from '../src/platform/database/prisma-client';

const TOP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function checkIntelligenceStatus() {
  console.log('🔍 CHECKING INTELLIGENCE STATUS FOR TOP WORKSPACE\n');
  console.log('='.repeat(80));
  console.log(`\n🎯 Workspace ID: ${TOP_WORKSPACE_ID}\n`);

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get all companies
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        customFields: true
      }
    });

    console.log(`📊 Total companies: ${allCompanies.length}\n`);

    // Check intelligence status
    const companiesWithIntelligence = allCompanies.filter(company => {
      const customFields = company.customFields as any;
      return customFields && customFields.strategyData;
    });

    const companiesWithoutIntelligence = allCompanies.filter(company => {
      const customFields = company.customFields as any;
      return !customFields || !customFields.strategyData;
    });

    console.log(`✅ Companies WITH intelligence: ${companiesWithIntelligence.length}`);
    console.log(`❌ Companies WITHOUT intelligence: ${companiesWithoutIntelligence.length}\n`);

    // Show percentage
    const percentage = allCompanies.length > 0 
      ? ((companiesWithIntelligence.length / allCompanies.length) * 100).toFixed(1)
      : '0';
    console.log(`📈 Coverage: ${percentage}%\n`);

    // Show sample companies without intelligence
    if (companiesWithoutIntelligence.length > 0) {
      console.log(`📋 Sample companies WITHOUT intelligence (first 10):`);
      companiesWithoutIntelligence.slice(0, 10).forEach((company, i) => {
        console.log(`   ${i + 1}. ${company.name} (${company.id})`);
      });
      if (companiesWithoutIntelligence.length > 10) {
        console.log(`   ... and ${companiesWithoutIntelligence.length - 10} more`);
      }
      console.log('');
    }

    // Check Austin Energy specifically
    const austinEnergy = allCompanies.find(c => 
      c.name.toLowerCase().includes('austin energy') || 
      c.id === '01K9QD3CWPZGXC2A91FYWG8A9D'
    );

    if (austinEnergy) {
      const customFields = austinEnergy.customFields as any;
      const hasIntelligence = customFields && customFields.strategyData;
      console.log(`\n🔍 Austin Energy Status:`);
      console.log(`   Name: ${austinEnergy.name}`);
      console.log(`   ID: ${austinEnergy.id}`);
      console.log(`   Has Intelligence: ${hasIntelligence ? '✅ YES' : '❌ NO'}`);
      if (hasIntelligence) {
        console.log(`   Strategy Generated At: ${customFields.strategyData?.strategyGeneratedAt || 'Unknown'}`);
      }
      console.log('');
    }

    // Recommendation
    if (companiesWithoutIntelligence.length > 0) {
      console.log('💡 RECOMMENDATION:');
      console.log('   Run the population script to generate intelligence:');
      console.log('   npx tsx scripts/populate-top-intelligence.ts\n');
    } else {
      console.log('✅ All companies have intelligence data!\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('✅ Database connection closed\n');
  }
}

// Run the check
checkIntelligenceStatus()
  .then(() => {
    console.log('✅ Check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });

