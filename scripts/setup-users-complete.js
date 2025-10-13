#!/usr/bin/env node

/**
 * 👥 SETUP USERS COMPLETE
 * 
 * Sets up proper users for Adrata and Demo workspaces
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function setupUsersComplete() {
  try {
    console.log('👥 Setting up workspace users...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Find or create users
    console.log('👤 FINDING/CREATING USERS:');
    
    // Find or create Dan
    let dan = await newPrisma.users.findFirst({
      where: {
        name: {
          contains: 'Dan',
          mode: 'insensitive'
        }
      }
    });
    
    if (!dan) {
      dan = await newPrisma.users.create({
        data: {
          name: 'Dan',
          email: 'dan@adrata.com',
          image: null,
          updatedAt: new Date()
        }
      });
      console.log('✅ Created Dan user');
    } else {
      console.log('✅ Found Dan user');
    }
    
    // Find or create Ross
    let ross = await newPrisma.users.findFirst({
      where: {
        name: {
          contains: 'Ross',
          mode: 'insensitive'
        }
      }
    });
    
    if (!ross) {
      ross = await newPrisma.users.create({
        data: {
          name: 'Ross',
          email: 'ross@adrata.com',
          image: null,
          updatedAt: new Date()
        }
      });
      console.log('✅ Created Ross user');
    } else {
      console.log('✅ Found Ross user');
    }
    
    // Find or create Todd
    let todd = await newPrisma.users.findFirst({
      where: {
        name: {
          contains: 'Todd',
          mode: 'insensitive'
        }
      }
    });
    
    if (!todd) {
      todd = await newPrisma.users.create({
        data: {
          name: 'Todd',
          email: 'todd@adrata.com',
          image: null,
          updatedAt: new Date()
        }
      });
      console.log('✅ Created Todd user');
    } else {
      console.log('✅ Found Todd user');
    }

    // 2. Find workspaces
    console.log('\n🏢 FINDING WORKSPACES:');
    
    const adrataWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Adrata',
          mode: 'insensitive'
        }
      }
    });
    
    if (!adratraWorkspace) {
      throw new Error('Adrata workspace not found!');
    }
    console.log(`✅ Found Adrata workspace: ${adratraWorkspace.name}`);
    
    const demoWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Demo',
          mode: 'insensitive'
        }
      }
    });
    
    if (!demoWorkspace) {
      throw new Error('Demo workspace not found!');
    }
    console.log(`✅ Found Demo workspace: ${demoWorkspace.name}`);

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

    // 4. Add users to Adrata workspace (Dan, Ross, Todd)
    console.log('\n👥 ADDING USERS TO ADRATA WORKSPACE:');
    
    await newPrisma.workspace_users.createMany({
      data: [
        {
          workspaceId: adrataWorkspace.id,
          userId: dan.id,
          role: 'MEMBER',
          joinedAt: new Date()
        },
        {
          workspaceId: adrataWorkspace.id,
          userId: ross.id,
          role: 'MEMBER',
          joinedAt: new Date()
        },
        {
          workspaceId: adrataWorkspace.id,
          userId: todd.id,
          role: 'MEMBER',
          joinedAt: new Date()
        }
      ]
    });
    console.log('✅ Added Dan, Ross, Todd to Adrata workspace');

    // 5. Add users to Demo workspace (Dan, Ross)
    console.log('\n👥 ADDING USERS TO DEMO WORKSPACE:');
    
    await newPrisma.workspace_users.createMany({
      data: [
        {
          workspaceId: demoWorkspace.id,
          userId: dan.id,
          role: 'MEMBER',
          joinedAt: new Date()
        },
        {
          workspaceId: demoWorkspace.id,
          userId: ross.id,
          role: 'ADMIN', // Ross is admin in Demo
          joinedAt: new Date()
        }
      ]
    });
    console.log('✅ Added Dan, Ross to Demo workspace (Ross as admin)');

    // 6. Set Ross as main seller for all companies and people in Demo workspace
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
    
    console.log(`✅ Set Ross as main seller for ${demoCompanies} companies and ${demoPeople} people in Demo workspace`);

    // 7. Summary
    console.log('\n📊 SETUP SUMMARY:');
    console.log('==================');
    console.log(`✅ Adrata workspace users: Dan, Ross, Todd`);
    console.log(`✅ Demo workspace users: Dan, Ross (Ross as admin)`);
    console.log(`✅ Ross is main seller for all Demo workspace records`);
    console.log('\n🎉 Workspace user setup completed successfully!');

  } catch (error) {
    console.error('❌ Error during user setup:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the setup
setupUsersComplete();
