#!/usr/bin/env node

/**
 * 🔍 AUDIT IXIA COMPANY LIST ISSUE
 * 
 * Diagnoses why Ixia appears in Speedrun but is missing from company list
 * Checks for duplicates, filtering mismatches, and soft delete issues
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditIxiaIssue() {
  try {
    console.log('🔍 AUDITING IXIA COMPANY LIST ISSUE\n');
    console.log('='.repeat(60));
    
    // Find all Ixia records (case-insensitive)
    const allIxiaRecords = await prisma.companies.findMany({
      where: {
        name: {
          contains: 'Ixia',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        mainSellerId: true,
        deletedAt: true,
        globalRank: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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

    console.log(`\n📊 FOUND ${allIxiaRecords.length} IXIA RECORD(S):\n`);
    
    if (allIxiaRecords.length === 0) {
      console.log('❌ No Ixia records found in database');
      return;
    }

    allIxiaRecords.forEach((record, index) => {
      console.log(`${index + 1}. ${record.name}`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Workspace: ${record.workspaceId}`);
      console.log(`   Main Seller ID: ${record.mainSellerId || 'NULL (unassigned)'}`);
      console.log(`   Deleted At: ${record.deletedAt ? record.deletedAt.toISOString() : 'NULL (active)'}`);
      console.log(`   Global Rank: ${record.globalRank || 'NULL'}`);
      console.log(`   Status: ${record.status || 'NULL'}`);
      console.log(`   People Count: ${record._count.people}`);
      console.log(`   Created: ${record.createdAt.toISOString()}`);
      console.log(`   Updated: ${record.updatedAt.toISOString()}`);
      console.log('');
    });

    // Check for duplicates
    const activeRecords = allIxiaRecords.filter(r => !r.deletedAt);
    const deletedRecords = allIxiaRecords.filter(r => r.deletedAt);
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Records: ${allIxiaRecords.length}`);
    console.log(`   Active Records: ${activeRecords.length}`);
    console.log(`   Deleted Records: ${deletedRecords.length}`);
    
    if (activeRecords.length > 1) {
      console.log(`\n⚠️  WARNING: Multiple active Ixia records found!`);
      console.log(`   This could cause the "listed twice" issue.`);
    }

    // Check people assignments for each active record
    console.log(`\n👥 PEOPLE ASSIGNMENTS:`);
    for (const record of activeRecords) {
      const people = await prisma.people.findMany({
        where: {
          companyId: record.id,
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          mainSellerId: true,
          deletedAt: true
        }
      });

      console.log(`\n   Company: ${record.name} (${record.id})`);
      console.log(`   Total People: ${people.length}`);
      
      if (people.length > 0) {
        const peopleBySeller = {};
        people.forEach(person => {
          const sellerId = person.mainSellerId || 'NULL';
          if (!peopleBySeller[sellerId]) {
            peopleBySeller[sellerId] = [];
          }
          peopleBySeller[sellerId].push(person);
        });

        Object.entries(peopleBySeller).forEach(([sellerId, peopleList]) => {
          console.log(`     Assigned to Seller ${sellerId}: ${peopleList.length} people`);
        });
      } else {
        console.log(`     No people assigned`);
      }
    }

    // Simulate Speedrun query for a specific user
    console.log(`\n🚀 SPEEDRUN QUERY SIMULATION:`);
    console.log(`   (Companies with mainSellerId = user AND 0 people assigned to user)`);
    
    // Get unique mainSellerIds from active records
    const uniqueSellers = [...new Set(activeRecords.map(r => r.mainSellerId).filter(Boolean))];
    
    if (uniqueSellers.length === 0) {
      console.log(`   ⚠️  No assigned sellers found - checking unassigned companies`);
      const unassignedRecords = activeRecords.filter(r => !r.mainSellerId);
      if (unassignedRecords.length > 0) {
        console.log(`   Found ${unassignedRecords.length} unassigned Ixia records`);
        console.log(`   These would NOT appear in Speedrun (requires mainSellerId)`);
      }
    }

    for (const sellerId of uniqueSellers) {
      console.log(`\n   For Seller: ${sellerId}`);
      
      const speedrunQuery = await prisma.companies.findMany({
        where: {
          name: {
            contains: 'Ixia',
            mode: 'insensitive'
          },
          workspaceId: activeRecords[0].workspaceId,
          deletedAt: null,
          mainSellerId: sellerId,
          people: {
            none: {
              deletedAt: null,
              mainSellerId: sellerId
            }
          }
        },
        select: {
          id: true,
          name: true,
          mainSellerId: true,
          _count: {
            select: {
              people: {
                where: {
                  deletedAt: null,
                  mainSellerId: sellerId
                }
              }
            }
          }
        }
      });

      console.log(`     Would appear in Speedrun: ${speedrunQuery.length > 0 ? 'YES ✅' : 'NO ❌'}`);
      if (speedrunQuery.length > 0) {
        speedrunQuery.forEach(company => {
          console.log(`       - ${company.name} (${company.id})`);
          console.log(`         People assigned to this seller: ${company._count.people}`);
        });
      }
    }

    // Simulate Companies query
    console.log(`\n🏢 COMPANIES QUERY SIMULATION:`);
    console.log(`   (Companies with mainSellerId = user OR mainSellerId = NULL)`);
    
    for (const sellerId of uniqueSellers) {
      console.log(`\n   For Seller: ${sellerId}`);
      
      const companiesQuery = await prisma.companies.findMany({
        where: {
          name: {
            contains: 'Ixia',
            mode: 'insensitive'
          },
          workspaceId: activeRecords[0].workspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: sellerId },
            { mainSellerId: null }
          ]
        },
        select: {
          id: true,
          name: true,
          mainSellerId: true
        }
      });

      console.log(`     Would appear in Company List: ${companiesQuery.length > 0 ? 'YES ✅' : 'NO ❌'}`);
      if (companiesQuery.length > 0) {
        companiesQuery.forEach(company => {
          console.log(`       - ${company.name} (${company.id})`);
          console.log(`         Main Seller: ${company.mainSellerId || 'NULL'}`);
        });
      }
    }

    // Check for the specific issue: appears in Speedrun but not in Company List
    console.log(`\n🔍 ISSUE DIAGNOSIS:`);
    
    for (const sellerId of uniqueSellers) {
      const speedrunResults = await prisma.companies.findMany({
        where: {
          name: {
            contains: 'Ixia',
            mode: 'insensitive'
          },
          workspaceId: activeRecords[0].workspaceId,
          deletedAt: null,
          mainSellerId: sellerId,
          people: {
            none: {
              deletedAt: null,
              mainSellerId: sellerId
            }
          }
        },
        select: {
          id: true,
          name: true,
          mainSellerId: true
        }
      });

      const companiesResults = await prisma.companies.findMany({
        where: {
          name: {
            contains: 'Ixia',
            mode: 'insensitive'
          },
          workspaceId: activeRecords[0].workspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: sellerId },
            { mainSellerId: null }
          ]
        },
        select: {
          id: true,
          name: true,
          mainSellerId: true
        }
      });

      const speedrunIds = new Set(speedrunResults.map(r => r.id));
      const companiesIds = new Set(companiesResults.map(r => r.id));

      const inSpeedrunNotInList = speedrunResults.filter(r => !companiesIds.has(r.id));
      const inListNotInSpeedrun = companiesResults.filter(r => !speedrunIds.has(r.id));

      if (inSpeedrunNotInList.length > 0) {
        console.log(`\n   ⚠️  ISSUE FOUND for Seller ${sellerId}:`);
        console.log(`      Companies in Speedrun but NOT in Company List:`);
        inSpeedrunNotInList.forEach(company => {
          console.log(`        - ${company.name} (${company.id})`);
          console.log(`          Main Seller: ${company.mainSellerId}`);
        });
      }

      if (inListNotInSpeedrun.length > 0) {
        console.log(`\n   ℹ️  Companies in List but NOT in Speedrun:`);
        inListNotInSpeedrun.forEach(company => {
          console.log(`        - ${company.name} (${company.id})`);
          console.log(`          Main Seller: ${company.mainSellerId || 'NULL'}`);
        });
      }

      if (inSpeedrunNotInList.length === 0 && inListNotInSpeedrun.length === 0) {
        console.log(`\n   ✅ No mismatch found for Seller ${sellerId}`);
        console.log(`      All Ixia records appear consistently in both queries`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ AUDIT COMPLETE\n');

  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditIxiaIssue()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

