#!/usr/bin/env node

/**
 * 🏢 CHECK EXISTING WORKSPACES
 * 
 * See what workspaces exist and create the ones we need for Dano
 */

const { PrismaClient } = require('@prisma/client');

async function checkWorkspaces() {
  console.log('🏢 CHECKING EXISTING WORKSPACES');
  console.log('================================\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // 1. Check existing workspaces
    console.log('1️⃣ EXISTING WORKSPACES:');
    console.log('------------------------');
    const existingWorkspaces = await prisma.workspaces.findMany();
    console.log(`Total workspaces: ${existingWorkspaces.length}`);
    
    if (existingWorkspaces.length > 0) {
      console.log('Current workspaces:');
      existingWorkspaces.forEach(w => {
        console.log(`   - ID: ${w.id}`);
        console.log(`     Name: ${w.name}`);
        console.log(`     Slug: ${w.slug}`);
        console.log(`     Description: ${w.description || 'N/A'}`);
        console.log('');
      });
    }
    
    // 2. Check if our target workspaces exist
    console.log('2️⃣ TARGET WORKSPACE CHECK:');
    console.log('----------------------------');
    
    const retailWorkspace = existingWorkspaces.find(w => 
      w.slug === 'retail-product-solutions' || 
      w.name.toLowerCase().includes('retail')
    );
    
    const notaryWorkspace = existingWorkspaces.find(w => 
      w.slug === 'notary-everyday' || 
      w.name.toLowerCase().includes('notary')
    );
    
    console.log(`Retail Product Solutions workspace: ${retailWorkspace ? '✅ EXISTS' : '❌ MISSING'}`);
    if (retailWorkspace) {
      console.log(`   ID: ${retailWorkspace.id}, Name: ${retailWorkspace.name}`);
    }
    
    console.log(`Notary Everyday workspace: ${notaryWorkspace ? '✅ EXISTS' : '❌ MISSING'}`);
    if (notaryWorkspace) {
      console.log(`   ID: ${notaryWorkspace.id}, Name: ${notaryWorkspace.name}`);
    }
    
    // 3. Check workspace memberships
    console.log('\n3️⃣ WORKSPACE MEMBERSHIPS:');
    console.log('--------------------------');
    const memberships = await prisma.workspaceMembership.findMany();
    console.log(`Total workspace memberships: ${memberships.length}`);
    
    // Look for any dano memberships
    const danoMemberships = memberships.filter(m => 
      m.userId.toLowerCase().includes('dano')
    );
    console.log(`Dano memberships: ${danoMemberships.length}`);
    
    // 4. Check leads in workspaces
    console.log('\n4️⃣ LEADS BY WORKSPACE:');
    console.log('-----------------------');
    
    if (existingWorkspaces.length > 0) {
      for (const workspace of existingWorkspaces.slice(0, 5)) { // Check first 5 workspaces
        const leadCount = await prisma.leads.count({
          where: { workspaceId: workspace.id }
        });
        console.log(`   ${workspace.name}: ${leadCount} leads`);
      }
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Workspace check complete!');
    
  } catch (error) {
    console.error('❌ Error checking workspaces:', error.message);
  }
}

checkWorkspaces();
