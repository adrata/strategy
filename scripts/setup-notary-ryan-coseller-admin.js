#!/usr/bin/env node

/**
 * 🔗 SETUP NOTARY EVERYDAY CO-SELLER AND ADMIN ACCESS
 * 
 * Adds Ryan as co-seller on all of Dano's deals (people) in the Notary Everyday workspace
 * and grants WORKSPACE_ADMIN role to Ryan and Noel.
 * 
 * Usage: node scripts/setup-notary-ryan-coseller-admin.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function setupNotaryCoSellerAndAdmin() {
  try {
    console.log('🔗 SETTING UP NOTARY EVERYDAY CO-SELLER AND ADMIN ACCESS\n');
    console.log('=' .repeat(60));
    
    // Step 1: Find users and workspace
    console.log('\n📋 Step 1: Finding users and workspace...\n');
    
    const dano = await prisma.users.findFirst({
      where: { email: 'dano@notaryeveryday.com' }
    });
    
    const ryan = await prisma.users.findFirst({
      where: { email: 'ryan@notaryeveryday.com' }
    });
    
    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });
    
    if (!dano) {
      console.log('❌ Dano user not found!');
      return;
    }
    
    if (!ryan) {
      console.log('❌ Ryan user not found!');
      return;
    }
    
    if (!noel) {
      console.log('❌ Noel user not found!');
      return;
    }
    
    console.log('✅ Found users:');
    console.log(`   Dano: ${dano.name} (${dano.id})`);
    console.log(`   Ryan: ${ryan.name} (${ryan.id})`);
    console.log(`   Noel: ${noel.name} (${noel.id})`);
    
    // Find Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: 'notary-everyday' },
          { slug: 'ne' }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }
    
    console.log(`\n✅ Found workspace: ${workspace.name} (${workspace.id})`);
    
    // Step 2: Add Ryan as co-seller on all of Dano's people
    console.log('\n📋 Step 2: Adding Ryan as co-seller on Dano\'s people...\n');
    
    // Get all people where Dano is the main seller
    const danoPeople = await prisma.people.findMany({
      where: {
        mainSellerId: dano.id,
        workspaceId: workspace.id,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        status: true
      }
    });
    
    console.log(`📊 Found ${danoPeople.length} people assigned to Dano`);
    
    if (danoPeople.length === 0) {
      console.log('⚠️  No people found assigned to Dano, skipping co-seller setup');
    } else {
      // Create co-seller relationships in batches
      const batchSize = 100;
      let coSellersAdded = 0;
      let coSellersSkipped = 0;
      
      for (let i = 0; i < danoPeople.length; i += batchSize) {
        const batch = danoPeople.slice(i, i + batchSize);
        
        const coSellerRecords = batch.map(person => ({
          personId: person.id,
          userId: ryan.id
        }));
        
        // Use createMany with skipDuplicates to avoid constraint violations
        const result = await prisma.person_co_sellers.createMany({
          data: coSellerRecords,
          skipDuplicates: true
        });
        
        coSellersAdded += result.count;
        coSellersSkipped += (batch.length - result.count);
        
        console.log(`   ✅ Processed batch ${Math.floor(i/batchSize) + 1}: ${result.count} co-sellers added, ${batch.length - result.count} already existed`);
      }
      
      console.log(`\n📈 Co-seller Summary:`);
      console.log(`   Total people: ${danoPeople.length}`);
      console.log(`   Co-sellers added: ${coSellersAdded}`);
      console.log(`   Already existed: ${coSellersSkipped}`);
    }
    
    // Step 3: Update workspace roles to WORKSPACE_ADMIN
    console.log('\n📋 Step 3: Updating workspace roles to WORKSPACE_ADMIN...\n');
    
    // Update Ryan's role
    const ryanMembership = await prisma.workspace_users.findFirst({
      where: {
        userId: ryan.id,
        workspaceId: workspace.id
      }
    });
    
    if (ryanMembership) {
      await prisma.workspace_users.update({
        where: { id: ryanMembership.id },
        data: {
          role: 'WORKSPACE_ADMIN',
          updatedAt: new Date()
        }
      });
      console.log('✅ Updated Ryan\'s role to WORKSPACE_ADMIN');
    } else {
      await prisma.workspace_users.create({
        data: {
          userId: ryan.id,
          workspaceId: workspace.id,
          role: 'WORKSPACE_ADMIN'
        }
      });
      console.log('✅ Created Ryan\'s workspace membership with WORKSPACE_ADMIN role');
    }
    
    // Update Noel's role
    const noelMembership = await prisma.workspace_users.findFirst({
      where: {
        userId: noel.id,
        workspaceId: workspace.id
      }
    });
    
    if (noelMembership) {
      await prisma.workspace_users.update({
        where: { id: noelMembership.id },
        data: {
          role: 'WORKSPACE_ADMIN',
          updatedAt: new Date()
        }
      });
      console.log('✅ Updated Noel\'s role to WORKSPACE_ADMIN');
    } else {
      await prisma.workspace_users.create({
        data: {
          userId: noel.id,
          workspaceId: workspace.id,
          role: 'WORKSPACE_ADMIN'
        }
      });
      console.log('✅ Created Noel\'s workspace membership with WORKSPACE_ADMIN role');
    }
    
    // Step 4: Verify results
    console.log('\n📋 Step 4: Verifying results...\n');
    
    // Count people with Ryan as co-seller
    const peopleWithRyanCoSeller = await prisma.person_co_sellers.count({
      where: {
        userId: ryan.id,
        person: {
          workspaceId: workspace.id,
          deletedAt: null
        }
      }
    });
    
    console.log(`📊 Verification Results:`);
    console.log(`   People with Ryan as co-seller: ${peopleWithRyanCoSeller}`);
    
    // Check workspace admin roles
    const workspaceAdmins = await prisma.workspace_users.findMany({
      where: {
        workspaceId: workspace.id,
        role: 'WORKSPACE_ADMIN',
        isActive: true
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log(`   Workspace admins: ${workspaceAdmins.length}`);
    workspaceAdmins.forEach((admin, index) => {
      console.log(`     ${index + 1}. ${admin.user.name} (${admin.user.email})`);
    });
    
    // Note about companies
    console.log('\n📝 Note about Companies:');
    console.log('   Companies table has mainSellerId but no co-seller relationship table.');
    console.log('   Companies remain assigned to Dano as main seller only.');
    console.log('   If co-seller functionality is needed for companies, a company_co_sellers table would need to be created.');
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('Ryan is now co-seller on all of Dano\'s people, and both Ryan and Noel have WORKSPACE_ADMIN access.');
    
  } catch (error) {
    console.error('❌ Error setting up co-seller and admin access:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupNotaryCoSellerAndAdmin();
