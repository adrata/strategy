#!/usr/bin/env node

/**
 * Fix Accounting/Finance Champions Misassignment
 * 
 * Finds and fixes people incorrectly assigned as "champion" who are in
 * accounting/finance departments. These should be "stakeholder" instead.
 * 
 * Specifically fixes Rubiel Powell and any other accounting/finance directors
 * who were incorrectly assigned as champions.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AccountingFinanceChampionFixer {
  constructor(workspaceId = null) {
    this.workspaceId = workspaceId;
    this.fixed = [];
    this.errors = [];
  }

  async fix() {
    console.log(`\n${'='.repeat(70)}`);
    console.log('🔧 Fixing Accounting/Finance Champion Misassignments');
    console.log('='.repeat(70));

    try {
      // Build query to find misassigned champions
      const whereClause = {
        buyerGroupRole: 'champion',
        deletedAt: null,
        OR: [
          {
            department: {
              contains: 'accounting',
              mode: 'insensitive'
            }
          },
          {
            department: {
              contains: 'finance',
              mode: 'insensitive'
            }
          },
          {
            department: {
              contains: 'financial',
              mode: 'insensitive'
            }
          },
          {
            jobTitle: {
              contains: 'accounting',
              mode: 'insensitive'
            }
          },
          {
            jobTitle: {
              contains: 'finance',
              mode: 'insensitive'
            }
          },
          {
            jobTitle: {
              contains: 'financial',
              mode: 'insensitive'
            }
          }
        ]
      };

      // Add workspace filter if provided
      if (this.workspaceId) {
        whereClause.workspaceId = this.workspaceId;
      }

      // Find all misassigned champions
      const misassignedChampions = await prisma.people.findMany({
        where: whereClause,
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log(`\n📊 Found ${misassignedChampions.length} accounting/finance people incorrectly assigned as champions\n`);

      if (misassignedChampions.length === 0) {
        console.log('✅ No misassignments found!');
        return;
      }

      // Fix each misassigned champion
      for (const person of misassignedChampions) {
        try {
          await this.fixPerson(person);
        } catch (error) {
          console.error(`   ❌ Error fixing ${person.fullName || person.firstName}: ${error.message}`);
          this.errors.push({
            person: person.fullName || person.firstName,
            id: person.id,
            error: error.message
          });
        }
      }

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async fixPerson(person) {
    const companyName = person.company?.name || 'Unknown';
    const personName = person.fullName || person.firstName || 'Unknown';
    const department = person.department || person.jobTitle || 'Unknown';
    
    console.log(`   🔍 ${personName} (${department}) at ${companyName}`);

    // Update to stakeholder role
    await prisma.people.update({
      where: { id: person.id },
      data: {
        buyerGroupRole: 'stakeholder',
        updatedAt: new Date()
      }
    });

    this.fixed.push({
      id: person.id,
      name: personName,
      company: companyName,
      department: department,
      oldRole: 'champion',
      newRole: 'stakeholder'
    });

    console.log(`   ✅ Updated ${personName} from champion to stakeholder`);
  }

  printSummary() {
    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 FIX SUMMARY');
    console.log('='.repeat(70));

    console.log(`\n✅ Fixed: ${this.fixed.length} people`);
    if (this.fixed.length > 0) {
      console.log('\nFixed People:');
      this.fixed.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix.name} (${fix.company})`);
        console.log(`      Department: ${fix.department}`);
        console.log(`      Changed: ${fix.oldRole} → ${fix.newRole}`);
      });
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors: ${this.errors.length}`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.person}: ${error.error}`);
      });
    }

    console.log('\n✅ Fix complete!\n');
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const workspaceId = args[0] || null; // Optional workspace ID filter
  
  if (workspaceId) {
    console.log(`🔍 Filtering by workspace: ${workspaceId}`);
  } else {
    console.log('🔍 Fixing across all workspaces');
  }

  const fixer = new AccountingFinanceChampionFixer(workspaceId);
  fixer.fix().catch(console.error);
}

module.exports = { AccountingFinanceChampionFixer };

