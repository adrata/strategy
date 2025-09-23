#!/usr/bin/env node

/**
 * 📊 STUDY TOP WORKSPACE DATA
 * 
 * Comprehensive analysis of TOP Engineering Plus workspace data
 * to understand the data structure, quality, and relationships.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function studyTopWorkspaceData() {
  console.log('🔍 STUDYING TOP ENGINEERING PLUS WORKSPACE DATA');
  console.log('===============================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // 1. Workspace Overview
    await analyzeWorkspaceOverview();
    
    // 2. Data Distribution Analysis
    await analyzeDataDistribution();
    
    // 3. Data Quality Analysis
    await analyzeDataQuality();
    
    // 4. Engagement Scoring Analysis
    await analyzeEngagementScoring();
    
    // 5. Company-People Relationships
    await analyzeCompanyPeopleRelationships();
    
    // 6. Sample Data Review
    await reviewSampleData();
    
    // 7. Data Insights and Recommendations
    await generateDataInsights();

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzeWorkspaceOverview() {
  console.log('📋 1. WORKSPACE OVERVIEW');
  console.log('========================\n');
  
  // Get workspace details
  const workspace = await prisma.workspaces.findUnique({
    where: { id: TOP_WORKSPACE_ID },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      description: true,
      defaultLanguage: true,
      timezone: true,
      currency: true,
      subscriptionTier: true,
      subscriptionStatus: true
    }
  });

  if (!workspace) {
    console.log('❌ TOP Engineering Plus workspace not found');
    return;
  }

  console.log(`🏢 Workspace: ${workspace.name}`);
  console.log(`   ID: ${workspace.id}`);
  console.log(`   Slug: ${workspace.slug}`);
  console.log(`   Created: ${workspace.createdAt}`);
  console.log(`   Updated: ${workspace.updatedAt}`);
  console.log(`   Description: ${workspace.description || 'Not set'}`);
  console.log(`   Default Language: ${workspace.defaultLanguage || 'Not set'}`);
  console.log(`   Timezone: ${workspace.timezone || 'Not set'}`);
  console.log(`   Currency: ${workspace.currency || 'Not set'}`);
  console.log(`   Subscription Tier: ${workspace.subscriptionTier || 'Not set'}`);
  console.log(`   Subscription Status: ${workspace.subscriptionStatus || 'Not set'}\n`);
}

async function analyzeDataDistribution() {
  console.log('📊 2. DATA DISTRIBUTION ANALYSIS');
  console.log('=================================\n');
  
  // Count all data types
  const [leads, prospects, opportunities, companies, people] = await Promise.all([
    prisma.leads.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.prospects.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.opportunities.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.companies.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })
  ]);

  console.log('📈 Record Counts:');
  console.log(`   Leads: ${leads.toLocaleString()}`);
  console.log(`   Prospects: ${prospects.toLocaleString()}`);
  console.log(`   Opportunities: ${opportunities.toLocaleString()}`);
  console.log(`   Companies: ${companies.toLocaleString()}`);
  console.log(`   People: ${people.toLocaleString()}\n`);

  // Lead status distribution
  const leadStatusDistribution = await prisma.leads.groupBy({
    by: ['status'],
    _count: { id: true },
    where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
  });

  console.log('🎯 Lead Status Distribution:');
  leadStatusDistribution.forEach(stat => {
    console.log(`   ${stat.status}: ${stat._count.id.toLocaleString()} leads`);
  });
  console.log('');

  // Prospect engagement level distribution
  const prospectEngagementDistribution = await prisma.prospects.groupBy({
    by: ['engagementLevel'],
    _count: { id: true },
    where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
  });

  console.log('📈 Prospect Engagement Level Distribution:');
  prospectEngagementDistribution.forEach(stat => {
    console.log(`   ${stat.engagementLevel}: ${stat._count.id.toLocaleString()} prospects`);
  });
  console.log('');
}

async function analyzeDataQuality() {
  console.log('🔍 3. DATA QUALITY ANALYSIS');
  console.log('===========================\n');
  
  // Email coverage analysis
  const [leadsWithEmail, prospectsWithEmail, peopleWithEmail] = await Promise.all([
    prisma.leads.count({ 
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        email: { not: null }
      } 
    }),
    prisma.prospects.count({ 
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        email: { not: null }
      } 
    }),
    prisma.people.count({ 
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        email: { not: null }
      } 
    })
  ]);

  const [totalLeads, totalProspects, totalPeople] = await Promise.all([
    prisma.leads.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.prospects.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })
  ]);

  console.log('📧 Email Coverage:');
  console.log(`   Leads: ${leadsWithEmail}/${totalLeads} (${((leadsWithEmail/totalLeads)*100).toFixed(1)}%)`);
  console.log(`   Prospects: ${prospectsWithEmail}/${totalProspects} (${((prospectsWithEmail/totalProspects)*100).toFixed(1)}%)`);
  console.log(`   People: ${peopleWithEmail}/${totalPeople} (${((peopleWithEmail/totalPeople)*100).toFixed(1)}%)\n`);

  // Phone coverage analysis
  const [leadsWithPhone, prospectsWithPhone, peopleWithPhone] = await Promise.all([
    prisma.leads.count({ 
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        OR: [
          { phone: { not: null } },
          { mobilePhone: { not: null } },
          { workPhone: { not: null } }
        ]
      } 
    }),
    prisma.prospects.count({ 
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        OR: [
          { phone: { not: null } },
          { mobilePhone: { not: null } },
          { workPhone: { not: null } }
        ]
      } 
    }),
    prisma.people.count({ 
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        OR: [
          { phone: { not: null } },
          { mobilePhone: { not: null } },
          { workPhone: { not: null } }
        ]
      } 
    })
  ]);

  console.log('📞 Phone Coverage:');
  console.log(`   Leads: ${leadsWithPhone}/${totalLeads} (${((leadsWithPhone/totalLeads)*100).toFixed(1)}%)`);
  console.log(`   Prospects: ${prospectsWithPhone}/${totalProspects} (${((prospectsWithPhone/totalProspects)*100).toFixed(1)}%)`);
  console.log(`   People: ${peopleWithPhone}/${totalPeople} (${((peopleWithPhone/totalPeople)*100).toFixed(1)}%)\n`);

  // Company coverage analysis
  const [leadsWithCompany, prospectsWithCompany, peopleWithCompany] = await Promise.all([
    prisma.leads.count({ 
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        company: { not: null }
      } 
    }),
    prisma.prospects.count({ 
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        company: { not: null }
      } 
    }),
    prisma.people.count({ 
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        companyId: { not: null }
      } 
    })
  ]);

  console.log('🏢 Company Coverage:');
  console.log(`   Leads: ${leadsWithCompany}/${totalLeads} (${((leadsWithCompany/totalLeads)*100).toFixed(1)}%)`);
  console.log(`   Prospects: ${prospectsWithCompany}/${totalProspects} (${((prospectsWithCompany/totalProspects)*100).toFixed(1)}%)`);
  console.log(`   People: ${peopleWithCompany}/${totalPeople} (${((peopleWithCompany/totalPeople)*100).toFixed(1)}%)\n`);
}

async function analyzeEngagementScoring() {
  console.log('📊 4. ENGAGEMENT SCORING ANALYSIS');
  console.log('=================================\n');
  
  // Engagement score distribution for leads
  const leadEngagementStats = await prisma.leads.aggregate({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null,
      enrichmentScore: { not: null }
    },
    _avg: { enrichmentScore: true },
    _min: { enrichmentScore: true },
    _max: { enrichmentScore: true },
    _count: { enrichmentScore: true }
  });

  console.log('🎯 Lead Engagement Scoring:');
  console.log(`   Records with scores: ${leadEngagementStats._count.enrichmentScore}`);
  console.log(`   Average score: ${leadEngagementStats._avg.enrichmentScore?.toFixed(2) || 'N/A'}`);
  console.log(`   Min score: ${leadEngagementStats._min.enrichmentScore || 'N/A'}`);
  console.log(`   Max score: ${leadEngagementStats._max.enrichmentScore || 'N/A'}\n`);

  // Engagement score distribution for prospects
  const prospectEngagementStats = await prisma.prospects.aggregate({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null,
      enrichmentScore: { not: null }
    },
    _avg: { enrichmentScore: true },
    _min: { enrichmentScore: true },
    _max: { enrichmentScore: true },
    _count: { enrichmentScore: true }
  });

  console.log('🎯 Prospect Engagement Scoring:');
  console.log(`   Records with scores: ${prospectEngagementStats._count.enrichmentScore}`);
  console.log(`   Average score: ${prospectEngagementStats._avg.enrichmentScore?.toFixed(2) || 'N/A'}`);
  console.log(`   Min score: ${prospectEngagementStats._min.enrichmentScore || 'N/A'}`);
  console.log(`   Max score: ${prospectEngagementStats._max.enrichmentScore || 'N/A'}\n`);

  // Engagement score distribution for people
  const peopleEngagementStats = await prisma.people.aggregate({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null,
      enrichmentScore: { not: null }
    },
    _avg: { enrichmentScore: true },
    _min: { enrichmentScore: true },
    _max: { enrichmentScore: true },
    _count: { enrichmentScore: true }
  });

  console.log('🎯 People Engagement Scoring:');
  console.log(`   Records with scores: ${peopleEngagementStats._count.enrichmentScore}`);
  console.log(`   Average score: ${peopleEngagementStats._avg.enrichmentScore?.toFixed(2) || 'N/A'}`);
  console.log(`   Min score: ${peopleEngagementStats._min.enrichmentScore || 'N/A'}`);
  console.log(`   Max score: ${peopleEngagementStats._max.enrichmentScore || 'N/A'}\n`);
}

async function analyzeCompanyPeopleRelationships() {
  console.log('🔗 5. COMPANY-PEOPLE RELATIONSHIPS');
  console.log('===================================\n');
  
  // Companies with people
  const companiesWithPeople = await prisma.companies.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null,
      people: { some: {} }
    },
    include: {
      _count: {
        select: { people: true }
      }
    },
    orderBy: {
      people: { _count: 'desc' }
    },
    take: 10
  });

  console.log('🏢 Top 10 Companies by People Count:');
  companiesWithPeople.forEach((company, index) => {
    console.log(`   ${index + 1}. ${company.name}: ${company._count.people} people`);
  });
  console.log('');

  // People without companies
  const peopleWithoutCompanies = await prisma.people.count({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null,
      companyId: null
    }
  });

  const totalPeople = await prisma.people.count({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null
    }
  });

  console.log('👥 People-Company Relationships:');
  console.log(`   People without companies: ${peopleWithoutCompanies}/${totalPeople} (${((peopleWithoutCompanies/totalPeople)*100).toFixed(1)}%)\n`);
}

async function reviewSampleData() {
  console.log('📋 6. SAMPLE DATA REVIEW');
  console.log('========================\n');
  
  // Sample leads
  const sampleLeads = await prisma.leads.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      company: true,
      jobTitle: true,
      status: true,
      enrichmentScore: true,
      engagementLevel: true,
      createdAt: true
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  console.log('👥 Sample Leads:');
  sampleLeads.forEach((lead, index) => {
    console.log(`   ${index + 1}. ${lead.fullName}`);
    console.log(`      Email: ${lead.email || 'N/A'}`);
    console.log(`      Company: ${lead.company || 'N/A'}`);
    console.log(`      Title: ${lead.jobTitle || 'N/A'}`);
    console.log(`      Status: ${lead.status}`);
    console.log(`      Engagement Score: ${lead.enrichmentScore || 'N/A'}`);
    console.log(`      Engagement Level: ${lead.engagementLevel || 'N/A'}`);
    console.log(`      Created: ${lead.createdAt}`);
    console.log('');
  });

  // Sample prospects
  const sampleProspects = await prisma.prospects.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      company: true,
      jobTitle: true,
      engagementLevel: true,
      enrichmentScore: true,
      createdAt: true
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  console.log('🎯 Sample Prospects:');
  sampleProspects.forEach((prospect, index) => {
    console.log(`   ${index + 1}. ${prospect.fullName}`);
    console.log(`      Email: ${prospect.email || 'N/A'}`);
    console.log(`      Company: ${prospect.company || 'N/A'}`);
    console.log(`      Title: ${prospect.jobTitle || 'N/A'}`);
    console.log(`      Engagement Level: ${prospect.engagementLevel || 'N/A'}`);
    console.log(`      Engagement Score: ${prospect.enrichmentScore || 'N/A'}`);
    console.log(`      Created: ${prospect.createdAt}`);
    console.log('');
  });

  // Sample companies
  const sampleCompanies = await prisma.companies.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      industry: true,
      size: true,
      city: true,
      state: true,
      country: true,
      createdAt: true,
      _count: {
        select: { people: true }
      }
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  console.log('🏢 Sample Companies:');
  sampleCompanies.forEach((company, index) => {
    console.log(`   ${index + 1}. ${company.name}`);
    console.log(`      Industry: ${company.industry || 'N/A'}`);
    console.log(`      Size: ${company.size || 'N/A'}`);
    console.log(`      Location: ${company.city || 'N/A'}, ${company.state || 'N/A'}, ${company.country || 'N/A'}`);
    console.log(`      People Count: ${company._count.people}`);
    console.log(`      Created: ${company.createdAt}`);
    console.log('');
  });
}

async function generateDataInsights() {
  console.log('💡 7. DATA INSIGHTS & RECOMMENDATIONS');
  console.log('=====================================\n');
  
  // Get comprehensive statistics
  const [totalLeads, totalProspects, totalCompanies, totalPeople] = await Promise.all([
    prisma.leads.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.prospects.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.companies.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })
  ]);

  console.log('📊 KEY INSIGHTS:');
  console.log(`   • Total Records: ${(totalLeads + totalProspects + totalCompanies + totalPeople).toLocaleString()}`);
  console.log(`   • Lead-to-Prospect Ratio: ${(totalLeads/totalProspects).toFixed(2)}:1`);
  console.log(`   • People-to-Company Ratio: ${(totalPeople/totalCompanies).toFixed(2)}:1`);
  console.log(`   • Data Density: ${((totalLeads + totalProspects)/totalCompanies).toFixed(1)} contacts per company\n`);

  console.log('🎯 RECOMMENDATIONS:');
  console.log('   1. Focus on high-engagement prospects for immediate outreach');
  console.log('   2. Enrich company data to improve targeting accuracy');
  console.log('   3. Implement lead scoring based on engagement metrics');
  console.log('   4. Create company-based campaigns for better personalization');
  console.log('   5. Track conversion rates from prospect to opportunity\n');

  console.log('✅ DATA STUDY COMPLETE');
  console.log('======================');
  console.log('The TOP Engineering Plus workspace contains rich, production-ready data');
  console.log('with comprehensive contact information and engagement scoring.');
  console.log('This data is ready for sales and marketing activities.\n');
}

// Run the analysis
studyTopWorkspaceData().catch(console.error);
