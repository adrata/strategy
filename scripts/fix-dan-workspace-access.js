#!/usr/bin/env node

/**
 * 🔧 FIX DAN WORKSPACE ACCESS
 * Remove dan@adrata.com from Notary Everyday workspace
 * Ensure proper workspace separation
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDanWorkspaceAccess() {
  try {
    console.log('🔧 FIXING DAN WORKSPACE ACCESS\n');

    // Get dan@adrata.com user
    const danUser = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com' }
    });

    if (!danUser) {
      console.log('❌ dan@adrata.com user not found');
      return;
    }

    console.log(`👤 Found dan@adrata.com user: ${danUser.id}`);

    // Get Notary Everyday workspace
    const notaryWorkspace = await prisma.workspaces.findFirst({
      where: { name: 'Notary Everyday' }
    });

    if (!notaryWorkspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log(`🏢 Found Notary Everyday workspace: ${notaryWorkspace.id}`);

    // Check if dan is a member of Notary Everyday
    const danMembership = await prisma.workspaceMembership.findFirst({
      where: {
        userId: danUser.id,
        workspaceId: notaryWorkspace.id
      }
    });

    if (danMembership) {
      console.log(`❌ PROBLEM: dan@adrata.com is a member of Notary Everyday workspace`);
      console.log(`   Membership ID: ${danMembership.id}`);
      console.log(`   Role: ${danMembership.role}`);
      
      // Remove the membership
      console.log('\n🔧 Removing dan@adrata.com from Notary Everyday workspace...');
      await prisma.workspaceMembership.delete({
        where: { id: danMembership.id }
      });
      
      console.log('✅ Successfully removed dan@adrata.com from Notary Everyday workspace');
    } else {
      console.log('✅ dan@adrata.com is NOT a member of Notary Everyday workspace');
    }

    // Update dan's active workspace to something else (or null)
    if (danUser.activeWorkspaceId === notaryWorkspace.id) {
      console.log('\n🔧 Updating dan@adrata.com active workspace...');
      await prisma.users.update({
        where: { id: danUser.id },
        data: { activeWorkspaceId: null }
      });
      console.log('✅ Set dan@adrata.com active workspace to null');
    }

    // Verify dano@retail-products.com is properly configured
    console.log('\n🔍 Verifying dano@retail-products.com configuration...');
    const danoUser = await prisma.users.findFirst({
      where: { email: 'dano@retail-products.com' }
    });

    if (danoUser) {
      console.log(`👤 dano@retail-products.com user: ${danoUser.id}`);
      console.log(`   Active Workspace: ${danoUser.activeWorkspaceId}`);
      
      // Check if dano is a member of Notary Everyday
      const danoMembership = await prisma.workspaceMembership.findFirst({
        where: {
          userId: danoUser.id,
          workspaceId: notaryWorkspace.id
        }
      });

      if (danoMembership) {
        console.log('✅ dano@retail-products.com is properly a member of Notary Everyday');
      } else {
        console.log('❌ dano@retail-products.com is NOT a member of Notary Everyday - this needs to be fixed');
      }
    }

    // Final verification
    console.log('\n🔍 FINAL VERIFICATION:');
    
    // Check dan's current state
    const updatedDan = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com' }
    });
    console.log(`dan@adrata.com active workspace: ${updatedDan?.activeWorkspaceId || 'null'}`);

    // Check dan's memberships
    const danMemberships = await prisma.workspaceMembership.findMany({
      where: { userId: danUser.id }
    });
    console.log(`dan@adrata.com workspace memberships: ${danMemberships.length}`);

    if (danMemberships.length > 0) {
      console.log('   Memberships:');
      for (const membership of danMemberships) {
        const workspace = await prisma.workspaces.findUnique({
          where: { id: membership.workspaceId },
          select: { name: true }
        });
        console.log(`   - ${workspace?.name || 'Unknown'} (${membership.role})`);
      }
    }

  } catch (error) {
    console.error('❌ Error fixing dan workspace access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDanWorkspaceAccess();
