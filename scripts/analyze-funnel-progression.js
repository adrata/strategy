#!/usr/bin/env node

/**
 * 🔍 ANALYZE FUNNEL PROGRESSION
 * 
 * This script analyzes the current funnel progression to understand
 * if we have proper Lead → Prospect → Opportunity flow or duplicates.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function analyzeFunnelProgression() {
  console.log('🔍 ANALYZING FUNNEL PROGRESSION');
  console.log('===============================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get all leads with their People records
    const leadsWithPeople = await prisma.leads.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        personId: true,
        status: true
      }
    });

    // Get all prospects with their People records
    const prospectsWithPeople = await prisma.prospects.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        personId: true,
        status: true
      }
    });

    // Get all opportunities
    const opportunities = await prisma.opportunities.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        personId: true,
        stage: true
      }
    });

    console.log('📊 CURRENT FUNNEL STATE:');
    console.log(`   Leads: ${leadsWithPeople.length}`);
    console.log(`   Prospects: ${prospectsWithPeople.length}`);
    console.log(`   Opportunities: ${opportunities.length}\n`);

    // Analyze duplicates between leads and prospects
    const leadPersonIds = new Set(leadsWithPeople.map(l => l.personId));
    const prospectPersonIds = new Set(prospectsWithPeople.map(p => p.personId));
    
    const duplicatePersonIds = new Set([...leadPersonIds].filter(id => prospectPersonIds.has(id)));
    
    console.log('🔍 DUPLICATE ANALYSIS:');
    console.log(`   Unique People in Leads: ${leadPersonIds.size}`);
    console.log(`   Unique People in Prospects: ${prospectPersonIds.size}`);
    console.log(`   People in BOTH Leads AND Prospects: ${duplicatePersonIds.size}\n`);

    if (duplicatePersonIds.size > 0) {
      console.log('⚠️  ISSUE IDENTIFIED: People exist in multiple funnel stages');
      console.log('   This violates proper funnel progression!\n');
      
      // Show some examples
      const duplicateExamples = Array.from(duplicatePersonIds).slice(0, 5);
      console.log('📋 EXAMPLES OF DUPLICATES:');
      
      for (const personId of duplicateExamples) {
        const lead = leadsWithPeople.find(l => l.personId === personId);
        const prospect = prospectsWithPeople.find(p => p.personId === personId);
        
        console.log(`   Person: ${lead.fullName} (${lead.email})`);
        console.log(`     Lead ID: ${lead.id} (Status: ${lead.status})`);
        console.log(`     Prospect ID: ${prospect.id} (Status: ${prospect.status})`);
        console.log('');
      }
    } else {
      console.log('✅ SUCCESS: No duplicates found - proper funnel progression!\n');
    }

    // Analyze funnel progression
    console.log('📈 FUNNEL PROGRESSION ANALYSIS:');
    
    const leadStatuses = await prisma.leads.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });
    
    const prospectStatuses = await prisma.prospects.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });
    
    const opportunityStages = await prisma.opportunities.groupBy({
      by: ['stage'],
      _count: { id: true },
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    console.log('   LEAD STATUSES:');
    leadStatuses.forEach(s => console.log(`     ${s.status}: ${s._count.id.toLocaleString()}`));
    
    console.log('   PROSPECT STATUSES:');
    prospectStatuses.forEach(s => console.log(`     ${s.status}: ${s._count.id.toLocaleString()}`));
    
    console.log('   OPPORTUNITY STAGES:');
    if (opportunityStages.length === 0) {
      console.log('     No opportunities found');
    } else {
      opportunityStages.forEach(s => console.log(`     ${s.stage}: ${s._count.id.toLocaleString()}`));
    }
    console.log('');

    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    if (duplicatePersonIds.size > 0) {
      console.log('   1. 🔧 FIX DUPLICATES: Move people from Lead to Prospect (not both)');
      console.log('   2. 📊 IMPLEMENT PROPER FUNNEL: Lead → Prospect → Opportunity');
      console.log('   3. 🎯 QUALIFY LEADS: Convert qualified leads to prospects');
      console.log('   4. 🚀 CREATE OPPORTUNITIES: From qualified prospects\n');
    } else {
      console.log('   ✅ Funnel progression is correct!');
      console.log('   🎯 Next: Create opportunities from qualified prospects\n');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeFunnelProgression().catch(console.error);
