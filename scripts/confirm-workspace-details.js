#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function confirmWorkspace() {
  try {
    // Check the workspace details
    const workspace = await prisma.workspaces.findFirst({
      where: { id: '01K7DNYR5VZ7JY36KGKKN76XZ1' },
      select: { id: true, name: true, createdAt: true }
    });
    
    console.log('🎯 WORKSPACE CONFIRMATION:');
    console.log('Workspace ID:', workspace.id);
    console.log('Workspace Name:', workspace.name);
    console.log('Created:', workspace.createdAt);
    
    // Check final linkage stats
    const totalPeople = await prisma.people.count({
      where: { workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1', deletedAt: null }
    });
    
    const linkedPeople = await prisma.people.count({
      where: { 
        workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1', 
        deletedAt: null,
        companyId: { not: null }
      }
    });
    
    const totalCompanies = await prisma.companies.count({
      where: { workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1' }
    });
    
    console.log('\n📊 FINAL STATS:');
    console.log('Total People:', totalPeople);
    console.log('Linked People:', linkedPeople);
    console.log('Linkage Rate:', ((linkedPeople / totalPeople) * 100).toFixed(1) + '%');
    console.log('Total Companies:', totalCompanies);
    
    // Check database schema
    console.log('\n🗄️ DATABASE SCHEMA:');
    console.log('Using streamlined schema: prisma/schema-streamlined.prisma');
    
    // Show a few sample companies to confirm they're in the streamlined database
    const sampleCompanies = await prisma.companies.findMany({
      where: { workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1' },
      select: { id: true, name: true, industry: true },
      take: 5
    });
    
    console.log('\n🏢 SAMPLE COMPANIES:');
    sampleCompanies.forEach((company, i) => {
      console.log(`${i+1}. ${company.name} (${company.industry})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

confirmWorkspace();
