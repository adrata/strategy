#!/usr/bin/env node

/**
 * ✅ VERIFY PEOPLE EQUATION
 * 
 * This script verifies that: Leads + Prospects = People
 * after fixing the funnel progression.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function verifyPeopleEquation() {
  console.log('✅ VERIFYING PEOPLE EQUATION');
  console.log('============================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get counts
    const [peopleCount, leadsCount, prospectsCount, opportunitiesCount] = await Promise.all([
      prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
      prisma.leads.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
      prisma.prospects.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
      prisma.opportunities.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })
    ]);

    console.log('📊 CURRENT COUNTS:');
    console.log(`   People: ${peopleCount.toLocaleString()}`);
    console.log(`   Leads: ${leadsCount.toLocaleString()}`);
    console.log(`   Prospects: ${prospectsCount.toLocaleString()}`);
    console.log(`   Opportunities: ${opportunitiesCount.toLocaleString()}\n`);

    // Calculate the equation
    const leadsPlusProspects = leadsCount + prospectsCount;
    const difference = leadsPlusProspects - peopleCount;

    console.log('🧮 PEOPLE EQUATION VERIFICATION:');
    console.log(`   Leads + Prospects = ${leadsCount.toLocaleString()} + ${prospectsCount.toLocaleString()} = ${leadsPlusProspects.toLocaleString()}`);
    console.log(`   People = ${peopleCount.toLocaleString()}`);
    console.log(`   Difference = ${difference.toLocaleString()}\n`);

    if (difference === 0) {
      console.log('✅ SUCCESS: Leads + Prospects = People (Perfect Match!)\n');
    } else if (Math.abs(difference) <= 10) {
      console.log('✅ SUCCESS: Leads + Prospects ≈ People (Within Tolerance)\n');
    } else {
      console.log('⚠️  WARNING: Leads + Prospects ≠ People\n');
    }

    // Check for any remaining duplicates
    const leadsWithPeople = await prisma.leads.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: { not: null }
      },
      select: { personId: true }
    });

    const prospectsWithPeople = await prisma.prospects.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: { not: null }
      },
      select: { personId: true }
    });

    const leadPersonIds = new Set(leadsWithPeople.map(l => l.personId));
    const prospectPersonIds = new Set(prospectsWithPeople.map(p => p.personId));
    const duplicates = new Set([...leadPersonIds].filter(id => prospectPersonIds.has(id)));

    console.log('🔍 DUPLICATE CHECK:');
    console.log(`   People in Leads: ${leadPersonIds.size.toLocaleString()}`);
    console.log(`   People in Prospects: ${prospectPersonIds.size.toLocaleString()}`);
    console.log(`   Duplicates: ${duplicates.size}\n`);

    if (duplicates.size === 0) {
      console.log('✅ SUCCESS: No duplicates found!\n');
    } else {
      console.log('⚠️  WARNING: Duplicates still exist!\n');
    }

    // Final verification
    console.log('🎯 FINAL VERIFICATION:');
    if (difference === 0 && duplicates.size === 0) {
      console.log('✅ PERFECT: Leads + Prospects = People with no duplicates!');
      console.log('✅ PERFECT: Clean funnel progression achieved!');
      console.log('✅ PERFECT: 2025 CRM architecture implemented!\n');
    } else {
      console.log('⚠️  ISSUES REMAIN:');
      if (difference !== 0) {
        console.log(`   - People count mismatch: ${difference.toLocaleString()}`);
      }
      if (duplicates.size > 0) {
        console.log(`   - Duplicates found: ${duplicates.size}`);
      }
      console.log('');
    }

    // Show the clean funnel
    console.log('🎯 CLEAN FUNNEL ARCHITECTURE:');
    console.log('=============================\n');
    console.log('   Lead → Prospect → Opportunity');
    console.log(`     ↓        ↓           ↓`);
    console.log(`   ${leadsCount.toLocaleString()}     ${prospectsCount.toLocaleString()}        ${opportunitiesCount.toLocaleString()}`);
    console.log('   (Unqualified) (Qualified) (Active Deals)\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyPeopleEquation().catch(console.error);
