#!/usr/bin/env node

/**
 * 🔍 AUDIT WORKSPACE MEMBERSHIPS
 * Check all workspace memberships to identify cross-contamination
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditWorkspaceMemberships() {
  try {
    console.log('🔍 AUDITING WORKSPACE MEMBERSHIPS\n');

    // Get all workspace memberships
    const memberships = await prisma.workspaceMembership.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    console.log(`📊 Found ${memberships.length} total workspace memberships:\n`);

    // Group by workspace
    const workspaceGroups = {};
    memberships.forEach(membership => {
      const workspaceName = membership.workspace.name;
      if (!workspaceGroups[workspaceName]) {
        workspaceGroups[workspaceName] = [];
      }
      workspaceGroups[workspaceName].push(membership);
    });

    // Display by workspace
    Object.keys(workspaceGroups).forEach(workspaceName => {
      console.log(`🏢 ${workspaceName} (${workspaceGroups[workspaceName][0].workspace.slug}):`);
      workspaceGroups[workspaceName].forEach(membership => {
        console.log(`  - ${membership.users.name} (${membership.users.email})`);
        console.log(`    Role: ${membership.role} - Active: ${membership.isActive}`);
      });
      console.log('');
    });

    // Check for problematic memberships
    console.log('🚨 CHECKING FOR PROBLEMATIC MEMBERSHIPS:\n');

    // Check if dan@adrata.com is in Notary Everyday
    const danInNotary = memberships.find(m => 
      m.users.email === 'dan@adrata.com' && 
      m.workspace.name === 'Notary Everyday'
    );

    if (danInNotary) {
      console.log('❌ PROBLEM: dan@adrata.com is in Notary Everyday workspace');
      console.log(`   Membership ID: ${danInNotary.id}`);
      console.log(`   Role: ${danInNotary.role}`);
    } else {
      console.log('✅ dan@adrata.com is NOT in Notary Everyday workspace');
    }

    // Check if dano@retail-products.com is in the right workspace
    const danoMemberships = memberships.filter(m => 
      m.users.email === 'dano@retail-products.com'
    );

    console.log(`\n📋 dano@retail-products.com memberships:`);
    danoMemberships.forEach(membership => {
      console.log(`  - ${membership.workspace.name} (${membership.workspace.slug})`);
      console.log(`    Role: ${membership.role} - Active: ${membership.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error auditing workspace memberships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditWorkspaceMemberships();
