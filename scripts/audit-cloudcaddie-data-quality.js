#!/usr/bin/env node

/**
 * 🔍 CLOUDCADDIE DATA QUALITY AUDIT
 * 
 * Detailed audit of actual data in CloudCaddie records:
 * - Contact information (emails, phones)
 * - Intelligence data quality
 * - Data completeness and accuracy
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditCloudCaddieDataQuality() {
  try {
    console.log('🔍 CLOUDCADDIE DATA QUALITY AUDIT');
    console.log('==================================\n');
    
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
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Get all companies with detailed data
    const companies = await prisma.companies.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        name: true,
        domain: true,
        website: true,
        email: true,
        phone: true,
        industry: true,
        size: true,
        description: true,
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
      },
      orderBy: { name: 'asc' }
    });

    // Get all people with detailed data
    const people = await prisma.people.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        department: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        linkedinUrl: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        },
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
      orderBy: { fullName: 'asc' }
    });

    console.log(`📊 AUDITING ${companies.length} COMPANIES AND ${people.length} PEOPLE\n`);

    // COMPANY DATA QUALITY ANALYSIS
    console.log('🏢 COMPANY DATA QUALITY ANALYSIS:');
    console.log('==================================');

    const companyDataQuality = {
      total: companies.length,
      hasDomain: companies.filter(c => c.domain && c.domain.trim() !== '').length,
      hasWebsite: companies.filter(c => c.website && c.website.trim() !== '').length,
      hasEmail: companies.filter(c => c.email && c.email.trim() !== '').length,
      hasPhone: companies.filter(c => c.phone && c.phone.trim() !== '').length,
      hasDescription: companies.filter(c => c.description && c.description.trim() !== '').length,
      hasIntelligence: companies.filter(c => c.companyIntelligence && c.companyIntelligence !== null).length,
      hasBusinessChallenges: companies.filter(c => c.businessChallenges && c.businessChallenges.length > 0).length,
      hasBusinessPriorities: companies.filter(c => c.businessPriorities && c.businessPriorities.length > 0).length,
      hasCompetitiveAdvantages: companies.filter(c => c.competitiveAdvantages && c.competitiveAdvantages.length > 0).length,
      hasGrowthOpportunities: companies.filter(c => c.growthOpportunities && c.growthOpportunities.length > 0).length,
      hasStrategicInitiatives: companies.filter(c => c.strategicInitiatives && c.strategicInitiatives.length > 0).length,
      hasSuccessMetrics: companies.filter(c => c.successMetrics && c.successMetrics.length > 0).length,
      hasMarketPosition: companies.filter(c => c.marketPosition && c.marketPosition.trim() !== '').length,
      hasDigitalMaturity: companies.filter(c => c.digitalMaturity !== null && c.digitalMaturity !== undefined).length,
      hasTechStack: companies.filter(c => c.techStack && c.techStack.length > 0).length,
      hasCompetitors: companies.filter(c => c.competitors && c.competitors.length > 0).length,
      hasConfidence: companies.filter(c => c.confidence !== null && c.confidence !== undefined).length,
      hasLastVerified: companies.filter(c => c.lastVerified !== null).length
    };

    console.log('📋 Company Data Completeness:');
    console.table({
      'Total Companies': [companyDataQuality.total],
      'Has Domain': [companyDataQuality.hasDomain, `${((companyDataQuality.hasDomain / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Website': [companyDataQuality.hasWebsite, `${((companyDataQuality.hasWebsite / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Email': [companyDataQuality.hasEmail, `${((companyDataQuality.hasEmail / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Phone': [companyDataQuality.hasPhone, `${((companyDataQuality.hasPhone / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Description': [companyDataQuality.hasDescription, `${((companyDataQuality.hasDescription / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Intelligence': [companyDataQuality.hasIntelligence, `${((companyDataQuality.hasIntelligence / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Business Challenges': [companyDataQuality.hasBusinessChallenges, `${((companyDataQuality.hasBusinessChallenges / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Business Priorities': [companyDataQuality.hasBusinessPriorities, `${((companyDataQuality.hasBusinessPriorities / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Competitive Advantages': [companyDataQuality.hasCompetitiveAdvantages, `${((companyDataQuality.hasCompetitiveAdvantages / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Growth Opportunities': [companyDataQuality.hasGrowthOpportunities, `${((companyDataQuality.hasGrowthOpportunities / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Strategic Initiatives': [companyDataQuality.hasStrategicInitiatives, `${((companyDataQuality.hasStrategicInitiatives / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Success Metrics': [companyDataQuality.hasSuccessMetrics, `${((companyDataQuality.hasSuccessMetrics / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Market Position': [companyDataQuality.hasMarketPosition, `${((companyDataQuality.hasMarketPosition / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Digital Maturity': [companyDataQuality.hasDigitalMaturity, `${((companyDataQuality.hasDigitalMaturity / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Tech Stack': [companyDataQuality.hasTechStack, `${((companyDataQuality.hasTechStack / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Competitors': [companyDataQuality.hasCompetitors, `${((companyDataQuality.hasCompetitors / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Confidence Score': [companyDataQuality.hasConfidence, `${((companyDataQuality.hasConfidence / companyDataQuality.total) * 100).toFixed(1)}%`],
      'Has Last Verified': [companyDataQuality.hasLastVerified, `${((companyDataQuality.hasLastVerified / companyDataQuality.total) * 100).toFixed(1)}%`]
    });

    // PEOPLE DATA QUALITY ANALYSIS
    console.log('\n👥 PEOPLE DATA QUALITY ANALYSIS:');
    console.log('=================================');

    const peopleDataQuality = {
      total: people.length,
      hasEmail: people.filter(p => p.email && p.email.trim() !== '').length,
      hasWorkEmail: people.filter(p => p.workEmail && p.workEmail.trim() !== '').length,
      hasPersonalEmail: people.filter(p => p.personalEmail && p.personalEmail.trim() !== '').length,
      hasAnyEmail: people.filter(p => (p.email && p.email.trim() !== '') || (p.workEmail && p.workEmail.trim() !== '') || (p.personalEmail && p.personalEmail.trim() !== '')).length,
      hasPhone: people.filter(p => p.phone && p.phone.trim() !== '').length,
      hasMobilePhone: people.filter(p => p.mobilePhone && p.mobilePhone.trim() !== '').length,
      hasWorkPhone: people.filter(p => p.workPhone && p.workPhone.trim() !== '').length,
      hasAnyPhone: people.filter(p => (p.phone && p.phone.trim() !== '') || (p.mobilePhone && p.mobilePhone.trim() !== '') || (p.workPhone && p.workPhone.trim() !== '')).length,
      hasLinkedIn: people.filter(p => p.linkedinUrl && p.linkedinUrl.trim() !== '').length,
      hasJobTitle: people.filter(p => p.jobTitle && p.jobTitle.trim() !== '').length,
      hasDepartment: people.filter(p => p.department && p.department.trim() !== '').length,
      hasEnrichmentScore: people.filter(p => p.enrichmentScore !== null && p.enrichmentScore !== undefined).length,
      hasLastEnriched: people.filter(p => p.lastEnriched !== null).length,
      hasBuyerGroupRole: people.filter(p => p.buyerGroupRole && p.buyerGroupRole.trim() !== '').length,
      hasDecisionPower: people.filter(p => p.decisionPower !== null && p.decisionPower !== undefined).length,
      hasInfluenceLevel: people.filter(p => p.influenceLevel && p.influenceLevel.trim() !== '').length,
      hasEngagementLevel: people.filter(p => p.engagementLevel && p.engagementLevel.trim() !== '').length,
      hasBuyerGroupStatus: people.filter(p => p.buyerGroupStatus && p.buyerGroupStatus.trim() !== '').length,
      hasIsBuyerGroupMember: people.filter(p => p.isBuyerGroupMember !== null && p.isBuyerGroupMember !== undefined).length,
      hasBuyerGroupOptimized: people.filter(p => p.buyerGroupOptimized !== null && p.buyerGroupOptimized !== undefined).length,
      hasDecisionMaking: people.filter(p => p.decisionMaking && p.decisionMaking.trim() !== '').length,
      hasCommunicationStyle: people.filter(p => p.communicationStyle && p.communicationStyle.trim() !== '').length,
      hasEngagementStrategy: people.filter(p => p.engagementStrategy && p.engagementStrategy.trim() !== '').length,
      hasCoresignalData: people.filter(p => p.coresignalData && p.coresignalData !== null).length,
      hasEnrichedData: people.filter(p => p.enrichedData && p.enrichedData !== null).length
    };

    console.log('📋 People Data Completeness:');
    console.table({
      'Total People': [peopleDataQuality.total],
      'Has Email': [peopleDataQuality.hasEmail, `${((peopleDataQuality.hasEmail / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Work Email': [peopleDataQuality.hasWorkEmail, `${((peopleDataQuality.hasWorkEmail / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Personal Email': [peopleDataQuality.hasPersonalEmail, `${((peopleDataQuality.hasPersonalEmail / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Any Email': [peopleDataQuality.hasAnyEmail, `${((peopleDataQuality.hasAnyEmail / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Phone': [peopleDataQuality.hasPhone, `${((peopleDataQuality.hasPhone / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Mobile Phone': [peopleDataQuality.hasMobilePhone, `${((peopleDataQuality.hasMobilePhone / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Work Phone': [peopleDataQuality.hasWorkPhone, `${((peopleDataQuality.hasWorkPhone / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Any Phone': [peopleDataQuality.hasAnyPhone, `${((peopleDataQuality.hasAnyPhone / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has LinkedIn': [peopleDataQuality.hasLinkedIn, `${((peopleDataQuality.hasLinkedIn / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Job Title': [peopleDataQuality.hasJobTitle, `${((peopleDataQuality.hasJobTitle / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Department': [peopleDataQuality.hasDepartment, `${((peopleDataQuality.hasDepartment / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Enrichment Score': [peopleDataQuality.hasEnrichmentScore, `${((peopleDataQuality.hasEnrichmentScore / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Last Enriched': [peopleDataQuality.hasLastEnriched, `${((peopleDataQuality.hasLastEnriched / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Buyer Group Role': [peopleDataQuality.hasBuyerGroupRole, `${((peopleDataQuality.hasBuyerGroupRole / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Decision Power': [peopleDataQuality.hasDecisionPower, `${((peopleDataQuality.hasDecisionPower / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Influence Level': [peopleDataQuality.hasInfluenceLevel, `${((peopleDataQuality.hasInfluenceLevel / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Engagement Level': [peopleDataQuality.hasEngagementLevel, `${((peopleDataQuality.hasEngagementLevel / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Buyer Group Status': [peopleDataQuality.hasBuyerGroupStatus, `${((peopleDataQuality.hasBuyerGroupStatus / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Is Buyer Group Member': [peopleDataQuality.hasIsBuyerGroupMember, `${((peopleDataQuality.hasIsBuyerGroupMember / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Buyer Group Optimized': [peopleDataQuality.hasBuyerGroupOptimized, `${((peopleDataQuality.hasBuyerGroupOptimized / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Decision Making': [peopleDataQuality.hasDecisionMaking, `${((peopleDataQuality.hasDecisionMaking / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Communication Style': [peopleDataQuality.hasCommunicationStyle, `${((peopleDataQuality.hasCommunicationStyle / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Engagement Strategy': [peopleDataQuality.hasEngagementStrategy, `${((peopleDataQuality.hasEngagementStrategy / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Coresignal Data': [peopleDataQuality.hasCoresignalData, `${((peopleDataQuality.hasCoresignalData / peopleDataQuality.total) * 100).toFixed(1)}%`],
      'Has Enriched Data': [peopleDataQuality.hasEnrichedData, `${((peopleDataQuality.hasEnrichedData / peopleDataQuality.total) * 100).toFixed(1)}%`]
    });

    // SAMPLE DATA EXAMPLES
    console.log('\n📋 SAMPLE COMPANY DATA:');
    console.log('========================');
    
    const sampleCompanies = companies.slice(0, 3);
    for (const company of sampleCompanies) {
      console.log(`\n🏢 ${company.name}:`);
      console.log(`   Domain: ${company.domain || '❌ Missing'}`);
      console.log(`   Website: ${company.website || '❌ Missing'}`);
      console.log(`   Email: ${company.email || '❌ Missing'}`);
      console.log(`   Phone: ${company.phone || '❌ Missing'}`);
      console.log(`   Industry: ${company.industry || '❌ Missing'}`);
      console.log(`   Size: ${company.size || '❌ Missing'}`);
      console.log(`   Intelligence: ${company.companyIntelligence ? '✅ Present' : '❌ Missing'}`);
      console.log(`   Business Challenges: ${company.businessChallenges?.length || 0} items`);
      console.log(`   Business Priorities: ${company.businessPriorities?.length || 0} items`);
      console.log(`   Competitive Advantages: ${company.competitiveAdvantages?.length || 0} items`);
      console.log(`   Growth Opportunities: ${company.growthOpportunities?.length || 0} items`);
      console.log(`   Strategic Initiatives: ${company.strategicInitiatives?.length || 0} items`);
      console.log(`   Success Metrics: ${company.successMetrics?.length || 0} items`);
      console.log(`   Market Position: ${company.marketPosition || '❌ Missing'}`);
      console.log(`   Digital Maturity: ${company.digitalMaturity || '❌ Missing'}`);
      console.log(`   Tech Stack: ${company.techStack?.length || 0} items`);
      console.log(`   Competitors: ${company.competitors?.length || 0} items`);
      console.log(`   Confidence: ${company.confidence || '❌ Missing'}`);
      console.log(`   Last Verified: ${company.lastVerified ? company.lastVerified.toISOString().split('T')[0] : '❌ Never'}`);
    }

    console.log('\n📋 SAMPLE PEOPLE DATA:');
    console.log('=======================');
    
    const samplePeople = people.slice(0, 3);
    for (const person of samplePeople) {
      console.log(`\n👤 ${person.fullName} (${person.company?.name || 'No Company'}):`);
      console.log(`   Job Title: ${person.jobTitle || '❌ Missing'}`);
      console.log(`   Department: ${person.department || '❌ Missing'}`);
      console.log(`   Email: ${person.email || '❌ Missing'}`);
      console.log(`   Work Email: ${person.workEmail || '❌ Missing'}`);
      console.log(`   Personal Email: ${person.personalEmail || '❌ Missing'}`);
      console.log(`   Phone: ${person.phone || '❌ Missing'}`);
      console.log(`   Mobile Phone: ${person.mobilePhone || '❌ Missing'}`);
      console.log(`   Work Phone: ${person.workPhone || '❌ Missing'}`);
      console.log(`   LinkedIn: ${person.linkedinUrl || '❌ Missing'}`);
      console.log(`   Enrichment Score: ${person.enrichmentScore || '❌ Missing'}`);
      console.log(`   Last Enriched: ${person.lastEnriched ? person.lastEnriched.toISOString().split('T')[0] : '❌ Never'}`);
      console.log(`   Buyer Group Role: ${person.buyerGroupRole || '❌ Missing'}`);
      console.log(`   Decision Power: ${person.decisionPower || '❌ Missing'}`);
      console.log(`   Influence Level: ${person.influenceLevel || '❌ Missing'}`);
      console.log(`   Engagement Level: ${person.engagementLevel || '❌ Missing'}`);
      console.log(`   Buyer Group Status: ${person.buyerGroupStatus || '❌ Missing'}`);
      console.log(`   Is Buyer Group Member: ${person.isBuyerGroupMember !== null ? person.isBuyerGroupMember : '❌ Missing'}`);
      console.log(`   Buyer Group Optimized: ${person.buyerGroupOptimized !== null ? person.buyerGroupOptimized : '❌ Missing'}`);
      console.log(`   Decision Making: ${person.decisionMaking || '❌ Missing'}`);
      console.log(`   Communication Style: ${person.communicationStyle || '❌ Missing'}`);
      console.log(`   Engagement Strategy: ${person.engagementStrategy || '❌ Missing'}`);
      console.log(`   Coresignal Data: ${person.coresignalData ? '✅ Present' : '❌ Missing'}`);
      console.log(`   Enriched Data: ${person.enrichedData ? '✅ Present' : '❌ Missing'}`);
    }

    // DATA QUALITY SUMMARY
    console.log('\n🎯 DATA QUALITY SUMMARY:');
    console.log('=========================');
    
    const companyContactQuality = ((companyDataQuality.hasEmail + companyDataQuality.hasPhone) / (companyDataQuality.total * 2)) * 100;
    const peopleContactQuality = ((peopleDataQuality.hasAnyEmail + peopleDataQuality.hasAnyPhone) / (peopleDataQuality.total * 2)) * 100;
    const companyIntelligenceQuality = ((companyDataQuality.hasIntelligence + companyDataQuality.hasBusinessChallenges + companyDataQuality.hasBusinessPriorities) / (companyDataQuality.total * 3)) * 100;
    const peopleIntelligenceQuality = ((peopleDataQuality.hasBuyerGroupRole + peopleDataQuality.hasDecisionPower + peopleDataQuality.hasInfluenceLevel) / (peopleDataQuality.total * 3)) * 100;

    console.log(`📊 Company Contact Quality: ${companyContactQuality.toFixed(1)}%`);
    console.log(`📊 People Contact Quality: ${peopleContactQuality.toFixed(1)}%`);
    console.log(`📊 Company Intelligence Quality: ${companyIntelligenceQuality.toFixed(1)}%`);
    console.log(`📊 People Intelligence Quality: ${peopleIntelligenceQuality.toFixed(1)}%`);
    
    const overallQuality = (companyContactQuality + peopleContactQuality + companyIntelligenceQuality + peopleIntelligenceQuality) / 4;
    console.log(`📊 Overall Data Quality: ${overallQuality.toFixed(1)}%`);

    // RECOMMENDATIONS
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('===================');
    
    if (companyContactQuality < 50) {
      console.log('⚠️  WARNING: Low company contact information - need to add more emails and phones');
    } else {
      console.log('✅ Good company contact information coverage');
    }

    if (peopleContactQuality < 50) {
      console.log('⚠️  WARNING: Low people contact information - need to add more emails and phones');
    } else {
      console.log('✅ Good people contact information coverage');
    }

    if (companyIntelligenceQuality < 80) {
      console.log('⚠️  WARNING: Company intelligence needs improvement - run enrichment');
    } else {
      console.log('✅ Good company intelligence coverage');
    }

    if (peopleIntelligenceQuality < 80) {
      console.log('⚠️  WARNING: People intelligence needs improvement - run enrichment');
    } else {
      console.log('✅ Good people intelligence coverage');
    }

    if (overallQuality >= 80) {
      console.log('🎉 EXCELLENT: CloudCaddie workspace has high-quality data ready for sales activities!');
    } else if (overallQuality >= 60) {
      console.log('✅ GOOD: CloudCaddie workspace has decent data quality with room for improvement');
    } else {
      console.log('⚠️  NEEDS WORK: CloudCaddie workspace needs significant data quality improvements');
    }

    console.log('\n🎉 Data quality audit complete!');

  } catch (error) {
    console.error('❌ Error during data quality audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
if (require.main === module) {
  auditCloudCaddieDataQuality();
}

module.exports = { auditCloudCaddieDataQuality };
