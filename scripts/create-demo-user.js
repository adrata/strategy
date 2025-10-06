#!/usr/bin/env node

/**
 * 🎯 CREATE DEMO USER
 * Creates a simple demo user for testing the seller companies page
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    console.log('🚀 Creating demo user...');

    // Hash password
    const hashedPassword = await bcrypt.hash('demo123', 10);

    // Create demo user
    const demoUser = await prisma.users.upsert({
      where: { id: 'demo-user-2025' },
      update: {
        password: hashedPassword,
        isActive: true
      },
      create: {
        id: 'demo-user-2025',
        email: 'demo@adrata.com',
        password: hashedPassword,
        name: 'Demo User',
        firstName: 'Demo',
        lastName: 'User',
        displayName: 'Demo User',
        isActive: true,
        updatedAt: new Date()
      }
    });

    console.log('✅ Demo user created:', demoUser.email);

    // Create demo workspace
    const demoWorkspace = await prisma.workspaces.upsert({
      where: { id: 'demo-workspace-2025' },
      update: {},
      create: {
        id: 'demo-workspace-2025',
        name: 'Demo Workspace',
        slug: 'demo',
        description: 'Demo workspace for testing',
        updatedAt: new Date()
      }
    });

    console.log('✅ Demo workspace created:', demoWorkspace.name);

    // Create workspace membership
    const membership = await prisma.workspace_users.upsert({
      where: {
        userId_workspaceId: {
          userId: demoUser.id,
          workspaceId: demoWorkspace.id
        }
      },
      update: {},
      create: {
        userId: demoUser.id,
        workspaceId: demoWorkspace.id,
        role: 'OWNER'
      }
    });

    console.log('✅ Workspace membership created');

    console.log('\n🎉 Demo user setup complete!');
    console.log('Email: demo@adrata.com');
    console.log('Password: demo123');
    console.log('Workspace: demo-workspace-2025');

  } catch (error) {
    console.error('❌ Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
