#!/usr/bin/env node

/**
 * 🔍 CLOUDCADDIE WORKSPACE AUDIT
 * 
 * Comprehensive audit of CloudCaddie workspace data quality and readiness
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditCloudCaddieWorkspace() {
  try {
    console.log('🔍 CLOUDCADDIE WORKSPACE AUDIT');
    console.log('================================\n');
    
    // Find CloudCaddie workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { name: { contains: 'Cloud Caddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ CloudCaddie workspace not found!');
      const allWorkspaces = await prisma.workspaces.findMany({
        select: { id: true, name: true, slug: true }
      });
      console.log('Available workspaces:');
      console.table(allWorkspaces);
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    console.log(`📅 Created: ${workspace.createdAt}`);
    console.log(`🔄 Updated: ${workspace.updatedAt}`);
    console.log(`🏢 Business Model: ${workspace.businessModel || 'Not set'}`);
    console.log(`🏭 Industry: ${workspace.industry || 'Not set'}`);
    console.log(`🎯 Services: ${workspace.serviceOfferings?.length || 0} offerings`);
    console.log(`📦 Products: ${workspace.productPortfolio?.length || 0} products`);
    console.log(`💡 Value Props: ${workspace.valuePropositions?.length || 0} propositions`);
    console.log(`🎯 Target Industries: ${workspace.targetIndustries?.length || 0} industries`);
    console.log(`👥 Target Sizes: ${workspace.targetCompanySize?.length || 0} size categories`);
    console.log(`🏆 Competitive Advantages: ${workspace.competitiveAdvantages?.length || 0} advantages`);
    console.log(`📋 ICP: ${workspace.idealCustomerProfile ? 'Set' : 'Not set'}`);
    console.log(`📈 Sales Methodology: ${workspace.salesMethodology ? 'Set' : 'Not set'}\n`);

    // Count companies
    const companyCount = await prisma.companies.count({
      where: { workspaceId: workspace.id }
    });
    
    console.log(`🏢 COMPANIES: ${companyCount} total`);
    
    if (companyCount > 0) {
      const companies = await prisma.companies.findMany({
        where: { workspaceId: workspace.id },
        select: {
          id: true,
          name: true,
          domain: true,
          industry: true,
          status: true,
          priority: true,
          companyIntelligence: true,
          businessChallenges: true,
          businessPriorities: true,
          competitiveAdvantages: true,
          growthOpportunities: true,
          strategicInitiatives: true,
          successMetrics: true,
          marketPosition: true,
          digitalMaturity: true,
          techStack: true,
          competitors: true,
          lastVerified: true,
          confidence: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      console.log('\n📊 Company Status Breakdown:');
      const statusBreakdown = await prisma.companies.groupBy({
        by: ['status'],
        where: { workspaceId: workspace.id },
        _count: { status: true }
      });
      console.table(statusBreakdown.map(s => ({ status: s.status, count: s._count.status })));

      console.log('\n📊 Company Priority Breakdown:');
      const priorityBreakdown = await prisma.companies.groupBy({
        by: ['priority'],
        where: { workspaceId: workspace.id },
        _count: { priority: true }
      });
      console.table(priorityBreakdown.map(p => ({ priority: p.priority, count: p._count.priority })));

      console.log('\n📊 Company Intelligence Status:');
      const intelligenceStats = {
        hasIntelligence: companies.filter(c => c.companyIntelligence).length,
        hasBusinessChallenges: companies.filter(c => c.businessChallenges?.length > 0).length,
        hasBusinessPriorities: companies.filter(c => c.businessPriorities?.length > 0).length,
        hasCompetitiveAdvantages: companies.filter(c => c.competitiveAdvantages?.length > 0).length,
        hasGrowthOpportunities: companies.filter(c => c.growthOpportunities?.length > 0).length,
        hasStrategicInitiatives: companies.filter(c => c.strategicInitiatives?.length > 0).length,
        hasSuccessMetrics: companies.filter(c => c.successMetrics?.length > 0).length,
        hasMarketPosition: companies.filter(c => c.marketPosition).length,
        hasDigitalMaturity: companies.filter(c => c.digitalMaturity).length,
        hasTechStack: companies.filter(c => c.techStack?.length > 0).length,
        hasCompetitors: companies.filter(c => c.competitors?.length > 0).length,
        hasConfidence: companies.filter(c => c.confidence).length,
        hasLastVerified: companies.filter(c => c.lastVerified).length
      };
      console.table(intelligenceStats);

      console.log('\n🏢 Top 10 Companies (by creation date):');
      console.table(companies.map(c => ({
        name: c.name,
        domain: c.domain,
        industry: c.industry,
        status: c.status,
        priority: c.priority,
        intelligence: c.companyIntelligence ? 'Yes' : 'No',
        confidence: c.confidence || 'N/A',
        lastVerified: c.lastVerified ? c.lastVerified.toISOString().split('T')[0] : 'Never'
      })));
    }

    // Count people
    const peopleCount = await prisma.people.count({
      where: { workspaceId: workspace.id }
    });
    
    console.log(`\n👥 PEOPLE: ${peopleCount} total`);
    
    if (peopleCount > 0) {
      const people = await prisma.people.findMany({
        where: { workspaceId: workspace.id },
        select: {
          id: true,
          fullName: true,
          jobTitle: true,
          email: true,
          companyId: true,
          status: true,
          priority: true,
          enrichmentScore: true,
          lastEnriched: true,
          buyerGroupRole: true,
          decisionPower: true,
          influenceLevel: true,
          engagementLevel: true,
          buyerGroupStatus: true,
          isBuyerGroupMember: true,
          buyerGroupOptimized: true,
          decisionMaking: true,
          communicationStyle: true,
          engagementStrategy: true,
          coresignalData: true,
          enrichedData: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      console.log('\n📊 People Status Breakdown:');
      const peopleStatusBreakdown = await prisma.people.groupBy({
        by: ['status'],
        where: { workspaceId: workspace.id },
        _count: { status: true }
      });
      console.table(peopleStatusBreakdown.map(s => ({ status: s.status, count: s._count.status })));

      console.log('\n📊 People Priority Breakdown:');
      const peoplePriorityBreakdown = await prisma.people.groupBy({
        by: ['priority'],
        where: { workspaceId: workspace.id },
        _count: { priority: true }
      });
      console.table(peoplePriorityBreakdown.map(p => ({ priority: p.priority, count: p._count.priority })));

      console.log('\n📊 People Intelligence Status:');
      const peopleIntelligenceStats = {
        hasEnrichmentScore: people.filter(p => p.enrichmentScore).length,
        hasLastEnriched: people.filter(p => p.lastEnriched).length,
        hasBuyerGroupRole: people.filter(p => p.buyerGroupRole).length,
        hasDecisionPower: people.filter(p => p.decisionPower).length,
        hasInfluenceLevel: people.filter(p => p.influenceLevel).length,
        hasEngagementLevel: people.filter(p => p.engagementLevel).length,
        hasBuyerGroupStatus: people.filter(p => p.buyerGroupStatus).length,
        isBuyerGroupMember: people.filter(p => p.isBuyerGroupMember).length,
        hasBuyerGroupOptimized: people.filter(p => p.buyerGroupOptimized).length,
        hasDecisionMaking: people.filter(p => p.decisionMaking).length,
        hasCommunicationStyle: people.filter(p => p.communicationStyle).length,
        hasEngagementStrategy: people.filter(p => p.engagementStrategy).length,
        hasCoresignalData: people.filter(p => p.coresignalData).length,
        hasEnrichedData: people.filter(p => p.enrichedData).length
      };
      console.table(peopleIntelligenceStats);

      console.log('\n👥 Top 10 People (by creation date):');
      console.table(people.map(p => ({
        name: p.fullName,
        title: p.jobTitle,
        email: p.email,
        companyId: p.companyId,
        status: p.status,
        priority: p.priority,
        enrichment: p.enrichmentScore || 'N/A',
        lastEnriched: p.lastEnriched ? p.lastEnriched.toISOString().split('T')[0] : 'Never',
        buyerGroup: p.buyerGroupRole || 'N/A'
      })));
    }

    // Check company-people relationships
    const linkedPeople = await prisma.people.count({
      where: { 
        workspaceId: workspace.id,
        companyId: { not: null }
      }
    });
    
    const unlinkedPeople = await prisma.people.count({
      where: { 
        workspaceId: workspace.id,
        companyId: null
      }
    });

    console.log(`\n🔗 COMPANY-PEOPLE RELATIONSHIPS:`);
    console.log(`✅ Linked people: ${linkedPeople}`);
    console.log(`❌ Unlinked people: ${unlinkedPeople}`);
    console.log(`📊 Linkage rate: ${peopleCount > 0 ? ((linkedPeople / peopleCount) * 100).toFixed(1) : 0}%`);

    // Check for proper lead/prospect/opportunity status distribution
    const leadCount = await prisma.people.count({
      where: { workspaceId: workspace.id, status: 'LEAD' }
    });
    const prospectCount = await prisma.people.count({
      where: { workspaceId: workspace.id, status: 'PROSPECT' }
    });
    const opportunityCount = await prisma.people.count({
      where: { workspaceId: workspace.id, status: 'OPPORTUNITY' }
    });

    console.log(`\n📈 SALES PIPELINE STATUS:`);
    console.log(`🎯 Leads: ${leadCount}`);
    console.log(`🔍 Prospects: ${prospectCount}`);
    console.log(`💼 Opportunities: ${opportunityCount}`);

    // Check enrichment status
    const enrichedCompanies = await prisma.companies.count({
      where: { 
        workspaceId: workspace.id,
        lastVerified: { not: null }
      }
    });

    const enrichedPeople = await prisma.people.count({
      where: { 
        workspaceId: workspace.id,
        lastEnriched: { not: null }
      }
    });

    console.log(`\n🧠 ENRICHMENT STATUS:`);
    console.log(`🏢 Enriched companies: ${enrichedCompanies} / ${companyCount} (${companyCount > 0 ? ((enrichedCompanies / companyCount) * 100).toFixed(1) : 0}%)`);
    console.log(`👥 Enriched people: ${enrichedPeople} / ${peopleCount} (${peopleCount > 0 ? ((enrichedPeople / peopleCount) * 100).toFixed(1) : 0}%)`);

    // Generate recommendations
    console.log(`\n🎯 RECOMMENDATIONS:`);
    console.log('==================');
    
    if (companyCount === 0) {
      console.log('❌ CRITICAL: No companies found in workspace');
    } else if (companyCount < 10) {
      console.log('⚠️  WARNING: Very few companies in workspace');
    } else {
      console.log('✅ Good company count for sales activities');
    }

    if (peopleCount === 0) {
      console.log('❌ CRITICAL: No people found in workspace');
    } else if (peopleCount < 20) {
      console.log('⚠️  WARNING: Very few people in workspace');
    } else {
      console.log('✅ Good people count for sales activities');
    }

    if (linkedPeople / peopleCount < 0.8) {
      console.log('⚠️  WARNING: Low company-people linkage rate - need to link more people to companies');
    } else {
      console.log('✅ Good company-people linkage rate');
    }

    if (enrichedCompanies / companyCount < 0.5) {
      console.log('⚠️  WARNING: Low company enrichment rate - need to run company enrichment');
    } else {
      console.log('✅ Good company enrichment rate');
    }

    if (enrichedPeople / peopleCount < 0.5) {
      console.log('⚠️  WARNING: Low people enrichment rate - need to run people enrichment');
    } else {
      console.log('✅ Good people enrichment rate');
    }

    if (leadCount === 0 && prospectCount === 0 && opportunityCount === 0) {
      console.log('❌ CRITICAL: No sales pipeline activity - all people need proper status assignment');
    } else {
      console.log('✅ Sales pipeline has activity');
    }

    console.log('\n🎉 Audit complete!');

  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
if (require.main === module) {
  auditCloudCaddieWorkspace();
}

module.exports = { auditCloudCaddieWorkspace };
