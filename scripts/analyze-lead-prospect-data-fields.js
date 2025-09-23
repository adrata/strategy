#!/usr/bin/env node

/**
 * 🔍 ANALYZE LEAD/PROSPECT DATA FIELDS
 * 
 * This script analyzes what data exists in leads/prospects tables
 * to ensure we don't lose any data during conversion.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function analyzeLeadProspectDataFields() {
  console.log('🔍 ANALYZING LEAD/PROSPECT DATA FIELDS');
  console.log('=====================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // 1. Analyze Lead data fields
    await analyzeLeadDataFields();
    
    // 2. Analyze Prospect data fields
    await analyzeProspectDataFields();
    
    // 3. Compare with People data fields
    await compareWithPeopleDataFields();
    
    // 4. Identify data that might be lost
    await identifyDataLossRisks();
    
    // 5. Recommendations for data preservation
    await generateDataPreservationRecommendations();

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzeLeadDataFields() {
  console.log('📊 1. LEAD DATA FIELDS ANALYSIS');
  console.log('==============================\n');
  
  // Get sample leads with all fields
  const sampleLeads = await prisma.leads.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null
    },
    take: 5
  });

  if (sampleLeads.length === 0) {
    console.log('❌ No leads found');
    return;
  }

  console.log('📋 LEAD FIELDS WITH DATA:');
  const leadFields = Object.keys(sampleLeads[0]);
  
  // Analyze each field for data presence
  for (const field of leadFields) {
    if (field === 'id' || field === 'workspaceId' || field === 'deletedAt') continue;
    
    const fieldData = sampleLeads.map(lead => lead[field]).filter(value => 
      value !== null && value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    );
    
    const percentage = ((fieldData.length / sampleLeads.length) * 100).toFixed(1);
    console.log(`   ${field}: ${fieldData.length}/${sampleLeads.length} (${percentage}%)`);
    
    // Show sample values for key fields
    if (['status', 'priority', 'source', 'estimatedValue', 'currency', 'tags', 'customFields'].includes(field)) {
      const uniqueValues = [...new Set(fieldData)];
      console.log(`     Sample values: ${uniqueValues.slice(0, 3).join(', ')}`);
    }
  }
  console.log('');
}

async function analyzeProspectDataFields() {
  console.log('📊 2. PROSPECT DATA FIELDS ANALYSIS');
  console.log('==================================\n');
  
  // Get sample prospects with all fields
  const sampleProspects = await prisma.prospects.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null
    },
    take: 5
  });

  if (sampleProspects.length === 0) {
    console.log('❌ No prospects found');
    return;
  }

  console.log('📋 PROSPECT FIELDS WITH DATA:');
  const prospectFields = Object.keys(sampleProspects[0]);
  
  // Analyze each field for data presence
  for (const field of prospectFields) {
    if (field === 'id' || field === 'workspaceId' || field === 'deletedAt') continue;
    
    const fieldData = sampleProspects.map(prospect => prospect[field]).filter(value => 
      value !== null && value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    );
    
    const percentage = ((fieldData.length / sampleProspects.length) * 100).toFixed(1);
    console.log(`   ${field}: ${fieldData.length}/${sampleProspects.length} (${percentage}%)`);
    
    // Show sample values for key fields
    if (['engagementLevel', 'priority', 'source', 'estimatedValue', 'currency', 'tags', 'customFields'].includes(field)) {
      const uniqueValues = [...new Set(fieldData)];
      console.log(`     Sample values: ${uniqueValues.slice(0, 3).join(', ')}`);
    }
  }
  console.log('');
}

async function compareWithPeopleDataFields() {
  console.log('📊 3. PEOPLE DATA FIELDS COMPARISON');
  console.log('===================================\n');
  
  // Get sample people with all fields
  const samplePeople = await prisma.people.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null
    },
    take: 5
  });

  if (samplePeople.length === 0) {
    console.log('❌ No people found');
    return;
  }

  console.log('📋 PEOPLE FIELDS WITH DATA:');
  const peopleFields = Object.keys(samplePeople[0]);
  
  // Analyze each field for data presence
  for (const field of peopleFields) {
    if (field === 'id' || field === 'workspaceId' || field === 'deletedAt') continue;
    
    const fieldData = samplePeople.map(person => person[field]).filter(value => 
      value !== null && value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    );
    
    const percentage = ((fieldData.length / samplePeople.length) * 100).toFixed(1);
    console.log(`   ${field}: ${fieldData.length}/${samplePeople.length} (${percentage}%)`);
  }
  console.log('');
}

async function identifyDataLossRisks() {
  console.log('⚠️  4. DATA LOSS RISK ANALYSIS');
  console.log('=============================\n');
  
  // Get field counts for leads, prospects, and people
  const [leadCount, prospectCount, peopleCount] = await Promise.all([
    prisma.leads.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.prospects.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })
  ]);

  // Check for fields that exist in leads/prospects but not in people
  const sampleLead = await prisma.leads.findFirst({
    where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
  });

  const sampleProspect = await prisma.prospects.findFirst({
    where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
  });

  const samplePerson = await prisma.people.findFirst({
    where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
  });

  if (!sampleLead || !sampleProspect || !samplePerson) {
    console.log('❌ Could not get sample records for comparison');
    return;
  }

  const leadFields = Object.keys(sampleLead);
  const prospectFields = Object.keys(sampleProspect);
  const peopleFields = Object.keys(samplePerson);

  console.log('🔍 FIELD COMPARISON:');
  console.log(`   Lead fields: ${leadFields.length}`);
  console.log(`   Prospect fields: ${prospectFields.length}`);
  console.log(`   People fields: ${peopleFields.length}`);
  console.log('');

  // Find fields in leads that might not be in people
  const leadOnlyFields = leadFields.filter(field => !peopleFields.includes(field));
  const prospectOnlyFields = prospectFields.filter(field => !peopleFields.includes(field));

  console.log('⚠️  POTENTIAL DATA LOSS FIELDS:');
  if (leadOnlyFields.length > 0) {
    console.log('   Lead-only fields:');
    leadOnlyFields.forEach(field => {
      console.log(`     - ${field}`);
    });
  }

  if (prospectOnlyFields.length > 0) {
    console.log('   Prospect-only fields:');
    prospectOnlyFields.forEach(field => {
      console.log(`     - ${field}`);
    });
  }

  if (leadOnlyFields.length === 0 && prospectOnlyFields.length === 0) {
    console.log('   ✅ No data loss risk - all fields exist in people table');
  }
  console.log('');
}

async function generateDataPreservationRecommendations() {
  console.log('💡 5. DATA PRESERVATION RECOMMENDATIONS');
  console.log('======================================\n');
  
  console.log('🎯 RECOMMENDED APPROACH:');
  console.log('');
  console.log('1. 📊 STATUS-BASED CONVERSION:');
  console.log('   • Keep same Person record throughout lifecycle');
  console.log('   • Use status fields to track progression');
  console.log('   • Lead → Prospect → Opportunity (status changes)');
  console.log('');
  
  console.log('2. 🔄 DATA MIGRATION STRATEGY:');
  console.log('   • Create missing People records for orphaned leads/prospects');
  console.log('   • Copy all lead/prospect data to People records');
  console.log('   • Maintain lead/prospect records as "status views"');
  console.log('   • Use views/queries to filter by status');
  console.log('');
  
  console.log('3. 📋 LIST/RECORD VIEW STRATEGY:');
  console.log('   • Create unified "Contacts" view (all People)');
  console.log('   • Filter by status: Lead, Prospect, Opportunity');
  console.log('   • Maintain separate lead/prospect tables for reporting');
  console.log('   • Use personId to link all records');
  console.log('');
  
  console.log('4. 🏢 COMPANY RELATIONSHIP STRATEGY:');
  console.log('   • Link all People to Companies (B2B model)');
  console.log('   • Inherit company from Person in lead/prospect views');
  console.log('   • Maintain 1:1 Person to Company relationship');
  console.log('');
  
  console.log('5. 🔧 IMPLEMENTATION STEPS:');
  console.log('   • Step 1: Create missing People records');
  console.log('   • Step 2: Copy all data from leads/prospects to People');
  console.log('   • Step 3: Update UI to use People table with status filters');
  console.log('   • Step 4: Maintain lead/prospect tables for historical data');
  console.log('   • Step 5: Create unified views for different user needs');
  console.log('');
}

// Run the analysis
analyzeLeadProspectDataFields().catch(console.error);
