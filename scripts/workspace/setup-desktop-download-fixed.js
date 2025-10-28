#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDesktopDownload() {
  try {
    console.log('🚀 Setting up desktop download feature...\n');

    // 1. Add DESKTOP_DOWNLOAD to workspace features for Adrata and Notary Everyday
    const targetWorkspaces = ['adrata', 'notary-everyday'];
    
    for (const slug of targetWorkspaces) {
      const workspace = await prisma.workspaces.findFirst({
        where: { slug }
      });

      if (workspace) {
        const currentFeatures = workspace.enabledFeatures || [];
        if (!currentFeatures.includes('DESKTOP_DOWNLOAD')) {
          const updatedFeatures = [...currentFeatures, 'DESKTOP_DOWNLOAD'];
          
          await prisma.workspaces.update({
            where: { id: workspace.id },
            data: { 
              enabledFeatures: updatedFeatures,
              updatedAt: new Date()
            }
          });
          
          console.log(`✅ Added DESKTOP_DOWNLOAD to ${workspace.name}`);
        } else {
          console.log(`✅ ${workspace.name} already has DESKTOP_DOWNLOAD`);
        }
      } else {
        console.log(`❌ Workspace with slug '${slug}' not found`);
      }
    }

    // 2. Create or find DESKTOP_DOWNLOAD_ACCESS permission
    let desktopPermission = await prisma.permissions.findFirst({
      where: { name: 'DESKTOP_DOWNLOAD_ACCESS' }
    });

    if (!desktopPermission) {
      desktopPermission = await prisma.permissions.create({
        data: {
          name: 'DESKTOP_DOWNLOAD_ACCESS',
          description: 'Access to desktop download feature',
          resource: 'desktop',
          action: 'download',
          isActive: true
        }
      });
      console.log(`✅ Created DESKTOP_DOWNLOAD_ACCESS permission`);
    } else {
      console.log(`✅ DESKTOP_DOWNLOAD_ACCESS permission already exists`);
    }

    // 3. Find or create ADRATA_USER role and assign permission
    let adrataRole = await prisma.roles.findFirst({
      where: { name: 'ADRATA_USER' }
    });

    if (adratraRole) {
      // Assign desktop download permission to Adrata role
      await prisma.role_permissions.upsert({
        where: {
          roleId_permissionId: {
            roleId: adrataRole.id,
            permissionId: desktopPermission.id
          }
        },
        update: {},
        create: {
          roleId: adrataRole.id,
          permissionId: desktopPermission.id
        }
      });
      console.log(`✅ Assigned DESKTOP_DOWNLOAD_ACCESS to ADRATA_USER role`);
    }

    // 4. Summary
    console.log('\n📊 Desktop Download Setup Summary:');
    console.log(`   Permission: ${desktopPermission.name}`);
    console.log(`   Target Workspaces: ${targetWorkspaces.join(', ')}`);
    console.log(`   Role Assignment: ${adratraRole ? 'ADRATA_USER' : 'None'}`);

    console.log('\n✅ Desktop download feature setup completed!');

  } catch (error) {
    console.error('❌ Error setting up desktop download:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDesktopDownload();
