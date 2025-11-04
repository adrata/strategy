#!/usr/bin/env node

/**
 * 📧 SEND JUSTIN WELCOME EMAIL (PRODUCTION)
 * 
 * This script sends a welcome email to justin.johnson@cloudcaddie.com
 * in the CloudCaddie workspace using the existing invitation email system
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function sendJustinWelcomeEmail() {
  console.log('📧 [SEND WELCOME EMAIL] Sending welcome email to justin.johnson@cloudcaddie.com\n');

  try {
    await prisma.$connect();
    
    // Get CloudCaddie workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { 
        isActive: true,
        OR: [
          { name: 'CloudCaddie' },
          { slug: 'cloudcaddie' }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      console.log('❌ CloudCaddie workspace not found');
      return;
    }

    console.log(`🎯 Using workspace: ${workspace.name} (${workspace.id})`);

    // Get Justin user
    const user = await prisma.users.findFirst({
      where: { email: 'justin.johnson@cloudcaddie.com', isActive: true },
      select: { id: true, email: true, name: true, firstName: true, lastName: true }
    });

    if (!user) {
      console.log('❌ Justin user not found');
      return;
    }

    console.log(`👤 Found user: ${user.name} (${user.email})`);

    // Generate invitation token
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

    // Create production invitation link
    const baseUrl = 'https://adrata.com';
    const invitationLink = `${baseUrl}/setup-account?token=${invitationToken}`;

    console.log(`🔗 Production Setup URL: ${invitationLink}`);

    // Send email using Resend directly
    console.log('\n📧 [EMAIL] Sending welcome email...');
    
    const emailData = {
      inviterName: 'Adrata Client Team',
      inviterEmail: 'noreply@adrata.com',
      workspaceName: workspace.name,
      invitationLink: invitationLink,
      expiresAt: expiresAt,
      userEmail: user.email,
      userName: user.name
    };

    // Import the email service
    const { sendInvitationEmail } = require('../src/platform/services/InvitationEmailService.ts');

    const result = await sendInvitationEmail({
      to: user.email,
      inviterName: emailData.inviterName,
      inviterEmail: emailData.inviterEmail,
      workspaceName: emailData.workspaceName,
      invitationLink: emailData.invitationLink,
      expiresAt: emailData.expiresAt,
      userEmail: emailData.userEmail,
      userName: emailData.userName
    });

    if (result.success) {
      console.log('✅ Welcome email sent successfully!');
      console.log(`📧 Sent to: ${user.email}`);
      console.log(`🔗 Setup link: ${invitationLink}`);
    } else {
      console.log('❌ Failed to send welcome email:', result.error);
    }

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
sendJustinWelcomeEmail();
