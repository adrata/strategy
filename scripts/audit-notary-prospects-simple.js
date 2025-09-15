#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditNotaryProspects() {
  try {
    console.log('🔍 NOTARY EVERYDAY PROSPECTS AUDIT\n');
    
    const NOTARY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';
    const EXPECTED_COUNT = 394;
    
    console.log(`Workspace ID: ${NOTARY_WORKSPACE_ID}`);
    console.log(`Expected count: ${EXPECTED_COUNT}\n`);
    
    // Get workspace info
    const workspace = await prisma.workspace.findUnique({
      where: { id: NOTARY_WORKSPACE_ID },
      select: { id: true, name: true, slug: true }
    });
    
    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }
    
    console.log(`📋 Workspace: ${workspace.name} (${workspace.slug})`);
    
    // Count prospects
    const prospectCount = await prisma.prospect.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID, 
        deletedAt: null 
      }
    });
    
    console.log(`📊 Actual prospect count: ${prospectCount}`);
    console.log(`📊 Expected count: ${EXPECTED_COUNT}`);
    console.log(`📊 Difference: ${prospectCount - EXPECTED_COUNT}`);
    
    if (prospectCount === EXPECTED_COUNT) {
      console.log('✅ Count matches expected!');
    } else if (prospectCount > EXPECTED_COUNT) {
      console.log(`⚠️  Found ${prospectCount - EXPECTED_COUNT} MORE prospects than expected`);
    } else {
      console.log(`⚠️  Found ${EXPECTED_COUNT - prospectCount} FEWER prospects than expected`);
    }
    
    // Get sample prospects to analyze
    const sampleProspects = await prisma.prospect.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID, 
        deletedAt: null 
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        email: true,
        createdAt: true,
        personId: true,
        leadId: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📋 Sample prospects (most recent 10):');
    sampleProspects.forEach((prospect, index) => {
      console.log(`${index + 1}. ${prospect.fullName || 'No name'}`);
      console.log(`   Company: ${prospect.company || 'No company'}`);
      console.log(`   Email: ${prospect.email || 'No email'}`);
      console.log(`   PersonId: ${prospect.personId || 'None'}`);
      console.log(`   LeadId: ${prospect.leadId || 'None'}`);
      console.log(`   Created: ${prospect.createdAt}`);
      console.log('');
    });
    
    // Check for data quality issues
    const prospectsWithoutPerson = await prisma.prospect.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID, 
        deletedAt: null,
        personId: null
      }
    });
    
    const prospectsWithoutLead = await prisma.prospect.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID, 
        deletedAt: null,
        leadId: null
      }
    });
    
    console.log('🔍 Data Quality Analysis:');
    console.log(`  Prospects without personId: ${prospectsWithoutPerson}`);
    console.log(`  Prospects without leadId: ${prospectsWithoutLead}`);
    
    return {
      workspace,
      expectedCount: EXPECTED_COUNT,
      actualCount: prospectCount,
      difference: prospectCount - EXPECTED_COUNT,
      dataQuality: {
        withoutPerson: prospectsWithoutPerson,
        withoutLead: prospectsWithoutLead
      }
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

auditNotaryProspects();
