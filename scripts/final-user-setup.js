#!/usr/bin/env node

/**
 * 👥 FINAL USER SETUP
 * 
 * Sets up users for Adrata and Demo workspaces
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function finalUserSetup() {
  try {
    console.log('👥 Final user setup...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Find users
    const dan = await newPrisma.users.findFirst({
      where: { name: { contains: 'Dan', mode: 'insensitive' } }
    });
    
    const ross = await newPrisma.users.findFirst({
      where: { name: { contains: 'Ross', mode: 'insensitive' } }
    });
    
    const todd = await newPrisma.users.findFirst({
      where: { name: { contains: 'Todd', mode: 'insensitive' } }
    });
    
    console.log(`✅ Dan: ${dan ? 'Found' : 'Not found'}`);
    console.log(`✅ Ross: ${ross ? 'Found' : 'Not found'}`);
    console.log(`✅ Todd: ${todd ? 'Found' : 'Not found'}`);

    // 2. Find workspaces
    const adrataWorkspace = await newPrisma.workspaces.findFirst({
      where: { name: { contains: 'Adrata', mode: 'insensitive' } }
    });
    
    const demoWorkspace = await newPrisma.workspaces.findFirst({
      where: { name: { contains: 'Demo', mode: 'insensitive' } }
    });
    
    console.log(`✅ Adrata: ${adratraWorkspace ? 'Found' : 'Not found'}`);
    console.log(`✅ Demo: ${demoWorkspace ? 'Found' : 'Not found'}`);

    if (!dan || !ross || !todd || !adratraWorkspace || !demoWorkspace) {
      console.log('❌ Missing required users or workspaces');
      return;
    }

    // 3. Clear existing workspace users
    console.log('\n🗑️ CLEARING EXISTING WORKSPACE USERS:');
    
    await newPrisma.workspace_users.deleteMany({
      where: { workspaceId: adrataWorkspace.id }
    });
    console.log('✅ Cleared Adrata workspace users');
    
    await newPrisma.workspace_users.deleteMany({
      where: { workspaceId: demoWorkspace.id }
    });
    console.log('✅ Cleared Demo workspace users');

    // 4. Add users to Adrata workspace
    console.log('\n👥 ADDING USERS TO ADRATA WORKSPACE:');
    
    await newPrisma.workspace_users.createMany({
      data: [
        { workspaceId: adrataWorkspace.id, userId: dan.id, role: 'MEMBER', joinedAt: new Date() },
        { workspaceId: adrataWorkspace.id, userId: ross.id, role: 'MEMBER', joinedAt: new Date() },
        { workspaceId: adrataWorkspace.id, userId: todd.id, role: 'MEMBER', joinedAt: new Date() }
      ]
    });
    console.log('✅ Added Dan, Ross, Todd to Adrata workspace');

    // 5. Add users to Demo workspace
    console.log('\n👥 ADDING USERS TO DEMO WORKSPACE:');
    
    await newPrisma.workspace_users.createMany({
      data: [
        { workspaceId: demoWorkspace.id, userId: dan.id, role: 'MEMBER', joinedAt: new Date() },
        { workspaceId: demoWorkspace.id, userId: ross.id, role: 'ADMIN', joinedAt: new Date() }
      ]
    });
    console.log('✅ Added Dan, Ross to Demo workspace (Ross as admin)');

    // 6. Set Ross as main seller for Demo workspace
    console.log('\n👑 SETTING ROSS AS MAIN SELLER IN DEMO WORKSPACE:');
    
    const demoCompanies = await newPrisma.companies.count({
      where: { workspaceId: demoWorkspace.id }
    });
    
    const demoPeople = await newPrisma.people.count({
      where: { workspaceId: demoWorkspace.id }
    });
    
    await newPrisma.companies.updateMany({
      where: { workspaceId: demoWorkspace.id },
      data: { mainSellerId: ross.id }
    });
    
    await newPrisma.people.updateMany({
      where: { workspaceId: demoWorkspace.id },
      data: { mainSellerId: ross.id }
    });
    
    console.log(`✅ Set Ross as main seller for ${demoCompanies} companies and ${demoPeople} people`);

    console.log('\n🎉 User setup completed successfully!');

  } catch (error) {
    console.error('❌ Error during user setup:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the setup
finalUserSetup();
