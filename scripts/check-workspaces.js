#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const SBI_DATABASE_URL = 'postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sbiPrisma = new PrismaClient({
  datasources: {
    db: {
      url: SBI_DATABASE_URL
    }
  }
});

async function checkWorkspaces() {
  try {
    await sbiPrisma.$connect();
    
    // Check workspaces
    const workspaces = await sbiPrisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
      }
    });
    
    console.log('📋 WORKSPACES IN SBI DATABASE:');
    workspaces.forEach(ws => {
      console.log(`   - ${ws.name} (${ws.slug}) - ${ws.id}`);
    });
    
    // Check companies per workspace
    console.log('\n🏢 COMPANIES PER WORKSPACE:');
    for (const ws of workspaces) {
      const count = await sbiPrisma.companies.count({
        where: { workspaceId: ws.id }
      });
      console.log(`   - ${ws.name}: ${count} companies`);
    }
    
    // Check people per workspace
    console.log('\n👥 PEOPLE PER WORKSPACE:');
    for (const ws of workspaces) {
      const count = await sbiPrisma.people.count({
        where: { workspaceId: ws.id }
      });
      console.log(`   - ${ws.name}: ${count} people`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sbiPrisma.$disconnect();
  }
}

checkWorkspaces();

