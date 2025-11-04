#!/usr/bin/env node

/**
 * CHECK NOEL IN NOTARY EVERYDAY WORKSPACE
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNoelNotaryEveryday() {
  try {
    await prisma.$connect();
    
    // Find Notary Everyday workspace by exact name/slug
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: 'notary-everyday' }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Find Noel
    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });

    if (!noel) {
      console.log('❌ Noel user not found!');
      return;
    }

    console.log(`✅ Found Noel: ${noel.name} (${noel.email})\n`);

    // Check membership
    const membership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: noel.id
      }
    });

    if (membership) {
      console.log(`✅ Noel IS a member of ${workspace.name}`);
      console.log(`   Role: ${membership.role}`);
      console.log(`   Active: ${membership.isActive ? 'Yes' : 'No'}\n`);
    } else {
      console.log(`⚠️  Noel is NOT a member of ${workspace.name}`);
      console.log(`   Noel can be invited to join.\n`);
    }

    // Show welcome email preview
    console.log('\n📧 WELCOME EMAIL PREVIEW:');
    console.log('='.repeat(60));
    console.log(`Subject: Invitation to join ${workspace.name} workspace on Adrata`);
    console.log('\nYou\'re invited to ' + workspace.name);
    console.log('Join your team on Adrata\n');
    console.log(`Hi ${noel.name?.split(' ')[0] || 'Noel'},`);
    console.log(`\nYou've been invited to join ${workspace.name} on Adrata.`);
    console.log('\nAdrata helps teams accelerate revenue growth with intelligent sales tools and AI-powered insights.');
    console.log('\n[Accept invitation button]');
    console.log('\nWhat you\'ll get access to:');
    console.log('• Personalized sales dashboard');
    console.log('• Real-time team collaboration');
    console.log('• AI-powered sales insights');
    console.log('• Advanced pipeline management');
    console.log('• Prospect intelligence tools');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNoelNotaryEveryday();

