#!/usr/bin/env node

/**
 * Check Ryan Serrato's password status
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRyanPassword() {
  try {
    await prisma.$connect();
    
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'ryan@notaryeveryday.com' },
          { email: 'ryan@notary-everyday.com' },
          { name: { contains: 'Ryan Serrato', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });
    
    if (!user) {
      console.log('❌ Ryan user not found');
      return;
    }

    console.log('👤 User Information:');
    console.log('===================');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`User ID: ${user.id}`);
    console.log(`Active: ${user.isActive}`);
    console.log(`Created: ${user.createdAt.toLocaleString()}`);
    console.log(`Last Updated: ${user.updatedAt.toLocaleString()}`);
    console.log(`Last Login: ${user.lastLoginAt ? user.lastLoginAt.toLocaleString() : 'Never'}`);
    
    console.log('\n🔐 Password Status:');
    console.log('==================');
    if (user.password) {
      console.log('✅ Password is set');
      console.log(`Password hash: ${user.password.substring(0, 20)}...`);
      console.log(`Hash type: ${user.password.startsWith('$2') ? 'bcrypt' : 'unknown'}`);
      console.log('\n⚠️  Note: Passwords are hashed and cannot be retrieved in plaintext.');
      console.log('   If Ryan needs to reset his password, use the invitation email we just sent.');
    } else {
      console.log('❌ No password set');
      console.log('   Ryan needs to complete account setup using the invitation link.');
      console.log('   We just sent him a welcome email with a setup link.');
    }

  } catch (error) {
    console.error('❌ Error checking password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRyanPassword();

