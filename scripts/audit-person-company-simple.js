#!/usr/bin/env node

/**
 * 🔍 SIMPLE PERSON & COMPANY AUDIT
 * 
 * Based on the findings:
 * - People: 1,928
 * - Leads: 957  
 * - Prospects: 278
 * - Expected People: 1,235 (957 + 278)
 * - People vs Expected: +693 (too many people!)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function auditPersonCompanySimple() {
  console.log('🔍 SIMPLE PERSON & COMPANY AUDIT');
  console.log('='.repeat(50));
  console.log('');

  try {
    // 1. BASIC INVENTORY
    await basicInventory();
    
    // 2. ANALYZE PERSON-LEAD-PROSPECT MISMATCH
    await analyzePersonMismatch();
    
    // 3. CHECK ORPHANED RECORDS
    await checkOrphanedRecords();
    
    // 4. GENERATE FIX PLAN
    await generateFixPlan();

  } catch (error) {
    console.error('❌ Error in audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function basicInventory() {
  console.log('📊 BASIC INVENTORY');
  console.log('-'.repeat(30));
  
  const [peopleCount, companiesCount, leadsCount, prospectsCount] = await Promise.all([
    prisma.people.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.companies.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: DANO_WORKSPACE_ID } })
  ]);
  
  console.log(`   People: ${peopleCount.toLocaleString()}`);
  console.log(`   Companies: ${companiesCount.toLocaleString()}`);
  console.log(`   Leads: ${leadsCount.toLocaleString()}`);
  console.log(`   Prospects: ${prospectsCount.toLocaleString()}`);
  console.log(`   `);
  console.log(`   Total Leads + Prospects: ${(leadsCount + prospectsCount).toLocaleString()}`);
  console.log(`   Expected People Count: ${(leadsCount + prospectsCount).toLocaleString()}`);
  console.log(`   Actual vs Expected: ${peopleCount - (leadsCount + prospectsCount) > 0 ? '+' : ''}${peopleCount - (leadsCount + prospectsCount)}`);
  console.log('');
}

async function analyzePersonMismatch() {
  console.log('👥 PERSON-LEAD-PROSPECT MISMATCH ANALYSIS');
  console.log('-'.repeat(40));
  
  // Get leads with person references
  const leadsWithPeople = await prisma.leads.findMany({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    },
    select: {
      id: true,
      fullName: true,
      personId: true
    }
  });
  
  // Get prospects with person references
  const prospectsWithPeople = await prisma.prospects.findMany({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    },
    select: {
      id: true,
      fullName: true,
      personId: true
    }
  });
  
  // Get leads without person references
  const leadsWithoutPeople = await prisma.leads.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: null
    }
  });
  
  // Get prospects without person references
  const prospectsWithoutPeople = await prisma.prospects.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: null
    }
  });
  
  console.log(`   Leads with Person References: ${leadsWithPeople.length.toLocaleString()}`);
  console.log(`   Leads without Person References: ${leadsWithoutPeople.toLocaleString()}`);
  console.log(`   Prospects with Person References: ${prospectsWithPeople.length.toLocaleString()}`);
  console.log(`   Prospects without Person References: ${prospectsWithoutPeople.toLocaleString()}`);
  console.log('');
  
  // Check for duplicate person references
  const leadPersonIds = leadsWithPeople.map(l => l.personId);
  const prospectPersonIds = prospectsWithPeople.map(p => p.personId);
  
  const duplicatePersonIds = leadPersonIds.filter(id => prospectPersonIds.includes(id));
  
  console.log(`   Duplicate Person References (in both leads and prospects): ${duplicatePersonIds.length.toLocaleString()}`);
  
  if (duplicatePersonIds.length > 0) {
    console.log(`   Sample Duplicate Person IDs:`);
    duplicatePersonIds.slice(0, 5).forEach((id, index) => {
      console.log(`   ${index + 1}. ${id}`);
    });
  }
  console.log('');
  
  // Check for invalid person references
  const allReferencedPersonIds = [...new Set([...leadPersonIds, ...prospectPersonIds])];
  
  let invalidPersonReferences = 0;
  const invalidPersonIds = [];
  
  for (const personId of allReferencedPersonIds.slice(0, 100)) { // Check first 100
    const personExists = await prisma.people.findUnique({
      where: { id: personId }
    });
    
    if (!personExists) {
      invalidPersonReferences++;
      invalidPersonIds.push(personId);
    }
  }
  
  console.log(`   Invalid Person References (sample of 100): ${invalidPersonReferences.toLocaleString()}`);
  
  if (invalidPersonIds.length > 0) {
    console.log(`   Sample Invalid Person IDs:`);
    invalidPersonIds.slice(0, 5).forEach((id, index) => {
      console.log(`   ${index + 1}. ${id}`);
    });
  }
  console.log('');
}

async function checkOrphanedRecords() {
  console.log('🔍 ORPHANED RECORDS CHECK');
  console.log('-'.repeat(30));
  
  // Find people that are not referenced by any leads or prospects
  const allPeople = await prisma.people.findMany({
    where: { workspaceId: DANO_WORKSPACE_ID },
    select: { id: true, fullName: true, email: true }
  });
  
  const allLeadPersonIds = await prisma.leads.findMany({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    },
    select: { personId: true }
  }).then(leads => leads.map(l => l.personId));
  
  const allProspectPersonIds = await prisma.prospects.findMany({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    },
    select: { personId: true }
  }).then(prospects => prospects.map(p => p.personId));
  
  const allReferencedPersonIds = [...new Set([...allLeadPersonIds, ...allProspectPersonIds])];
  
  const orphanedPeople = allPeople.filter(person => !allReferencedPersonIds.includes(person.id));
  
  console.log(`   Total People: ${allPeople.length.toLocaleString()}`);
  console.log(`   People Referenced by Leads/Prospects: ${allReferencedPersonIds.length.toLocaleString()}`);
  console.log(`   Orphaned People: ${orphanedPeople.length.toLocaleString()}`);
  console.log('');
  
  if (orphanedPeople.length > 0) {
    console.log(`   Sample Orphaned People:`);
    orphanedPeople.slice(0, 10).forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.fullName} (${person.email || 'no email'})`);
    });
    console.log('');
  }
  
  // Check for leads/prospects without people
  const leadsWithoutPeople = await prisma.leads.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: null
    }
  });
  
  const prospectsWithoutPeople = await prisma.prospects.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: null
    }
  });
  
  console.log(`   Leads without People: ${leadsWithoutPeople.toLocaleString()}`);
  console.log(`   Prospects without People: ${prospectsWithoutPeople.toLocaleString()}`);
  console.log('');
}

async function generateFixPlan() {
  console.log('🔧 FIX PLAN');
  console.log('-'.repeat(30));
  
  console.log(`   CRITICAL ISSUES IDENTIFIED:`);
  console.log(`   1. 693 extra people records (1,928 vs expected 1,235)`);
  console.log(`   2. Leads/prospects without person references`);
  console.log(`   3. Duplicate person references (same person in both leads and prospects)`);
  console.log(`   4. Invalid person references (pointing to non-existent people)`);
  console.log(`   5. Orphaned people records (not referenced by leads/prospects)`);
  console.log('');
  
  console.log(`   RECOMMENDED FIX STRATEGY:`);
  console.log(`   `);
  console.log(`   PHASE 1: CLEAN UP INVALID REFERENCES`);
  console.log(`   - Remove invalid person references from leads/prospects`);
  console.log(`   - Fix duplicate person references (decide if person should be lead or prospect)`);
  console.log(`   `);
  console.log(`   PHASE 2: CREATE MISSING PERSON RECORDS`);
  console.log(`   - Create person records for leads/prospects without people`);
  console.log(`   - Link them properly to their respective leads/prospects`);
  console.log(`   `);
  console.log(`   PHASE 3: REMOVE ORPHANED PEOPLE`);
  console.log(`   - Identify and remove people not referenced by leads/prospects`);
  console.log(`   - This should bring the count down to match leads + prospects`);
  console.log(`   `);
  console.log(`   PHASE 4: VALIDATE INTEGRITY`);
  console.log(`   - Ensure person count = leads count + prospects count`);
  console.log(`   - Verify all relationships are valid and consistent`);
  console.log('');
  
  console.log(`   EXPECTED OUTCOME:`);
  console.log(`   - People: 1,235 (957 leads + 278 prospects)`);
  console.log(`   - All leads have valid person references`);
  console.log(`   - All prospects have valid person references`);
  console.log(`   - No duplicate or invalid references`);
  console.log(`   - No orphaned people records`);
  console.log('');
}

// Run the audit
if (require.main === module) {
  auditPersonCompanySimple().catch(console.error);
}

module.exports = { auditPersonCompanySimple };

