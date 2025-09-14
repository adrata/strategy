#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssignedUsers() {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { id: true, name: true, amount: true, assignedUserId: true, stage: true }
    });
    
    console.log('🔍 Checking assignedUserId for Dano\'s opportunities:\n');
    
    const withUser = opportunities.filter(o => o.assignedUserId);
    const withoutUser = opportunities.filter(o => !o.assignedUserId);
    
    console.log(`📊 Summary: ${withUser.length} WITH assignedUserId, ${withoutUser.length} WITHOUT assignedUserId`);
    
    if (withUser.length > 0) {
      console.log('\n✅ Opportunities WITH assignedUserId:');
      withUser.slice(0, 5).forEach(opp => {
        console.log(`   - ${opp.name || 'Unnamed'} - $${opp.amount || 0} - User: ${opp.assignedUserId} - Stage: ${opp.stage}`);
      });
    }
    
    if (withoutUser.length > 0) {
      console.log('\n❌ Opportunities WITHOUT assignedUserId (first 5):');
      withoutUser.slice(0, 5).forEach(opp => {
        console.log(`   - ${opp.name || 'Unnamed'} - $${opp.amount || 0} - Stage: ${opp.stage}`);
      });
    }
    
    // Check what user IDs exist in the workspace
    console.log('\n👤 Checking user IDs in workspace:');
    const users = await prisma.user.findMany({
      where: {
        workspaces: {
          some: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
        }
      },
      select: { id: true, email: true, name: true }
    });
    
    users.forEach(user => {
      console.log(`   - ${user.name || user.email} (ID: ${user.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssignedUsers();
