#!/usr/bin/env node

/**
 * 🔍 STUDY DATA MODEL
 * 
 * Carefully examine what data we actually have in the database
 */

const { PrismaClient } = require('@prisma/client');

async function studyDataModel() {
  console.log('🔍 STUDYING ADRATA DATA MODEL');
  console.log('==============================\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // 1. Check UserProfile table
    console.log('1️⃣ USER PROFILES:');
    console.log('------------------');
    const userProfiles = await prisma.userProfile.findMany({
      take: 10
    });
    console.log(`Total UserProfiles: ${userProfiles.length}`);
    
    if (userProfiles.length > 0) {
      console.log('Sample UserProfiles:');
      userProfiles.forEach(p => {
        console.log(`   - UserId: ${p.userId}, WorkspaceId: ${p.workspaceId}`);
        console.log(`     Title: ${p.title || 'N/A'}, Department: ${p.department || 'N/A'}`);
        console.log(`     Territory: ${p.territory || 'N/A'}, Quota: ${p.quota || 'N/A'}`);
      });
    }
    
    // 2. Check WorkspaceMembership table
    console.log('\n2️⃣ WORKSPACE MEMBERSHIPS:');
    console.log('---------------------------');
    const memberships = await prisma.workspaceMembership.findMany({
      take: 10
    });
    console.log(`Total WorkspaceMemberships: ${memberships.length}`);
    
    if (memberships.length > 0) {
      console.log('Sample WorkspaceMemberships:');
      memberships.forEach(m => {
        console.log(`   - UserId: ${m.userId}, WorkspaceId: ${m.workspaceId}`);
        console.log(`     Role: ${m.role}, Active: ${m.isActive}`);
      });
    }
    
    // 3. Check SellerProductPortfolio table
    console.log('\n3️⃣ SELLER PRODUCT PORTFOLIOS:');
    console.log('-------------------------------');
    const products = await prisma.sellerProductPortfolio.findMany({
      take: 5
    });
    console.log(`Total SellerProductPortfolios: ${products.length}`);
    
    if (products.length > 0) {
      console.log('Sample SellerProductPortfolios:');
      products.forEach(p => {
        console.log(`   - SellerId: ${p.sellerId}, WorkspaceId: ${p.workspaceId}`);
        console.log(`     Product: ${p.productName} (${p.productCategory})`);
        console.log(`     Target Industries: ${JSON.stringify(p.targetIndustries)}`);
        console.log(`     Buying Committee Roles: ${JSON.stringify(p.buyingCommitteeRoles)}`);
      });
    }
    
    // 4. Check leads table
    console.log('\n4️⃣ LEADS:');
    console.log('----------');
    const totalLeads = await prisma.leads.count();
    console.log(`Total Leads: ${totalLeads}`);
    
    if (totalLeads > 0) {
      const sampleLeads = await prisma.leads.findMany({
        take: 5
      });
      console.log('Sample Leads:');
      sampleLeads.forEach(l => {
        console.log(`   - LeadId: ${l.id}, AssignedUserId: ${l.assignedUserId}`);
        console.log(`     WorkspaceId: ${l.workspaceId}, Company: ${l.company || 'N/A'}`);
        console.log(`     Name: ${l.fullName || 'N/A'}, Title: ${l.title || 'N/A'}`);
      });
    }
    
    // 5. Get unique workspace IDs
    console.log('\n5️⃣ UNIQUE WORKSPACE IDs:');
    console.log('--------------------------');
    
    // Get workspace IDs from various tables
    const userWorkspaces = userProfiles.map(p => p.workspaceId);
    const membershipWorkspaces = memberships.map(m => m.workspaceId);
    const productWorkspaces = products.map(p => p.workspaceId);
    
    const allWorkspaceIds = [...new Set([...userWorkspaces, ...membershipWorkspaces, ...productWorkspaces])];
    
    console.log('Found workspace IDs:');
    allWorkspaceIds.forEach(w => {
      console.log(`   - ${w}`);
    });
    
    // 6. Search for anything with 'dano' or 'ryan'
    console.log('\n6️⃣ SEARCHING FOR DANO AND RYAN:');
    console.log('---------------------------------');
    
    // Search UserProfiles
    const danoUserProfiles = userProfiles.filter(p => 
      p.userId.toLowerCase().includes('dano') || 
      p.userId.toLowerCase().includes('ryan')
    );
    console.log(`UserProfiles with dano/ryan: ${danoUserProfiles.length}`);
    
    // Search WorkspaceMemberships
    const danoMemberships = memberships.filter(m => 
      m.userId.toLowerCase().includes('dano') || 
      m.userId.toLowerCase().includes('ryan')
    );
    console.log(`WorkspaceMemberships with dano/ryan: ${danoMemberships.length}`);
    
    // Search SellerProductPortfolio
    const danoProducts = products.filter(p => 
      p.sellerId.toLowerCase().includes('dano') || 
      p.sellerId.toLowerCase().includes('ryan')
    );
    console.log(`SellerProductPortfolios with dano/ryan: ${danoProducts.length}`);
    
    // Search leads if any exist
    if (totalLeads > 0) {
      const danoLeads = await prisma.leads.findMany({
        where: {
          OR: [
            { assignedUserId: { contains: 'dano', mode: 'insensitive' } },
            { assignedUserId: { contains: 'ryan', mode: 'insensitive' } }
          ]
        },
        take: 5
      });
      console.log(`Leads assigned to dano/ryan: ${danoLeads.length}`);
      
      if (danoLeads.length > 0) {
        console.log('Sample leads for dano/ryan:');
        danoLeads.forEach(l => {
          console.log(`   - AssignedUserId: ${l.assignedUserId}, WorkspaceId: ${l.workspaceId}`);
          console.log(`     Company: ${l.company || 'N/A'}, Name: ${l.fullName || 'N/A'}`);
        });
      }
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Data model study complete!');
    
  } catch (error) {
    console.error('❌ Error studying data model:', error.message);
    console.error('Stack:', error.stack);
  }
}

studyDataModel();
