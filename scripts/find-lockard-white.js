#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findCompany() {
  try {
    await prisma.$connect();
    
    const companies = await prisma.companies.findMany({
      where: { 
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', 
        deletedAt: null,
        OR: [
          { name: { contains: 'Lockard', mode: 'insensitive' } },
          { name: { contains: 'White', mode: 'insensitive' } },
          { website: { contains: 'landw', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, website: true },
      take: 10
    });

    console.log('Found companies:');
    companies.forEach(c => console.log('  -', c.name, '(' + c.website + ')'));
    
    if (companies.length === 0) {
      console.log('No companies found. Let me search for companies with "landw" in the name...');
      
      const landwCompanies = await prisma.companies.findMany({
        where: { 
          workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', 
          deletedAt: null,
          OR: [
            { name: { contains: 'landw', mode: 'insensitive' } },
            { website: { contains: 'landw', mode: 'insensitive' } }
          ]
        },
        select: { id: true, name: true, website: true },
        take: 10
      });
      
      console.log('Companies with "landw":');
      landwCompanies.forEach(c => console.log('  -', c.name, '(' + c.website + ')'));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findCompany();
