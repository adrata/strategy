#!/usr/bin/env node

/**
 * 🧪 TEST USER INVITATION SCRIPT
 * 
 * This script tests the user invitation system by inviting ross@adrata.com
 * It will create an invitation token and either send an email or display the setup link
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testInviteRoss() {
  console.log('🧪 [TEST INVITE] Starting invitation test for ross@adrata.com\n');

  try {
    await prisma.$connect();
    
    // 1. Get available workspaces
    console.log('1️⃣ [WORKSPACES] Looking up available workspaces...');
    const workspaces = await prisma.workspaces.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true
      }
    });

    if (workspaces.length === 0) {
      console.log('❌ No active workspaces found. Please create a workspace first.');
      return;
    }

    console.log(`Found ${workspaces.length} workspace(s):`);
    workspaces.forEach(ws => {
      console.log(`   - ${ws.name} (${ws.slug}) - ID: ${ws.id}`);
    });

    // Use the first workspace for the test
    const targetWorkspace = workspaces[0];
    console.log(`\n🎯 Using workspace: ${targetWorkspace.name} (${targetWorkspace.id})`);

    // 2. Check if ross@adrata.com already exists
    console.log('\n2️⃣ [USER CHECK] Checking if ross@adrata.com exists...');
    let user = await prisma.users.findFirst({
      where: {
        email: 'ross@adrata.com',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
      }
    });

    if (!user) {
      console.log('👤 Creating new user: ross@adrata.com');
      user = await prisma.users.create({
        data: {
          email: 'ross@adrata.com',
          name: 'Ross',
          firstName: 'Ross',
          lastName: 'Sylvester',
          isActive: true,
          activeWorkspaceId: targetWorkspace.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
        }
      });
      console.log(`✅ Created user: ${user.email} (ID: ${user.id})`);
    } else {
      console.log(`✅ Found existing user: ${user.email} (ID: ${user.id})`);
    }

    // 3. Check if user is already a member of this workspace
    console.log('\n3️⃣ [MEMBERSHIP CHECK] Checking workspace membership...');
    const existingMembership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: targetWorkspace.id,
        userId: user.id,
        isActive: true,
      }
    });

    if (existingMembership) {
      console.log('⚠️  User is already a member of this workspace');
      console.log(`   Role: ${existingMembership.role}`);
      console.log(`   Joined: ${existingMembership.joinedAt}`);
    }

    // 4. Generate invitation token
    console.log('\n4️⃣ [TOKEN GENERATION] Creating invitation token...');
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

    // Store invitation token with metadata
    await prisma.reset_tokens.create({
      data: {
        token: invitationToken,
        userId: user.id,
        expiresAt: expiresAt,
        used: false,
        metadata: {
          type: 'invitation',
          workspaceId: targetWorkspace.id,
          role: 'VIEWER',
          invitedBy: user.id, // Using the same user for testing
          invitedAt: new Date().toISOString(),
        }
      }
    });

    console.log(`✅ Generated invitation token: ${invitationToken.substring(0, 8)}...`);
    console.log(`   Expires: ${expiresAt.toLocaleString()}`);

    // 5. Create invitation link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/setup-account?token=${invitationToken}`;

    console.log('\n5️⃣ [INVITATION LINK] Generated setup link:');
    console.log(`🔗 ${invitationLink}`);

    // 6. Add user to workspace if not already a member
    if (!existingMembership) {
      console.log('\n6️⃣ [WORKSPACE MEMBERSHIP] Adding user to workspace...');
      await prisma.workspace_users.create({
        data: {
          workspaceId: targetWorkspace.id,
          userId: user.id,
          role: 'VIEWER',
          isActive: true,
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      console.log('✅ Added user to workspace');
    }

    // 7. Send invitation email
    console.log('\n7️⃣ [EMAIL SENDING] Sending invitation email...');
    try {
      // Import the email service
      const { sendInvitationEmail } = require('../src/platform/services/InvitationEmailService.ts');
      
      const emailResult = await sendInvitationEmail({
        to: user.email,
        inviterName: 'Adrata Admin',
        inviterEmail: 'admin@adrata.com',
        workspaceName: targetWorkspace.name,
        invitationLink: invitationLink,
        expiresAt: expiresAt,
        userEmail: user.email,
        userName: user.name,
      });

      if (emailResult.success) {
        console.log('✅ Email sent successfully to ross@adrata.com!');
        console.log('   Check your inbox for the invitation email.');
      } else {
        console.log('❌ Email sending failed:', emailResult.error);
        console.log('   You can still use the setup link above to test');
      }
    } catch (emailError) {
      console.log('❌ Email service error:', emailError.message);
      console.log('   You can still use the setup link above to test');
    }

    // 8. Summary
    console.log('\n🎉 [TEST COMPLETE] Invitation test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   User: ${user.email} (${user.name})`);
    console.log(`   Workspace: ${targetWorkspace.name}`);
    console.log(`   Role: VIEWER`);
    console.log(`   Token: ${invitationToken.substring(0, 8)}...`);
    console.log(`   Expires: ${expiresAt.toLocaleString()}`);
    console.log(`   Setup URL: ${invitationLink}`);
    
    console.log('\n🧪 [NEXT STEPS] To test the setup process:');
    console.log('   1. Open the setup URL in a browser');
    console.log('   2. Verify the account details are pre-filled');
    console.log('   3. Enter a password (min 8 chars, uppercase, lowercase, number)');
    console.log('   4. Confirm the password');
    console.log('   5. Click "Set Up Account"');
    console.log('   6. Verify Ross is logged in and redirected to the workspace');

  } catch (error) {
    console.error('❌ [TEST INVITE] Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testInviteRoss();
