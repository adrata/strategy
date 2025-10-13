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

async function findWorkspaceWithData() {
  try {
    console.log('Finding workspace with 433 companies and 42 people...\n');
    await sbiPrisma.$connect();
    
    const workspaces = await sbiPrisma.$queryRaw`
      SELECT id, name, slug, timezone, description, "createdAt", "updatedAt"
      FROM workspaces 
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`Found ${workspaces.length} workspaces:`);
    
    for (const workspace of workspaces) {
      const companies = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM companies 
        WHERE "workspaceId" = ${workspace.id};
      `;
      
      const people = await sbiPrisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM people 
        WHERE "workspaceId" = ${workspace.id};
      `;
      
      const companyCount = Number(companies[0].count);
      const peopleCount = Number(people[0].count);
      
      console.log(`${workspace.name}: ${companyCount} companies, ${peopleCount} people`);
      
      // Check if this matches our target (433 companies, 42 people)
      if (companyCount === 433 && peopleCount === 42) {
        console.log(`\n🎯 FOUND TARGET WORKSPACE: ${workspace.name} (${workspace.id})`);
        console.log(`   Companies: ${companyCount}`);
        console.log(`   People: ${peopleCount}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sbiPrisma.$disconnect();
  }
}

findWorkspaceWithData();
