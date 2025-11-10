#!/usr/bin/env node

/**
 * 🔍 EXTENDED AUDIT IXIA COMPANY LIST ISSUE
 * 
 * Checks for name variations, all workspaces, and people relationships
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function extendedAudit() {
  try {
    console.log('🔍 EXTENDED IXIA AUDIT\n');
    console.log('='.repeat(60));

    // Search for any variation of Ixia
    const searchTerms = ['Ixia', 'ixia', 'IXIA', 'ixiacom', 'Ixia Communications'];
    
    for (const term of searchTerms) {
      const records = await prisma.companies.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { legalName: { contains: term, mode: 'insensitive' } },
            { tradingName: { contains: term, mode: 'insensitive' } },
            { website: { contains: term, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          legalName: true,
          tradingName: true,
          website: true,
          workspaceId: true,
          mainSellerId: true,
          deletedAt: true,
          globalRank: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              people: {
                where: {
                  deletedAt: null
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (records.length > 0) {
        console.log(`\n📊 Found ${records.length} record(s) matching "${term}":\n`);
        records.forEach((record, index) => {
          console.log(`${index + 1}. ${record.name}`);
          console.log(`   ID: ${record.id}`);
          console.log(`   Workspace: ${record.workspaceId}`);
          console.log(`   Main Seller: ${record.mainSellerId || 'NULL'}`);
          console.log(`   Deleted: ${record.deletedAt ? record.deletedAt.toISOString() : 'NO'}`);
          console.log(`   Global Rank: ${record.globalRank || 'NULL'}`);
          console.log(`   Status: ${record.status || 'NULL'}`);
          console.log(`   People Count: ${record._count.people}`);
          console.log(`   Website: ${record.website || 'N/A'}`);
          console.log('');
        });
      }
    }

    // Check all workspaces for Ixia
    console.log(`\n🌐 CHECKING ALL WORKSPACES:\n`);
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true
      }
    });

    for (const workspace of workspaces) {
      const ixiaInWorkspace = await prisma.companies.findMany({
        where: {
          workspaceId: workspace.id,
          name: {
            contains: 'Ixia',
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          deletedAt: true,
          mainSellerId: true,
          _count: {
            select: {
              people: {
                where: {
                  deletedAt: null
                }
              }
            }
          }
        }
      });

      if (ixiaInWorkspace.length > 0) {
        console.log(`\n   Workspace: ${workspace.name} (${workspace.id})`);
        ixiaInWorkspace.forEach(record => {
          console.log(`     - ${record.name} (${record.id})`);
          console.log(`       Deleted: ${record.deletedAt ? 'YES' : 'NO'}`);
          console.log(`       Main Seller: ${record.mainSellerId || 'NULL'}`);
          console.log(`       People: ${record._count.people}`);
        });
      }
    }

    // Check if there are people with Ixia in their company name
    console.log(`\n👥 CHECKING PEOPLE WITH IXIA IN COMPANY NAME:\n`);
    const peopleWithIxia = await prisma.people.findMany({
      where: {
        OR: [
          { company: { name: { contains: 'Ixia', mode: 'insensitive' } } },
          { notes: { contains: 'Ixia', mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        companyId: true,
        mainSellerId: true,
        company: {
          select: {
            id: true,
            name: true,
            deletedAt: true,
            mainSellerId: true
          }
        }
      },
      take: 20
    });

    if (peopleWithIxia.length > 0) {
      console.log(`   Found ${peopleWithIxia.length} people:\n`);
      peopleWithIxia.forEach((person, index) => {
        console.log(`${index + 1}. ${person.fullName}`);
        console.log(`   Person ID: ${person.id}`);
        console.log(`   Person Main Seller: ${person.mainSellerId || 'NULL'}`);
        console.log(`   Company: ${person.company?.name || 'N/A'} (${person.companyId || 'N/A'})`);
        console.log(`   Company Deleted: ${person.company?.deletedAt ? 'YES' : 'NO'}`);
        console.log(`   Company Main Seller: ${person.company?.mainSellerId || 'NULL'}`);
        console.log('');
      });
    } else {
      console.log(`   No people found with Ixia in company name or notes`);
    }

    // Check the specific Ixia record's people
    const ixiaRecord = await prisma.companies.findFirst({
      where: {
        name: {
          contains: 'Ixia',
          mode: 'insensitive'
        }
      }
    });

    if (ixiaRecord) {
      console.log(`\n👥 PEOPLE ASSIGNED TO IXIA (${ixiaRecord.id}):\n`);
      const people = await prisma.people.findMany({
        where: {
          companyId: ixiaRecord.id
        },
        select: {
          id: true,
          fullName: true,
          mainSellerId: true,
          deletedAt: true,
          globalRank: true
        }
      });

      if (people.length > 0) {
        people.forEach((person, index) => {
          console.log(`${index + 1}. ${person.fullName}`);
          console.log(`   ID: ${person.id}`);
          console.log(`   Main Seller: ${person.mainSellerId || 'NULL'}`);
          console.log(`   Deleted: ${person.deletedAt ? 'YES' : 'NO'}`);
          console.log(`   Global Rank: ${person.globalRank || 'NULL'}`);
          console.log('');
        });
      } else {
        console.log(`   No people found`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ EXTENDED AUDIT COMPLETE\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

extendedAudit()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

