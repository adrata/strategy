#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllAccounts() {
  try {
    await prisma.$connect();
    
    // Check all accounts in the workspace
    const allAccounts = await prisma.accounts.findMany({
      where: { 
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        deletedAt: null
      },
      select: { id: true, name: true, assignedUserId: true },
      take: 20
    });
    
    console.log('📊 All accounts in workspace (first 20):');
    allAccounts.forEach(a => {
      console.log(`   ${a.name} - ${a.assignedUserId || 'NULL'}`);
    });
    
    // Count by assignment
    const assignedToDano = allAccounts.filter(a => a.assignedUserId === '01K1VBYYV7TRPY04NW4TW4XWRB');
    const assignedToDanoString = allAccounts.filter(a => a.assignedUserId === 'dano');
    const unassigned = allAccounts.filter(a => !a.assignedUserId);
    
    console.log(`\n📊 Account assignments:`);
    console.log(`   Assigned to Dano (UUID): ${assignedToDano.length}`);
    console.log(`   Assigned to Dano (string): ${assignedToDanoString.length}`);
    console.log(`   Unassigned: ${unassigned.length}`);
    
    // Get total counts
    const totalAssignedToDano = await prisma.accounts.count({
      where: { 
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: '01K1VBYYV7TRPY04NW4TW4XWRB',
        deletedAt: null
      }
    });
    
    const totalUnassigned = await prisma.accounts.count({
      where: { 
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: null,
        deletedAt: null
      }
    });
    
    console.log(`\n📊 Total counts:`);
    console.log(`   Total assigned to Dano: ${totalAssignedToDano}`);
    console.log(`   Total unassigned: ${totalUnassigned}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllAccounts();
