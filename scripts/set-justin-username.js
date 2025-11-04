#!/usr/bin/env node

/**
 * 🔧 SET JUSTIN JOHNSON USERNAME
 * Sets Justin's username to "justin"
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setJustinUsername() {
  try {
    console.log('🔧 Setting Justin Johnson\'s username...\n');

    // Find Justin's user record
    const justinUser = await prisma.users.findFirst({
      where: { 
        OR: [
          { email: 'justin.johnson@cloudcaddie.com' },
          { name: { contains: 'Justin Johnson', mode: 'insensitive' } }
        ]
      },
      select: { id: true, email: true, name: true, username: true }
    });

    if (!justinUser) {
      console.log('❌ Justin Johnson not found in database');
      return;
    }

    console.log(`✅ Found user: ${justinUser.name} (${justinUser.email})`);
    console.log(`   Current username: ${justinUser.username || 'NOT SET'}\n`);

    // Check if username "justin" is already taken
    const existingUser = await prisma.users.findFirst({
      where: {
        username: 'justin',
        id: { not: justinUser.id }
      }
    });

    if (existingUser) {
      console.log(`❌ Username "justin" is already taken by: ${existingUser.name} (${existingUser.email})`);
      return;
    }

    // Update Justin's username
    const updatedUser = await prisma.users.update({
      where: { id: justinUser.id },
      data: { 
        username: 'justin',
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true
      }
    });

    console.log('✅ Justin\'s username updated successfully!');
    console.log('═══════════════════════════════════════');
    console.log('👤 USER INFORMATION:');
    console.log('═══════════════════════════════════════');
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Username: ${updatedUser.username}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    if (error.code === 'P2002') {
      console.error('❌ Error: Username "justin" is already taken by another user');
    } else {
      console.error('❌ Error setting username:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

setJustinUsername();

