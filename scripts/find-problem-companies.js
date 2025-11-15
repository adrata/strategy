/**
 * 🔍 FIND: Problem Companies
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

(async () => {
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          actions: {
            where: {
              deletedAt: null,
              status: 'COMPLETED'
            }
          },
          people: {
            where: {
              deletedAt: null,
              actions: {
                some: {
                  deletedAt: null,
                  status: 'COMPLETED'
                }
              }
            }
          }
        }
      }
    }
  });

  const problemCompanies = companies.filter(c => c._count.people > 0 && c._count.actions === 0);
  
  console.log(`\nFound ${problemCompanies.length} problem companies:\n`);
  
  for (const company of problemCompanies) {
    console.log(`${company.name}:`);
    console.log(`  Direct COMPLETED actions: ${company._count.actions}`);
    console.log(`  People with COMPLETED actions: ${company._count.people}`);
    
    const people = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        companyId: company.id,
        deletedAt: null,
        actions: {
          some: {
            deletedAt: null,
            status: 'COMPLETED'
          }
        }
      },
      select: {
        id: true,
        fullName: true,
        _count: {
          select: {
            actions: {
              where: {
                deletedAt: null,
                status: 'COMPLETED'
              }
            }
          }
        },
        actions: {
          where: {
            deletedAt: null,
            status: 'COMPLETED'
          },
          select: {
            id: true,
            type: true,
            companyId: true
          },
          take: 3
        }
      }
    });
    
    for (const person of people) {
      console.log(`    ${person.fullName}: ${person._count.actions} COMPLETED actions`);
      person.actions.forEach(a => {
        console.log(`      - ${a.type}: companyId = ${a.companyId || 'null'}`);
      });
    }
    console.log('');
  }
  
  await prisma.$disconnect();
})();

