#!/usr/bin/env node

/**
 * 🧹 CLEANUP FAKE PEOPLE
 * 
 * Removes clearly fake, test, or placeholder people from the database
 */

const { PrismaClient } = require('@prisma/client');

class CleanupFakePeople {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    this.results = {
      peopleRemoved: 0,
      peopleReviewed: 0,
      errors: []
    };
  }

  async execute() {
    console.log('🧹 CLEANING UP FAKE PEOPLE');
    console.log('==========================\n');

    try {
      await this.identifyAndRemoveFakePeople();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async identifyAndRemoveFakePeople() {
    console.log('🔍 STEP 1: Identifying fake people...');
    
    // Get the suspicious people we found
    const suspiciousPeople = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        OR: [
          { firstName: { contains: 'test', mode: 'insensitive' } },
          { firstName: { contains: 'fake', mode: 'insensitive' } },
          { firstName: { contains: 'unknown', mode: 'insensitive' } },
          { lastName: { contains: 'test', mode: 'insensitive' } },
          { lastName: { contains: 'fake', mode: 'insensitive' } },
          { lastName: { contains: 'unknown', mode: 'insensitive' } },
          { fullName: { contains: 'test', mode: 'insensitive' } },
          { fullName: { contains: 'fake', mode: 'insensitive' } },
          { fullName: { contains: 'unknown', mode: 'insensitive' } },
          { jobTitle: { contains: 'test', mode: 'insensitive' } },
          { jobTitle: { contains: 'fake', mode: 'insensitive' } },
          { jobTitle: { contains: 'unknown', mode: 'insensitive' } }
        ]
      },
      select: { 
        id: true, 
        fullName: true, 
        jobTitle: true, 
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`📊 Found ${suspiciousPeople.length} suspicious people to review`);
    console.log('');

    for (const person of suspiciousPeople) {
      const shouldRemove = this.shouldRemovePerson(person);
      
      if (shouldRemove) {
        try {
          // Remove from buyer groups first
          await this.prisma.buyerGroupToPerson.deleteMany({
            where: { personId: person.id }
          });

          // Remove the person
          await this.prisma.people.delete({
            where: { id: person.id }
          });

          console.log(`   ✅ Removed: ${person.fullName} (${person.jobTitle || 'No title'})`);
          this.results.peopleRemoved++;
        } catch (error) {
          console.error(`   ❌ Failed to remove ${person.fullName}:`, error.message);
          this.results.errors.push(`Failed to remove ${person.fullName}: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ Keep: ${person.fullName} (${person.jobTitle || 'No title'}) - appears to be real person`);
        this.results.peopleReviewed++;
      }
    }
  }

  shouldRemovePerson(person) {
    const firstName = (person.firstName || '').toLowerCase();
    const lastName = (person.lastName || '').toLowerCase();
    const fullName = (person.fullName || '').toLowerCase();
    const jobTitle = (person.jobTitle || '').toLowerCase();
    const email = (person.email || '').toLowerCase();

    // Definitely remove these patterns
    const removePatterns = [
      // Test/fake patterns
      'test', 'fake', 'dummy', 'sample', 'example', 'demo', 'placeholder',
      
      // Generic patterns
      'unknown', 'n/a', 'na', 'tbd', 'to be determined',
      
      // Email-only entries (no real name)
      !person.firstName && !person.lastName && person.email,
      
      // Test email domains
      email.includes('@test.') || email.includes('@fake.') || email.includes('@example.'),
      
      // Suspicious job titles
      jobTitle === 'test title' || jobTitle === 'fake title' || jobTitle === 'unknown title'
    ];

    // Check for remove patterns
    for (const pattern of removePatterns) {
      if (pattern === true) {
        return true;
      }
      if (typeof pattern === 'string' && (
        firstName.includes(pattern) || lastName.includes(pattern) ||
        fullName.includes(pattern) || jobTitle.includes(pattern)
      )) {
        return true;
      }
    }

    // Special cases - these look like real people with incomplete data
    const keepPatterns = [
      // Real names that might have incomplete data
      '박지환', '李兰花', '周莹', '曾涛', '叶宁', '刘聃', // Korean/Chinese names
      'Léo Hehlen', 'Plinio Corrêa', 'David Laszewski' // Real international names
    ];

    for (const pattern of keepPatterns) {
      if (fullName.includes(pattern.toLowerCase())) {
        return false; // Keep these - they appear to be real people
      }
    }

    // If it's just an email with no name, remove it
    if (!person.firstName && !person.lastName && person.email) {
      return true;
    }

    // If it has a real name but no email, keep it (might be incomplete data)
    if (person.firstName && person.lastName && !person.email) {
      return false;
    }

    // Default to keeping if we're not sure
    return false;
  }

  async generateReport() {
    console.log('\n🎉 FAKE PEOPLE CLEANUP REPORT');
    console.log('==============================');
    console.log(`✅ People removed: ${this.results.peopleRemoved}`);
    console.log(`⚠️ People reviewed and kept: ${this.results.peopleReviewed}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log('\n🎯 Next steps:');
    console.log('   1. Run final audit to confirm only real people remain');
    console.log('   2. Review any remaining suspicious entries manually');
    console.log('   3. Update buyer groups if needed after cleanup');
    console.log('\n🚀 Fake people cleanup complete!');
  }
}

if (require.main === module) {
  const cleaner = new CleanupFakePeople();
  cleaner.execute().catch(console.error);
}

module.exports = CleanupFakePeople;
