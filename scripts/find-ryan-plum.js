#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findRyanPlum() {
  const people = await prisma.people.findMany({
    where: {
      OR: [
        { fullName: { contains: 'Ryan Plum', mode: 'insensitive' } },
        { firstName: { contains: 'Ryan', mode: 'insensitive' }, lastName: { contains: 'Plum', mode: 'insensitive' } }
      ],
      deletedAt: null
    },
    include: {
      company: true
    }
  });

  console.log(`\nFound ${people.length} people matching "Ryan Plum":\n`);
  
  for (const person of people) {
    console.log(`Name: ${person.fullName || `${person.firstName} ${person.lastName}`}`);
    console.log(`Email: ${person.email || person.workEmail || 'N/A'}`);
    console.log(`Company: ${person.company?.name || 'N/A'}`);
    console.log(`Company Website: ${person.company?.website || 'N/A'}`);
    console.log(`Buyer Group Member: ${person.isBuyerGroupMember}`);
    console.log(`Buyer Group Role: ${person.buyerGroupRole || 'N/A'}`);
    console.log('');
  }

  await prisma.$disconnect();
}

findRyanPlum().catch(console.error);

