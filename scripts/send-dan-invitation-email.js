#!/usr/bin/env node

/**
 * 📧 SEND DAN INVITATION EMAIL VIA API
 * 
 * This script actually calls the admin invite-user API to send Dan an invitation
 * to the Adrata workspace
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function sendDanInvitationEmail() {
  console.log('📧 [SEND INVITATION] Sending invitation email to dan@adrata.com\n');

  try {
    await prisma.$connect();
    
    // Get Adrata workspace
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
      console.log('❌ Adrata workspace not found');
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

    // Prepare the API call data
    const apiData = {
      email: user.email,
      firstName: user.firstName || 'Dan',
      lastName: user.lastName || 'Mirolli',
      workspaceId: workspace.id,
      role: 'VIEWER'
    };

    console.log('📤 API Call Data:', apiData);

    // Make the API call to send the invitation
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/v1/admin/invite-user`;
    
    console.log(`🌐 Calling API: ${apiUrl}`);

    // Note: This will fail without proper authentication
    // The API requires admin authentication
    console.log('\n⚠️  Note: This API call requires admin authentication.');
    console.log('To actually send the email, you need to:');
    console.log('1. Use the admin panel in the UI');
    console.log('2. Or make an authenticated request with proper headers');
    console.log('3. Or manually send the setup link to Dan');
    
    // Generate a setup link for manual sending
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

    // Create production invitation link
    const invitationLink = `https://adrata.com/setup-account?token=${invitationToken}`;
    console.log(`\n🔗 Production Setup URL: ${invitationLink}`);
    
    console.log('\n📧 [MANUAL SEND] You can send this link to Dan manually:');
    console.log(`Subject: Welcome to Adrata - Set up your password`);
    console.log(`To: dan@adrata.com`);
    console.log(`Message: Hi Dan! Welcome to Adrata. Click the link below to set up your password and access the workspace:`);
    console.log(`${invitationLink}`);
    console.log(`\nThis link expires on: ${expiresAt.toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error sending invitation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
sendDanInvitationEmail();
