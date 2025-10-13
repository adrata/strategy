#!/usr/bin/env node

/**
 * 🔐 UPDATE RYAN TO ADMIN AND GENERATE NEW PASSWORDS
 * 
 * Updates Ryan to WORKSPACE_ADMIN role and generates new passwords for Dano, Ryan, and Noel
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function updateRyanAndGeneratePasswords() {
  try {
    console.log('🔐 Updating Ryan to admin and generating new passwords...\n');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Step 1: Update Ryan to WORKSPACE_ADMIN
    console.log('👑 Updating Ryan to WORKSPACE_ADMIN...');
    
    const ryan = await prisma.users.findFirst({
      where: {
        email: 'ryan@notaryeveryday.com'
      }
    });

    if (ryan) {
      // Find Ryan's workspace membership
      const ryanMembership = await prisma.workspace_users.findFirst({
        where: {
          userId: ryan.id,
          workspaceId: {
            in: await prisma.workspaces.findMany({
              where: {
                OR: [
                  { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
                  { name: { contains: 'NotaryEveryday', mode: 'insensitive' } }
                ]
              },
              select: { id: true }
            }).then(workspaces => workspaces.map(w => w.id))
          }
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
        console.log(`✅ Updated Ryan's role to WORKSPACE_ADMIN`);
      } else {
        console.log('❌ Ryan workspace membership not found!');
      }
    } else {
      console.log('❌ Ryan user not found!');
    }

    // Step 2: Generate new passwords for all three users
    console.log('\n🔐 Generating new passwords...');
    
    const users = [
      { email: 'dano@notaryeveryday.com', name: 'Dano', username: 'dano' },
      { email: 'ryan@notaryeveryday.com', name: 'Ryan', username: 'ryan' },
      { email: 'noel@notaryeveryday.com', name: 'Noel', username: 'noel' }
    ];

    const passwordResults = [];

    for (const userInfo of users) {
      const user = await prisma.users.findFirst({
        where: { email: userInfo.email }
      });

      if (user) {
        // Generate new password
        const newPassword = crypto.randomBytes(8).toString('hex'); // 16 character password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user with new password
        await prisma.users.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            username: userInfo.username,
            updatedAt: new Date()
          }
        });

        passwordResults.push({
          name: userInfo.name,
          email: userInfo.email,
          username: userInfo.username,
          password: newPassword
        });

        console.log(`✅ Updated ${userInfo.name}'s password and username`);
      } else {
        console.log(`❌ ${userInfo.name} user not found!`);
      }
    }

    // Step 3: Display all credentials
    console.log('\n📋 USER CREDENTIALS:');
    console.log('====================');
    
    passwordResults.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}:`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Username: ${user.username}`);
      console.log(`   🔑 Password: ${user.password}`);
    });

    // Step 4: Verify workspace roles
    console.log('\n👑 WORKSPACE ADMIN ROLES:');
    console.log('=========================');
    
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } }
        ]
      }
    });

    if (workspace) {
      const admins = await prisma.workspace_users.findMany({
        where: {
          workspaceId: workspace.id,
          role: 'WORKSPACE_ADMIN',
          isActive: true
        },
        include: {
          user: {
            select: { name: true, email: true, username: true }
          }
        }
      });

      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.user.name} (${admin.user.email}) - Username: ${admin.user.username || 'Not set'}`);
      });
    }

    console.log('\n🎉 All updates completed successfully!');
    console.log('Users can now log in with their new credentials.');

  } catch (error) {
    console.error('❌ Error updating users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the updates
updateRyanAndGeneratePasswords();
