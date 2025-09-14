#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDanoAccounts() {
  try {
    await prisma.$connect();
    
    // Check what accounts Dano now has
    const danoAccounts = await prisma.accounts.findMany({
      where: { 
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: '01K1VBYYV7TRPY04NW4TW4XWRB',
        deletedAt: null
      },
      select: { id: true, name: true, assignedUserId: true },
      take: 10
    });
    
    console.log('📊 Dano\'s accounts (first 10):');
    danoAccounts.forEach(a => {
      console.log(`   ${a.name} - ${a.assignedUserId}`);
    });
    
    // Check total count
    const totalCount = await prisma.accounts.count({
      where: { 
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: '01K1VBYYV7TRPY04NW4TW4XWRB',
        deletedAt: null
      }
    });
    
    console.log(`\n📊 Total accounts assigned to Dano: ${totalCount}`);
    console.log(`   Expected: 150`);
    console.log(`   Actual: ${totalCount}`);
    
    // Check if there are any unassigned accounts
    const unassignedCount = await prisma.accounts.count({
      where: { 
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: null,
        deletedAt: null
      }
    });
    
    console.log(`\n📊 Unassigned accounts: ${unassignedCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDanoAccounts();
