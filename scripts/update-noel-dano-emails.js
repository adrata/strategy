#!/usr/bin/env node

/**
 * 📧 UPDATE NOEL AND DANO EMAILS
 * 
 * Updates Noel's username to "noel" and Dano's email to dano@notaryeveryday.com
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateNoelAndDanoEmails() {
  try {
    console.log('📧 Updating Noel and Dano user details...\n');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Step 1: Update Noel's username
    console.log('👤 Updating Noel\'s username...');
    
    const noel = await prisma.users.findFirst({
      where: {
        email: 'noel@notaryeveryday.com'
      }
    });

    if (noel) {
      await prisma.users.update({
        where: { id: noel.id },
        data: {
          username: 'noel',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated Noel's username to: noel`);
      console.log(`   Email: ${noel.email}`);
      console.log(`   Name: ${noel.name}`);
    } else {
      console.log('❌ Noel user not found!');
    }

    // Step 2: Update Dano's email
    console.log('\n👤 Updating Dano\'s email...');
    
    const dano = await prisma.users.findFirst({
      where: {
        email: 'dano@retail-products.com'
      }
    });

    if (dano) {
      await prisma.users.update({
        where: { id: dano.id },
        data: {
          email: 'dano@notaryeveryday.com',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated Dano's email to: dano@notaryeveryday.com`);
      console.log(`   Name: ${dano.name}`);
      console.log(`   Previous email: dano@retail-products.com`);
    } else {
      console.log('❌ Dano user not found!');
    }

    // Step 3: Verify updates
    console.log('\n🔍 Verifying updates...');
    
    const updatedNoel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' },
      select: { id: true, name: true, email: true, username: true }
    });

    const updatedDano = await prisma.users.findFirst({
      where: { email: 'dano@notaryeveryday.com' },
      select: { id: true, name: true, email: true, username: true }
    });

    console.log('\n📊 UPDATED USER DETAILS:');
    console.log('========================');
    
    if (updatedNoel) {
      console.log(`✅ Noel Serrato:`);
      console.log(`   📧 Email: ${updatedNoel.email}`);
      console.log(`   👤 Username: ${updatedNoel.username || 'Not set'}`);
      console.log(`   🆔 ID: ${updatedNoel.id}`);
    }

    if (updatedDano) {
      console.log(`✅ Just Dano:`);
      console.log(`   📧 Email: ${updatedDano.email}`);
      console.log(`   👤 Username: ${updatedDano.username || 'Not set'}`);
      console.log(`   🆔 ID: ${updatedDano.id}`);
    }

    console.log('\n🎉 Email and username updates completed successfully!');

  } catch (error) {
    console.error('❌ Error updating user details:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the updates
updateNoelAndDanoEmails();
