const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeAllCompaniesComprehensive() {
  console.log('🔍 COMPREHENSIVE COMPANY ANALYSIS');
  console.log('=================================');
  console.log('Matching what you see in the left panel (475 companies)');
  console.log('');

  try {
    // Get TOP Engineering Plus workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    if (!workspace) {
      throw new Error('TOP Engineering Plus workspace not found');
    }

    console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspace.id})`);
    console.log('');

    // Get ALL companies in the workspace (not just those with CoreSignal IDs)
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        customFields: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 TOTAL COMPANIES IN WORKSPACE: ${allCompanies.length}`);
    console.log('');

    // Categorize companies
    const categories = {
      withCoreSignalId: [],
      withoutCoreSignalId: [],
      suspiciousSize: [],
      noBuyerGroup: [],
      noPeopleInBuyerGroup: [],
      noDecisionMaker: [],
      sizeMismatch: []
    };

    console.log('🔍 ANALYZING EACH COMPANY...');
    console.log('─'.repeat(50));

    for (const company of allCompanies) {
      const coresignalData = company.customFields?.coresignalData;
      const companySize = coresignalData?.employees_count;
      const companyName = company.name.toLowerCase();
      
      // Check if has CoreSignal ID
      if (coresignalData?.id) {
        categories.withCoreSignalId.push(company);
        
        // Check for suspicious size
        const isMajorUtility = companyName.includes('power') || 
                              companyName.includes('electric') || 
                              companyName.includes('utility') ||
                              companyName.includes('energy') ||
                              companyName.includes('hydro') ||
                              companyName.includes('grid');
        
        if (isMajorUtility && companySize <= 10) {
          categories.suspiciousSize.push({
            name: company.name,
            size: companySize,
            coresignalId: coresignalData.id
          });
        }
      } else {
        categories.withoutCoreSignalId.push(company);
      }

      // Check buyer group status
      const buyerGroup = await prisma.buyer_groups.findFirst({
        where: {
          companyId: company.id,
          workspaceId: workspace.id
        },
        select: {
          id: true,
          customFields: true
        }
      });

      if (!buyerGroup) {
        categories.noBuyerGroup.push(company);
      } else {
        const roleDistribution = buyerGroup.customFields?.roleDistribution;
        if (roleDistribution) {
          const totalPeople = Object.values(roleDistribution).reduce((sum, count) => sum + count, 0);
          
          if (totalPeople === 0) {
            categories.noPeopleInBuyerGroup.push(company);
          }
          
          if (roleDistribution.decisionMakers === 0) {
            categories.noDecisionMaker.push({
              name: company.name,
              size: companySize,
              coresignalId: coresignalData?.id,
              totalPeople: totalPeople
            });
          }
          
          // Size mismatch
          if (companySize > 500 && totalPeople < 5) {
            categories.sizeMismatch.push({
              name: company.name,
              size: companySize,
              coresignalId: coresignalData?.id,
              buyerGroupSize: totalPeople
            });
          }
        }
      }
    }

    // Generate comprehensive report
    console.log('\n📊 COMPREHENSIVE ANALYSIS RESULTS');
    console.log('==================================');
    console.log('');

    console.log('📈 COMPANY BREAKDOWN:');
    console.log('─'.repeat(30));
    console.log(`Total Companies: ${allCompanies.length}`);
    console.log(`With CoreSignal IDs: ${categories.withCoreSignalId.length}`);
    console.log(`Without CoreSignal IDs: ${categories.withoutCoreSignalId.length}`);
    console.log('');

    console.log('🚨 COMPANIES NEEDING RE-ENRICHMENT:');
    console.log('─'.repeat(50));
    
    console.log(`1. NEVER FOUND THE COMPANY (Suspicious Size): ${categories.suspiciousSize.length}`);
    if (categories.suspiciousSize.length > 0) {
      console.log('   Examples:');
      categories.suspiciousSize.slice(0, 5).forEach(company => {
        console.log(`   - ${company.name} (${company.size} employees, ID: ${company.coresignalId})`);
      });
      if (categories.suspiciousSize.length > 5) {
        console.log(`   ... and ${categories.suspiciousSize.length - 5} more`);
      }
    }
    console.log('');

    console.log(`2. NO PEOPLE IN BUYER GROUP: ${categories.noPeopleInBuyerGroup.length}`);
    if (categories.noPeopleInBuyerGroup.length > 0) {
      console.log('   Examples:');
      categories.noPeopleInBuyerGroup.slice(0, 5).forEach(company => {
        console.log(`   - ${company.name}`);
      });
      if (categories.noPeopleInBuyerGroup.length > 5) {
        console.log(`   ... and ${categories.noPeopleInBuyerGroup.length - 5} more`);
      }
    }
    console.log('');

    console.log(`3. BUYER GROUP BUT NO DECISION MAKER: ${categories.noDecisionMaker.length}`);
    if (categories.noDecisionMaker.length > 0) {
      console.log('   Examples:');
      categories.noDecisionMaker.slice(0, 5).forEach(company => {
        console.log(`   - ${company.name} (${company.size} employees, ${company.totalPeople} people, ID: ${company.coresignalId})`);
      });
      if (categories.noDecisionMaker.length > 5) {
        console.log(`   ... and ${categories.noDecisionMaker.length - 5} more`);
      }
    }
    console.log('');

    console.log(`4. NO BUYER GROUP AT ALL: ${categories.noBuyerGroup.length}`);
    if (categories.noBuyerGroup.length > 0) {
      console.log('   Examples:');
      categories.noBuyerGroup.slice(0, 5).forEach(company => {
        console.log(`   - ${company.name}`);
      });
      if (categories.noBuyerGroup.length > 5) {
        console.log(`   ... and ${categories.noBuyerGroup.length - 5} more`);
      }
    }
    console.log('');

    console.log(`5. SIZE MISMATCH (Large company, tiny buyer group): ${categories.sizeMismatch.length}`);
    if (categories.sizeMismatch.length > 0) {
      console.log('   Examples:');
      categories.sizeMismatch.slice(0, 5).forEach(company => {
        console.log(`   - ${company.name} (${company.size} employees, ${company.buyerGroupSize} in buyer group, ID: ${company.coresignalId})`);
      });
      if (categories.sizeMismatch.length > 5) {
        console.log(`   ... and ${categories.sizeMismatch.length - 5} more`);
      }
    }
    console.log('');

    // Calculate totals for companies that need re-enrichment
    const totalNeedingReEnrichment = new Set([
      ...categories.suspiciousSize.map(c => c.name),
      ...categories.noPeopleInBuyerGroup.map(c => c.name),
      ...categories.noDecisionMaker.map(c => c.name),
      ...categories.noBuyerGroup.map(c => c.name),
      ...categories.sizeMismatch.map(c => c.name)
    ]).size;

    console.log('📈 SUMMARY:');
    console.log('─'.repeat(30));
    console.log(`Total Companies: ${allCompanies.length}`);
    console.log(`Companies Needing Re-enrichment: ${totalNeedingReEnrichment}`);
    console.log(`Companies Already Good: ${allCompanies.length - totalNeedingReEnrichment}`);
    console.log(`Re-enrichment Rate: ${((totalNeedingReEnrichment / allCompanies.length) * 100).toFixed(1)}%`);
    console.log('');

    // Show companies without CoreSignal IDs
    if (categories.withoutCoreSignalId.length > 0) {
      console.log('⚠️ COMPANIES WITHOUT CORESIGNAL IDs:');
      console.log(`   Count: ${categories.withoutCoreSignalId.length}`);
      console.log('   Examples:');
      categories.withoutCoreSignalId.slice(0, 10).forEach(company => {
        console.log(`   - ${company.name}`);
      });
      if (categories.withoutCoreSignalId.length > 10) {
        console.log(`   ... and ${categories.withoutCoreSignalId.length - 10} more`);
      }
      console.log('');
    }

    return {
      totalCompanies: allCompanies.length,
      withCoreSignalId: categories.withCoreSignalId.length,
      withoutCoreSignalId: categories.withoutCoreSignalId.length,
      needingReEnrichment: totalNeedingReEnrichment,
      issueBreakdown: categories
    };

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  analyzeAllCompaniesComprehensive().catch(console.error);
}

module.exports = analyzeAllCompaniesComprehensive;