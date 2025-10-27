#!/usr/bin/env node

/**
 * 📧 SEND ROSS INVITATION EMAIL
 * 
 * This script sends an actual invitation email to ross@adrata.com
 * using the existing API endpoint
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function sendRossInvitation() {
  console.log('📧 [SEND INVITATION] Sending invitation email to ross@adrata.com\n');

  try {
    await prisma.$connect();
    
    // Get workspace info
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      console.log('❌ No active workspace found');
      return;
    }

    console.log(`🎯 Using workspace: ${workspace.name}`);

    // Get or create Ross user
    let user = await prisma.users.findFirst({
      where: { email: 'ross@adrata.com', isActive: true },
      select: { id: true, email: true, name: true, firstName: true, lastName: true }
    });

    if (!user) {
      console.log('👤 Creating Ross user...');
      user = await prisma.users.create({
        data: {
          email: 'ross@adrata.com',
          name: 'Ross Sylvester',
          firstName: 'Ross',
          lastName: 'Sylvester',
          isActive: true,
          activeWorkspaceId: workspace.id,
        },
        select: { id: true, email: true, name: true, firstName: true, lastName: true }
      });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

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

    // Create invitation link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/setup-account?token=${invitationToken}`;

    console.log(`🔗 Setup URL: ${invitationLink}`);

    // Send email using the API endpoint
    console.log('\n📧 [EMAIL] Sending invitation email...');
    
    const response = await fetch('http://localhost:3000/api/v1/admin/invite-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-admin-token-here' // This would need to be a real admin token
      },
      body: JSON.stringify({
        email: 'ross@adrata.com',
        firstName: 'Ross',
        lastName: 'Sylvester',
        workspaceId: workspace.id,
        role: 'VIEWER'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email sent successfully!');
      console.log(`   Email ID: ${result.data?.emailId || 'N/A'}`);
    } else {
      const error = await response.text();
      console.log('❌ Email sending failed:', error);
      console.log('   This might be due to authentication requirements');
      console.log('   You can still use the setup link above to test');
    }

    console.log('\n📋 [SUMMARY]');
    console.log(`   User: ${user.email} (${user.name})`);
    console.log(`   Workspace: ${workspace.name}`);
    console.log(`   Token: ${invitationToken.substring(0, 8)}...`);
    console.log(`   Expires: ${expiresAt.toLocaleString()}`);
    console.log(`   Setup URL: ${invitationLink}`);

  } catch (error) {
    console.error('❌ [ERROR]', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
sendRossInvitation();
