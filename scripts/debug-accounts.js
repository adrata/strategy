#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAccounts() {
  try {
    await prisma.$connect();
    
    // Test the exact query that loadAllData uses
    const accounts = await prisma.accounts.findMany({
      where: { 
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk', 
        deletedAt: null,
        OR: [
          { assignedUserId: '01K1VBYYV7TRPY04NW4TW4XWRB' },
          { assignedUserId: 'dano' }
        ]
      },
      select: {
        id: true, name: true, industry: true, size: true,
        revenue: true, updatedAt: true
      },
      orderBy: [{ updatedAt: 'desc' }]
    });
    
    console.log('📊 Database query result:');
    console.log(`   Total accounts found: ${accounts.length}`);
    console.log(`   First account: ${accounts[0]?.name || 'None'}`);
    console.log(`   Last account: ${accounts[accounts.length - 1]?.name || 'None'}`);
    
    // Check if there are any accounts with different assignedUserId
    const allAccounts = await prisma.accounts.findMany({
      where: { 
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk', 
        deletedAt: null
      },
      select: {
        id: true, name: true, assignedUserId: true
      }
    });
    
    console.log('\n📊 All accounts in workspace:');
    console.log(`   Total: ${allAccounts.length}`);
    
    const assignedToDano = allAccounts.filter(a => a.assignedUserId === '01K1VBYYV7TRPY04NW4TW4XWRB');
    const assignedToDanoString = allAccounts.filter(a => a.assignedUserId === 'dano');
    const unassigned = allAccounts.filter(a => !a.assignedUserId);
    
    console.log(`   Assigned to Dano (UUID): ${assignedToDano.length}`);
    console.log(`   Assigned to Dano (string): ${assignedToDanoString.length}`);
    console.log(`   Unassigned: ${unassigned.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAccounts();
