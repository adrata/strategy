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

async function checkAdrataWorkspaces() {
  try {
    console.log('Checking Adrata workspaces in SBI database...\n');
    await sbiPrisma.$connect();
    
    const workspaces = await sbiPrisma.$queryRaw`
      SELECT id, name, slug, timezone, description, "createdAt", "updatedAt"
      FROM workspaces 
      WHERE name ILIKE '%adratra%'
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`Found ${workspaces.length} Adrata workspaces:`);
    workspaces.forEach((workspace, index) => {
      console.log(`${index + 1}. ${workspace.name} (${workspace.id})`);
    });
    
    if (workspaces.length > 0) {
      const workspace = workspaces[0];
      console.log(`\nUsing workspace: ${workspace.name} (${workspace.id})`);
      
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
      
      console.log(`Companies: ${companies[0].count}`);
      console.log(`People: ${people[0].count}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sbiPrisma.$disconnect();
  }
}

checkAdrataWorkspaces();
