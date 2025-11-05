#!/usr/bin/env node

/**
 * 🔍 FIND WORKSPACES BY NAME
 * 
 * Searches for workspaces matching "D'Asti" and "Culture Culz"
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findWorkspaces() {
  try {
    console.log('🔍 Searching for workspaces...\n');
    
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Search for D'Asti
    console.log('📋 SEARCHING FOR D\'ASTI:');
    const dastiWorkspaces = await prisma.workspaces.findMany({
      where: {
        OR: [
          { name: { contains: "D'Asti", mode: 'insensitive' } },
          { name: { contains: "Dasti", mode: 'insensitive' } },
          { name: { contains: "Maritime", mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${dastiWorkspaces.length} workspaces matching D'Asti:`);
    dastiWorkspaces.forEach((ws, i) => {
      console.log(`   ${i + 1}. ${ws.name} (${ws.id}) - slug: ${ws.slug}`);
    });
    console.log('');

    // Search for Culture Culz
    console.log('📋 SEARCHING FOR CULTURE CULZ:');
    const cultureWorkspaces = await prisma.workspaces.findMany({
      where: {
        OR: [
          { name: { contains: "Culture", mode: 'insensitive' } },
          { name: { contains: "Culz", mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${cultureWorkspaces.length} workspaces matching Culture Culz:`);
    cultureWorkspaces.forEach((ws, i) => {
      console.log(`   ${i + 1}. ${ws.name} (${ws.id}) - slug: ${ws.slug}`);
    });
    console.log('');

    // List ALL workspaces for reference
    console.log('📋 ALL WORKSPACES IN DATABASE:');
    const allWorkspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`Total: ${allWorkspaces.length} workspaces\n`);
    allWorkspaces.forEach((ws, i) => {
      console.log(`   ${i + 1}. ${ws.name} (${ws.id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

findWorkspaces();

