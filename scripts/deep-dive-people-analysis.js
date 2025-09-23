#!/usr/bin/env node

/**
 * 🔍 DEEP DIVE PEOPLE ANALYSIS
 * 
 * This script does a deep analysis to understand why Leads + Prospects ≠ People
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function deepDivePeopleAnalysis() {
  console.log('🔍 DEEP DIVE PEOPLE ANALYSIS');
  console.log('============================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get all leads with their People records
    const leadsWithPeople = await prisma.leads.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        personId: true
      }
    });

    // Get all prospects with their People records
    const prospectsWithPeople = await prisma.prospects.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        personId: true
      }
    });

    // Get all people
    const allPeople = await prisma.people.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    console.log('📊 RECORD COUNTS:');
    console.log(`   Total Leads: ${leadsWithPeople.length}`);
    console.log(`   Total Prospects: ${prospectsWithPeople.length}`);
    console.log(`   Total People: ${allPeople.length}\n`);

    // Analyze leads
    const leadsWithPersonId = leadsWithPeople.filter(l => l.personId);
    const leadsWithoutPersonId = leadsWithPeople.filter(l => !l.personId);
    
    console.log('🔍 LEADS ANALYSIS:');
    console.log(`   Leads with personId: ${leadsWithPersonId.length}`);
    console.log(`   Leads without personId: ${leadsWithoutPersonId.length}\n`);

    // Analyze prospects
    const prospectsWithPersonId = prospectsWithPeople.filter(p => p.personId);
    const prospectsWithoutPersonId = prospectsWithPeople.filter(p => !p.personId);
    
    console.log('🔍 PROSPECTS ANALYSIS:');
    console.log(`   Prospects with personId: ${prospectsWithPersonId.length}`);
    console.log(`   Prospects without personId: ${prospectsWithoutPersonId.length}\n`);

    // Get unique person IDs from leads and prospects
    const leadPersonIds = new Set(leadsWithPersonId.map(l => l.personId));
    const prospectPersonIds = new Set(prospectsWithPersonId.map(p => p.personId));
    const allPersonIds = new Set([...leadPersonIds, ...prospectPersonIds]);

    console.log('🔍 UNIQUE PERSON IDS:');
    console.log(`   Unique personIds in Leads: ${leadPersonIds.size}`);
    console.log(`   Unique personIds in Prospects: ${prospectPersonIds.size}`);
    console.log(`   Total unique personIds: ${allPersonIds.size}\n`);

    // Check if all personIds exist in People table
    const peopleIds = new Set(allPeople.map(p => p.id));
    const missingPersonIds = new Set([...allPersonIds].filter(id => !peopleIds.has(id)));

    console.log('🔍 PEOPLE TABLE VERIFICATION:');
    console.log(`   People in database: ${peopleIds.size}`);
    console.log(`   PersonIds referenced: ${allPersonIds.size}`);
    console.log(`   Missing personIds: ${missingPersonIds.size}\n`);

    if (missingPersonIds.size > 0) {
      console.log('⚠️  MISSING PERSON IDS:');
      Array.from(missingPersonIds).slice(0, 5).forEach(id => {
        console.log(`   - ${id}`);
      });
      console.log('');
    }

    // Check for orphaned People records
    const orphanedPeople = allPeople.filter(p => !allPersonIds.has(p.id));
    
    console.log('🔍 ORPHANED PEOPLE RECORDS:');
    console.log(`   Orphaned People: ${orphanedPeople.length}\n`);

    if (orphanedPeople.length > 0) {
      console.log('📋 ORPHANED PEOPLE EXAMPLES:');
      orphanedPeople.slice(0, 5).forEach(person => {
        console.log(`   - ${person.fullName} (${person.email}) - ID: ${person.id}`);
      });
      console.log('');
    }

    // Final analysis
    console.log('🎯 FINAL ANALYSIS:');
    console.log('==================\n');
    
    const totalRecords = leadsWithPeople.length + prospectsWithPeople.length;
    const uniquePeopleReferenced = allPersonIds.size;
    const totalPeopleInDB = allPeople.length;
    
    console.log(`   Total Records (Leads + Prospects): ${totalRecords}`);
    console.log(`   Unique People Referenced: ${uniquePeopleReferenced}`);
    console.log(`   Total People in Database: ${totalPeopleInDB}`);
    console.log(`   Orphaned People: ${orphanedPeople.length}\n`);

    if (totalRecords === totalPeopleInDB) {
      console.log('✅ SUCCESS: Leads + Prospects = People (Perfect Match!)\n');
    } else if (totalRecords === uniquePeopleReferenced) {
      console.log('✅ SUCCESS: Leads + Prospects = Unique People Referenced\n');
      console.log(`   Note: ${orphanedPeople.length} orphaned People records exist\n`);
    } else {
      console.log('⚠️  WARNING: Mismatch detected\n');
    }

    // Show the equation
    console.log('🧮 PEOPLE EQUATION:');
    console.log(`   Leads (${leadsWithPeople.length}) + Prospects (${prospectsWithPeople.length}) = ${totalRecords}`);
    console.log(`   People in DB = ${totalPeopleInDB}`);
    console.log(`   Unique People Referenced = ${uniquePeopleReferenced}\n`);

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
deepDivePeopleAnalysis().catch(console.error);
