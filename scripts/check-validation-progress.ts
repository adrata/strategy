import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProgress() {
  const workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK';
  
  const total = await prisma.companies.count({
    where: {
      workspaceId,
      deletedAt: null,
    },
  });

  const withClearedDescriptions = await prisma.companies.count({
    where: {
      workspaceId,
      deletedAt: null,
      OR: [
        { description: null },
        { descriptionEnriched: null },
      ],
    },
  });

  const withDescriptions = await prisma.companies.count({
    where: {
      workspaceId,
      deletedAt: null,
      OR: [
        { description: { not: null } },
        { descriptionEnriched: { not: null } },
      ],
    },
  });

  console.log('=== VALIDATION PROGRESS ===');
  console.log(`Total companies: ${total}`);
  console.log(`Companies with descriptions: ${withDescriptions}`);
  console.log(`Companies with cleared descriptions: ${withClearedDescriptions}`);
  console.log(`Remaining to validate: ${withDescriptions}`);

  await prisma.$disconnect();
}

checkProgress();

