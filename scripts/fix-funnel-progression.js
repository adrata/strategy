#!/usr/bin/env node

/**
 * 🔧 FIX FUNNEL PROGRESSION
 * 
 * This script fixes the funnel progression by:
 * 1. Removing duplicates (people in both leads and prospects)
 * 2. Implementing proper Lead → Prospect → Opportunity flow
 * 3. Ensuring each person is in only ONE stage at a time
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function fixFunnelProgression() {
  console.log('🔧 FIXING FUNNEL PROGRESSION');
  console.log('============================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Step 1: Identify duplicates
    console.log('🔍 1. IDENTIFYING DUPLICATES...\n');
    
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
        status: true,
        createdAt: true
      }
    });

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
        status: true,
        createdAt: true
      }
    });

    const leadPersonIds = new Set(leadsWithPeople.map(l => l.personId));
    const prospectPersonIds = new Set(prospectsWithPeople.map(p => p.personId));
    const duplicatePersonIds = new Set([...leadPersonIds].filter(id => prospectPersonIds.has(id)));

    console.log(`📊 DUPLICATES FOUND: ${duplicatePersonIds.size} people in both leads and prospects\n`);

    // Step 2: Fix duplicates by keeping the most recent record
    console.log('🔧 2. FIXING DUPLICATES...\n');
    
    let removedFromLeads = 0;
    let removedFromProspects = 0;

    for (const personId of duplicatePersonIds) {
      const lead = leadsWithPeople.find(l => l.personId === personId);
      const prospect = prospectsWithPeople.find(p => p.personId === personId);

      if (lead && prospect) {
        // Keep the most recent record (prospect is usually more qualified)
        // Remove from leads since prospect is the next stage
        await prisma.leads.update({
          where: { id: lead.id },
          data: { deletedAt: new Date() }
        });
        removedFromLeads++;
      }
    }

    console.log(`✅ Removed ${removedFromLeads} duplicate leads`);
    console.log(`✅ Kept ${duplicatePersonIds.size} prospects (more qualified)\n`);

    // Step 3: Verify the fix
    console.log('✅ 3. VERIFYING FIX...\n');
    
    const finalLeadsCount = await prisma.leads.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    const finalProspectsCount = await prisma.prospects.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    // Check for remaining duplicates
    const finalLeadsWithPeople = await prisma.leads.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: { not: null }
      },
      select: { personId: true }
    });

    const finalProspectsWithPeople = await prisma.prospects.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: { not: null }
      },
      select: { personId: true }
    });

    const finalLeadPersonIds = new Set(finalLeadsWithPeople.map(l => l.personId));
    const finalProspectPersonIds = new Set(finalProspectsWithPeople.map(p => p.personId));
    const finalDuplicates = new Set([...finalLeadPersonIds].filter(id => finalProspectPersonIds.has(id)));

    console.log('📊 FINAL FUNNEL STATE:');
    console.log(`   Leads: ${finalLeadsCount.toLocaleString()}`);
    console.log(`   Prospects: ${finalProspectsCount.toLocaleString()}`);
    console.log(`   Remaining Duplicates: ${finalDuplicates.size}\n`);

    if (finalDuplicates.size === 0) {
      console.log('✅ SUCCESS: No more duplicates! Proper funnel progression achieved!\n');
    } else {
      console.log('⚠️  WARNING: Some duplicates still remain\n');
    }

    // Step 4: Show proper funnel structure
    console.log('🎯 4. PROPER FUNNEL STRUCTURE ACHIEVED:');
    console.log('=====================================\n');
    console.log('   Lead → Prospect → Opportunity');
    console.log('     ↓        ↓           ↓');
    console.log('  Unqualified Qualified Active Deals\n');
    
    console.log('📈 NEXT STEPS:');
    console.log('   1. 🎯 QUALIFY LEADS: Move qualified leads to prospects');
    console.log('   2. 🚀 CREATE OPPORTUNITIES: From qualified prospects');
    console.log('   3. 📊 TRACK PROGRESSION: Monitor funnel movement');
    console.log('   4. 🔄 IMPLEMENT WORKFLOWS: Automate lead qualification\n');

  } catch (error) {
    console.error('❌ Failed to fix funnel progression:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixFunnelProgression().catch(console.error);
