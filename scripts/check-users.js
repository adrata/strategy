#!/usr/bin/env node

/**
 * SAFE READ-ONLY: Check Users in Database
 * This script only READS data - NO DELETES, NO UPDATES
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 SAFELY checking users in database (READ-ONLY)...\n');
    
    // SAFE: Only read data, no modifications
    const users = await prisma.users.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📊 Found ${users.length} users in database:\n`);
    
    if (users.length === 0) {
      console.log('   No users found in database.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'No Name'}`);
        console.log(`   🆔 ID: ${user.id}`);
        console.log(`   📧 Email: ${user.email || 'No Email'}`);
        console.log(`   🏢 Workspace ID: ${user.activeWorkspaceId || 'None'}`);
        console.log(`   📅 Created: ${user.createdAt}`);
        console.log('');
      });
    }
    
    // SAFE: Look for Dan specifically
    const danUsers = users.filter(user => 
      user.name?.toLowerCase().includes('dan') || 
      user.email?.toLowerCase().includes('dano') ||
      user.id === 'dano'
    );
    
    if (danUsers.length > 0) {
      console.log('🎯 Found Dan-related users:');
      danUsers.forEach(user => {
        console.log(`   👤 Name: ${user.name || 'No Name'}`);
        console.log(`   🆔 ID: ${user.id}`);
        console.log(`   📧 Email: ${user.email || 'No Email'}`);
        console.log(`   🏢 Workspace: ${user.activeWorkspaceId || 'None'}`);
      });
    } else {
      console.log('❌ No Dan-related users found.');
      console.log('   We need to identify the correct user ID for Dan.');
    }
    
    console.log('\n🛡️ SAFETY CHECK COMPLETE:');
    console.log('   ✅ Only READ operations performed');
    console.log('   ✅ No data was modified or deleted');
    console.log('   ✅ All users are safe');
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
    console.log('\n💡 This might mean the table structure is different.');
    console.log('   We should investigate before making any changes.');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the safe check
if (require.main === module) {
  checkUsers();
}

module.exports = { checkUsers };
