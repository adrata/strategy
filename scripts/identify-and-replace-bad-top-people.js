require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class IdentifyAndReplaceBadTopPeople {
  constructor() {
    this.prisma = prisma;
    this.workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK'; // TOP Engineering Plus
  }

  async analyze() {
    try {
      console.log('🔍 IDENTIFYING BAD DATA IN TOP WORKSPACE');
      console.log('==========================================\n');
      
      // Find people with coresignalId (system-added)
      const badPeople = await this.prisma.people.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          customFields: {
            path: ['coresignalId'],
            not: null
          }
        },
        include: {
          company: {
            select: {
              name: true,
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      console.log(`📊 Found ${badPeople.length} people with coresignalId (system-added)\n`);
      
      // Group by company to see which companies have bad data
      const byCompany = new Map();
      badPeople.forEach(person => {
        const companyName = person.company?.name || 'No Company';
        if (!byCompany.has(companyName)) {
          byCompany.set(companyName, []);
        }
        byCompany.get(companyName).push(person);
      });
      
      console.log('📋 Bad Data by Company:');
      console.log('======================');
      Array.from(byCompany.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .forEach(([company, people]) => {
          console.log(`  ${company}: ${people.length} people`);
        });
      
      // Show sample records
      console.log('\n\n📝 Sample Bad Records:');
      console.log('====================');
      badPeople.slice(0, 10).forEach((person, i) => {
        console.log(`\n${i + 1}. ${person.fullName}`);
        console.log(`   Company: ${person.company?.name || 'None'}`);
        console.log(`   Email: ${person.email || person.workEmail || person.personalEmail || 'None'}`);
        console.log(`   LinkedIn: ${person.linkedinUrl || 'None'}`);
        console.log(`   Job Title: ${person.jobTitle || 'None'}`);
        console.log(`   Created: ${new Date(person.createdAt).toISOString().split('T')[0]}`);
        console.log(`   CoreSignal ID: ${person.customFields?.coresignalId || 'None'}`);
        console.log(`   Tags: ${(person.tags || []).join(', ') || 'None'}`);
        console.log(`   Source: ${person.source || 'None'}`);
      });
      
      // Check for duplicates (same name + company)
      console.log('\n\n🔍 CHECKING FOR DUPLICATES');
      console.log('==========================');
      
      const duplicateMap = new Map();
      badPeople.forEach(person => {
        const key = `${person.fullName.toLowerCase()}_${(person.company?.name || '').toLowerCase()}`;
        if (!duplicateMap.has(key)) {
          duplicateMap.set(key, []);
        }
        duplicateMap.get(key).push(person);
      });
      
      const duplicates = Array.from(duplicateMap.entries())
        .filter(([key, people]) => people.length > 1);
      
      console.log(`\nFound ${duplicates.length} potential duplicate groups`);
      
      if (duplicates.length > 0) {
        console.log('\nSample Duplicates:');
        duplicates.slice(0, 5).forEach(([key, people]) => {
          console.log(`\n  ${key}:`);
          people.forEach(p => {
            console.log(`    - ${p.id} | Created: ${new Date(p.createdAt).toISOString().split('T')[0]} | CoreSignal: ${p.customFields?.coresignalId ? 'Yes' : 'No'}`);
          });
        });
      }
      
      // Generate export data
      this.generateExportData(badPeople);
      
      // Generate replacement strategy
      this.generateReplacementStrategy(badPeople);
      
      return {
        badPeople,
        byCompany,
        duplicates
      };
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  generateExportData(badPeople) {
    console.log('\n\n💾 EXPORT DATA FOR REPLACEMENT');
    console.log('==============================');
    
    console.log('\nTo export bad people IDs for deletion:');
    console.log(`
const badPeopleIds = ${JSON.stringify(badPeople.map(p => p.id), null, 2)};
    `);
    
    console.log('\nTo export bad people with details:');
    const exportData = badPeople.map(p => ({
      id: p.id,
      fullName: p.fullName,
      company: p.company?.name,
      email: p.email || p.workEmail || p.personalEmail,
      linkedinUrl: p.linkedinUrl,
      jobTitle: p.jobTitle,
      coresignalId: p.customFields?.coresignalId,
      createdAt: p.createdAt
    }));
    
    console.log(`\nTotal records to replace: ${exportData.length}`);
    console.log('\nSample export (first 3):');
    console.log(JSON.stringify(exportData.slice(0, 3), null, 2));
  }

  generateReplacementStrategy(badPeople) {
    console.log('\n\n🔄 REPLACEMENT STRATEGY');
    console.log('======================');
    
    console.log(`
1. IDENTIFY BAD DATA:
   ✅ Found ${badPeople.length} people with coresignalId in customFields
   ✅ These are likely the system-added "bad" data
   ✅ They were created around the same time (Sept 2025)

2. IDENTIFY GOOD DATA:
   - People WITHOUT coresignalId in customFields
   - People created in the original batch (Sept 2025)
   - People that match the same companies/names

3. REPLACEMENT OPTIONS:

   OPTION A: Delete Bad Data
   -------------------------
   - Soft delete (set deletedAt) - RECOMMENDED
   - Hard delete (remove from database)
   
   OPTION B: Update Bad Data
   --------------------------
   - Remove coresignalId from customFields
   - Update with good data from your list
   - Merge duplicates if they exist

   OPTION C: Tag for Review
   ------------------------
   - Add tag 'needs-review' or 'system-added'
   - Review manually before deleting
   - Export for comparison with good data

4. SAFETY STEPS:
   ⚠️  BACKUP FIRST: Export all data before making changes
   ⚠️  TEST: Try on 1-2 records first
   ⚠️  VERIFY: Check that good data exists to replace bad data
   ⚠️  VALIDATE: Ensure you're not deleting good data
    `);
    
    console.log('\n5. QUERY TO FIND GOOD DATA (for same companies):');
    const companiesWithBadData = [...new Set(badPeople.map(p => p.company?.id).filter(Boolean))];
    console.log(`
   const goodPeople = await prisma.people.findMany({
     where: {
       workspaceId: '${this.workspaceId}',
       deletedAt: null,
       companyId: { in: ${JSON.stringify(companiesWithBadData)} },
       customFields: {
         path: ['coresignalId'],
         equals: null
       }
     }
   });
    `);
  }
}

// Run the analysis
async function main() {
  const analyzer = new IdentifyAndReplaceBadTopPeople();
  await analyzer.analyze();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = IdentifyAndReplaceBadTopPeople;

