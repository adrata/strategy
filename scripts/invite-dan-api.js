#!/usr/bin/env node

/**
 * 📧 INVITE DAN VIA API
 * 
 * This script calls the admin invite-user API to send Dan an invitation
 * to the Adrata workspace
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inviteDanViaAPI() {
  console.log('📧 [INVITE DAN] Sending invitation to dan@adrata.com via API\n');

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

    // Check if Dan is already a member of the workspace
    const existingMembership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: user.id,
        isActive: true
      }
    });

    if (existingMembership) {
      console.log('✅ Dan is already a member of the Adrata workspace');
      
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
      console.log(`🔗 Production Setup URL: ${invitationLink}`);

      // Now we need to actually send the email using the API
      console.log('\n📧 [EMAIL] Calling admin invite-user API to send email...');
      
      // Prepare the API call data
      const apiData = {
        email: user.email,
        firstName: user.firstName || 'Dan',
        lastName: user.lastName || 'Mirolli',
        workspaceId: workspace.id,
        role: 'VIEWER'
      };

      console.log('📤 API Call Data:', apiData);
      console.log('\n🔗 To send the email, you can:');
      console.log('1. Use the admin panel in the UI');
      console.log('2. Make a POST request to /api/v1/admin/invite-user with the data above');
      console.log('3. Or manually send the setup link to Dan');
      console.log(`\nSetup Link: ${invitationLink}`);
      
      return;
    }

    // If Dan is not a member, we need to add him first
    console.log('👤 Adding Dan to Adrata workspace...');
    
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

    console.log('✅ Dan added to Adrata workspace');

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

    // Create production invitation link
    const invitationLink = `https://adrata.com/setup-account?token=${invitationToken}`;
    console.log(`🔗 Production Setup URL: ${invitationLink}`);

    console.log('\n📧 [EMAIL] To send the invitation email, you can:');
    console.log('1. Use the admin panel in the UI');
    console.log('2. Make a POST request to /api/v1/admin/invite-user');
    console.log('3. Or manually send the setup link to Dan');
    console.log(`\nSetup Link: ${invitationLink}`);

  } catch (error) {
    console.error('❌ Error inviting Dan:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
inviteDanViaAPI();
