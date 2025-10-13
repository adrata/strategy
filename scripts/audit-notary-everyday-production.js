#!/usr/bin/env node

/**
 * 🔍 NOTARY EVERYDAY PRODUCTION READINESS AUDIT
 * 
 * Comprehensive audit of Notary Everyday workspace data quality, intelligence, and enrichment status
 * Compares current streamlined database against old Neon database to ensure production readiness
 */

const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connections
const prisma = new PrismaClient();
const oldDbClient = new Client({
  connectionString: 'postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require'
});

// Audit results storage
const auditResults = {
  timestamp: new Date().toISOString(),
  workspace: null,
  dataInventory: {},
  intelligenceAudit: {},
  dataQuality: {},
  oldVsNew: {},
  productionReadiness: {},
  recommendations: []
};

async function connectDatabases() {
  try {
    console.log('🔌 Connecting to databases...');
    await oldDbClient.connect();
    console.log('✅ Connected to old Neon database');
    console.log('✅ Connected to streamlined database');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function findNotaryEverydayWorkspace() {
  try {
    console.log('\n🔍 Finding Notary Everyday workspace...');
    
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
    }
  });
  
  if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      const allWorkspaces = await prisma.workspaces.findMany({
        select: { id: true, name: true, slug: true, businessModel: true }
      });
      console.log('Available workspaces:');
      console.table(allWorkspaces);
      return null;
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
    console.log(`📈 Sales Methodology: ${workspace.salesMethodology ? 'Set' : 'Not set'}`);

    auditResults.workspace = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      businessModel: workspace.businessModel,
      industry: workspace.industry,
      serviceOfferings: workspace.serviceOfferings,
      productPortfolio: workspace.productPortfolio,
      valuePropositions: workspace.valuePropositions,
      targetIndustries: workspace.targetIndustries,
      targetCompanySize: workspace.targetCompanySize,
      competitiveAdvantages: workspace.competitiveAdvantages,
      idealCustomerProfile: workspace.idealCustomerProfile,
      salesMethodology: workspace.salesMethodology,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };

    return workspace;
  } catch (error) {
    console.error('❌ Error finding workspace:', error);
    return null;
  }
}

async function auditDataInventory(workspace) {
  try {
    console.log('\n📊 AUDITING DATA INVENTORY...');
    
    // Companies audit
    const companyCount = await prisma.companies.count({
      where: { workspaceId: workspace.id }
    });
    
    const companyStatusBreakdown = await prisma.companies.groupBy({
      by: ['status'],
      where: { workspaceId: workspace.id },
      _count: { status: true }
    });
    
    const companyPriorityBreakdown = await prisma.companies.groupBy({
      by: ['priority'],
      where: { workspaceId: workspace.id },
      _count: { priority: true }
    });

    console.log(`🏢 COMPANIES: ${companyCount} total`);
    console.log('Status breakdown:');
    console.table(companyStatusBreakdown.map(s => ({ status: s.status, count: s._count.status })));
    console.log('Priority breakdown:');
    console.table(companyPriorityBreakdown.map(p => ({ priority: p.priority, count: p._count.priority })));

    // People audit
    const peopleCount = await prisma.people.count({
      where: { workspaceId: workspace.id }
    });
    
    const peopleStatusBreakdown = await prisma.people.groupBy({
      by: ['status'],
      where: { workspaceId: workspace.id },
      _count: { status: true }
    });
    
    const peoplePriorityBreakdown = await prisma.people.groupBy({
      by: ['priority'],
      where: { workspaceId: workspace.id },
      _count: { priority: true }
    });

    console.log(`\n👥 PEOPLE: ${peopleCount} total`);
    console.log('Status breakdown:');
    console.table(peopleStatusBreakdown.map(s => ({ status: s.status, count: s._count.status })));
    console.log('Priority breakdown:');
    console.table(peoplePriorityBreakdown.map(p => ({ priority: p.priority, count: p._count.priority })));

    // Company-people relationships
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

    const linkageRate = peopleCount > 0 ? (linkedPeople / peopleCount) * 100 : 0;

    console.log(`\n🔗 COMPANY-PEOPLE RELATIONSHIPS:`);
    console.log(`✅ Linked people: ${linkedPeople}`);
    console.log(`❌ Unlinked people: ${unlinkedPeople}`);
    console.log(`📊 Linkage rate: ${linkageRate.toFixed(1)}%`);

    auditResults.dataInventory = {
      companies: {
        total: companyCount,
        statusBreakdown: companyStatusBreakdown.map(s => ({ status: s.status, count: s._count.status })),
        priorityBreakdown: companyPriorityBreakdown.map(p => ({ priority: p.priority, count: p._count.priority }))
      },
      people: {
        total: peopleCount,
        statusBreakdown: peopleStatusBreakdown.map(s => ({ status: s.status, count: s._count.status })),
        priorityBreakdown: peoplePriorityBreakdown.map(p => ({ priority: p.priority, count: p._count.priority }))
      },
      relationships: {
        linkedPeople,
        unlinkedPeople,
        linkageRate: parseFloat(linkageRate.toFixed(1))
      }
    };

    return { companyCount, peopleCount, linkageRate };
  } catch (error) {
    console.error('❌ Error auditing data inventory:', error);
    return null;
  }
}

async function auditCompanyIntelligence(workspace) {
  try {
    console.log('\n🧠 AUDITING COMPANY INTELLIGENCE...');
    
    const companies = await prisma.companies.findMany({
      where: { workspaceId: workspace.id },
    select: {
      id: true,
      name: true,
        domain: true,
        industry: true,
        status: true,
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
        confidence: true,
      lastVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const intelligenceStats = {
      total: companies.length,
      hasCompanyIntelligence: companies.filter(c => c.companyIntelligence).length,
      hasBusinessChallenges: companies.filter(c => c.businessChallenges?.length > 0).length,
      hasBusinessPriorities: companies.filter(c => c.businessPriorities?.length > 0).length,
      hasCompetitiveAdvantages: companies.filter(c => c.competitiveAdvantages?.length > 0).length,
      hasGrowthOpportunities: companies.filter(c => c.growthOpportunities?.length > 0).length,
      hasStrategicInitiatives: companies.filter(c => c.strategicInitiatives?.length > 0).length,
      hasSuccessMetrics: companies.filter(c => c.successMetrics?.length > 0).length,
      hasMarketPosition: companies.filter(c => c.marketPosition).length,
      hasDigitalMaturity: companies.filter(c => c.digitalMaturity !== null).length,
      hasTechStack: companies.filter(c => c.techStack?.length > 0).length,
      hasCompetitors: companies.filter(c => c.competitors?.length > 0).length,
      hasConfidence: companies.filter(c => c.confidence !== null).length,
      hasLastVerified: companies.filter(c => c.lastVerified).length
    };

    console.log('Company Intelligence Coverage:');
    console.table(intelligenceStats);

    // Calculate completeness scores
    const completenessScores = {};
    Object.keys(intelligenceStats).forEach(key => {
      if (key !== 'total') {
        const percentage = (intelligenceStats[key] / intelligenceStats.total) * 100;
        completenessScores[key] = parseFloat(percentage.toFixed(1));
      }
    });

    console.log('\nCompany Intelligence Completeness (%):');
    console.table(completenessScores);

    // Identify companies with missing critical data
    const companiesWithMissingData = companies.filter(company => {
      const criticalFields = [
        'companyIntelligence', 'businessChallenges', 'businessPriorities',
        'competitiveAdvantages', 'marketPosition', 'confidence'
      ];
      return criticalFields.some(field => !company[field] || 
        (Array.isArray(company[field]) && company[field].length === 0));
    });

    console.log(`\n⚠️  Companies with missing critical intelligence: ${companiesWithMissingData.length}`);
    if (companiesWithMissingData.length > 0) {
      console.log('Companies needing enrichment:');
      console.table(companiesWithMissingData.map(c => ({
        name: c.name,
        domain: c.domain,
        industry: c.industry,
        status: c.status,
        missingFields: [
          !c.companyIntelligence && 'companyIntelligence',
          (!c.businessChallenges || c.businessChallenges.length === 0) && 'businessChallenges',
          (!c.businessPriorities || c.businessPriorities.length === 0) && 'businessPriorities',
          (!c.competitiveAdvantages || c.competitiveAdvantages.length === 0) && 'competitiveAdvantages',
          !c.marketPosition && 'marketPosition',
          c.confidence === null && 'confidence'
        ].filter(Boolean).join(', ')
      })));
    }

    auditResults.intelligenceAudit.companies = {
      stats: intelligenceStats,
      completenessScores,
      companiesWithMissingData: companiesWithMissingData.map(c => ({
        id: c.id,
        name: c.name,
        domain: c.domain,
        industry: c.industry,
        status: c.status
      }))
    };

    return { intelligenceStats, completenessScores, companiesWithMissingData };
  } catch (error) {
    console.error('❌ Error auditing company intelligence:', error);
    return null;
  }
}

async function auditPeopleIntelligence(workspace) {
  try {
    console.log('\n👥 AUDITING PEOPLE INTELLIGENCE...');
    
    const people = await prisma.people.findMany({
      where: { workspaceId: workspace.id },
    select: {
      id: true,
      fullName: true,
        jobTitle: true,
        email: true,
        companyId: true,
        status: true,
        enrichedData: true,
        coresignalData: true,
      buyerGroupRole: true,
        decisionPower: true,
        influenceLevel: true,
        engagementLevel: true,
        communicationStyle: true,
        engagementStrategy: true,
      enrichmentScore: true,
      lastEnriched: true,
        currentRole: true,
        yearsInRole: true,
        totalExperience: true,
        technicalSkills: true,
        softSkills: true,
        industrySkills: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const intelligenceStats = {
      total: people.length,
      hasEnrichedData: people.filter(p => p.enrichedData).length,
      hasCoresignalData: people.filter(p => p.coresignalData).length,
      hasBuyerGroupRole: people.filter(p => p.buyerGroupRole).length,
      hasDecisionPower: people.filter(p => p.decisionPower !== null).length,
      hasInfluenceLevel: people.filter(p => p.influenceLevel).length,
      hasEngagementLevel: people.filter(p => p.engagementLevel).length,
      hasCommunicationStyle: people.filter(p => p.communicationStyle).length,
      hasEngagementStrategy: people.filter(p => p.engagementStrategy).length,
      hasEnrichmentScore: people.filter(p => p.enrichmentScore !== null).length,
      hasLastEnriched: people.filter(p => p.lastEnriched).length,
      hasCurrentRole: people.filter(p => p.currentRole).length,
      hasYearsInRole: people.filter(p => p.yearsInRole !== null).length,
      hasTotalExperience: people.filter(p => p.totalExperience !== null).length,
      hasTechnicalSkills: people.filter(p => p.technicalSkills?.length > 0).length,
      hasSoftSkills: people.filter(p => p.softSkills?.length > 0).length,
      hasIndustrySkills: people.filter(p => p.industrySkills?.length > 0).length
    };

    console.log('People Intelligence Coverage:');
    console.table(intelligenceStats);

    // Calculate completeness scores
    const completenessScores = {};
    Object.keys(intelligenceStats).forEach(key => {
      if (key !== 'total') {
        const percentage = (intelligenceStats[key] / intelligenceStats.total) * 100;
        completenessScores[key] = parseFloat(percentage.toFixed(1));
      }
    });

    console.log('\nPeople Intelligence Completeness (%):');
    console.table(completenessScores);

    // Identify people with missing critical data
    const peopleWithMissingData = people.filter(person => {
      const criticalFields = [
        'buyerGroupRole', 'decisionPower', 'influenceLevel', 
        'enrichmentScore', 'currentRole', 'totalExperience'
      ];
      return criticalFields.some(field => !person[field] || 
        (Array.isArray(person[field]) && person[field].length === 0));
    });

    console.log(`\n⚠️  People with missing critical intelligence: ${peopleWithMissingData.length}`);
    if (peopleWithMissingData.length > 0) {
      console.log('People needing enrichment:');
      console.table(peopleWithMissingData.slice(0, 10).map(p => ({
        name: p.fullName,
        title: p.jobTitle,
        email: p.email,
        status: p.status,
        missingFields: [
          !p.buyerGroupRole && 'buyerGroupRole',
          p.decisionPower === null && 'decisionPower',
          !p.influenceLevel && 'influenceLevel',
          p.enrichmentScore === null && 'enrichmentScore',
          !p.currentRole && 'currentRole',
          p.totalExperience === null && 'totalExperience'
        ].filter(Boolean).join(', ')
      })));
    }

    auditResults.intelligenceAudit.people = {
      stats: intelligenceStats,
      completenessScores,
      peopleWithMissingData: peopleWithMissingData.map(p => ({
        id: p.id,
        fullName: p.fullName,
        jobTitle: p.jobTitle,
        email: p.email,
        status: p.status
      }))
    };

    return { intelligenceStats, completenessScores, peopleWithMissingData };
  } catch (error) {
    console.error('❌ Error auditing people intelligence:', error);
    return null;
  }
}

async function compareOldVsNew(workspace) {
  try {
    console.log('\n🔄 COMPARING OLD VS NEW DATABASE...');
    
    // Query old database for Notary Everyday data
    const oldCompaniesQuery = `
      SELECT COUNT(*) as count, 
             COUNT(CASE WHEN "companyIntelligence" IS NOT NULL THEN 1 END) as with_intelligence,
             COUNT(CASE WHEN "businessChallenges" IS NOT NULL AND array_length("businessChallenges", 1) > 0 THEN 1 END) as with_challenges,
             COUNT(CASE WHEN "confidence" IS NOT NULL THEN 1 END) as with_confidence
      FROM "companies" 
      WHERE "workspaceId" = $1
    `;
    
    const oldPeopleQuery = `
      SELECT COUNT(*) as count,
             COUNT(CASE WHEN "enrichedData" IS NOT NULL OR "coresignalData" IS NOT NULL THEN 1 END) as with_enrichment,
             COUNT(CASE WHEN "buyerGroupRole" IS NOT NULL THEN 1 END) as with_buyer_role,
             COUNT(CASE WHEN "decisionPower" IS NOT NULL THEN 1 END) as with_decision_power
      FROM "people" 
      WHERE "workspaceId" = $1
    `;

    const oldCompaniesResult = await oldDbClient.query(oldCompaniesQuery, [workspace.id]);
    const oldPeopleResult = await oldDbClient.query(oldPeopleQuery, [workspace.id]);

    const oldData = {
      companies: {
        total: parseInt(oldCompaniesResult.rows[0].count),
        withIntelligence: parseInt(oldCompaniesResult.rows[0].with_intelligence),
        withChallenges: parseInt(oldCompaniesResult.rows[0].with_challenges),
        withConfidence: parseInt(oldCompaniesResult.rows[0].with_confidence)
      },
      people: {
        total: parseInt(oldPeopleResult.rows[0].count),
        withEnrichment: parseInt(oldPeopleResult.rows[0].with_enrichment),
        withBuyerRole: parseInt(oldPeopleResult.rows[0].with_buyer_role),
        withDecisionPower: parseInt(oldPeopleResult.rows[0].with_decision_power)
      }
    };

    // Get current data for comparison
    const currentCompanyCount = await prisma.companies.count({
      where: { workspaceId: workspace.id }
    });
    
    const currentPeopleCount = await prisma.people.count({
      where: { workspaceId: workspace.id }
    });

    const currentCompaniesWithIntelligence = await prisma.companies.count({
    where: {
        workspaceId: workspace.id,
        companyIntelligence: { not: null }
      }
    });

    const currentPeopleWithEnrichment = await prisma.people.count({
    where: {
        workspaceId: workspace.id,
      OR: [
          { enrichedData: { not: null } },
          { coresignalData: { not: null } }
      ]
    }
  });
  
    const currentData = {
      companies: {
        total: currentCompanyCount,
        withIntelligence: currentCompaniesWithIntelligence
      },
      people: {
        total: currentPeopleCount,
        withEnrichment: currentPeopleWithEnrichment
      }
    };

    console.log('OLD DATABASE:');
    console.table(oldData);
    console.log('\nNEW DATABASE:');
    console.table(currentData);

    const comparison = {
      companies: {
        totalDiff: currentData.companies.total - oldData.companies.total,
        intelligenceDiff: currentData.companies.withIntelligence - oldData.companies.withIntelligence,
        dataLoss: currentData.companies.total < oldData.companies.total
      },
      people: {
        totalDiff: currentData.people.total - oldData.people.total,
        enrichmentDiff: currentData.people.withEnrichment - oldData.people.withEnrichment,
        dataLoss: currentData.people.total < oldData.people.total
      }
    };

    console.log('\nCOMPARISON:');
    console.table(comparison);

    if (comparison.companies.dataLoss || comparison.people.dataLoss) {
      console.log('⚠️  WARNING: Data loss detected during migration!');
    } else {
      console.log('✅ No data loss detected');
    }

    auditResults.oldVsNew = {
      oldData,
      currentData,
      comparison
    };

    return { oldData, currentData, comparison };
  } catch (error) {
    console.error('❌ Error comparing databases:', error);
    return null;
  }
}

async function generateProductionReadinessAssessment(workspace, dataInventory, companyIntelligence, peopleIntelligence, comparison) {
  try {
    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT...');
    
    const assessment = {
      overall: 'UNKNOWN',
      companies: 'UNKNOWN',
      people: 'UNKNOWN',
      dataIntegrity: 'UNKNOWN',
      recommendations: []
    };

    // Company readiness assessment
    const companyCompleteness = companyIntelligence?.completenessScores || {};
    const avgCompanyCompleteness = Object.values(companyCompleteness).reduce((a, b) => a + b, 0) / Object.keys(companyCompleteness).length;
    
    if (avgCompanyCompleteness >= 80) {
      assessment.companies = 'READY';
    } else if (avgCompanyCompleteness >= 50) {
      assessment.companies = 'WARNING';
    } else {
      assessment.companies = 'CRITICAL';
    }

    // People readiness assessment
    const peopleCompleteness = peopleIntelligence?.completenessScores || {};
    const avgPeopleCompleteness = Object.values(peopleCompleteness).reduce((a, b) => a + b, 0) / Object.keys(peopleCompleteness).length;
    
    if (avgPeopleCompleteness >= 80) {
      assessment.people = 'READY';
    } else if (avgPeopleCompleteness >= 50) {
      assessment.people = 'WARNING';
    } else {
      assessment.people = 'CRITICAL';
    }

    // Data integrity assessment
    if (comparison?.companies.dataLoss || comparison?.people.dataLoss) {
      assessment.dataIntegrity = 'CRITICAL';
    } else if (dataInventory?.linkageRate < 90) {
      assessment.dataIntegrity = 'WARNING';
    } else {
      assessment.dataIntegrity = 'READY';
    }

    // Overall assessment
    const scores = [assessment.companies, assessment.people, assessment.dataIntegrity];
    if (scores.includes('CRITICAL')) {
      assessment.overall = 'CRITICAL';
    } else if (scores.includes('WARNING')) {
      assessment.overall = 'WARNING';
    } else {
      assessment.overall = 'READY';
    }

    // Generate recommendations
    if (assessment.companies === 'CRITICAL') {
      assessment.recommendations.push('❌ CRITICAL: Run comprehensive company enrichment immediately');
    } else if (assessment.companies === 'WARNING') {
      assessment.recommendations.push('⚠️  WARNING: Company intelligence needs improvement');
    }

    if (assessment.people === 'CRITICAL') {
      assessment.recommendations.push('❌ CRITICAL: Run comprehensive people enrichment immediately');
    } else if (assessment.people === 'WARNING') {
      assessment.recommendations.push('⚠️  WARNING: People intelligence needs improvement');
    }

    if (assessment.dataIntegrity === 'CRITICAL') {
      assessment.recommendations.push('❌ CRITICAL: Data migration issues detected - investigate immediately');
    } else if (assessment.dataIntegrity === 'WARNING') {
      assessment.recommendations.push('⚠️  WARNING: Improve company-people linkage rate');
    }

    if (dataInventory?.companies.total === 0) {
      assessment.recommendations.push('❌ CRITICAL: No companies found in workspace');
    } else if (dataInventory?.companies.total < 10) {
      assessment.recommendations.push('⚠️  WARNING: Very few companies for production use');
    }

    if (dataInventory?.people.total === 0) {
      assessment.recommendations.push('❌ CRITICAL: No people found in workspace');
    } else if (dataInventory?.people.total < 20) {
      assessment.recommendations.push('⚠️  WARNING: Very few people for production use');
    }

    console.log('\n📊 ASSESSMENT RESULTS:');
    console.log(`Overall Status: ${assessment.overall}`);
    console.log(`Companies: ${assessment.companies} (${avgCompanyCompleteness.toFixed(1)}% complete)`);
    console.log(`People: ${assessment.people} (${avgPeopleCompleteness.toFixed(1)}% complete)`);
    console.log(`Data Integrity: ${assessment.dataIntegrity}`);

    console.log('\n🎯 RECOMMENDATIONS:');
    assessment.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    auditResults.productionReadiness = assessment;
    auditResults.recommendations = assessment.recommendations;

    return assessment;
  } catch (error) {
    console.error('❌ Error generating assessment:', error);
    return null;
  }
}

async function saveAuditResults() {
  try {
    console.log('\n💾 Saving audit results...');
    
    // Save JSON results
    const jsonPath = path.join(process.cwd(), 'notary-everyday-audit-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(auditResults, null, 2));
    console.log(`✅ JSON results saved to: ${jsonPath}`);

    // Generate markdown report
    const reportPath = path.join(process.cwd(), 'NOTARY_EVERYDAY_AUDIT_REPORT.md');
    const report = generateMarkdownReport();
    fs.writeFileSync(reportPath, report);
    console.log(`✅ Markdown report saved to: ${reportPath}`);

  } catch (error) {
    console.error('❌ Error saving results:', error);
  }
}

function generateMarkdownReport() {
  const { workspace, dataInventory, intelligenceAudit, oldVsNew, productionReadiness, recommendations } = auditResults;
  
  return `# Notary Everyday Workspace Production Readiness Audit

**Audit Date:** ${new Date(auditResults.timestamp).toLocaleString()}

## Executive Summary

**Overall Status:** ${productionReadiness.overall}

This audit evaluates the Notary Everyday workspace for production readiness, including data completeness, intelligence coverage, and migration integrity.

## Workspace Configuration

- **Name:** ${workspace.name}
- **ID:** ${workspace.id}
- **Business Model:** ${workspace.businessModel || 'Not set'}
- **Industry:** ${workspace.industry || 'Not set'}
- **Services:** ${workspace.serviceOfferings?.length || 0} offerings
- **Products:** ${workspace.productPortfolio?.length || 0} products
- **Value Props:** ${workspace.valuePropositions?.length || 0} propositions

## Data Inventory

### Companies
- **Total:** ${dataInventory.companies.total}
- **Status Distribution:** ${JSON.stringify(dataInventory.companies.statusBreakdown)}
- **Priority Distribution:** ${JSON.stringify(dataInventory.companies.priorityBreakdown)}

### People
- **Total:** ${dataInventory.people.total}
- **Status Distribution:** ${JSON.stringify(dataInventory.people.statusBreakdown)}
- **Priority Distribution:** ${JSON.stringify(dataInventory.people.priorityBreakdown)}

### Relationships
- **Linked People:** ${dataInventory.relationships.linkedPeople}
- **Unlinked People:** ${dataInventory.relationships.unlinkedPeople}
- **Linkage Rate:** ${dataInventory.relationships.linkageRate}%

## Intelligence Coverage

### Company Intelligence
${Object.entries(intelligenceAudit.companies?.completenessScores || {}).map(([key, value]) => `- **${key}:** ${value}%`).join('\n')}

### People Intelligence
${Object.entries(intelligenceAudit.people?.completenessScores || {}).map(([key, value]) => `- **${key}:** ${value}%`).join('\n')}

## Migration Comparison

### Old vs New Database
- **Companies:** ${oldVsNew.currentData?.companies.total || 0} (was ${oldVsNew.oldData?.companies.total || 0})
- **People:** ${oldVsNew.currentData?.people.total || 0} (was ${oldVsNew.oldData?.people.total || 0})
- **Data Loss:** ${oldVsNew.comparison?.companies.dataLoss || oldVsNew.comparison?.people.dataLoss ? 'YES' : 'NO'}

## Production Readiness Assessment

- **Overall:** ${productionReadiness.overall}
- **Companies:** ${productionReadiness.companies}
- **People:** ${productionReadiness.people}
- **Data Integrity:** ${productionReadiness.dataIntegrity}

## Recommendations

${recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## Next Steps

Based on this audit, the following actions are recommended:

1. **Immediate Actions:** Address all CRITICAL issues
2. **Short-term:** Improve WARNING areas
3. **Long-term:** Maintain data quality standards

---
*Generated by Notary Everyday Production Audit Script*
`;
}

async function main() {
  try {
    console.log('🔍 NOTARY EVERYDAY PRODUCTION READINESS AUDIT');
    console.log('==============================================\n');

    // Connect to databases
    const connected = await connectDatabases();
    if (!connected) {
      process.exit(1);
    }

    // Find workspace
    const workspace = await findNotaryEverydayWorkspace();
    if (!workspace) {
      process.exit(1);
    }

    // Audit data inventory
    const dataInventory = await auditDataInventory(workspace);
    if (!dataInventory) {
      process.exit(1);
    }

    // Audit intelligence
    const companyIntelligence = await auditCompanyIntelligence(workspace);
    const peopleIntelligence = await auditPeopleIntelligence(workspace);

    // Compare old vs new
    const comparison = await compareOldVsNew(workspace);

    // Generate assessment
    const assessment = await generateProductionReadinessAssessment(
      workspace, 
      dataInventory, 
      companyIntelligence, 
      peopleIntelligence, 
      comparison
    );

    // Save results
    await saveAuditResults();

    console.log('\n🎉 Audit complete!');
    console.log(`Overall Status: ${assessment.overall}`);

  } catch (error) {
    console.error('❌ Fatal error during audit:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await oldDbClient.end();
  }
}

// Run the audit
if (require.main === module) {
  main();
}

module.exports = { main };