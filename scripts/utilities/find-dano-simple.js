#!/usr/bin/env node

/**
 * 🔍 FIND DANO - SIMPLE DATABASE SEARCH
 * 
 * Search for Dano's actual workspace and profile data
 */

const { PrismaClient } = require('@prisma/client');

async function findDano() {
  console.log('🔍 Searching for Dano in the database...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // 1. Find all UserProfiles that might be Dano
    console.log('1️⃣ Searching UserProfile table...');
    const allUserProfiles = await prisma.userProfile.findMany({
      take: 20 // Get first 20 to see what's there
    });
    
    console.log(`Found ${allUserProfiles.length} user profiles total`);
    
    const danoProfiles = allUserProfiles.filter(p => 
      p.userId.toLowerCase().includes('dano') || 
      (p.title && p.title.toLowerCase().includes('dano'))
    );
    
    console.log(`Found ${danoProfiles.length} profiles matching 'dano':`);
    danoProfiles.forEach(p => {
      console.log(`   - UserId: ${p.userId}, WorkspaceId: ${p.workspaceId}, Title: ${p.title || 'N/A'}`);
    });
    
    // 2. Find all WorkspaceMemberships
    console.log('\n2️⃣ Searching WorkspaceMembership table...');
    const allMemberships = await prisma.workspaceMembership.findMany({
      take: 20
    });
    
    console.log(`Found ${allMemberships.length} workspace memberships total`);
    
    const danoMemberships = allMemberships.filter(m => 
      m.userId.toLowerCase().includes('dano')
    );
    
    console.log(`Found ${danoMemberships.length} memberships for dano:`);
    danoMemberships.forEach(m => {
      console.log(`   - UserId: ${m.userId}, WorkspaceId: ${m.workspaceId}, Role: ${m.role}, Active: ${m.isActive}`);
    });
    
    // 3. Find SellerProductPortfolio
    console.log('\n3️⃣ Searching SellerProductPortfolio table...');
    const allProducts = await prisma.sellerProductPortfolio.findMany({
      take: 10
    });
    
    console.log(`Found ${allProducts.length} product portfolios total`);
    
    const danoProducts = allProducts.filter(p => 
      p.sellerId.toLowerCase().includes('dano')
    );
    
    console.log(`Found ${danoProducts.length} product portfolios for dano:`);
    danoProducts.forEach(p => {
      console.log(`   - SellerId: ${p.sellerId}, WorkspaceId: ${p.workspaceId}, Product: ${p.productName}`);
      console.log(`     Industries: ${JSON.stringify(p.targetIndustries)}`);
      console.log(`     Buyer Roles: ${JSON.stringify(p.buyingCommitteeRoles)}`);
    });
    
    // 4. Find leads assigned to dano
    console.log('\n4️⃣ Searching Lead table...');
    const totalLeads = await prisma.lead.count();
    console.log(`Found ${totalLeads} leads total in database`);
    
    const danoLeads = await prisma.lead.findMany({
      where: {
        assignedUserId: { contains: 'dano', mode: 'insensitive' }
      },
      take: 5
    });
    
    console.log(`Found ${danoLeads.length} leads assigned to dano (showing first 5):`);
    danoLeads.forEach(l => {
      console.log(`   - LeadId: ${l.id}, AssignedUserId: ${l.assignedUserId}, WorkspaceId: ${l.workspaceId}`);
      console.log(`     Company: ${l.companyName || 'N/A'}, Person: ${l.fullName || 'N/A'}`);
    });
    
    // 5. Check what workspace IDs exist
    console.log('\n5️⃣ Checking unique workspace IDs...');
    const uniqueWorkspaces = new Set();
    
    allUserProfiles.forEach(p => uniqueWorkspaces.add(p.workspaceId));
    allMemberships.forEach(m => uniqueWorkspaces.add(m.workspaceId));
    
    console.log('Unique workspace IDs found:');
    Array.from(uniqueWorkspaces).forEach(w => {
      console.log(`   - ${w}`);
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findDano();
