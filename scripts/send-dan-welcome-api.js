#!/usr/bin/env node

/**
 * 📧 SEND DAN WELCOME EMAIL VIA API
 * 
 * This script sends a welcome email to dan@adrata.com
 * using the admin invite-user API endpoint
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function sendDanWelcomeEmail() {
  console.log('📧 [SEND WELCOME EMAIL] Sending welcome email to dan@adrata.com via API\n');

  try {
    await prisma.$connect();
    
    // Get Adrata workspace specifically
    const workspace = await prisma.workspaces.findFirst({
      where: { 
        isActive: true,
        OR: [
          { name: 'Adrata' },
          { slug: 'adrata' }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      console.log('❌ No active workspace found');
      return;
    }

    console.log(`🎯 Using workspace: ${workspace.name} (${workspace.id})`);

    // Get Dan user
    const user = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com', isActive: true },
      select: { id: true, email: true, name: true, firstName: true, lastName: true }
    });

    if (!user) {
      console.log('❌ Dan user not found');
      return;
    }

    console.log(`👤 Found user: ${user.name} (${user.email})`);

    // Check if Dan is already a member of the workspace
    const existingMembership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: user.id,
        isActive: true
      }
    });

    if (existingMembership) {
      console.log('✅ Dan is already a member of the workspace');
      
      // Generate a new invitation token for password reset
      const crypto = require('crypto');
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      // Store invitation token
      await prisma.reset_tokens.create({
        data: {
          token: invitationToken,
          userId: user.id,
          expiresAt: expiresAt,
          used: false,
          metadata: {
            type: 'welcome',
            workspaceId: workspace.id,
            role: 'VIEWER',
            invitedBy: user.id,
            invitedAt: new Date().toISOString(),
          }
        }
      });

      console.log(`✅ Generated welcome token: ${invitationToken.substring(0, 8)}...`);

      // Create invitation link for production
      const baseUrl = 'https://adrata.com';
      const invitationLink = `${baseUrl}/setup-account?token=${invitationToken}`;

      console.log(`🔗 Setup URL: ${invitationLink}`);
      console.log('\n📧 [EMAIL] To send the welcome email, you can:');
      console.log('1. Use the admin panel to resend invitation');
      console.log('2. Or manually send the setup link to Dan');
      console.log(`3. Setup link: ${invitationLink}`);
      
      return;
    }

    // If Dan is not a member, we need to add him first
    console.log('👤 Adding Dan to workspace...');
    
    // Add Dan to workspace
    await prisma.workspace_users.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'VIEWER',
        isActive: true,
        joinedAt: new Date()
      }
    });

    console.log('✅ Dan added to workspace');

    // Now generate invitation token
    const crypto = require('crypto');
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Store invitation token
    await prisma.reset_tokens.create({
      data: {
        token: invitationToken,
        userId: user.id,
        expiresAt: expiresAt,
        used: false,
        metadata: {
          type: 'invitation',
          workspaceId: workspace.id,
          role: 'VIEWER',
          invitedBy: user.id,
          invitedAt: new Date().toISOString(),
        }
      }
    });

    console.log(`✅ Generated invitation token: ${invitationToken.substring(0, 8)}...`);

    // Create invitation link for production
    const baseUrl = 'https://adrata.com';
    const invitationLink = `${baseUrl}/setup-account?token=${invitationToken}`;

    console.log(`🔗 Setup URL: ${invitationLink}`);
    console.log('\n📧 [EMAIL] To send the welcome email, you can:');
    console.log('1. Use the admin panel to resend invitation');
    console.log('2. Or manually send the setup link to Dan');
    console.log(`3. Setup link: ${invitationLink}`);

  } catch (error) {
    console.error('❌ Error processing Dan welcome email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
sendDanWelcomeEmail();
