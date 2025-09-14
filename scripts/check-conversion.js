#!/usr/bin/env node

/**
 * 🔍 CHECK CONVERSION RESULTS SCRIPT
 * 
 * Verifies that all UUIDs were converted to ULIDs
 * and identifies any remaining issues
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConversion() {
  try {
    await prisma.$connect();
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    
    console.log('🔍 Checking conversion results...\n');
    
    // Check accounts
    const accounts = await prisma.accounts.findMany({
      where: { 
        workspaceId, 
        deletedAt: null 
      },
      select: { id: true, name: true },
      take: 5
    });
    
    console.log('📊 Account IDs after conversion:');
    accounts.forEach(acc => {
      const name = acc.name || 'Unknown';
      console.log(`   - ${name.padEnd(30)} | ID: ${acc.id} | Length: ${acc.id.length}`);
    });
    
    // Check leads
    const leads = await prisma.leads.findMany({
      where: { 
        workspaceId, 
        deletedAt: null 
      },
      select: { id: true, company: true },
      take: 5
    });
    
    console.log('\n📊 Lead IDs after conversion:');
    leads.forEach(lead => {
      const company = lead.company || 'Unknown';
      console.log(`   - ${company.padEnd(30)} | ID: ${lead.id} | Length: ${lead.id.length}`);
    });
    
    // Check contacts
    const contacts = await prisma.contacts.findMany({
      where: { 
        workspaceId, 
        deletedAt: null 
      },
      select: { id: true, firstName: true, lastName: true },
      take: 5
    });
    
    console.log('\n📊 Contact IDs after conversion:');
    contacts.forEach(contact => {
      const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown';
      console.log(`   - ${name.padEnd(30)} | ID: ${contact.id} | Length: ${contact.id.length}`);
    });
    
    // Check for any remaining UUIDs (36 characters) using Prisma queries
    console.log('\n🔍 Checking for remaining UUIDs...');
    
    const remainingUUIDAccounts = await prisma.accounts.findMany({
      where: { 
        workspaceId, 
        deletedAt: null,
        id: { contains: '-' } // UUIDs contain hyphens
      },
      select: { id: true, name: true },
      take: 5
    });
    
    const remainingUUIDLeads = await prisma.leads.findMany({
      where: { 
        workspaceId, 
        deletedAt: null,
        id: { contains: '-' } // UUIDs contain hyphens
      },
      select: { id: true, company: true },
      take: 5
    });
    
    const remainingUUIDContacts = await prisma.contacts.findMany({
      where: { 
        workspaceId, 
        deletedAt: null,
        id: { contains: '-' } // UUIDs contain hyphens
      },
      select: { id: true, firstName: true, lastName: true },
      take: 5
    });
    
    if (remainingUUIDAccounts.length > 0 || remainingUUIDLeads.length > 0 || remainingUUIDContacts.length > 0) {
      console.log('❌ Found remaining UUIDs:');
      remainingUUIDAccounts.forEach(record => {
        console.log(`   - accounts: ${record.name || 'Unknown'} | ID: ${record.id}`);
      });
      remainingUUIDLeads.forEach(record => {
        console.log(`   - leads: ${record.company || 'Unknown'} | ID: ${record.id}`);
      });
      remainingUUIDContacts.forEach(record => {
        const name = `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown';
        console.log(`   - contacts: ${name} | ID: ${record.id}`);
      });
    } else {
      console.log('✅ All records converted to ULIDs successfully!');
    }
    
    // Check total counts
    console.log('\n📊 Total record counts:');
    const accountCount = await prisma.accounts.count({ where: { workspaceId, deletedAt: null } });
    const leadCount = await prisma.leads.count({ where: { workspaceId, deletedAt: null } });
    const contactCount = await prisma.contacts.count({ where: { workspaceId, deletedAt: null } });
    
    console.log(`   - Accounts: ${accountCount}`);
    console.log(`   - Leads: ${leadCount}`);
    console.log(`   - Contacts: ${contactCount}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error checking conversion:', error);
    await prisma.$disconnect();
  }
}

checkConversion();
