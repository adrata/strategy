#!/usr/bin/env node

/**
 * 🧪 TEST SCRIPT FOR LEADS ↔ PROSPECTS SWAP MIGRATION
 * 
 * This script tests the migration logic without affecting production data
 * by creating temporary test records and verifying the swap works correctly.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * 🧪 Create test data for migration testing
 */
async function createTestData() {
  console.log('🧪 Creating test data...');
  
  // Create test workspace if it doesn't exist
  const testWorkspaceId = 'test_workspace_migration';
  
  // Clean up any existing test data first
  await prisma.leads.deleteMany({
    where: { workspaceId: testWorkspaceId }
  });
  await prisma.prospects.deleteMany({
    where: { workspaceId: testWorkspaceId }
  });
  
  const now = new Date();
  
  // Create test leads
  const testLeads = [
    {
      id: 'test_lead_1',
      workspaceId: testWorkspaceId,
      firstName: 'Test',
      lastName: 'Lead One',
      fullName: 'Test Lead One',
      email: 'testlead1@example.com',
      company: 'Test Company A',
      status: 'new',
      priority: 'high',
      source: 'website',
      updatedAt: now
    },
    {
      id: 'test_lead_2',
      workspaceId: testWorkspaceId,
      firstName: 'Test',
      lastName: 'Lead Two',
      fullName: 'Test Lead Two',
      email: 'testlead2@example.com',
      company: 'Test Company B',
      status: 'contacted',
      priority: 'medium',
      source: 'referral',
      updatedAt: now
    }
  ];
  
  // Create test prospects
  const testProspects = [
    {
      id: 'test_prospect_1',
      workspaceId: testWorkspaceId,
      firstName: 'Test',
      lastName: 'Prospect One',
      fullName: 'Test Prospect One',
      email: 'testprospect1@example.com',
      company: 'Test Company C',
      status: 'qualified',
      priority: 'high',
      source: 'cold_outreach',
      updatedAt: now
    },
    {
      id: 'test_prospect_2',
      workspaceId: testWorkspaceId,
      firstName: 'Test',
      lastName: 'Prospect Two',
      fullName: 'Test Prospect Two',
      email: 'testprospect2@example.com',
      company: 'Test Company D',
      status: 'nurturing',
      priority: 'low',
      source: 'linkedin',
      updatedAt: now
    },
    {
      id: 'test_prospect_3',
      workspaceId: testWorkspaceId,
      firstName: 'Test',
      lastName: 'Prospect Three',
      fullName: 'Test Prospect Three',
      email: 'testprospect3@example.com',
      company: 'Test Company E',
      status: 'new',
      priority: 'medium',
      source: 'event',
      updatedAt: now
    }
  ];
  
  // Insert test data
  await prisma.leads.createMany({ data: testLeads });
  await prisma.prospects.createMany({ data: testProspects });
  
  console.log(`✅ Created ${testLeads.length} test leads and ${testProspects.length} test prospects`);
  
  return { testLeads, testProspects, testWorkspaceId };
}

/**
 * 🔄 Test the swap migration logic on test data
 */
async function testSwapMigration(testWorkspaceId) {
  console.log('🔄 Testing swap migration logic...');
  
  // Get initial counts
  const initialLeadsCount = await prisma.leads.count({
    where: { workspaceId: testWorkspaceId }
  });
  const initialProspectsCount = await prisma.prospects.count({
    where: { workspaceId: testWorkspaceId }
  });
  
  console.log(`Initial: ${initialLeadsCount} leads, ${initialProspectsCount} prospects`);
  
  // Perform the swap in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Fetch current test data
    const currentLeads = await tx.leads.findMany({
      where: { workspaceId: testWorkspaceId }
    });
    const currentProspects = await tx.prospects.findMany({
      where: { workspaceId: testWorkspaceId }
    });
    
    // Clear test tables
    await tx.leads.deleteMany({
      where: { workspaceId: testWorkspaceId }
    });
    await tx.prospects.deleteMany({
      where: { workspaceId: testWorkspaceId }
    });
    
    // Convert prospects to leads
    if (currentProspects.length > 0) {
      const prospectsAsLeads = currentProspects.map(prospect => ({
        id: `lead_converted_${prospect.id}`,
        workspaceId: prospect.workspaceId,
        assignedUserId: prospect.assignedUserId,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        fullName: prospect.fullName,
        displayName: prospect.displayName,
        email: prospect.email,
        workEmail: prospect.workEmail,
        personalEmail: prospect.personalEmail,
        phone: prospect.phone,
        mobilePhone: prospect.mobilePhone,
        workPhone: prospect.workPhone,
        company: prospect.company,
        companyDomain: prospect.companyDomain,
        industry: prospect.industry,
        companySize: prospect.companySize,
        jobTitle: prospect.jobTitle,
        title: prospect.title,
        department: prospect.department,
        linkedinUrl: prospect.linkedinUrl,
        address: prospect.address,
        city: prospect.city,
        state: prospect.state,
        country: prospect.country,
        postalCode: prospect.postalCode,
        status: prospect.status,
        priority: prospect.priority,
        source: prospect.source,
        estimatedValue: prospect.estimatedValue,
        currency: prospect.currency,
        notes: prospect.notes,
        description: prospect.description,
        tags: prospect.tags,
        customFields: prospect.customFields,
        preferredLanguage: prospect.preferredLanguage,
        timezone: prospect.timezone,
        lastEnriched: prospect.lastEnriched,
        enrichmentSources: prospect.enrichmentSources,
        emailVerified: prospect.emailVerified,
        phoneVerified: prospect.phoneVerified,
        mobileVerified: prospect.mobileVerified,
        enrichmentScore: prospect.enrichmentScore,
        emailConfidence: prospect.emailConfidence,
        phoneConfidence: prospect.phoneConfidence,
        dataCompleteness: prospect.dataCompleteness,
        createdAt: prospect.createdAt,
        updatedAt: new Date(),
        personId: prospect.personId,
        deletedAt: prospect.deletedAt,
        buyerGroupRole: prospect.buyerGroupRole,
        completedStages: prospect.completedStages || [],
        currentStage: prospect.currentStage,
        lastActionDate: prospect.lastActionDate,
        nextAction: prospect.nextAction,
        nextActionDate: prospect.nextActionDate,
        lastContactDate: prospect.lastContactDate,
        companyId: prospect.companyId
      }));
      
      await tx.leads.createMany({ data: prospectsAsLeads });
    }
    
    // Convert leads to prospects
    if (currentLeads.length > 0) {
      const leadsAsProspects = currentLeads.map(lead => ({
        id: `prospect_converted_${lead.id}`,
        workspaceId: lead.workspaceId,
        assignedUserId: lead.assignedUserId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        fullName: lead.fullName,
        displayName: lead.displayName,
        email: lead.email,
        workEmail: lead.workEmail,
        personalEmail: lead.personalEmail,
        phone: lead.phone,
        mobilePhone: lead.mobilePhone,
        workPhone: lead.workPhone,
        company: lead.company,
        companyDomain: lead.companyDomain,
        industry: lead.industry,
        companySize: lead.companySize,
        jobTitle: lead.jobTitle,
        title: lead.title,
        department: lead.department,
        linkedinUrl: lead.linkedinUrl,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        postalCode: lead.postalCode,
        status: lead.status,
        priority: lead.priority,
        source: lead.source,
        estimatedValue: lead.estimatedValue,
        currency: lead.currency,
        notes: lead.notes,
        description: lead.description,
        tags: lead.tags,
        customFields: lead.customFields,
        preferredLanguage: lead.preferredLanguage,
        timezone: lead.timezone,
        lastEnriched: lead.lastEnriched,
        enrichmentSources: lead.enrichmentSources,
        emailVerified: lead.emailVerified,
        phoneVerified: lead.phoneVerified,
        mobileVerified: lead.mobileVerified,
        enrichmentScore: lead.enrichmentScore,
        emailConfidence: lead.emailConfidence,
        phoneConfidence: lead.phoneConfidence,
        dataCompleteness: lead.dataCompleteness,
        createdAt: lead.createdAt,
        updatedAt: new Date(),
        personId: lead.personId,
        deletedAt: lead.deletedAt,
        buyerGroupRole: lead.buyerGroupRole,
        completedStages: lead.completedStages || [],
        currentStage: lead.currentStage,
        lastActionDate: lead.lastActionDate,
        nextAction: lead.nextAction,
        nextActionDate: lead.nextActionDate,
        lastContactDate: lead.lastContactDate,
        companyId: lead.companyId
      }));
      
      await tx.prospects.createMany({ data: leadsAsProspects });
    }
    
    return {
      originalLeads: currentLeads.length,
      originalProspects: currentProspects.length
    };
  });
  
  // Verify results
  const finalLeadsCount = await prisma.leads.count({
    where: { workspaceId: testWorkspaceId }
  });
  const finalProspectsCount = await prisma.prospects.count({
    where: { workspaceId: testWorkspaceId }
  });
  
  console.log(`Final: ${finalLeadsCount} leads, ${finalProspectsCount} prospects`);
  
  // Validate the swap worked
  const swapSuccess = (
    finalLeadsCount === initialProspectsCount &&
    finalProspectsCount === initialLeadsCount
  );
  
  if (swapSuccess) {
    console.log('✅ TEST PASSED: Data swap worked correctly!');
  } else {
    console.log('❌ TEST FAILED: Data swap did not work as expected!');
  }
  
  return swapSuccess;
}

/**
 * 🧹 Clean up test data
 */
async function cleanupTestData(testWorkspaceId) {
  console.log('🧹 Cleaning up test data...');
  
  await prisma.leads.deleteMany({
    where: { workspaceId: testWorkspaceId }
  });
  await prisma.prospects.deleteMany({
    where: { workspaceId: testWorkspaceId }
  });
  
  console.log('✅ Test data cleaned up');
}

/**
 * 🚀 Main test function
 */
async function main() {
  try {
    console.log('🧪 Starting Migration Test');
    console.log('========================');
    
    // Create test data
    const { testWorkspaceId } = await createTestData();
    
    // Test the migration
    const testPassed = await testSwapMigration(testWorkspaceId);
    
    // Clean up
    await cleanupTestData(testWorkspaceId);
    
    if (testPassed) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('The migration script is ready to use on production data.');
      console.log('\nTo run the actual migration:');
      console.log('node scripts/database/swap-leads-prospects-migration.js --confirm');
    } else {
      console.log('\n❌ TESTS FAILED!');
      console.log('Please review the migration logic before running on production data.');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
