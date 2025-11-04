#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$connect();
    const workspaces = await prisma.workspaces.findMany({
      where: {
        OR: [
          { name: { contains: 'Notary', mode: 'insensitive' } },
          { name: { contains: 'Everyday', mode: 'insensitive' } },
          { slug: { contains: 'notary', mode: 'insensitive' } },
          { slug: { contains: 'everyday', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, slug: true }
    });
    console.log('Workspaces containing "Notary" or "Everyday":');
    console.table(workspaces);
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();

