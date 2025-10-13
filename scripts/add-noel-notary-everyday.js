#!/usr/bin/env node

/**
 * 👤 ADD NOEL SERRATO TO NOTARY EVERYDAY WORKSPACE
 * 
 * Creates Noel Serrato as a workspace admin for the Notary Everyday workspace
 * with email noel@notaryeveryday.com and Arizona location
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Noel's user configuration
const NOEL_CONFIG = {
  email: 'noel@notaryeveryday.com',
  name: 'Noel Serrato',
  firstName: 'Noel',
  lastName: 'Serrato',
  timezone: 'America/Phoenix', // Arizona timezone
  role: 'WORKSPACE_ADMIN'
};

async function addNoelToNotaryEveryday() {
  try {
    console.log('👤 Adding Noel Serrato to Notary Everyday workspace...\n');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Step 1: Find Notary Everyday workspace
    console.log('🔍 Finding Notary Everyday workspace...');
    
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Step 2: Check if Noel already exists
    console.log('👤 Checking if Noel already exists...');
    
    let noelUser = await prisma.users.findFirst({
      where: {
        email: NOEL_CONFIG.email
      }
    });

    if (noelUser) {
      console.log(`📋 Noel already exists: ${noelUser.name} (${noelUser.email})`);
    } else {
      // Step 3: Generate temporary password
      console.log('🔐 Generating temporary password...');
      const tempPassword = crypto.randomBytes(8).toString('hex'); // 16 character password
      const hashedPassword = await bcrypt.hash(tempPassword, 12);
      
      // Step 4: Create Noel's user account
      console.log('👤 Creating Noel\'s user account...');
      
      noelUser = await prisma.users.create({
        data: {
          email: NOEL_CONFIG.email,
          password: hashedPassword,
          name: NOEL_CONFIG.name,
          firstName: NOEL_CONFIG.firstName,
          lastName: NOEL_CONFIG.lastName,
          timezone: NOEL_CONFIG.timezone,
          isActive: true,
          activeWorkspaceId: workspace.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Created user: ${noelUser.name} (${noelUser.email})`);
      console.log(`🔑 TEMPORARY PASSWORD: ${tempPassword}`);
      console.log('⚠️  Please share this password with Noel for initial login\n');
    }

    // Step 5: Check if Noel is already a member of the workspace
    console.log('🏢 Checking workspace membership...');
    
    const existingMembership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: noelUser.id
      }
    });

    if (existingMembership) {
      console.log(`📋 Noel is already a member of ${workspace.name} with role: ${existingMembership.role}`);
      
      // Update role to WORKSPACE_ADMIN if not already
      if (existingMembership.role !== NOEL_CONFIG.role) {
        await prisma.workspace_users.update({
          where: { id: existingMembership.id },
          data: {
            role: NOEL_CONFIG.role,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Updated Noel's role to ${NOEL_CONFIG.role}`);
      }
    } else {
      // Step 6: Add Noel to workspace with WORKSPACE_ADMIN role
      console.log('🏢 Adding Noel to Notary Everyday workspace...');
      
      await prisma.workspace_users.create({
        data: {
          workspaceId: workspace.id,
          userId: noelUser.id,
          role: NOEL_CONFIG.role,
          isActive: true,
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Added Noel to ${workspace.name} with role: ${NOEL_CONFIG.role}`);
    }

    // Step 7: Summary
    console.log('\n📊 SETUP SUMMARY:');
    console.log('==================');
    console.log(`✅ User: ${noelUser.name} (${noelUser.email})`);
    console.log(`✅ Workspace: ${workspace.name} (${workspace.id})`);
    console.log(`✅ Role: ${NOEL_CONFIG.role}`);
    console.log(`✅ Location: Arizona (${NOEL_CONFIG.timezone})`);
    console.log(`✅ Status: Active`);
    
    if (!existingMembership) {
      console.log('\n🎉 Noel Serrato has been successfully added to the Notary Everyday workspace!');
      console.log('Noel can now log in with the provided temporary password and change it on first login.');
    } else {
      console.log('\n🎉 Noel Serrato\'s workspace access has been verified and updated!');
    }

  } catch (error) {
    console.error('❌ Error adding Noel to workspace:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
addNoelToNotaryEveryday();
