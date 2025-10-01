const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeCompaniesNeedingReEnrichment() {
  console.log('🔍 ANALYZING COMPANIES NEEDING RE-ENRICHMENT');
  console.log('============================================');
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

    // Get all companies with CoreSignal IDs
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 TOTAL COMPANIES WITH CORESIGNAL IDs: ${allCompanies.length}`);
    console.log('');

    // Analyze each company for specific issues
    const issueAnalysis = {
      neverFoundCompany: [],
      noPeopleInBuyerGroup: [],
      noDecisionMaker: [],
      suspiciousSize: [],
      noBuyerGroup: [],
      sizeMismatch: []
    };

    console.log('🔍 ANALYZING EACH COMPANY...');
    console.log('─'.repeat(50));

    for (const company of allCompanies) {
      const coresignalData = company.customFields?.coresignalData;
      const companySize = coresignalData?.employees_count;
      const companyName = company.name.toLowerCase();
      
      // Issue 1: Suspicious company size for major utilities
      const isMajorUtility = companyName.includes('power') || 
                            companyName.includes('electric') || 
                            companyName.includes('utility') ||
                            companyName.includes('energy') ||
                            companyName.includes('hydro') ||
                            companyName.includes('grid');
      
      if (isMajorUtility && companySize <= 10) {
        issueAnalysis.suspiciousSize.push({
          name: company.name,
          size: companySize,
          coresignalId: coresignalData?.id
        });
      }

      // Check for existing buyer group
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
        // Issue 2: No buyer group at all
        issueAnalysis.noBuyerGroup.push({
          name: company.name,
          size: companySize,
          coresignalId: coresignalData?.id
        });
      } else {
        const roleDistribution = buyerGroup.customFields?.roleDistribution;
        if (roleDistribution) {
          const totalPeople = Object.values(roleDistribution).reduce((sum, count) => sum + count, 0);
          
          // Issue 3: No people in buyer group
          if (totalPeople === 0) {
            issueAnalysis.noPeopleInBuyerGroup.push({
              name: company.name,
              size: companySize,
              coresignalId: coresignalData?.id
            });
          }
          
          // Issue 4: No decision makers
          if (roleDistribution.decisionMakers === 0) {
            issueAnalysis.noDecisionMaker.push({
              name: company.name,
              size: companySize,
              coresignalId: coresignalData?.id,
              totalPeople: totalPeople
            });
          }
          
          // Issue 5: Size mismatch (large company, tiny buyer group)
          if (companySize > 500 && totalPeople < 5) {
            issueAnalysis.sizeMismatch.push({
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
    console.log('\n📊 RE-ENRICHMENT ANALYSIS RESULTS');
    console.log('==================================');
    console.log('');

    console.log('🚨 COMPANIES NEEDING RE-ENRICHMENT:');
    console.log('─'.repeat(50));
    
    console.log(`1. NEVER FOUND THE COMPANY (Suspicious Size): ${issueAnalysis.suspiciousSize.length}`);
    if (issueAnalysis.suspiciousSize.length > 0) {
      console.log('   Examples:');
      issueAnalysis.suspiciousSize.slice(0, 5).forEach(company => {
        console.log(`   - ${company.name} (${company.size} employees, ID: ${company.coresignalId})`);
      });
      if (issueAnalysis.suspiciousSize.length > 5) {
        console.log(`   ... and ${issueAnalysis.suspiciousSize.length - 5} more`);
      }
    }
    console.log('');

    console.log(`2. NO PEOPLE IN BUYER GROUP: ${issueAnalysis.noPeopleInBuyerGroup.length}`);
    if (issueAnalysis.noPeopleInBuyerGroup.length > 0) {
      console.log('   Examples:');
      issueAnalysis.noPeopleInBuyerGroup.slice(0, 5).forEach(company => {
        console.log(`   - ${company.name} (${company.size} employees, ID: ${company.coresignalId})`);
      });
      if (issueAnalysis.noPeopleInBuyerGroup.length > 5) {
        console.log(`   ... and ${issueAnalysis.noPeopleInBuyerGroup.length - 5} more`);
      }
    }
    console.log('');

    console.log(`3. BUYER GROUP BUT NO DECISION MAKER: ${issueAnalysis.noDecisionMaker.length}`);
    if (issueAnalysis.noDecisionMaker.length > 0) {
      console.log('   Examples:');
      issueAnalysis.noDecisionMaker.slice(0, 5).forEach(company => {
        console.log(`   - ${company.name} (${company.size} employees, ${company.totalPeople} people, ID: ${company.coresignalId})`);
      });
      if (issueAnalysis.noDecisionMaker.length > 5) {
        console.log(`   ... and ${issueAnalysis.noDecisionMaker.length - 5} more`);
      }
    }
    console.log('');

    console.log(`4. NO BUYER GROUP AT ALL: ${issueAnalysis.noBuyerGroup.length}`);
    if (issueAnalysis.noBuyerGroup.length > 0) {
      console.log('   Examples:');
      issueAnalysis.noBuyerGroup.slice(0, 5).forEach(company => {
        console.log(`   - ${company.name} (${company.size} employees, ID: ${company.coresignalId})`);
      });
      if (issueAnalysis.noBuyerGroup.length > 5) {
        console.log(`   ... and ${issueAnalysis.noBuyerGroup.length - 5} more`);
      }
    }
    console.log('');

    console.log(`5. SIZE MISMATCH (Large company, tiny buyer group): ${issueAnalysis.sizeMismatch.length}`);
    if (issueAnalysis.sizeMismatch.length > 0) {
      console.log('   Examples:');
      issueAnalysis.sizeMismatch.slice(0, 5).forEach(company => {
        console.log(`   - ${company.name} (${company.size} employees, ${company.buyerGroupSize} in buyer group, ID: ${company.coresignalId})`);
      });
      if (issueAnalysis.sizeMismatch.length > 5) {
        console.log(`   ... and ${issueAnalysis.sizeMismatch.length - 5} more`);
      }
    }
    console.log('');

    // Calculate totals
    const totalNeedingReEnrichment = new Set([
      ...issueAnalysis.suspiciousSize.map(c => c.name),
      ...issueAnalysis.noPeopleInBuyerGroup.map(c => c.name),
      ...issueAnalysis.noDecisionMaker.map(c => c.name),
      ...issueAnalysis.noBuyerGroup.map(c => c.name),
      ...issueAnalysis.sizeMismatch.map(c => c.name)
    ]).size;

    console.log('📈 SUMMARY:');
    console.log('─'.repeat(30));
    console.log(`Total Companies: ${allCompanies.length}`);
    console.log(`Companies Needing Re-enrichment: ${totalNeedingReEnrichment}`);
    console.log(`Companies Already Good: ${allCompanies.length - totalNeedingReEnrichment}`);
    console.log(`Re-enrichment Rate: ${((totalNeedingReEnrichment / allCompanies.length) * 100).toFixed(1)}%`);
    console.log('');

    // Cost estimation
    const avgCreditsPerCompany = 15; // Conservative estimate
    const costPerCredit = 0.05;
    const creditMultiplier = 2;
    const estimatedCost = totalNeedingReEnrichment * avgCreditsPerCompany * costPerCredit * creditMultiplier;

    console.log('💰 COST ESTIMATION:');
    console.log(`   Companies to re-enrich: ${totalNeedingReEnrichment}`);
    console.log(`   Estimated credits per company: ${avgCreditsPerCompany}`);
    console.log(`   Total estimated credits: ${totalNeedingReEnrichment * avgCreditsPerCompany}`);
    console.log(`   Cost per credit: $${costPerCredit} (with ${creditMultiplier}x multiplier)`);
    console.log(`   Estimated total cost: $${estimatedCost.toFixed(2)}`);
    console.log('');

    return {
      totalCompanies: allCompanies.length,
      needingReEnrichment: totalNeedingReEnrichment,
      issueBreakdown: issueAnalysis,
      estimatedCost: estimatedCost
    };

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  analyzeCompaniesNeedingReEnrichment().catch(console.error);
}

module.exports = analyzeCompaniesNeedingReEnrichment;
