#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const newPrisma = new PrismaClient();

async function clearAdrata() {
  try {
    console.log('Clearing Adrata workspace...');
    await newPrisma.$connect();
    
    const workspace = await newPrisma.workspaces.findFirst({
      where: { name: { contains: 'Adrata', mode: 'insensitive' } }
    });
    
    if (!workspace) {
      throw new Error('Adrata workspace not found!');
    }
    
    console.log(`Found workspace: ${workspace.name}`);
    
    const companyCount = await newPrisma.companies.count({
      where: { workspaceId: workspace.id }
    });
    
    const peopleCount = await newPrisma.people.count({
      where: { workspaceId: workspace.id }
    });
    
    console.log(`Companies to delete: ${companyCount}`);
    console.log(`People to delete: ${peopleCount}`);
    
    const deletedCompanies = await newPrisma.companies.deleteMany({
      where: { workspaceId: workspace.id }
    });
    
    const deletedPeople = await newPrisma.people.deleteMany({
      where: { workspaceId: workspace.id }
    });
    
    console.log(`Deleted ${deletedCompanies.count} companies`);
    console.log(`Deleted ${deletedPeople.count} people`);
    console.log('Adrata workspace cleared successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

clearAdrata();
