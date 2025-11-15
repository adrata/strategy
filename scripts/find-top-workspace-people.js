#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findTopWorkspacePeople() {
  try {
    console.log('Finding TOP workspaces and people...\n');
    
    // Find all TOP workspaces
    const topWorkspaces = await prisma.workspaces.findMany({
      where: {
        OR: [
          { name: { contains: 'TOP', mode: 'insensitive' } },
          { slug: { contains: 'top', mode: 'insensitive' } }
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    
    console.log('📊 TOP WORKSPACES FOUND:');
    for (const ws of topWorkspaces) {
      const peopleCount = await prisma.people.count({
        where: {
          workspaceId: ws.id,
          deletedAt: null
        }
      });
      
      const buyerGroupCount = await prisma.people.count({
        where: {
          workspaceId: ws.id,
          deletedAt: null,
          OR: [
            { buyerGroupRole: { not: null } },
            { isBuyerGroupMember: true }
          ]
        }
      });
      
      const coresignalCount = await prisma.people.count({
        where: {
          workspaceId: ws.id,
          deletedAt: null,
          coresignalData: { not: null }
        }
      });
      
      console.log(`\n   ${ws.name} (${ws.slug})`);
      console.log(`      ID: ${ws.id}`);
      console.log(`      Total People: ${peopleCount}`);
      console.log(`      Buyer Group People: ${buyerGroupCount}`);
      console.log(`      With CoreSignal Data: ${coresignalCount}`);
    }
    
    // Check the specific workspace ID
    const targetWorkspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    const targetWorkspace = await prisma.workspaces.findUnique({
      where: { id: targetWorkspaceId },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    
    console.log(`\n\n🎯 TARGET WORKSPACE (${targetWorkspaceId}):`);
    if (targetWorkspace) {
      console.log(`   Name: ${targetWorkspace.name}`);
      console.log(`   Slug: ${targetWorkspace.slug}`);
      
      const peopleCount = await prisma.people.count({
        where: {
          workspaceId: targetWorkspaceId,
          deletedAt: null
        }
      });
      console.log(`   Total People: ${peopleCount}`);
    } else {
      console.log('   ❌ Workspace not found!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

findTopWorkspacePeople();

