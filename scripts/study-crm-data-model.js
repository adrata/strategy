#!/usr/bin/env node

/**
 * 🔍 STUDY CRM DATA MODEL
 * 
 * This script analyzes the current data structure against CRM best practices
 * to understand how leads, prospects, opportunities, people, and companies should relate.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function studyCrmDataModel() {
  console.log('🔍 STUDYING CRM DATA MODEL AGAINST BEST PRACTICES');
  console.log('=================================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // 1. Industry Best Practices Overview
    await showBestPractices();
    
    // 2. Current Data Structure Analysis
    await analyzeCurrentStructure();
    
    // 3. Data Flow Analysis
    await analyzeDataFlow();
    
    // 4. Relationship Analysis
    await analyzeRelationships();
    
    // 5. Recommendations
    await generateRecommendations();

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function showBestPractices() {
  console.log('📚 1. CRM BEST PRACTICES (Industry Standard)');
  console.log('============================================\n');
  
  console.log('🏗️ PROPER CRM DATA MODEL:');
  console.log('');
  console.log('   LEAD → CONTACT → OPPORTUNITY');
  console.log('     ↓        ↓         ↓');
  console.log('   COMPANY ← COMPANY → COMPANY');
  console.log('');
  console.log('📋 ENTITY DEFINITIONS:');
  console.log('   • LEAD: Unqualified individual/organization showing interest');
  console.log('   • CONTACT: Qualified individual (converted from lead)');
  console.log('   • COMPANY: Business entity/organization');
  console.log('   • PROSPECT: Qualified lead ready for sales engagement');
  console.log('   • OPPORTUNITY: Potential revenue-generating deal');
  console.log('');
  console.log('🔄 PROPER DATA FLOW:');
  console.log('   1. Lead captured (unqualified)');
  console.log('   2. Lead qualified → becomes Contact');
  console.log('   3. Contact associated with Company');
  console.log('   4. Qualified Contact → becomes Prospect');
  console.log('   5. Prospect → Opportunity created');
  console.log('   6. Opportunity linked to Company + Contact');
  console.log('');
  console.log('✅ CORRECT RELATIONSHIPS:');
  console.log('   • 1 Lead = 1 Contact (after conversion)');
  console.log('   • 1 Contact = 1 Person (individual)');
  console.log('   • 1 Company = Multiple Contacts');
  console.log('   • 1 Opportunity = 1 Company + 1+ Contacts');
  console.log('   • People = Leads + Prospects (unique individuals)');
  console.log('');
}

async function analyzeCurrentStructure() {
  console.log('📊 2. CURRENT DATA STRUCTURE ANALYSIS');
  console.log('====================================\n');
  
  const [peopleCount, leadsCount, prospectsCount, opportunitiesCount, companiesCount] = await Promise.all([
    prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.leads.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.prospects.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.opportunities.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.companies.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })
  ]);

  console.log('📈 CURRENT RECORD COUNTS:');
  console.log(`   People: ${peopleCount.toLocaleString()}`);
  console.log(`   Leads: ${leadsCount.toLocaleString()}`);
  console.log(`   Prospects: ${prospectsCount.toLocaleString()}`);
  console.log(`   Opportunities: ${opportunitiesCount.toLocaleString()}`);
  console.log(`   Companies: ${companiesCount.toLocaleString()}`);
  console.log('');

  console.log('🔍 DATA STRUCTURE ANALYSIS:');
  console.log(`   Expected: People = Leads + Prospects (${leadsCount + prospectsCount})`);
  console.log(`   Actual: People = ${peopleCount}`);
  console.log(`   Difference: ${Math.abs(peopleCount - (leadsCount + prospectsCount))} records`);
  console.log('');

  if (peopleCount === leadsCount + prospectsCount) {
    console.log('✅ DATA STRUCTURE: CORRECT');
    console.log('   People count matches leads + prospects count');
  } else if (peopleCount > leadsCount + prospectsCount) {
    console.log('⚠️  DATA STRUCTURE: TOO MANY PEOPLE');
    console.log(`   ${peopleCount - (leadsCount + prospectsCount)} extra people records`);
  } else {
    console.log('⚠️  DATA STRUCTURE: TOO MANY LEADS/PROSPECTS');
    console.log(`   ${(leadsCount + prospectsCount) - peopleCount} extra lead/prospect records`);
  }
  console.log('');
}

async function analyzeDataFlow() {
  console.log('🔄 3. DATA FLOW ANALYSIS');
  console.log('=======================\n');
  
  // Check lead status distribution
  const leadStatusDistribution = await prisma.leads.groupBy({
    by: ['status'],
    _count: { id: true },
    where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
  });

  console.log('📊 LEAD STATUS DISTRIBUTION:');
  leadStatusDistribution.forEach(stat => {
    console.log(`   ${stat.status}: ${stat._count.id.toLocaleString()} leads`);
  });
  console.log('');

  // Check prospect engagement levels
  const prospectEngagementDistribution = await prisma.prospects.groupBy({
    by: ['engagementLevel'],
    _count: { id: true },
    where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
  });

  console.log('📊 PROSPECT ENGAGEMENT DISTRIBUTION:');
  prospectEngagementDistribution.forEach(stat => {
    console.log(`   ${stat.engagementLevel}: ${stat._count.id.toLocaleString()} prospects`);
  });
  console.log('');

  // Check opportunity stages
  const opportunityStageDistribution = await prisma.opportunities.groupBy({
    by: ['stage'],
    _count: { id: true },
    where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
  });

  console.log('📊 OPPORTUNITY STAGE DISTRIBUTION:');
  if (opportunityStageDistribution.length === 0) {
    console.log('   No opportunities found');
  } else {
    opportunityStageDistribution.forEach(stat => {
      console.log(`   ${stat.stage}: ${stat._count.id.toLocaleString()} opportunities`);
    });
  }
  console.log('');

  // Check data flow issues
  console.log('🔍 DATA FLOW ANALYSIS:');
  const allNewLeads = leadStatusDistribution.find(s => s.status === 'new');
  const allInitialProspects = prospectEngagementDistribution.find(s => s.engagementLevel === 'initial');
  
  if (allNewLeads && allNewLeads._count.id === await prisma.leads.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })) {
    console.log('⚠️  ISSUE: All leads are in "new" status');
    console.log('   This suggests leads haven\'t been qualified or converted');
  }
  
  if (allInitialProspects && allInitialProspects._count.id === await prisma.prospects.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })) {
    console.log('⚠️  ISSUE: All prospects are in "initial" engagement level');
    console.log('   This suggests prospects haven\'t been properly engaged');
  }
  
  if (await prisma.opportunities.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }) === 0) {
    console.log('⚠️  ISSUE: No opportunities created');
    console.log('   This suggests the sales pipeline hasn\'t been activated');
  }
  console.log('');
}

async function analyzeRelationships() {
  console.log('🔗 4. RELATIONSHIP ANALYSIS');
  console.log('===========================\n');
  
  // Check personId references
  const [leadsWithPersonId, prospectsWithPersonId] = await Promise.all([
    prisma.leads.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: { not: null }
      }
    }),
    prisma.prospects.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: { not: null }
      }
    })
  ]);

  const [totalLeads, totalProspects] = await Promise.all([
    prisma.leads.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.prospects.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })
  ]);

  console.log('🔗 PERSONID REFERENCES:');
  console.log(`   Leads with personId: ${leadsWithPersonId}/${totalLeads} (${((leadsWithPersonId/totalLeads)*100).toFixed(1)}%)`);
  console.log(`   Prospects with personId: ${prospectsWithPersonId}/${totalProspects} (${((prospectsWithPersonId/totalProspects)*100).toFixed(1)}%)\n`);

  // Check company relationships
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

  console.log('🏢 COMPANY RELATIONSHIPS:');
  console.log(`   Leads with company: ${leadsWithCompany}/${totalLeads} (${((leadsWithCompany/totalLeads)*100).toFixed(1)}%)`);
  console.log(`   Prospects with company: ${prospectsWithCompany}/${totalProspects} (${((prospectsWithCompany/totalProspects)*100).toFixed(1)}%)`);
  console.log(`   People with company: ${peopleWithCompany}/${await prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })} (${((peopleWithCompany/await prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }))*100).toFixed(1)}%)\n`);

  // Check for duplicates
  const [peopleEmails, leadsEmails, prospectsEmails] = await Promise.all([
    prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null, email: { not: null } },
      select: { email: true }
    }),
    prisma.leads.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null, email: { not: null } },
      select: { email: true }
    }),
    prisma.prospects.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null, email: { not: null } },
      select: { email: true }
    })
  ]);

  const peopleEmailSet = new Set(peopleEmails.map(p => p.email.toLowerCase()));
  const leadsEmailSet = new Set(leadsEmails.map(l => l.email.toLowerCase()));
  const prospectsEmailSet = new Set(prospectsEmails.map(p => p.email.toLowerCase()));

  const peopleLeadsOverlap = [...peopleEmailSet].filter(email => leadsEmailSet.has(email));
  const peopleProspectsOverlap = [...peopleEmailSet].filter(email => prospectsEmailSet.has(email));
  const leadsProspectsOverlap = [...leadsEmailSet].filter(email => prospectsEmailSet.has(email));

  console.log('🔄 DUPLICATE ANALYSIS:');
  console.log(`   People-Leads email overlap: ${peopleLeadsOverlap.length} emails`);
  console.log(`   People-Prospects email overlap: ${peopleProspectsOverlap.length} emails`);
  console.log(`   Leads-Prospects email overlap: ${leadsProspectsOverlap.length} emails\n`);
}

async function generateRecommendations() {
  console.log('💡 5. RECOMMENDATIONS');
  console.log('====================\n');
  
  const [peopleCount, leadsCount, prospectsCount] = await Promise.all([
    prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.leads.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.prospects.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })
  ]);

  const totalLeadsProspects = leadsCount + prospectsCount;
  const difference = Math.abs(peopleCount - totalLeadsProspects);

  console.log('🎯 IMMEDIATE ACTIONS NEEDED:');
  console.log('');
  
  if (difference > 0) {
    console.log('1. 🔧 FIX DATA STRUCTURE:');
    if (peopleCount > totalLeadsProspects) {
      console.log(`   • Remove ${difference} extra people records`);
      console.log('   • Ensure each person has exactly one lead OR one prospect');
    } else {
      console.log(`   • Create ${difference} missing people records`);
      console.log('   • Ensure each lead/prospect has exactly one person record');
    }
    console.log('');
  }

  console.log('2. 🔄 IMPLEMENT PROPER DATA FLOW:');
  console.log('   • Convert qualified leads to prospects');
  console.log('   • Create opportunities from qualified prospects');
  console.log('   • Link all records to proper companies');
  console.log('');

  console.log('3. 🏢 ESTABLISH COMPANY RELATIONSHIPS:');
  console.log('   • Link leads to companies');
  console.log('   • Link prospects to companies');
  console.log('   • Ensure people are linked to companies');
  console.log('');

  console.log('4. 📊 ACTIVATE SALES PIPELINE:');
  console.log('   • Move leads from "new" to qualified status');
  console.log('   • Move prospects from "initial" to engaged status');
  console.log('   • Create opportunities for qualified prospects');
  console.log('');

  console.log('✅ EXPECTED FINAL STRUCTURE:');
  console.log(`   • People: ${totalLeadsProspects} (exactly matching leads + prospects)`);
  console.log(`   • Leads: ${leadsCount} (unqualified individuals)`);
  console.log(`   • Prospects: ${prospectsCount} (qualified individuals)`);
  console.log(`   • Opportunities: >0 (active sales pipeline)`);
  console.log(`   • Companies: Linked to all people/leads/prospects`);
  console.log('');

  console.log('🎯 SUCCESS METRICS:');
  console.log('   • People = Leads + Prospects (exact match)');
  console.log('   • 100% of leads/prospects have personId references');
  console.log('   • 100% of people linked to companies');
  console.log('   • Active opportunities in pipeline');
  console.log('   • Proper lead qualification workflow');
  console.log('');
}

// Run the analysis
studyCrmDataModel().catch(console.error);
