#!/usr/bin/env node

/**
 * TOP Buyer Group Data Analysis
 * 
 * Analyzes the TOP data to identify:
 * 1. Which people, leads, prospects were generated from buyer group searches
 * 2. Which were enriched as part of buyer group searches
 * 3. Which companies still need buyer group analysis
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeTopBuyerGroupData() {
  console.log('🔍 TOP Buyer Group Data Analysis');
  console.log('================================\n');

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

    // 1. ANALYZE PEOPLE DATA
    console.log('👥 PEOPLE ANALYSIS');
    console.log('==================');
    
    const totalPeople = await prisma.people.count({
      where: { workspaceId: topWorkspace.id }
    });
    
    const peopleWithBuyerGroupRole = await prisma.people.count({
      where: {
        workspaceId: topWorkspace.id,
        buyerGroupRole: { not: null }
      }
    });
    
    const peopleWithEnrichmentSources = await prisma.people.count({
      where: {
        workspaceId: topWorkspace.id,
        enrichmentSources: { isEmpty: false }
      }
    });
    
    const peopleInBuyerGroups = await prisma.people.count({
      where: {
        workspaceId: topWorkspace.id,
        buyerGroups: { some: {} }
      }
    });

    console.log(`Total People: ${totalPeople}`);
    console.log(`With Buyer Group Role: ${peopleWithBuyerGroupRole} (${((peopleWithBuyerGroupRole/totalPeople)*100).toFixed(1)}%)`);
    console.log(`With Enrichment Sources: ${peopleWithEnrichmentSources} (${((peopleWithEnrichmentSources/totalPeople)*100).toFixed(1)}%)`);
    console.log(`In Buyer Groups: ${peopleInBuyerGroups} (${((peopleInBuyerGroups/totalPeople)*100).toFixed(1)}%)\n`);

    // Buyer group role breakdown
    const buyerGroupRoles = await prisma.people.groupBy({
      by: ['buyerGroupRole'],
      where: {
        workspaceId: topWorkspace.id,
        buyerGroupRole: { not: null }
      },
      _count: { buyerGroupRole: true }
    });

    console.log('Buyer Group Role Distribution:');
    buyerGroupRoles.forEach(role => {
      console.log(`  ${role.buyerGroupRole || 'Unknown'}: ${role._count.buyerGroupRole}`);
    });
    console.log('');

    // Enrichment sources analysis
    const enrichmentSources = await prisma.people.findMany({
      where: {
        workspaceId: topWorkspace.id,
        enrichmentSources: { isEmpty: false }
      },
      select: {
        enrichmentSources: true
      }
    });

    const sourceCounts = {};
    enrichmentSources.forEach(person => {
      person.enrichmentSources.forEach(source => {
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
    });

    console.log('Enrichment Sources:');
    Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });
    console.log('');

    // 2. ANALYZE LEADS DATA
    console.log('🎯 LEADS ANALYSIS');
    console.log('=================');
    
    const totalLeads = await prisma.leads.count({
      where: { workspaceId: topWorkspace.id }
    });
    
    const leadsWithBuyerGroupRole = await prisma.leads.count({
      where: {
        workspaceId: topWorkspace.id,
        buyerGroupRole: { not: null }
      }
    });
    
    const leadsWithEnrichmentSources = await prisma.leads.count({
      where: {
        workspaceId: topWorkspace.id,
        enrichmentSources: { isEmpty: false }
      }
    });

    console.log(`Total Leads: ${totalLeads}`);
    console.log(`With Buyer Group Role: ${leadsWithBuyerGroupRole} (${((leadsWithBuyerGroupRole/totalLeads)*100).toFixed(1)}%)`);
    console.log(`With Enrichment Sources: ${leadsWithEnrichmentSources} (${((leadsWithEnrichmentSources/totalLeads)*100).toFixed(1)}%)\n`);

    // 3. ANALYZE PROSPECTS DATA
    console.log('🔍 PROSPECTS ANALYSIS');
    console.log('=====================');
    
    const totalProspects = await prisma.prospects.count({
      where: { workspaceId: topWorkspace.id }
    });
    
    const prospectsWithBuyerGroupRole = await prisma.prospects.count({
      where: {
        workspaceId: topWorkspace.id,
        buyerGroupRole: { not: null }
      }
    });
    
    const prospectsWithEnrichmentSources = await prisma.prospects.count({
      where: {
        workspaceId: topWorkspace.id,
        enrichmentSources: { isEmpty: false }
      }
    });

    console.log(`Total Prospects: ${totalProspects}`);
    console.log(`With Buyer Group Role: ${prospectsWithBuyerGroupRole} (${((prospectsWithBuyerGroupRole/totalProspects)*100).toFixed(1)}%)`);
    console.log(`With Enrichment Sources: ${prospectsWithEnrichmentSources} (${((prospectsWithEnrichmentSources/totalProspects)*100).toFixed(1)}%)\n`);

    // 4. ANALYZE COMPANIES DATA
    console.log('🏢 COMPANIES ANALYSIS');
    console.log('=====================');
    
    const totalCompanies = await prisma.companies.count({
      where: { workspaceId: topWorkspace.id }
    });
    
    const companiesWithBuyerGroups = await prisma.companies.count({
      where: {
        workspaceId: topWorkspace.id,
        buyerGroups: { some: {} }
      }
    });

    console.log(`Total Companies: ${totalCompanies}`);
    console.log(`With Buyer Groups: ${companiesWithBuyerGroups} (${((companiesWithBuyerGroups/totalCompanies)*100).toFixed(1)}%)\n`);

    // 5. ANALYZE BUYER GROUPS
    console.log('👥 BUYER GROUPS ANALYSIS');
    console.log('========================');
    
    const totalBuyerGroups = await prisma.buyer_groups.count({
      where: { workspaceId: topWorkspace.id }
    });
    
    const buyerGroupsWithPeople = await prisma.buyer_groups.count({
      where: {
        workspaceId: topWorkspace.id,
        people: { some: {} }
      }
    });

    console.log(`Total Buyer Groups: ${totalBuyerGroups}`);
    console.log(`With People: ${buyerGroupsWithPeople} (${((buyerGroupsWithPeople/totalBuyerGroups)*100).toFixed(1)}%)\n`);

    // 6. IDENTIFY COMPANIES NEEDING BUYER GROUP ANALYSIS
    console.log('🎯 COMPANIES NEEDING BUYER GROUP ANALYSIS');
    console.log('==========================================');
    
    const companiesNeedingAnalysis = await prisma.companies.findMany({
      where: {
        workspaceId: topWorkspace.id,
        buyerGroups: { none: {} }
      },
      select: {
        id: true,
        name: true,
        industry: true,
        size: true,
        people: {
          select: {
            id: true,
            buyerGroupRole: true
          }
        }
      },
      take: 20
    });

    console.log(`Companies without buyer groups: ${companiesNeedingAnalysis.length}`);
    console.log('\nTop 20 companies needing buyer group analysis:');
    companiesNeedingAnalysis.forEach((company, index) => {
      const peopleCount = company.people.length;
      const peopleWithRoles = company.people.filter(p => p.buyerGroupRole).length;
      console.log(`${index + 1}. ${company.name} (${company.industry || 'Unknown'}) - ${peopleCount} people, ${peopleWithRoles} with roles`);
    });
    console.log('');

    // 7. DETAILED BUYER GROUP ANALYSIS
    console.log('📊 DETAILED BUYER GROUP BREAKDOWN');
    console.log('==================================');
    
    const buyerGroupDetails = await prisma.buyer_groups.findMany({
      where: { workspaceId: topWorkspace.id },
      include: {
        company: {
          select: { name: true, industry: true }
        },
        people: {
          include: {
            person: {
              select: {
                fullName: true,
                jobTitle: true,
                buyerGroupRole: true
              }
            }
          }
        }
      }
    });

    console.log('Buyer Group Details:');
    buyerGroupDetails.forEach((bg, index) => {
      console.log(`\n${index + 1}. ${bg.name} (${bg.company?.name || 'No Company'})`);
      console.log(`   Company: ${bg.company?.name || 'Unknown'} (${bg.company?.industry || 'Unknown Industry'})`);
      console.log(`   People: ${bg.people.length}`);
      console.log(`   Purpose: ${bg.purpose || 'Not specified'}`);
      console.log(`   Status: ${bg.status || 'Unknown'}`);
      
      if (bg.people.length > 0) {
        console.log('   Members:');
        bg.people.forEach(bgPerson => {
          const person = bgPerson.person;
          console.log(`     - ${person.fullName} (${person.jobTitle || 'Unknown Title'}) - ${person.buyerGroupRole || 'No Role'}`);
        });
      }
    });

    // 8. SUMMARY REPORT
    console.log('\n📋 SUMMARY REPORT');
    console.log('==================');
    console.log(`Total Records Analyzed:`);
    console.log(`  People: ${totalPeople}`);
    console.log(`  Leads: ${totalLeads}`);
    console.log(`  Prospects: ${totalProspects}`);
    console.log(`  Companies: ${totalCompanies}`);
    console.log(`  Buyer Groups: ${totalBuyerGroups}`);
    
    console.log(`\nBuyer Group Coverage:`);
    console.log(`  People with buyer group roles: ${peopleWithBuyerGroupRole}/${totalPeople} (${((peopleWithBuyerGroupRole/totalPeople)*100).toFixed(1)}%)`);
    console.log(`  Leads with buyer group roles: ${leadsWithBuyerGroupRole}/${totalLeads} (${((leadsWithBuyerGroupRole/totalLeads)*100).toFixed(1)}%)`);
    console.log(`  Prospects with buyer group roles: ${prospectsWithBuyerGroupRole}/${totalProspects} (${((prospectsWithBuyerGroupRole/totalProspects)*100).toFixed(1)}%)`);
    console.log(`  Companies with buyer groups: ${companiesWithBuyerGroups}/${totalCompanies} (${((companiesWithBuyerGroups/totalCompanies)*100).toFixed(1)}%)`);
    
    console.log(`\nEnrichment Coverage:`);
    console.log(`  People with enrichment sources: ${peopleWithEnrichmentSources}/${totalPeople} (${((peopleWithEnrichmentSources/totalPeople)*100).toFixed(1)}%)`);
    console.log(`  Leads with enrichment sources: ${leadsWithEnrichmentSources}/${totalLeads} (${((leadsWithEnrichmentSources/totalLeads)*100).toFixed(1)}%)`);
    console.log(`  Prospects with enrichment sources: ${prospectsWithEnrichmentSources}/${totalProspects} (${((prospectsWithEnrichmentSources/totalProspects)*100).toFixed(1)}%)`);

  } catch (error) {
    console.error('❌ Error analyzing TOP buyer group data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeTopBuyerGroupData();
