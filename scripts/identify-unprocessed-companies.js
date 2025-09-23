#!/usr/bin/env node

/**
 * 🔍 IDENTIFY UNPROCESSED COMPANIES FOR BUYER GROUP ANALYSIS
 * 
 * This script identifies companies that still need processing:
 * 1. Companies with no people having buyer group roles
 * 2. Companies with some people having roles but missing key roles
 * 3. Companies that need new people discovered for buyer groups
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function identifyUnprocessedCompanies() {
  console.log('🔍 IDENTIFYING UNPROCESSED COMPANIES FOR BUYER GROUP ANALYSIS');
  console.log('============================================================\n');

  try {
    // Get TOP workspace ID (Dan's workspace)
    const topWorkspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'TOP',
          mode: 'insensitive'
        }
      }
    });

    if (!topWorkspace) {
      console.log('❌ TOP workspace not found');
      return;
    }

    console.log(`📊 Analyzing workspace: ${topWorkspace.name} (${topWorkspace.id})\n`);

    // 1. GET ALL COMPANIES WITH DETAILED PEOPLE ANALYSIS
    console.log('🏢 STEP 1: Analyzing all companies and their people...');
    console.log('=====================================================');
    
    const allCompanies = await prisma.companies.findMany({
      where: { workspaceId: topWorkspace.id },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        size: true,
        people: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            email: true,
            buyerGroupRole: true,
            customFields: true,
            enrichmentSources: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Found ${allCompanies.length} total companies\n`);

    // 2. CATEGORIZE COMPANIES BY PROCESSING STATUS
    console.log('📋 STEP 2: Categorizing companies by processing status...');
    console.log('=======================================================');

    const categories = {
      fullyProcessed: [],
      partiallyProcessed: [],
      notProcessed: [],
      noPeople: [],
      noWebsite: []
    };

    for (const company of allCompanies) {
      const peopleCount = company.people.length;
      const peopleWithRoles = company.people.filter(p => p.buyerGroupRole).length;
      const peopleWithEnrichment = company.people.filter(p => p.enrichmentSources && p.enrichmentSources.length > 0).length;
      
      // Check for key buyer group roles
      const hasDecisionMaker = company.people.some(p => p.buyerGroupRole === 'Decision Maker');
      const hasChampion = company.people.some(p => p.buyerGroupRole === 'Champion');
      const hasInfluencer = company.people.some(p => p.buyerGroupRole === 'Influencer');
      const hasStakeholder = company.people.some(p => p.buyerGroupRole === 'Stakeholder');
      const hasBlocker = company.people.some(p => p.buyerGroupRole === 'Blocker');
      const hasIntroducer = company.people.some(p => p.buyerGroupRole === 'Introducer');

      const companyAnalysis = {
        id: company.id,
        name: company.name,
        website: company.website,
        industry: company.industry,
        size: company.size,
        peopleCount,
        peopleWithRoles,
        peopleWithEnrichment,
        roleCoverage: peopleCount > 0 ? (peopleWithRoles / peopleCount * 100).toFixed(1) : 0,
        hasDecisionMaker,
        hasChampion,
        hasInfluencer,
        hasStakeholder,
        hasBlocker,
        hasIntroducer,
        keyRolesPresent: [hasDecisionMaker, hasChampion, hasInfluencer].filter(Boolean).length,
        allRolesPresent: [hasDecisionMaker, hasChampion, hasInfluencer, hasStakeholder, hasBlocker, hasIntroducer].filter(Boolean).length
      };

      // Categorize based on processing status
      if (peopleCount === 0) {
        categories.noPeople.push(companyAnalysis);
      } else if (!company.website || company.website.trim() === '') {
        categories.noWebsite.push(companyAnalysis);
      } else if (peopleWithRoles === 0) {
        categories.notProcessed.push(companyAnalysis);
      } else if (peopleWithRoles === peopleCount && companyAnalysis.keyRolesPresent >= 2) {
        categories.fullyProcessed.push(companyAnalysis);
      } else {
        categories.partiallyProcessed.push(companyAnalysis);
      }
    }

    // 3. DISPLAY RESULTS BY CATEGORY
    console.log('📊 PROCESSING STATUS BREAKDOWN');
    console.log('==============================');
    console.log(`✅ Fully Processed: ${categories.fullyProcessed.length} companies`);
    console.log(`🔄 Partially Processed: ${categories.partiallyProcessed.length} companies`);
    console.log(`❌ Not Processed: ${categories.notProcessed.length} companies`);
    console.log(`👥 No People: ${categories.noPeople.length} companies`);
    console.log(`🌐 No Website: ${categories.noWebsite.length} companies`);
    console.log('');

    // 4. DETAILED ANALYSIS OF EACH CATEGORY
    if (categories.notProcessed.length > 0) {
      console.log('❌ NOT PROCESSED COMPANIES (Need Full Analysis)');
      console.log('===============================================');
      console.log('These companies have people but no buyer group roles assigned:');
      console.log('');
      
      categories.notProcessed.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   Industry: ${company.industry || 'Unknown'}`);
        console.log(`   Website: ${company.website || 'None'}`);
        console.log(`   People: ${company.peopleCount} (0 with roles)`);
        console.log(`   Priority: HIGH - Needs complete buyer group analysis`);
        console.log('');
      });
    }

    if (categories.partiallyProcessed.length > 0) {
      console.log('🔄 PARTIALLY PROCESSED COMPANIES (Need Completion)');
      console.log('=================================================');
      console.log('These companies have some people with roles but are incomplete:');
      console.log('');
      
      categories.partiallyProcessed.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   Industry: ${company.industry || 'Unknown'}`);
        console.log(`   Website: ${company.website || 'None'}`);
        console.log(`   People: ${company.peopleCount} (${company.peopleWithRoles} with roles, ${company.roleCoverage}% coverage)`);
        console.log(`   Key Roles: DM:${company.hasDecisionMaker ? '✅' : '❌'} CH:${company.hasChampion ? '✅' : '❌'} IN:${company.hasInfluencer ? '✅' : '❌'}`);
        console.log(`   Priority: MEDIUM - Needs role completion or new people discovery`);
        console.log('');
      });
    }

    if (categories.noPeople.length > 0) {
      console.log('👥 COMPANIES WITH NO PEOPLE (Need People Discovery)');
      console.log('=================================================');
      console.log('These companies exist but have no people records:');
      console.log('');
      
      categories.noPeople.slice(0, 10).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   Industry: ${company.industry || 'Unknown'}`);
        console.log(`   Website: ${company.website || 'None'}`);
        console.log(`   Priority: HIGH - Needs people discovery via CoreSignal`);
        console.log('');
      });
      
      if (categories.noPeople.length > 10) {
        console.log(`   ... and ${categories.noPeople.length - 10} more companies with no people`);
      }
    }

    if (categories.noWebsite.length > 0) {
      console.log('🌐 COMPANIES WITH NO WEBSITE (Cannot Process)');
      console.log('=============================================');
      console.log('These companies cannot be processed without a website:');
      console.log('');
      
      categories.noWebsite.slice(0, 5).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   Industry: ${company.industry || 'Unknown'}`);
        console.log(`   People: ${company.peopleCount}`);
        console.log(`   Priority: LOW - Cannot enrich without website`);
        console.log('');
      });
      
      if (categories.noWebsite.length > 5) {
        console.log(`   ... and ${categories.noWebsite.length - 5} more companies without websites`);
      }
    }

    // 5. SUMMARY AND RECOMMENDATIONS
    console.log('📋 PROCESSING RECOMMENDATIONS');
    console.log('=============================');
    
    const totalNeedingProcessing = categories.notProcessed.length + categories.partiallyProcessed.length + categories.noPeople.length;
    
    console.log(`🎯 IMMEDIATE PRIORITY (${totalNeedingProcessing} companies):`);
    console.log(`   • ${categories.notProcessed.length} companies need complete buyer group analysis`);
    console.log(`   • ${categories.partiallyProcessed.length} companies need role completion`);
    console.log(`   • ${categories.noPeople.length} companies need people discovery`);
    console.log('');
    
    console.log('🚀 RECOMMENDED PROCESSING ORDER:');
    console.log('   1. Start with companies that have websites but no people (people discovery)');
    console.log('   2. Process companies with people but no buyer group roles (full analysis)');
    console.log('   3. Complete companies with partial buyer group roles (role completion)');
    console.log('   4. Skip companies without websites (cannot process)');
    console.log('');

    // 6. CREATE PROCESSING LISTS FOR NEXT STEPS
    const processingLists = {
      needsPeopleDiscovery: categories.noPeople.filter(c => c.website),
      needsFullAnalysis: categories.notProcessed,
      needsRoleCompletion: categories.partiallyProcessed,
      cannotProcess: categories.noWebsite
    };

    console.log('📊 PROCESSING LISTS SUMMARY');
    console.log('===========================');
    console.log(`🔍 Needs People Discovery: ${processingLists.needsPeopleDiscovery.length} companies`);
    console.log(`🎯 Needs Full Analysis: ${processingLists.needsFullAnalysis.length} companies`);
    console.log(`🔄 Needs Role Completion: ${processingLists.needsRoleCompletion.length} companies`);
    console.log(`❌ Cannot Process: ${processingLists.cannotProcess.length} companies`);
    console.log('');

    return {
      categories,
      processingLists,
      summary: {
        totalCompanies: allCompanies.length,
        fullyProcessed: categories.fullyProcessed.length,
        needsProcessing: totalNeedingProcessing,
        cannotProcess: categories.noWebsite.length
      }
    };

  } catch (error) {
    console.error('❌ Error identifying unprocessed companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
if (require.main === module) {
  identifyUnprocessedCompanies()
    .then(result => {
      if (result) {
        console.log('✅ Analysis complete! Use the processing lists above to prioritize your next steps.');
      }
    })
    .catch(console.error);
}

module.exports = { identifyUnprocessedCompanies };
