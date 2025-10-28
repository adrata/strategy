#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDesktop() {
  try {
    console.log('🚀 Desktop download setup...\n');

    // Find ADRATA_USER role
    const adrataRole = await prisma.roles.findFirst({
      where: { name: 'ADRATA_USER' }
    });

    if (adratraRole) {
      console.log(`✅ Found ADRATA_USER role: ${adratraRole.id}`);
      
      // Find DESKTOP_DOWNLOAD_ACCESS permission
      const desktopPermission = await prisma.permissions.findFirst({
        where: { name: 'DESKTOP_DOWNLOAD_ACCESS' }
      });

      if (desktopPermission) {
        // Assign permission to role
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
      } else {
        console.log(`❌ DESKTOP_DOWNLOAD_ACCESS permission not found`);
      }
    } else {
      console.log(`❌ ADRATA_USER role not found`);
    }

    console.log('\n✅ Desktop download setup completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDesktop();
