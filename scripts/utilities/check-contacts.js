#!/usr/bin/env node

/**
 * 🧪 CHECK CONTACTS IN DATABASE
 * 
 * Simple script to check if there are contacts and their structure
 */

const { PrismaClient } = require('@prisma/client');

async function checkContacts() {
  console.log('🧪 Checking contacts in database...\n');
  
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check total contacts count
    const totalContacts = await prisma.contacts.count();
    console.log(`📊 Total contacts in database: ${totalContacts}`);
    
    if (totalContacts > 0) {
      // Get a sample contact to see the structure
      const sampleContact = await prisma.contacts.findFirst({
        include: {
          accounts: true
        }
      });
      
      console.log('\n📋 Sample contact structure:');
      console.log(JSON.stringify(sampleContact, null, 2));
      
      // Check contacts by workspace
      const contactsByWorkspace = await prisma.contacts.groupBy({
        by: ['workspaceId'],
        _count: true
      });
      
      console.log('\n🏢 Contacts by workspace:');
      contactsByWorkspace.forEach(group => {
        console.log(`   Workspace ${group.workspaceId}: ${group._count} contacts`);
      });
      
      // Check contacts by assigned user
      const contactsByUser = await prisma.contacts.groupBy({
        by: ['assignedUserId'],
        _count: true
      });
      
      console.log('\n👤 Contacts by assigned user:');
      contactsByUser.forEach(group => {
        console.log(`   User ${group.assignedUserId}: ${group._count} contacts`);
      });
      
    } else {
      console.log('❌ No contacts found in database');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error checking contacts:', error.message);
  }
}

checkContacts();
