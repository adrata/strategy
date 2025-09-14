#!/usr/bin/env node

/**
 * 👤 SETUP DANO'S WORKSPACE ACCESS
 * 
 * Create Dano's workspace memberships and check account data
 */

const { PrismaClient } = require('@prisma/client');

async function setupDanoAccess() {
  console.log('👤 SETTING UP DANO\'S WORKSPACE ACCESS');
  console.log('======================================\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // Workspace IDs from previous check
    const RETAIL_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
    const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';
    const DANO_USER_ID = 'dano';
    
    console.log('1️⃣ CREATING DANO\'S WORKSPACE MEMBERSHIPS:');
    console.log('-------------------------------------------');
    
    // Check if Dano already has memberships
    const existingMemberships = await prisma.workspaceMembership.findMany({
      where: { userId: DANO_USER_ID }
    });
    
    console.log(`Existing memberships for Dano: ${existingMemberships.length}`);
    
    // Create membership for Retail Product Solutions
    let retailMembership;
    const existingRetail = existingMemberships.find(m => m.workspaceId === RETAIL_WORKSPACE_ID);
    
    if (!existingRetail) {
      retailMembership = await prisma.workspaceMembership.create({
        data: {
          id: `dano-retail-${Date.now()}`,
          userId: DANO_USER_ID,
          workspaceId: RETAIL_WORKSPACE_ID,
          role: 'SELLER',
          isActive: true,
          joinedAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ Created Retail Product Solutions membership for Dano');
    } else {
      console.log('✅ Dano already has Retail Product Solutions membership');
      retailMembership = existingRetail;
    }
    
    // Create membership for Notary Everyday
    let notaryMembership;
    const existingNotary = existingMemberships.find(m => m.workspaceId === NOTARY_WORKSPACE_ID);
    
    if (!existingNotary) {
      notaryMembership = await prisma.workspaceMembership.create({
        data: {
          id: `dano-notary-${Date.now()}`,
          userId: DANO_USER_ID,
          workspaceId: NOTARY_WORKSPACE_ID,
          role: 'SELLER',
          isActive: true,
          joinedAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ Created Notary Everyday membership for Dano');
    } else {
      console.log('✅ Dano already has Notary Everyday membership');
      notaryMembership = existingNotary;
    }
    
    console.log('\n2️⃣ CHECKING NOTARY EVERYDAY ACCOUNTS/LEADS:');
    console.log('---------------------------------------------');
    
    // Check leads in Notary Everyday workspace
    const notaryLeads = await prisma.leads.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID },
      take: 10 // Get sample
    });
    
    const totalNotaryLeads = await prisma.leads.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    console.log(`Total leads in Notary Everyday: ${totalNotaryLeads}`);
    
    if (notaryLeads.length > 0) {
      console.log('Sample Notary Everyday leads:');
      notaryLeads.forEach((lead, i) => {
        console.log(`   ${i + 1}. ${lead.fullName || 'N/A'} at ${lead.company || 'N/A'}`);
        console.log(`      Title: ${lead.title || 'N/A'}, Status: ${lead.status}`);
        console.log(`      AssignedUserId: ${lead.assignedUserId || 'Unassigned'}`);
      });
    }
    
    // Check leads assigned to Dano in Notary Everyday
    const danoNotaryLeads = await prisma.leads.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      }
    });
    
    console.log(`\nLeads assigned to Dano in Notary Everyday: ${danoNotaryLeads}`);
    
    console.log('\n3️⃣ CHECKING RETAIL PRODUCT SOLUTIONS ACCOUNTS/LEADS:');
    console.log('------------------------------------------------------');
    
    // Check leads in Retail workspace
    const retailLeads = await prisma.leads.findMany({
      where: { workspaceId: RETAIL_WORKSPACE_ID },
      take: 5 // Get sample
    });
    
    const totalRetailLeads = await prisma.leads.count({
      where: { workspaceId: RETAIL_WORKSPACE_ID }
    });
    
    console.log(`Total leads in Retail Product Solutions: ${totalRetailLeads}`);
    
    if (retailLeads.length > 0) {
      console.log('Sample Retail Product Solutions leads:');
      retailLeads.forEach((lead, i) => {
        console.log(`   ${i + 1}. ${lead.fullName || 'N/A'} at ${lead.company || 'N/A'}`);
        console.log(`      Title: ${lead.title || 'N/A'}, Status: ${lead.status}`);
      });
    }
    
    // Check unique companies in each workspace
    console.log('\n4️⃣ UNIQUE COMPANIES BY WORKSPACE:');
    console.log('-----------------------------------');
    
    // Get unique companies in Notary Everyday
    const notaryCompanies = await prisma.leads.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        company: { not: null }
      },
      select: { company: true },
      distinct: ['company'],
      take: 10
    });
    
    console.log(`Unique companies in Notary Everyday (first 10):`);
    notaryCompanies.forEach(c => {
      console.log(`   - ${c.company}`);
    });
    
    // Get unique companies in Retail
    const retailCompanies = await prisma.leads.findMany({
      where: { 
        workspaceId: RETAIL_WORKSPACE_ID,
        company: { not: null }
      },
      select: { company: true },
      distinct: ['company'],
      take: 10
    });
    
    console.log(`\nUnique companies in Retail Product Solutions (first 10):`);
    retailCompanies.forEach(c => {
      console.log(`   - ${c.company}`);
    });
    
    await prisma.$disconnect();
    console.log('\n✅ Dano setup complete!');
    
    return {
      retailWorkspaceId: RETAIL_WORKSPACE_ID,
      notaryWorkspaceId: NOTARY_WORKSPACE_ID,
      totalNotaryLeads,
      totalRetailLeads,
      danoNotaryLeads
    };
    
  } catch (error) {
    console.error('❌ Error setting up Dano:', error.message);
    console.error('Stack:', error.stack);
  }
}

setupDanoAccess();
