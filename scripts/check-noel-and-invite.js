#!/usr/bin/env node

/**
 * CHECK NOEL USER AND INVITE TO NOTARY EVERYDAY
 * 
 * Checks if user "noel" exists and displays welcome email content
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNoelAndInvite() {
  try {
    console.log('🔍 Checking for user "noel" and Notary Everyday workspace...\n');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Step 1: Find Noel user
    console.log('👤 Finding Noel user...');
    const noel = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'noel@notaryeveryday.com' },
          { email: { contains: 'noel', mode: 'insensitive' } },
          { name: { contains: 'noel', mode: 'insensitive' } }
        ]
      }
    });

    if (!noel) {
      console.log('❌ Noel user not found!');
      console.log('\nAvailable users with "noel" in name or email:');
      const similarUsers = await prisma.users.findMany({
        where: {
          OR: [
            { email: { contains: 'noel', mode: 'insensitive' } },
            { name: { contains: 'noel', mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true
        }
      });
      if (similarUsers.length > 0) {
        console.table(similarUsers);
      } else {
        console.log('   No users found.');
      }
      return;
    }

    console.log(`✅ Found Noel:`);
    console.log(`   Name: ${noel.name}`);
    console.log(`   Email: ${noel.email}`);
    console.log(`   ID: ${noel.id}`);
    console.log(`   Active: ${noel.isActive ? 'Yes' : 'No'}\n`);

    // Step 2: Find Notary Everyday workspace
    console.log('🏢 Finding Notary Everyday workspace...');
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { slug: 'notary-everyday' },
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } },
          { slug: { contains: 'ne', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }

    console.log(`✅ Found workspace:`);
    console.log(`   Name: ${workspace.name}`);
    console.log(`   ID: ${workspace.id}`);
    console.log(`   Slug: ${workspace.slug}\n`);

    // Step 3: Check if Noel is already in the workspace
    console.log('🔍 Checking workspace membership...');
    const membership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: noel.id
      }
    });

    if (membership) {
      console.log(`✅ Noel is already a member of ${workspace.name}`);
      console.log(`   Role: ${membership.role}`);
      console.log(`   Active: ${membership.isActive ? 'Yes' : 'No'}`);
      console.log(`   Joined: ${membership.joinedAt || 'N/A'}\n`);
    } else {
      console.log(`⚠️  Noel is NOT yet a member of ${workspace.name}`);
      console.log(`   Noel can be invited to join the workspace.\n`);
    }

    // Step 4: Display welcome email content
    console.log('\n📧 WELCOME EMAIL CONTENT:');
    console.log('='.repeat(60));
    console.log(`
Subject: Invitation to join ${workspace.name} workspace on Adrata

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're invited to ${workspace.name}

Join your team on Adrata

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi ${noel.name?.split(' ')[0] || 'Noel'},

You've been invited to join ${workspace.name} on Adrata.

Adrata helps teams accelerate revenue growth with intelligent sales tools and AI-powered insights.

[Accept invitation button]

This invitation expires on [expiration date]. Please accept it before then.

What you'll get access to:
• Personalized sales dashboard
• Real-time team collaboration
• AI-powered sales insights
• Advanced pipeline management
• Prospect intelligence tools

Questions? Contact us at [inviter email]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Having trouble with the button? Copy and paste this link into your browser:
[invitation link]

© ${new Date().getFullYear()} Adrata. All rights reserved.
    `);

    console.log('\n📋 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ User: ${noel.name} (${noel.email})`);
    console.log(`✅ Workspace: ${workspace.name}`);
    if (membership) {
      console.log(`✅ Status: Already a member (${membership.role})`);
      console.log(`\n💡 Noel is already in the workspace. No invitation needed.`);
    } else {
      console.log(`⚠️  Status: Not yet a member`);
      console.log(`\n💡 Noel can be invited using the invite-user API endpoint.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkNoelAndInvite();

