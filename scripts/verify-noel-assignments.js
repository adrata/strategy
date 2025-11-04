#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });
    
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: 'Notary Everyday', mode: 'insensitive' } }
    });
    
    const companies = await prisma.companies.count({
      where: { workspaceId: workspace.id, mainSellerId: noel.id }
    });
    
    const people = await prisma.people.count({
      where: { workspaceId: workspace.id, mainSellerId: noel.id }
    });
    
    console.log('Noel assigned as seller:');
    console.log('- Companies:', companies);
    console.log('- People:', people);
    
    // Check the imported contacts specifically
    const importedPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: noel.id,
        email: {
          in: [
            'tjones@firstam.com',
            'rob@raziexchange.com',
            'doug@fincenrealestatereport.com',
            'charles@fincenrealestatereport.com',
            'lacy@capitollien.com',
            'Josh@RhythmicTitleCompany.com',
            'amy.gregory@flagency.net',
            'matt@pythonic.ai',
            'docs@docprepper.com',
            'FernandezAlfredo689@gmail.com',
            'shenita.baker@fnf.com',
            'adam@closinglock.com',
            'cameron@cpgsynergy.agency',
            'kmorris@intemindbps.com',
            'chris@titlebondagency.com',
            'ryan.smith.cre@gmail.com',
            'tyler@ventanacustomhomes.com',
            'elissan@driggstitle.com',
            'eric.nutt@cltic.com'
          ]
        }
      },
      select: {
        fullName: true,
        email: true,
        mainSellerId: true
      }
    });
    
    console.log('\nImported contacts with noel as seller:', importedPeople.length);
    importedPeople.forEach(p => {
      console.log(`  - ${p.fullName} (${p.email})`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();

