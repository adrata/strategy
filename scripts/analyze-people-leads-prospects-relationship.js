#!/usr/bin/env node

/**
 * 🔍 ANALYZE PEOPLE-LEADS-PROSPECTS RELATIONSHIP
 * 
 * This script analyzes the relationship between people, leads, and prospects
 * to understand if we have data duplication or missing relationships.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function analyzePeopleLeadsProspectsRelationship() {
  console.log('🔍 ANALYZING PEOPLE-LEADS-PROSPECTS RELATIONSHIP');
  console.log('===============================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // 1. Basic counts
    await analyzeBasicCounts();
    
    // 2. Email overlap analysis
    await analyzeEmailOverlap();
    
    // 3. Name overlap analysis
    await analyzeNameOverlap();
    
    // 4. Data structure analysis
    await analyzeDataStructure();
    
    // 5. Recommendations
    await generateRecommendations();

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzeBasicCounts() {
  console.log('📊 1. BASIC COUNTS ANALYSIS');
  console.log('==========================\n');
  
  const [peopleCount, leadsCount, prospectsCount] = await Promise.all([
    prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.leads.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.prospects.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })
  ]);

  console.log('📈 Record Counts:');
  console.log(`   People: ${peopleCount.toLocaleString()}`);
  console.log(`   Leads: ${leadsCount.toLocaleString()}`);
  console.log(`   Prospects: ${prospectsCount.toLocaleString()}`);
  console.log(`   Total: ${(peopleCount + leadsCount + prospectsCount).toLocaleString()}\n`);

  console.log('🔍 Expected vs Actual:');
  console.log(`   Expected: People should = Leads + Prospects`);
  console.log(`   Actual: People (${peopleCount}) vs Leads+Prospects (${leadsCount + prospectsCount})`);
  console.log(`   Difference: ${Math.abs(peopleCount - (leadsCount + prospectsCount))} records\n`);
}

async function analyzeEmailOverlap() {
  console.log('📧 2. EMAIL OVERLAP ANALYSIS');
  console.log('============================\n');
  
  // Get all emails from each table
  const [peopleEmails, leadsEmails, prospectsEmails] = await Promise.all([
    prisma.people.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        email: { not: null }
      },
      select: { id: true, email: true, fullName: true }
    }),
    prisma.leads.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        email: { not: null }
      },
      select: { id: true, email: true, fullName: true }
    }),
    prisma.prospects.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        email: { not: null }
      },
      select: { id: true, email: true, fullName: true }
    })
  ]);

  console.log('📊 Email Coverage:');
  console.log(`   People with emails: ${peopleEmails.length}`);
  console.log(`   Leads with emails: ${leadsEmails.length}`);
  console.log(`   Prospects with emails: ${prospectsEmails.length}\n`);

  // Find overlaps
  const peopleEmailSet = new Set(peopleEmails.map(p => p.email.toLowerCase()));
  const leadsEmailSet = new Set(leadsEmails.map(l => l.email.toLowerCase()));
  const prospectsEmailSet = new Set(prospectsEmails.map(p => p.email.toLowerCase()));

  // People-Leads overlap
  const peopleLeadsOverlap = [...peopleEmailSet].filter(email => leadsEmailSet.has(email));
  console.log(`🔗 People-Leads email overlap: ${peopleLeadsOverlap.length} emails`);

  // People-Prospects overlap
  const peopleProspectsOverlap = [...peopleEmailSet].filter(email => prospectsEmailSet.has(email));
  console.log(`🔗 People-Prospects email overlap: ${peopleProspectsOverlap.length} emails`);

  // Leads-Prospects overlap
  const leadsProspectsOverlap = [...leadsEmailSet].filter(email => prospectsEmailSet.has(email));
  console.log(`🔗 Leads-Prospects email overlap: ${leadsProspectsOverlap.length} emails\n`);

  // Show sample overlaps
  if (peopleLeadsOverlap.length > 0) {
    console.log('📋 Sample People-Leads overlaps:');
    peopleLeadsOverlap.slice(0, 5).forEach(email => {
      const person = peopleEmails.find(p => p.email.toLowerCase() === email);
      const lead = leadsEmails.find(l => l.email.toLowerCase() === email);
      console.log(`   ${email}: Person(${person.fullName}) <-> Lead(${lead.fullName})`);
    });
    console.log('');
  }

  if (peopleProspectsOverlap.length > 0) {
    console.log('📋 Sample People-Prospects overlaps:');
    peopleProspectsOverlap.slice(0, 5).forEach(email => {
      const person = peopleEmails.find(p => p.email.toLowerCase() === email);
      const prospect = prospectsEmails.find(p => p.email.toLowerCase() === email);
      console.log(`   ${email}: Person(${person.fullName}) <-> Prospect(${prospect.fullName})`);
    });
    console.log('');
  }
}

async function analyzeNameOverlap() {
  console.log('👤 3. NAME OVERLAP ANALYSIS');
  console.log('===========================\n');
  
  // Get all names from each table
  const [peopleNames, leadsNames, prospectsNames] = await Promise.all([
    prisma.people.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: { id: true, fullName: true, email: true }
    }),
    prisma.leads.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: { id: true, fullName: true, email: true }
    }),
    prisma.prospects.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: { id: true, fullName: true, email: true }
    })
  ]);

  console.log('📊 Name Coverage:');
  console.log(`   People: ${peopleNames.length}`);
  console.log(`   Leads: ${leadsNames.length}`);
  console.log(`   Prospects: ${prospectsNames.length}\n`);

  // Find overlaps by name
  const peopleNameSet = new Set(peopleNames.map(p => p.fullName.toLowerCase()));
  const leadsNameSet = new Set(leadsNames.map(l => l.fullName.toLowerCase()));
  const prospectsNameSet = new Set(prospectsNames.map(p => p.fullName.toLowerCase()));

  // People-Leads overlap
  const peopleLeadsNameOverlap = [...peopleNameSet].filter(name => leadsNameSet.has(name));
  console.log(`🔗 People-Leads name overlap: ${peopleLeadsNameOverlap.length} names`);

  // People-Prospects overlap
  const peopleProspectsNameOverlap = [...peopleNameSet].filter(name => prospectsNameSet.has(name));
  console.log(`🔗 People-Prospects name overlap: ${peopleProspectsNameOverlap.length} names`);

  // Leads-Prospects overlap
  const leadsProspectsNameOverlap = [...leadsNameSet].filter(name => prospectsNameSet.has(name));
  console.log(`🔗 Leads-Prospects name overlap: ${leadsProspectsNameOverlap.length} names\n`);

  // Show sample name overlaps
  if (peopleLeadsNameOverlap.length > 0) {
    console.log('📋 Sample People-Leads name overlaps:');
    peopleLeadsNameOverlap.slice(0, 5).forEach(name => {
      const person = peopleNames.find(p => p.fullName.toLowerCase() === name);
      const lead = leadsNames.find(l => l.fullName.toLowerCase() === name);
      console.log(`   ${name}: Person(${person.email || 'no email'}) <-> Lead(${lead.email || 'no email'})`);
    });
    console.log('');
  }
}

async function analyzeDataStructure() {
  console.log('🏗️ 4. DATA STRUCTURE ANALYSIS');
  console.log('=============================\n');
  
  // Check if people have personId references in leads/prospects
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

  console.log('🔗 PersonId References:');
  console.log(`   Leads with personId: ${leadsWithPersonId}/${totalLeads} (${((leadsWithPersonId/totalLeads)*100).toFixed(1)}%)`);
  console.log(`   Prospects with personId: ${prospectsWithPersonId}/${totalProspects} (${((prospectsWithPersonId/totalProspects)*100).toFixed(1)}%)\n`);

  // Check for orphaned records
  const [orphanedLeads, orphanedProspects] = await Promise.all([
    prisma.leads.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: null,
        email: null
      }
    }),
    prisma.prospects.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: null,
        email: null
      }
    })
  ]);

  console.log('🚫 Orphaned Records (no personId, no email):');
  console.log(`   Orphaned Leads: ${orphanedLeads}`);
  console.log(`   Orphaned Prospects: ${orphanedProspects}\n`);

  // Check data creation patterns
  const [recentPeople, recentLeads, recentProspects] = await Promise.all([
    prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null },
      select: { id: true, fullName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.leads.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null },
      select: { id: true, fullName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.prospects.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null },
      select: { id: true, fullName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  console.log('📅 Recent Data Creation:');
  console.log('   Recent People:');
  recentPeople.forEach((person, index) => {
    console.log(`     ${index + 1}. ${person.fullName} - ${person.createdAt}`);
  });
  console.log('   Recent Leads:');
  recentLeads.forEach((lead, index) => {
    console.log(`     ${index + 1}. ${lead.fullName} - ${lead.createdAt}`);
  });
  console.log('   Recent Prospects:');
  recentProspects.forEach((prospect, index) => {
    console.log(`     ${index + 1}. ${prospect.fullName} - ${prospect.createdAt}`);
  });
  console.log('');
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

  console.log('🔍 ANALYSIS SUMMARY:');
  console.log(`   People: ${peopleCount.toLocaleString()}`);
  console.log(`   Leads + Prospects: ${totalLeadsProspects.toLocaleString()}`);
  console.log(`   Difference: ${difference.toLocaleString()} records\n`);

  if (peopleCount > totalLeadsProspects) {
    console.log('⚠️  ISSUE IDENTIFIED: Too many People records');
    console.log(`   You have ${difference.toLocaleString()} more people than leads+prospects`);
    console.log('   This suggests:');
    console.log('   • People records exist without corresponding leads/prospects');
    console.log('   • Data import may have created people without lead/prospect records');
    console.log('   • Some people may be orphaned or duplicate data\n');
    
    console.log('🎯 RECOMMENDATIONS:');
    console.log('   1. Investigate orphaned people records');
    console.log('   2. Create leads/prospects for people without them');
    console.log('   3. Check for data import issues');
    console.log('   4. Consider consolidating duplicate people records\n');
  } else if (peopleCount < totalLeadsProspects) {
    console.log('⚠️  ISSUE IDENTIFIED: Too many Leads/Prospects');
    console.log(`   You have ${difference.toLocaleString()} more leads+prospects than people`);
    console.log('   This suggests:');
    console.log('   • Leads/prospects exist without corresponding people records');
    console.log('   • Data import may have created leads/prospects without people');
    console.log('   • Some leads/prospects may be orphaned or duplicate data\n');
    
    console.log('🎯 RECOMMENDATIONS:');
    console.log('   1. Investigate orphaned leads/prospects');
    console.log('   2. Create people records for leads/prospects without them');
    console.log('   3. Check for data import issues');
    console.log('   4. Consider consolidating duplicate leads/prospects\n');
  } else {
    console.log('✅ DATA STRUCTURE LOOKS CORRECT');
    console.log('   People count matches leads + prospects count');
    console.log('   This suggests proper data relationships\n');
  }

  console.log('🔧 NEXT STEPS:');
  console.log('   1. Run detailed overlap analysis to find duplicates');
  console.log('   2. Check data import logs for any issues');
  console.log('   3. Implement data cleanup if needed');
  console.log('   4. Establish proper data relationships\n');
}

// Run the analysis
analyzePeopleLeadsProspectsRelationship().catch(console.error);
